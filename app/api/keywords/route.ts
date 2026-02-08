import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 네이버 검색광고 API 인증 정보
const API_KEY = process.env.NAVER_SEARCH_AD_API_KEY || "01000000005d84e573bf51b1af97bd55d80b4d161478ae089b8b686db032a1b9d3addb3ad3";
const SECRET_KEY = process.env.NAVER_SEARCH_AD_SECRET_KEY || "AQAAAABdhOVzv1Gxr5e9VdgLTRYUk3Gl94kmw7v5tmIXJb3Rrg==";
const CUSTOMER_ID = process.env.NAVER_SEARCH_AD_CUSTOMER_ID || "3495013";

function generateSignature(timestamp: string, method: string, uri: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
  return signature;
}

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const timestamp = Date.now().toString();
    const uri = '/keywordstool';
    const method = 'GET';
    
    const queryParams = new URLSearchParams({
      hintKeywords: keyword,
      showDetail: '1',
    });
    
    // 서명은 URI만 사용 (Python 스크립트와 동일)
    const signature = generateSignature(timestamp, method, uri, SECRET_KEY);

    const url = `https://api.searchad.naver.com${uri}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': API_KEY,
        'X-Customer': CUSTOMER_ID,
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('키워드 검색 오류:', error);
    return NextResponse.json(
      { error: '키워드 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

