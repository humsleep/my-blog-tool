import { NextRequest, NextResponse } from 'next/server';

// 네이버 검색 API 클라이언트 정보
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "tth9fnsKBgcMDWVf96EV";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "tgW9pUVIRc";

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

export async function POST(request: NextRequest) {
  try {
    const { keyword, limit = 10 } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodedKeyword}&display=${Math.min(limit, 100)}&sort=sim`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '경쟁 블로그 분석 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const posts: BlogPost[] = data.items || [];

    // 제목 길이 분석
    const titleLengths = posts.map(post => post.title.replace(/<[^>]*>/g, '').length);
    const averageTitleLength = titleLengths.length > 0
      ? Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length)
      : 0;

    // 자주 사용되는 단어 분석
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

    // 상위 블로거 분석
    const bloggerCount: Record<string, number> = {};
    posts.forEach(post => {
      bloggerCount[post.bloggername] = (bloggerCount[post.bloggername] || 0) + 1;
    });

    const topBloggers = Object.entries(bloggerCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 날짜 분포 분석
    const dateDistribution: Record<string, number> = {};
    posts.forEach(post => {
      const date = post.postdate.substring(0, 6); // YYYYMM
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

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('경쟁 블로그 분석 오류:', error);
    return NextResponse.json(
      { error: '경쟁 블로그 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

