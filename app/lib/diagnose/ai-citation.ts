/**
 * AI 인용 진단 — "AI 브리핑 인용 기대치" (AI API 0, 스크래핑 0).
 *
 * 배경: 2026 네이버는 Cue: 종료 후 AI 브리핑(통합검색 20%+)으로 AI 인용이 노출의 본류.
 *       하지만 "실제 인용수"를 주는 공식 API는 없고, SERP 스크래핑은 깨지기 쉬워 1인 운영엔 부담.
 *
 * 그래서 스크래핑 대신 두 축의 곱으로 "인용 가능성"을 정직하게 추정한다:
 *   1) 적합도 — 내가 노린 키워드가 'AI 브리핑이 실제로 뜨는' 정보성/질문형인가 (키워드만으로 분류)
 *   2) 준비도 — 그 글이 인용될 구조인가 (mate-readiness 점수, 별도 모듈)
 *   기대치 = 적합도비율 × 준비도점수.  (둘 다 높아야 인용 기대치가 높음)
 *
 * 또한 사용자가 직접 확인할 수 있도록 적합 키워드의 네이버 검색 링크를 함께 제공한다(panel에서 사용).
 */

export type AiProneTier = 'high' | 'medium' | 'low';

export interface AiKeywordItem {
  keyword: string;
  tier: AiProneTier;
  weight: number;     // high 1.0 / medium 0.6 / low 0.2
}

export interface AiCitationReport {
  totalKeywords: number;
  proneCount: number;        // tier !== 'low' 인 키워드 수 (AI 브리핑 적합)
  highCount: number;         // tier === 'high'
  proneRatio: number;        // Σweight / total (0~1)
  readinessScore: number;    // mate-readiness 점수 (0~100)
  expectationScore: number;  // round(proneRatio * readinessScore) — "AI 인용 기대치"
  grade: 'high' | 'mid' | 'low';
  keywords: AiKeywordItem[]; // 적합도 내림차순 정렬
}

/* 강한 정보성/질문 의도 — AI 브리핑이 가장 잘 뜨는 유형. */
const HIGH_PATTERNS = [
  '방법', '하는법', '하는 법', '어떻게', '왜', '언제', '어디', '누구',
  '차이', '비교', 'vs', '대비', '장단점',
  '뜻', '의미', '란', '이란', '정의', '개념',
  '효능', '효과', '증상', '원인', '부작용', '예방', '치료',
  '조건', '자격', '신청', '절차', '준비물', '서류', '기준', '방법은',
  '가격', '비용', '요금', '시세', '얼마', '환율',
  '순위', '종류', '리스트', '총정리',
];

/* 상업·후기성 정보 — 스마트블록/AI 브리핑이 종종 뜨는 유형. */
const MEDIUM_PATTERNS = [
  '추천', '후기', '리뷰', '베스트', 'best', '가성비', '내돈내산',
  '맛집', '카페', '여행', '가볼만한곳', '코스', '일정', '제품', '비교후기',
];

function norm(keyword: string): string {
  // 공백 제거 + 소문자 — "하는 법" / "하는법" 같은 변형 흡수.
  return keyword.toLowerCase().replace(/\s+/g, '');
}

/** 키워드 한 개의 AI 브리핑 적합도 분류. */
export function classifyAiProneness(keyword: string): AiKeywordItem {
  const k = norm(keyword);
  if (!k) return { keyword, tier: 'low', weight: 0.2 };
  if (keyword.includes('?')) return { keyword, tier: 'high', weight: 1.0 };
  if (HIGH_PATTERNS.some((p) => k.includes(norm(p)))) {
    return { keyword, tier: 'high', weight: 1.0 };
  }
  if (MEDIUM_PATTERNS.some((p) => k.includes(norm(p)))) {
    return { keyword, tier: 'medium', weight: 0.6 };
  }
  return { keyword, tier: 'low', weight: 0.2 };
}

const TIER_ORDER: Record<AiProneTier, number> = { high: 0, medium: 1, low: 2 };

/**
 * 내 키워드 목록 + 준비도 점수 → AI 인용 기대치 리포트.
 * @param keywords 진단이 뽑은 내 글 키워드 (중복 제거된 목록)
 * @param readinessScore mate-readiness 점수(0~100)
 */
export function analyzeAiCitation(keywords: string[], readinessScore: number): AiCitationReport {
  const items = keywords.map(classifyAiProneness);
  const total = items.length;
  const proneCount = items.filter((i) => i.tier !== 'low').length;
  const highCount = items.filter((i) => i.tier === 'high').length;
  const proneRatio = total ? items.reduce((a, i) => a + i.weight, 0) / total : 0;
  const expectationScore = Math.round(proneRatio * readinessScore);

  const grade: AiCitationReport['grade'] =
    expectationScore >= 55 ? 'high' : expectationScore >= 30 ? 'mid' : 'low';

  const sorted = [...items].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  return {
    totalKeywords: total,
    proneCount,
    highCount,
    proneRatio: Math.round(proneRatio * 100) / 100,
    readinessScore,
    expectationScore,
    grade,
    keywords: sorted,
  };
}

/** 키워드 → 네이버 검색(직접 AI 브리핑 확인용) URL. 사용자 브라우저에서 열림. */
export function naverSearchUrl(keyword: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
}

export const AI_TIER_LABEL: Record<AiProneTier, string> = {
  high: 'AI 브리핑 적합',
  medium: '부분 적합',
  low: '비대상',
};
