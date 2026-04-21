import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/app/lib/env';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';

export interface ImageSearchItem {
  id: string;
  source: 'pexels' | 'unsplash';
  thumbUrl: string;
  fullUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  alt: string;
}

export interface ImageSearchResponse {
  query: string;
  items: ImageSearchItem[];
  sources: { pexels: boolean; unsplash: boolean };
  errors: { pexels?: string; unsplash?: string };
}

const cache = getCache<ImageSearchResponse>('image-search', 10 * 60 * 1000);

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt?: string;
  src: {
    medium: string;
    large2x: string;
    original: string;
  };
}

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  links: { html: string; download_location: string };
  urls: { small: string; regular: string; full: string; raw: string };
  user: { name: string; links: { html: string } };
}

async function searchPexels(query: string, perPage: number): Promise<ImageSearchItem[] | { error: string }> {
  const key = env.pexelsApiKey;
  if (!key) return { error: 'PEXELS_API_KEY 미설정' };
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const res = await fetchWithRetry(url, {
      headers: { Authorization: key },
      timeoutMs: 8000,
      retries: 1,
    });
    if (!res.ok) return { error: `Pexels ${res.status}` };
    const json = (await res.json()) as { photos?: PexelsPhoto[] };
    return (json.photos || []).map((p) => ({
      id: `pexels-${p.id}`,
      source: 'pexels' as const,
      thumbUrl: p.src.medium,
      fullUrl: p.src.large2x,
      downloadUrl: p.src.original,
      width: p.width,
      height: p.height,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      sourceUrl: p.url,
      alt: p.alt || query,
    }));
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Pexels 오류' };
  }
}

async function searchUnsplash(query: string, perPage: number): Promise<ImageSearchItem[] | { error: string }> {
  const key = env.unsplashAccessKey;
  if (!key) return { error: 'UNSPLASH_ACCESS_KEY 미설정' };
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&client_id=${encodeURIComponent(key)}`;
    const res = await fetchWithRetry(url, { timeoutMs: 8000, retries: 1 });
    if (!res.ok) return { error: `Unsplash ${res.status}` };
    const json = (await res.json()) as { results?: UnsplashPhoto[] };
    return (json.results || []).map((p) => ({
      id: `unsplash-${p.id}`,
      source: 'unsplash' as const,
      thumbUrl: p.urls.small,
      fullUrl: p.urls.regular,
      downloadUrl: p.urls.full,
      width: p.width,
      height: p.height,
      photographer: p.user.name,
      photographerUrl: p.user.links.html,
      sourceUrl: p.links.html,
      alt: p.alt_description || p.description || query,
    }));
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unsplash 오류' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const perPage = Math.min(Math.max(parseInt(searchParams.get('perPage') || '12', 10) || 12, 1), 30);

    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = `${query.toLowerCase()}::${perPage}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const [pexelsResult, unsplashResult] = await Promise.all([
      searchPexels(query, perPage),
      searchUnsplash(query, perPage),
    ]);

    const pexelsItems = Array.isArray(pexelsResult) ? pexelsResult : [];
    const unsplashItems = Array.isArray(unsplashResult) ? unsplashResult : [];

    // 두 소스를 interleave 하여 다양성 확보
    const interleaved: ImageSearchItem[] = [];
    const max = Math.max(pexelsItems.length, unsplashItems.length);
    for (let i = 0; i < max; i++) {
      if (pexelsItems[i]) interleaved.push(pexelsItems[i]);
      if (unsplashItems[i]) interleaved.push(unsplashItems[i]);
    }

    const payload: ImageSearchResponse = {
      query,
      items: interleaved,
      sources: {
        pexels: Array.isArray(pexelsResult) && pexelsResult.length > 0,
        unsplash: Array.isArray(unsplashResult) && unsplashResult.length > 0,
      },
      errors: {
        ...(Array.isArray(pexelsResult) ? {} : { pexels: pexelsResult.error }),
        ...(Array.isArray(unsplashResult) ? {} : { unsplash: unsplashResult.error }),
      },
    };

    if (payload.items.length > 0) cache.set(cacheKey, payload);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('이미지 검색 오류:', error);
    const message = error instanceof Error ? error.message : '이미지 검색 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
