import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/app/lib/env';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';
import { checkRateLimit, tooManyRequestsResponse } from '@/app/lib/security/rate-limit';

const cache = getCache<{ count: number }>('document-count', 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, { limit: 30, windowMs: 60_000, bucket: 'document-count' });
    if (!rl.allowed) return tooManyRequestsResponse(rl);

    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = String(keyword).trim().toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodedKeyword}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': env.naverClientId,
        'X-Naver-Client-Secret': env.naverClientSecret,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: '문서수 조회 실패' }, { status: response.status });
    }

    const data = (await response.json()) as { total?: number };
    const result = { count: data.total || 0 };
    cache.set(cacheKey, result);
    return NextResponse.json(result, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('문서수 조회 오류:', error);
    const message = error instanceof Error ? error.message : '문서수 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
