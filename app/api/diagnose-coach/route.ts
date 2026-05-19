/**
 * GET /api/diagnose-coach?blogId=<id>&category=<DiagnoseCategory>
 *
 *  사용자 본인 RSS 12편을 휴리스틱으로 분석해 코치 리포트 반환.
 *  AI API 호출 없음. 외부 호출은 사용자 본인 RSS 1회 (이미 진단 시 호출과 동일 비용).
 *
 *  진단 결과 페이지에서 lazy fetch. competitor-patterns 와 비슷한 패턴.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchRss } from '@/app/lib/diagnose/naver-blog';
import { analyzeCoach } from '@/app/lib/diagnose/heuristic-coach';
import { CATEGORY_SEEDS, type DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';

export const runtime = 'nodejs';
export const maxDuration = 15;

const VALID_CATEGORIES = new Set(CATEGORY_SEEDS.map((c) => c.value));

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const blogId = url.searchParams.get('blogId');
  const category = url.searchParams.get('category') as DiagnoseCategory | null;

  if (!blogId) {
    return NextResponse.json({ error: 'blogId 가 필요합니다.' }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: '카테고리가 필요합니다.' }, { status: 400 });
  }

  try {
    const seed = CATEGORY_SEEDS.find((c) => c.value === category);
    const rss = await fetchRss(blogId);
    if (!rss || rss.items.length === 0) {
      return NextResponse.json(
        { error: '블로그 RSS 를 가져오지 못했어요. 비공개 블로그이거나 RSS 가 비어있을 수 있습니다.' },
        { status: 404 },
      );
    }

    const items = rss.items.slice(0, 12);
    const report = analyzeCoach(items, seed?.keywords ?? []);

    return NextResponse.json(
      { report },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (err) {
    console.error('diagnose-coach error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
