import { NextRequest, NextResponse } from 'next/server';

// 네이버 검색 API 클라이언트 정보
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "tth9fnsKBgcMDWVf96EV";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "tgW9pUVIRc";

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodedKeyword}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '문서수 조회 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const blogCount = data.total || 0;

    return NextResponse.json({ count: blogCount });
  } catch (error) {
    console.error('문서수 조회 오류:', error);
    return NextResponse.json(
      { error: '문서수 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

