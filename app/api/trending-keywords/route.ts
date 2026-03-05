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

// 인기 키워드 카테고리별 힌트 키워드
const CATEGORY_HINTS: Record<string, string[]> = {
  '전체': ['블로그', '포스팅', 'SEO', '마케팅', '콘텐츠'],
  'IT/기술': ['프로그래밍', '개발', '코딩', '앱개발', '웹개발'],
  '요리/음식': ['레시피', '요리', '맛집', '카페', '디저트'],
  '여행': ['여행', '국내여행', '해외여행', '맛집', '관광지'],
  '뷰티/패션': ['화장품', '스킨케어', '패션', '옷', '스타일'],
  '건강/운동': ['운동', '다이어트', '헬스', '요가', '필라테스'],
  '교육/학습': ['공부', '학습', '교육', '자격증', '시험'],
  '경제/투자': ['주식', '투자', '부동산', '경제', '재테크'],
  '육아/결혼': ['육아', '아기', '임신', '결혼', '육아용품'],
  '인테리어': ['인테리어', '홈데코', '가구', '셀프인테리어', '소품'],
  '반려동물': ['강아지', '고양이', '펫', '반려동물', '애완동물'],
  '자동차': ['자동차', '차량', '전기차', '중고차', '자동차보험'],
  '스포츠': ['축구', '야구', '골프', '테니스', '러닝'],
  '게임': ['게임', '온라인게임', '모바일게임', 'PC게임', '게임추천'],
  '부동산': ['부동산', '아파트', '청약', '전세', '월세'],
  '영화/드라마': ['영화', '드라마', '넷플릭스', '애니메이션', 'OTT'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '전체';
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '20');

    const hints = CATEGORY_HINTS[category] || CATEGORY_HINTS['전체'];
    const allKeywords: Array<{
      keyword: string;
      monthlyPcQcCnt: number;
      monthlyMobileQcCnt: number;
      totalCount: number;
      category: string;
    }> = [];

    // 각 힌트 키워드로 검색하여 인기 키워드 수집
    for (const hint of hints.slice(0, 3)) { // 최대 3개 힌트만 사용
      try {
        const timestamp = Date.now().toString();
        const uri = '/keywordstool';
        const method = 'GET';
        
        const queryParams = new URLSearchParams({
          hintKeywords: hint,
          showDetail: '1',
        });
        
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

        if (response.ok) {
          const data = await response.json();
          const keywordList = data.keywordList || [];
          
          keywordList.forEach((item: any) => {
            const pcCount = parseInt(item.monthlyPcQcCnt || '0') || 0;
            const mobileCount = parseInt(item.monthlyMobileQcCnt || '0') || 0;
            const totalCount = pcCount + mobileCount;
            
            // 검색량이 있는 키워드만 추가
            if (totalCount > 0) {
              allKeywords.push({
                keyword: item.relKeyword || '',
                monthlyPcQcCnt: pcCount,
                monthlyMobileQcCnt: mobileCount,
                totalCount: totalCount,
                category: category,
              });
            }
          });
        }
        
        // API 호출 제한을 고려한 딜레이
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`키워드 조회 오류 (${hint}):`, error);
        continue;
      }
    }

    // 중복 제거 및 검색량 기준 정렬
    const uniqueKeywords = new Map<string, typeof allKeywords[0]>();
    
    allKeywords.forEach(item => {
      const key = item.keyword.toLowerCase();
      if (!uniqueKeywords.has(key) || uniqueKeywords.get(key)!.totalCount < item.totalCount) {
        uniqueKeywords.set(key, item);
      }
    });

    // 검색량 기준 내림차순 정렬
    const sortedKeywords = Array.from(uniqueKeywords.values())
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        keyword: item.keyword,
        monthlyPcQcCnt: item.monthlyPcQcCnt,
        monthlyMobileQcCnt: item.monthlyMobileQcCnt,
        totalCount: item.totalCount,
        category: item.category,
      }));

    return NextResponse.json({
      period,
      category,
      keywords: sortedKeywords,
      total: sortedKeywords.length,
    });
  } catch (error) {
    console.error('인기 검색어 조회 오류:', error);
    return NextResponse.json(
      { error: '인기 검색어 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

