/**
 * GET /api/competitor-patterns?category=<DiagnoseCategory>&blogId=<userBlogId>
 *
 *  카테고리 상위 5명 블로거의 최근 글 패턴을 분석하고,
 *  blogId 가 함께 들어오면 사용자 RSS 와 비교한 결과까지 반환.
 *
 *  진단 결과 페이지에서 lazy fetch — 진단 본 API 와 분리되어 있어
 *  진단 결과 즉시 표시 후 이 카드만 점진적으로 채워짐.
 *
 *  캐시: 카테고리 패턴은 24h (lib 내부), 사용자 RSS 는 매번 fresh.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchCompetitorPatterns, extractUserFeatures, compareToPatterns } from '@/app/lib/diagnose/competitor-patterns';
import { CATEGORY_SEEDS, type DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';
import { fetchRss } from '@/app/lib/diagnose/naver-blog';

export const runtime = 'nodejs';
export const maxDuration = 30;

const VALID_CATEGORIES = new Set(CATEGORY_SEEDS.map((c) => c.value));

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') as DiagnoseCategory | null;
  const blogId = url.searchParams.get('blogId');

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: '카테고리가 필요합니다.' }, { status: 400 });
  }

  try {
    const patterns = await fetchCompetitorPatterns(category);
    if (!patterns) {
      return NextResponse.json(
        { error: '상위 블로거 패턴을 가져오지 못했어요. 잠시 후 다시 시도해주세요.' },
        { status: 503 },
      );
    }

    /* blogId 가 없으면 패턴만 반환 — 카테고리 평균 카드만 보여줄 때. */
    if (!blogId) {
      return NextResponse.json({ patterns, comparison: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      });
    }

    /* 사용자 RSS 비교 */
    const seed = CATEGORY_SEEDS.find((c) => c.value === category);
    const userRss = await fetchRss(blogId);
    if (!userRss || userRss.items.length === 0) {
      return NextResponse.json({ patterns, comparison: null, warning: '사용자 RSS 를 가져오지 못했어요.' });
    }
    const userItems = userRss.items.slice(0, 12);
    const userFeatures = extractUserFeatures(userItems, seed?.keywords ?? []);
    const comparison = compareToPatterns(patterns, userFeatures);

    return NextResponse.json({ patterns, comparison });
  } catch (err) {
    console.error('competitor-patterns error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
