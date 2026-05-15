import { NextRequest, NextResponse } from 'next/server';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';
import { checkRateLimit, tooManyRequestsResponse } from '@/app/lib/security/rate-limit';

interface PageviewsResponse {
  keyword: string;
  article: string | null;
  totalViews: number;
  dailyAverage: number;
  days: number;
  found: boolean;
}

const cache = getCache<PageviewsResponse>('wiki-pageviews', 60 * 60 * 1000);

function toYYYYMMDD(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function resolveArticleTitle(keyword: string): Promise<string | null> {
  try {
    const url = `https://ko.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search=${encodeURIComponent(keyword)}`;
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'boheme-blog-lab/1.0 (contact: boheme88@naver.com)' },
      retries: 1,
      timeoutMs: 6000,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as [string, string[], string[], string[]];
    const titles = json?.[1];
    return Array.isArray(titles) && titles.length > 0 ? titles[0] : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, { limit: 30, windowMs: 60_000, bucket: 'wiki' });
    if (!rl.allowed) return tooManyRequestsResponse(rl);

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim();
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 7), 90);

    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = `${keyword.toLowerCase()}::${days}`;
    const cached = cache.get(cacheKey);
    /* 위키 페이지뷰는 일 단위 데이터라 1시간 fresh + 2시간 SWR 로도 충분. */
    const cdnCache = 'public, s-maxage=3600, stale-while-revalidate=7200';
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT', 'Cache-Control': cdnCache } });
    }

    const article = await resolveArticleTitle(keyword);
    if (!article) {
      const empty: PageviewsResponse = { keyword, article: null, totalViews: 0, dailyAverage: 0, days, found: false };
      cache.set(cacheKey, empty);
      return NextResponse.json(empty, { headers: { 'x-cache': 'MISS', 'Cache-Control': cdnCache } });
    }

    // 위키미디어 pageviews API는 "오늘" 기준 데이터가 부족할 수 있어 2일 전까지만 조회
    const endDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const encodedArticle = encodeURIComponent(article.replace(/ /g, '_'));
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/ko.wikipedia.org/all-access/all-agents/${encodedArticle}/daily/${toYYYYMMDD(startDate)}/${toYYYYMMDD(endDate)}`;

    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'boheme-blog-lab/1.0 (contact: boheme88@naver.com)' },
      retries: 1,
      timeoutMs: 8000,
    });

    if (res.status === 404) {
      const empty: PageviewsResponse = { keyword, article, totalViews: 0, dailyAverage: 0, days, found: false };
      cache.set(cacheKey, empty);
      return NextResponse.json(empty, { headers: { 'x-cache': 'MISS', 'Cache-Control': cdnCache } });
    }
    if (!res.ok) {
      return NextResponse.json({ error: '위키 조회수 조회 실패' }, { status: res.status });
    }

    const json = (await res.json()) as { items?: Array<{ views: number }> };
    const items = json.items || [];
    const totalViews = items.reduce((sum, it) => sum + (it.views || 0), 0);
    const dailyAverage = items.length > 0 ? Math.round(totalViews / items.length) : 0;

    const payload: PageviewsResponse = {
      keyword, article, totalViews, dailyAverage, days, found: totalViews > 0,
    };
    cache.set(cacheKey, payload);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS', 'Cache-Control': cdnCache } });
  } catch (error) {
    console.error('위키 조회수 오류:', error);
    const message = error instanceof Error ? error.message : '위키 조회수 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
