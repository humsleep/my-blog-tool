import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/app/lib/env';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';

export interface NaverKeywordToolItem {
  relKeyword: string;
  monthlyPcQcCnt: string | number;
  monthlyMobileQcCnt: string | number;
  monthlyAvePcClkCnt?: string | number;
  monthlyAveMobileClkCnt?: string | number;
  monthlyAvePcCtr?: string | number;
  monthlyAveMobileCtr?: string | number;
  plAvgDepth?: string | number;
  compIdx?: string;
}

export interface NaverKeywordToolResponse {
  keywordList: NaverKeywordToolItem[];
}

const cache = getCache<NaverKeywordToolResponse>('keywords', 5 * 60 * 1000);

function generateSignature(timestamp: string, method: string, uri: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = String(keyword).trim().toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const timestamp = Date.now().toString();
    const uri = '/keywordstool';
    const method = 'GET';

    const queryParams = new URLSearchParams({
      hintKeywords: keyword,
      showDetail: '1',
    });

    const signature = generateSignature(timestamp, method, uri, env.naverSearchAdSecretKey);
    const url = `https://api.searchad.naver.com${uri}?${queryParams.toString()}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': env.naverSearchAdApiKey,
        'X-Customer': env.naverSearchAdCustomerId,
        'X-Signature': signature,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API 요청 실패: ${errorText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as NaverKeywordToolResponse;
    cache.set(cacheKey, data);
    return NextResponse.json(data, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('키워드 검색 오류:', error);
    const message = error instanceof Error ? error.message : '키워드 검색 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
