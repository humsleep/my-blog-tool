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

export interface DiagnoseLatestResponse {
  latest: DiagnoseLatest | null;
  previous: DiagnoseLatest | null;
  delta: number | null;
}

/** profile.category(커뮤니티 분야) → /api/trending-keywords 의 hint 카테고리로 매핑 */
export const COMMUNITY_TO_TRENDING_CATEGORY: Record<string, string> = {
  'food-travel': '여행',
  'lifestyle': '인테리어',
  'info-howto': 'IT/기술',
  'review': '뷰티/패션',
  'culture': '영화/드라마',
  'health-fitness': '건강/운동',
  'parenting': '육아/결혼',
  'fashion-beauty': '뷰티/패션',
};

export const BAND_LABEL: Record<DiagnoseLatest['band'], string> = {
  top5:    '상위 5%',
  top15:   '상위 15%',
  top35:   '상위 35%',
  mid:     '평균',
  growing: '성장 단계',
};
