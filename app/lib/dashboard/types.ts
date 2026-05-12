/** 데일리 대시보드용 타입 모음 (Phase 28) */

export interface TrendingItem {
  rank: number;
  keyword: string;
  totalCount: number;
}

export interface DiagnoseLatest {
  id: string;
  blog_id: string;
  blog_title: string | null;
  category: string;
  category_label: string | null;
  total_score: number;
  activity_score: number;
  visibility_score: number;
  quality_score: number;
  band: 'top5' | 'top15' | 'top35' | 'mid' | 'growing';
  hit_count: number | null;
  top_ten_count: number | null;
  created_at: string;
}

export interface DiagnoseHistoryPoint {
  date: string;
  score: number;
}

export interface DiagnoseLatestResponse {
  latest: DiagnoseLatest | null;
  previous: DiagnoseLatest | null;
  delta: number | null;
  history?: DiagnoseHistoryPoint[];
}

/** profile.category(`app/lib/community/categories.ts` 의 한국어 카테고리) →
 *  `/api/trending-keywords` 가 받는 hint 카테고리로 매핑.
 *
 *  - 같은 라벨이면 1:1 (예: 'IT/기술' → 'IT/기술')
 *  - 트렌드 API에 없는 카테고리는 가장 가까운 것으로 흡수 ('맛집' → '요리/음식')
 *  - 매핑하지 않은 키('일상', '기타')는 호출부에서 `?? '전체'` 로 떨어짐
 */
export const COMMUNITY_TO_TRENDING_CATEGORY: Record<string, string> = {
  '맛집':       '요리/음식',
  '육아/결혼':  '육아/결혼',
  '스포츠':     '스포츠',
  'IT/기술':    'IT/기술',
  '요리/음식':  '요리/음식',
  '여행':       '여행',
  '뷰티/패션':  '뷰티/패션',
  '건강/운동':  '건강/운동',
  '교육/학습':  '교육/학습',
  '경제/투자':  '경제/투자',
  '인테리어':   '인테리어',
  '반려동물':   '반려동물',
  '자동차':     '자동차',
  '게임':       '게임',
  '부동산':     '부동산',
  '영화/드라마': '영화/드라마',
  // '일상' / '기타' — 전체 트렌드로 폴백 (매핑하지 않음)
};

export const BAND_LABEL: Record<DiagnoseLatest['band'], string> = {
  top5:    '상위 5%',
  top15:   '상위 15%',
  top35:   '상위 35%',
  mid:     '평균',
  growing: '성장 단계',
};
