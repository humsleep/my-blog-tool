import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/blog-diagnose/save
 *
 * 비로그인 상태에서 진단한 결과를, 로그인 직후 계정에 소급 저장 (Phase 60).
 *   이미 계산이 끝난 스냅샷을 그대로 저장 → 재진단(네이버 API 30여 건 호출) 없이
 *   "결과를 본 순간의 전환 가치"를 회수한다.
 *
 * 신뢰 모델: 점수는 본인 추적용 vanity 지표라 클라이언트 제공 스냅샷을 신뢰한다.
 *   단, user_id 는 서버 세션에서만 취하고(클라이언트 값 무시), RLS 0012(12시간 1회)가
 *   INSERT 단에서 한 번 더 강제한다 — 최근 진단이 있으면 조용히 skip.
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: { snapshot?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const snap = body?.snapshot as
    | {
        blogId?: string;
        blogTitle?: string | null;
        category?: string;
        categoryLabel?: string;
        geo?: { score?: number };
        score?: {
          total?: number;
          band?: string;
          activity?: { score?: number; postsLast30d?: number };
          visibility?: { score?: number; hitCount?: number; topTenCount?: number };
          quality?: { score?: number };
          insights?: string[];
        };
      }
    | undefined;

  if (!snap || typeof snap.blogId !== 'string' || !snap.score || typeof snap.score.total !== 'number') {
    return NextResponse.json({ error: 'invalid_snapshot' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const s = snap.score;
    const { data: inserted, error } = await supabase
      .from('diagnose_results')
      .insert({
        user_id: user.id,
        blog_id: snap.blogId,
        blog_title: snap.blogTitle ?? null,
        category: snap.category ?? null,
        category_label: snap.categoryLabel ?? null,
        total_score: s.total,
        activity_score: s.activity?.score ?? null,
        visibility_score: s.visibility?.score ?? null,
        quality_score: s.quality?.score ?? null,
        band: s.band ?? null,
        posts_last_30d: Number.isFinite(s.activity?.postsLast30d) ? s.activity!.postsLast30d : null,
        hit_count: s.visibility?.hitCount ?? null,
        top_ten_count: s.visibility?.topTenCount ?? null,
        insights: s.insights ?? null,
      })
      .select('id')
      .single();

    if (error) {
      // RLS 12h 1회(0012) 차단 등 → 이미 최근 점수 보유. 조용히 성공 처리(전환 UX 우선).
      console.error('[blog-diagnose/save] insert skipped:', error.message);
      return NextResponse.json({ saved: false, reason: 'recent_or_error' });
    }

    // geo_score best-effort — 0013 컬럼 부재 시 무시.
    if (inserted?.id && typeof snap.geo?.score === 'number') {
      await supabase.from('diagnose_results').update({ geo_score: snap.geo.score }).eq('id', inserted.id);
    }

    return NextResponse.json({ saved: true });
  } catch (e) {
    console.error('[blog-diagnose/save] server error:', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
