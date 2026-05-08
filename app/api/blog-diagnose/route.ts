import { NextResponse } from 'next/server';
import { extractBlogId, fetchRss, searchBlogByQuery, type BlogSearchItem } from '@/app/lib/diagnose/naver-blog';
import { findCategorySeed } from '@/app/lib/diagnose/category-seeds';
import { scoreActivity, scoreVisibility, scoreQuality, compose, mapHits, summarizeRss } from '@/app/lib/diagnose/scoring';
import { createClient } from '@/app/lib/supabase/server';

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const runtime = 'nodejs';
export const maxDuration = 60;        // Vercel hobby 한도

interface DiagnoseRequest {
  blogId?: string;
  blogInput?: string;     // URL/ID 어떤 형식이든 받아 normalize
  category?: string;
}

const CONCURRENCY = 5;
const PER_REQUEST_GAP_MS = 120;

/** 동시성 N으로 작업 풀 처리 — 풀이 다 끝날 때까지 결과 보존. */
async function runPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
      if (PER_REQUEST_GAP_MS > 0) {
        await new Promise((r) => setTimeout(r, PER_REQUEST_GAP_MS));
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export async function POST(request: Request) {
  const naverIdSet = !!process.env.NAVER_CLIENT_ID && !!process.env.NAVER_CLIENT_SECRET;
  if (!naverIdSet) {
    return NextResponse.json(
      { error: '네이버 검색 API가 설정되지 않았습니다. 운영자에게 문의해주세요.' },
      { status: 503 },
    );
  }

  let body: DiagnoseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  // 1) 입력 정규화
  const rawInput = (body.blogId || body.blogInput || '').trim();
  if (!rawInput) {
    return NextResponse.json({ error: '블로그 ID 또는 주소를 입력해주세요.' }, { status: 400 });
  }
  const blogId = extractBlogId(rawInput);
  if (!blogId) {
    return NextResponse.json(
      { error: '인식할 수 없는 형식이에요. "https://blog.naver.com/아이디" 또는 그냥 아이디만 입력해주세요.' },
      { status: 400 },
    );
  }

  // 2) 카테고리 시드 결정
  const seed = findCategorySeed(body.category || '');
  if (!seed) {
    return NextResponse.json(
      { error: '메인 카테고리를 선택해주세요.' },
      { status: 400 },
    );
  }

  // 3) RSS 가져오기 (활동성/품질 데이터 소스)
  const rss = await fetchRss(blogId);
  const { items, warnings } = summarizeRss(rss);

  // 4) 카테고리 키워드 30개로 검색해 랭크 매핑 (노출 점수)
  //    동시성 5, 요청 간 120ms gap → 30개 약 7~12초 소요 (네이버 응답 속도 변동에 따라)
  const searchResults = await runPool(
    seed.keywords,
    async (keyword) => {
      const r = await searchBlogByQuery(keyword, 30);
      return { keyword, items: r };
    },
    CONCURRENCY,
  );

  const failed = searchResults.filter((r) => r.items === null).length;
  const enriched: { keyword: string; items: BlogSearchItem[] | null }[] = searchResults;
  if (failed > 0) {
    warnings.push(`키워드 ${seed.keywords.length}개 중 ${failed}개 검색이 실패했어요. 점수가 보수적으로 산출됩니다.`);
  }

  const hits = mapHits(enriched, blogId);

  // 5) 점수 산출
  const activity = scoreActivity(items);
  const visibility = scoreVisibility(hits);
  const quality = scoreQuality(items);

  if (items.length === 0) {
    warnings.push('RSS에서 글을 찾지 못해 활동성·품질 점수가 0이에요. 노출 점수만 참고해주세요.');
  }

  const result = compose(activity, visibility, quality, warnings);

  // 6) 로그인 사용자 → DB 저장 (Phase 28: 데일리 대시보드 + 추적용)
  //    저장 실패는 무시. 진단 결과 응답 자체는 항상 정상 반환.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('diagnose_results').insert({
          user_id: user.id,
          blog_id: blogId,
          blog_title: rss?.title ?? null,
          category: seed.value,
          category_label: seed.label,
          total_score: result.total,
          activity_score: result.activity.score,
          visibility_score: result.visibility.score,
          quality_score: result.quality.score,
          band: result.band,
          posts_last_30d: Number.isFinite(result.activity.postsLast30d) ? result.activity.postsLast30d : null,
          hit_count: result.visibility.hitCount,
          top_ten_count: result.visibility.topTenCount,
          insights: result.insights,
        });
      }
    } catch (err) {
      console.error('[blog-diagnose] DB 저장 실패 (무시):', err);
    }
  }

  return NextResponse.json({
    blogId,
    blogTitle: rss?.title ?? null,
    blogLink: rss?.link ?? `https://blog.naver.com/${blogId}`,
    category: seed.value,
    categoryLabel: seed.label,
    keywordCount: seed.keywords.length,
    score: result,
    rssItemCount: items.length,
    diagnosedAt: new Date().toISOString(),
  });
}

/**
 * GET — 로그인 사용자의 진단 이력
 * - latest, previous: 직전 두 건 (대시보드 점수 카드 + delta 표시)
 * - history: 최근 12건 (최신 순 → 오래된 순으로 reverse) — sparkline 용
 *
 * 비로그인 / 미저장 상태이면 모두 null/빈 배열.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
    }

    const { data, error } = await supabase
      .from('diagnose_results')
      .select('id, blog_id, blog_title, category, category_label, total_score, activity_score, visibility_score, quality_score, band, hit_count, top_ten_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('[blog-diagnose GET] error:', error);
      return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
    }

    const list = data ?? [];
    const latest = list[0] ?? null;
    const previous = list[1] ?? null;

    // sparkline 용 — 오래된 → 최신 순으로 정렬 (최대 12건)
    const history = [...list]
      .reverse()
      .map((r) => ({ date: r.created_at as string, score: r.total_score as number }));

    return NextResponse.json({
      latest,
      previous,
      delta: latest && previous ? latest.total_score - previous.total_score : null,
      history,
    });
  } catch (err) {
    console.error('[blog-diagnose GET] exception:', err);
    return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
  }
}
