import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/app/lib/env';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';

interface BlogPost {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  postdate: string;
}

interface AnalysisResult {
  totalPosts: number;
  topPosts: BlogPost[];
  averageTitleLength: number;
  commonWords: Array<{ word: string; count: number }>;
  topBloggers: Array<{ name: string; count: number }>;
  dateDistribution: Record<string, number>;
}

const cache = getCache<AnalysisResult>('competitor', 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const { keyword, limit = 10 } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }

    const cacheKey = `${String(keyword).trim().toLowerCase()}::${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodedKeyword}&display=${Math.min(limit, 100)}&sort=sim`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': env.naverClientId,
        'X-Naver-Client-Secret': env.naverClientSecret,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: '경쟁 블로그 분석 실패' }, { status: response.status });
    }

    const data = await response.json();
    const posts: BlogPost[] = data.items || [];

    const titleLengths = posts.map(post => post.title.replace(/<[^>]*>/g, '').length);
    const averageTitleLength = titleLengths.length > 0
      ? Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length)
      : 0;

    const wordCount: Record<string, number> = {};
    posts.forEach(post => {
      const title = post.title.replace(/<[^>]*>/g, '').toLowerCase();
      const words = title.split(/[\s,\.!?]+/).filter(w => w.length > 1);
      words.forEach(word => {
        if (word !== keyword.toLowerCase()) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    const commonWords = Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const bloggerCount: Record<string, number> = {};
    posts.forEach(post => {
      bloggerCount[post.bloggername] = (bloggerCount[post.bloggername] || 0) + 1;
    });

    const topBloggers = Object.entries(bloggerCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dateDistribution: Record<string, number> = {};
    posts.forEach(post => {
      const date = post.postdate.substring(0, 6);
      dateDistribution[date] = (dateDistribution[date] || 0) + 1;
    });

    const analysisResult: AnalysisResult = {
      totalPosts: data.total || 0,
      topPosts: posts.slice(0, 10),
      averageTitleLength,
      commonWords,
      topBloggers,
      dateDistribution,
    };

    cache.set(cacheKey, analysisResult);
    return NextResponse.json(analysisResult, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('경쟁 블로그 분석 오류:', error);
    const message = error instanceof Error ? error.message : '경쟁 블로그 분석 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
