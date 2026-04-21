import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/app/lib/env';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  originalLink: string;
}

export interface NewsResponse {
  keyword: string;
  total: number;
  items: NewsItem[];
}

const cache = getCache<NewsResponse>('news', 5 * 60 * 1000);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim();
    const display = Math.min(parseInt(searchParams.get('display') || '10', 10) || 10, 50);
    const sort = searchParams.get('sort') === 'sim' ? 'sim' : 'date';

    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = `${keyword.toLowerCase()}::${display}::${sort}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
      keyword
    )}&display=${display}&sort=${sort}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': env.naverClientId,
        'X-Naver-Client-Secret': env.naverClientSecret,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: '뉴스 조회 실패' }, { status: response.status });
    }

    interface NaverNewsRawItem {
      title: string;
      link: string;
      description: string;
      pubDate: string;
      originallink?: string;
    }
    const data = (await response.json()) as { total?: number; items?: NaverNewsRawItem[] };
    const payload: NewsResponse = {
      keyword,
      total: data.total || 0,
      items: (data.items || []).map((item) => ({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
        originalLink: item.originallink || item.link,
      })),
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('뉴스 조회 오류:', error);
    const message = error instanceof Error ? error.message : '뉴스 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
