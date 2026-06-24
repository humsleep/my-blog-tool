/**
 * 블로그 진단 점수 계산.
 *
 *   A. Activity   25%  — 발행 빈도, 꾸준함, 최근 활성
 *   B. Visibility 50%  — 내 글이 노린 키워드의 1페이지 진입율 (가장 중요, 진단 v3)
 *   C. Quality    25%  — 글당 평균 글자수, 이미지 비율, 카테고리 일관성
 *
 *  최종 score는 0~100. 각 축도 0~100.
 *  band:
 *    - 80+: 카테고리 상위 5%
 *    - 65~79: 상위 15%
 *    - 50~64: 상위 35%
 *    - 35~49: 평균
 *    - <35: 성장 단계
 *
 *  ⚠️ 진짜 백분위가 아닌 점수→밴드 매핑입니다. Phase 26에서 카테고리 베이스라인 분포 캐시
 *  도입 시 진짜 percentile로 교체 예정.
 */

import type { RssItem, RssSummary, BlogSearchItem } from './naver-blog';

export interface VisibilityHit {
  keyword: string;
  rank: number | null;       // 1~30 안에 들어가면 숫자, 아니면 null
  postTitle?: string;        // 이 키워드를 추출한 내 글 제목 (진단 v3 — 내 글 기준 측정)
  competition?: number;      // 해당 키워드 총 블로그 문서수 (경쟁도 프록시, 진단 v3.1)
}

export interface ActivityScore {
  score: number;             // 0~100
  postsLast30d: number;
  postsLast90d: number;
  daysSinceLastPost: number;
  avgIntervalDays: number;   // 최근 30개 글 기준 평균 발행 간격 (일)
  cadenceStdDays: number;    // 표준편차 (작을수록 꾸준함)
}

export interface VisibilityScore {
  score: number;             // 0~100
  totalKeywords: number;
  hitCount: number;          // 1~30 안 노출된 키워드 수
  topTenCount: number;       // 1~10 안 노출된 키워드 수
  avgRankWhenHit: number;    // 노출됐을 때 평균 순위 (없으면 NaN)
  lowCompetitionHits: number; // 경쟁이 약한 키워드(무경쟁 구간)에서의 노출 수 — 점수 가산 적음
  hits: VisibilityHit[];
}

export interface QualityScore {
  score: number;             // 0~100
  avgCharsPerPost: number;
  avgImagesPerPost: number;
  categoryConsistency: number;   // 0~1 (가장 빈도 높은 카테고리 비율)
  topCategory: string | null;
}

export type Band = 'top5' | 'top15' | 'top35' | 'mid' | 'growing';

export interface DiagnoseScore {
  total: number;             // 0~100
  band: Band;
  activity: ActivityScore;
  visibility: VisibilityScore;
  quality: QualityScore;
  insights: string[];        // 자동 생성된 한국어 한줄 인사이트 (최대 6개)
  warnings: string[];        // 측정 한계·주의사항 (예: 신생 블로그)
}

const DAY_MS = 86_400_000;

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/* ─────────────────────────────────────────────────────────────────
 * A. Activity score
 * ──────────────────────────────────────────────────────────────── */
export function scoreActivity(items: RssItem[], now: number = Date.now()): ActivityScore {
  if (items.length === 0) {
    return {
      score: 0, postsLast30d: 0, postsLast90d: 0,
      daysSinceLastPost: Infinity, avgIntervalDays: Infinity, cadenceStdDays: Infinity,
    };
  }

  const dates = items
    .map((it) => new Date(it.pubDate).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);

  const last30 = now - 30 * DAY_MS;
  const last90 = now - 90 * DAY_MS;
  const postsLast30d = dates.filter((t) => t >= last30).length;
  const postsLast90d = dates.filter((t) => t >= last90).length;

  const daysSinceLastPost = dates.length ? (now - dates[0]) / DAY_MS : Infinity;

  // 평균 발행 간격 + 표준편차 (최근 30개)
  const recent = dates.slice(0, 30);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push((recent[i - 1] - recent[i]) / DAY_MS);
  }
  const avgIntervalDays = intervals.length
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : Infinity;
  const variance = intervals.length
    ? intervals.reduce((a, b) => a + Math.pow(b - avgIntervalDays, 2), 0) / intervals.length
    : Infinity;
  const cadenceStdDays = Number.isFinite(variance) ? Math.sqrt(variance) : Infinity;

  // 점수 산출 (3개 서브 점수의 가중 평균)
  // 1. 30일 발행 점수: 8편 이상 1.0, 0편 0.0 (선형)
  const s30 = clamp01(postsLast30d / 8);
  // 2. 활성도 점수: 7일 안에 발행 1.0, 30일 0.0
  const sActive = Number.isFinite(daysSinceLastPost)
    ? clamp01(1 - Math.max(0, daysSinceLastPost - 7) / 23)
    : 0;
  // 3. 꾸준함 점수: 표준편차/평균 비율이 낮을수록 1.0 (CV < 0.5 만점)
  const cv = Number.isFinite(avgIntervalDays) && avgIntervalDays > 0
    ? cadenceStdDays / avgIntervalDays : 1;
  const sCadence = clamp01(1 - Math.max(0, cv - 0.5) / 1.5);

  const score = Math.round((s30 * 0.4 + sActive * 0.4 + sCadence * 0.2) * 100);

  return {
    score,
    postsLast30d,
    postsLast90d,
    daysSinceLastPost: Number.isFinite(daysSinceLastPost) ? round1(daysSinceLastPost) : Infinity,
    avgIntervalDays: Number.isFinite(avgIntervalDays) ? round1(avgIntervalDays) : Infinity,
    cadenceStdDays: Number.isFinite(cadenceStdDays) ? round1(cadenceStdDays) : Infinity,
  };
}

/* ─────────────────────────────────────────────────────────────────
 * B. Visibility score
 *    진단 v3 — 도구가 정한 분야 고정 키워드가 아니라, 사용자가 실제로 쓴 글에서
 *    뽑은 키워드로 검색해 "내 글이 1페이지에 뜨는가"를 측정한다. (분야·규모와 무관하게 공정)
 *
 *    v3.1 경쟁도 보정 — "내 키워드로 내 글 찾기"는 제목이 독특할수록 거의 무조건 상위에
 *    잡혀 점수가 과대평가될 수 있다(자기키워드 인플레이션). 키워드별 총 문서수(total)를
 *    경쟁도로 보아, 무경쟁 키워드의 노출은 가산을 줄이고 경쟁 키워드의 노출은 더 크게 인정한다.
 * ──────────────────────────────────────────────────────────────── */

/** 순위 → 노출 크레딧 (1페이지 안에서 상위일수록 높게). */
function rankCredit(rank: number | null): number {
  if (rank === null) return 0;
  if (rank <= 10) return 1.0;
  if (rank <= 20) return 0.7;
  return 0.45;                 // 21~30위
}

/** 경쟁도(총 문서수) → 가중치. 무경쟁이면 떠도 가치가 적고, 헤드 키워드면 가치가 크다.
 *  competition 미상(undefined)이면 중립(1.0) — 하위호환. */
function competitionWeight(total: number | undefined): number {
  if (total === undefined) return 1.0;
  if (total < 300) return 0.3;      // 거의 무경쟁 — 떠도 의미 적음
  if (total < 3_000) return 0.6;
  if (total < 30_000) return 1.0;
  return 1.3;                        // 헤드 — 떠면 가치 큼
}

const LOW_COMPETITION_MAX = 300;
/** 가중 노출 크레딧 비율이 이 값이면 만점 (덜 박하게 — '공정' 의도 유지). */
const VISIBILITY_TARGET_RATIO = 0.5;

export function scoreVisibility(hits: VisibilityHit[]): VisibilityScore {
  const total = hits.length;
  const hit = hits.filter((h) => h.rank !== null);
  const top10 = hit.filter((h) => (h.rank as number) <= 10).length;
  const sumRanks = hit.reduce((a, h) => a + (h.rank as number), 0);
  const avgRank = hit.length ? sumRanks / hit.length : NaN;

  // 경쟁도 가중 노출 점수 — Σ(가중치·순위크레딧) / 키워드수.
  //   분모를 '키워드 수'로 둔다(Σ가중치가 아님): 그래야 무경쟁 키워드만 1위인 블로그가
  //   만점이 되지 않고(각 크레딧이 0.3배로 깎임), 경쟁 키워드 노출이 점수를 끌어올린다.
  let creditSum = 0;
  let lowCompetitionHits = 0;
  for (const h of hits) {
    const w = competitionWeight(h.competition);
    creditSum += w * rankCredit(h.rank);
    if (h.rank !== null && h.competition !== undefined && h.competition < LOW_COMPETITION_MAX) {
      lowCompetitionHits++;
    }
  }
  const ratio = total > 0 ? creditSum / total : 0;
  const score = Math.round(clamp01(ratio / VISIBILITY_TARGET_RATIO) * 100);

  return {
    score,
    totalKeywords: total,
    hitCount: hit.length,
    topTenCount: top10,
    avgRankWhenHit: hit.length ? round1(avgRank) : NaN,
    lowCompetitionHits,
    hits,
  };
}

/* ─────────────────────────────────────────────────────────────────
 * C. Quality score
 * ──────────────────────────────────────────────────────────────── */
export function scoreQuality(items: RssItem[]): QualityScore {
  if (items.length === 0) {
    return { score: 0, avgCharsPerPost: 0, avgImagesPerPost: 0, categoryConsistency: 0, topCategory: null };
  }
  const recent = items.slice(0, 30);

  const avgChars = recent.reduce((a, it) => a + it.contentLength, 0) / recent.length;
  const avgImages = recent.reduce((a, it) => a + it.imageCount, 0) / recent.length;

  // 카테고리 빈도
  const cats = recent.map((it) => it.category).filter((c): c is string => !!c);
  const counts = new Map<string, number>();
  for (const c of cats) counts.set(c, (counts.get(c) || 0) + 1);
  let topCategory: string | null = null;
  let topCount = 0;
  for (const [name, n] of counts) {
    if (n > topCount) { topCategory = name; topCount = n; }
  }
  const categoryConsistency = cats.length ? topCount / cats.length : 0;

  // 점수
  // 1. 글자수: 최근 글 본문 실제 측정값 기준 — 1,500자 이상 만점, 300자 미만 0
  const sChars = clamp01((avgChars - 300) / 1200);
  // 2. 이미지: 글당 평균 3장 만점, 0장 0
  const sImg = clamp01(avgImages / 3);
  // 3. 카테고리 일관성: 60% 집중 만점, 20% 이하 0 (C-Rank 친화)
  const sCat = clamp01((categoryConsistency - 0.2) / 0.4);

  const score = Math.round((sChars * 0.4 + sImg * 0.2 + sCat * 0.4) * 100);
  return {
    score,
    avgCharsPerPost: Math.round(avgChars),
    avgImagesPerPost: round1(avgImages),
    categoryConsistency: round1(categoryConsistency),
    topCategory,
  };
}

/* ─────────────────────────────────────────────────────────────────
 * Composite + insights
 * ──────────────────────────────────────────────────────────────── */
function bandFor(total: number): Band {
  if (total >= 80) return 'top5';
  if (total >= 65) return 'top15';
  if (total >= 50) return 'top35';
  if (total >= 35) return 'mid';
  return 'growing';
}

export function compose(
  activity: ActivityScore,
  visibility: VisibilityScore,
  quality: QualityScore,
  warnings: string[] = [],
): DiagnoseScore {
  // 가중치
  const total = Math.round(
    activity.score * 0.25 +
    visibility.score * 0.50 +
    quality.score * 0.25,
  );

  const insights: string[] = [];

  // 활동성 인사이트
  if (activity.daysSinceLastPost === Infinity) {
    insights.push('최근 RSS에서 글이 잡히지 않았어요. 비공개 블로그이거나 RSS 발행이 비활성화됐을 수 있습니다.');
  } else if (activity.daysSinceLastPost > 14) {
    insights.push(`최근 ${Math.round(activity.daysSinceLastPost)}일 동안 새 글이 없어요. 발행 간격이 멀어지면 노출 점수가 빠르게 떨어집니다.`);
  } else if (activity.postsLast30d >= 8) {
    insights.push(`최근 30일 ${activity.postsLast30d}편 — 발행량은 상위권입니다. 이 페이스를 유지하세요.`);
  }
  if (Number.isFinite(activity.avgIntervalDays) && activity.cadenceStdDays > activity.avgIntervalDays) {
    insights.push('발행 간격의 변동이 커요. 같은 요일·시간대를 정해두면 알고리즘 친화도가 올라갑니다.');
  }

  // 노출 인사이트 — 내 글이 노린 키워드 기준
  if (visibility.totalKeywords > 0 && visibility.hitCount === 0) {
    insights.push('내 글이 노린 키워드 중 1페이지 노출이 0건이에요. 제목 앞쪽에 핵심 키워드를 배치하고, 경쟁이 약한 롱테일부터 공략해 보세요.');
  } else if (visibility.hitCount >= Math.max(5, Math.round(visibility.totalKeywords * 0.5))) {
    insights.push(`측정한 내 글 ${visibility.totalKeywords}개 중 ${visibility.hitCount}개가 검색 1페이지에 떠요 — 노린 키워드를 잘 잡고 있습니다.`);
  }
  if (visibility.topTenCount >= 3) {
    insights.push(`상위 10위 안 진입 글이 ${visibility.topTenCount}개 — 그 글들의 패턴(제목·구조·본문 길이)을 새 글에 적용해 보세요.`);
  }
  if (visibility.hitCount > 0 && visibility.lowCompetitionHits >= Math.ceil(visibility.hitCount * 0.6)) {
    insights.push(`노출된 글 다수가 경쟁이 약한 키워드라 점수 가산이 제한적이에요. 검색량이 있는 키워드로도 1페이지에 들어가야 실제 유입이 늘어납니다.`);
  }

  // 품질 인사이트
  if (quality.avgCharsPerPost < 700) {
    insights.push(`글당 평균 ${quality.avgCharsPerPost}자 — 1,500자 안팎으로 늘리면 D.I.A. 점수에 유리합니다.`);
  }
  if (quality.avgImagesPerPost < 1) {
    insights.push('글당 이미지가 거의 없어요. 한 편에 3~5장 정도 적절히 배치하면 체류시간이 늘어납니다.');
  }
  if (quality.categoryConsistency < 0.4 && quality.topCategory) {
    insights.push(`주제가 분산되어 있어요. 비중이 가장 높은 "${quality.topCategory}" 한 카테고리에 집중하면 C-Rank 누적이 빨라집니다.`);
  } else if (quality.categoryConsistency >= 0.6 && quality.topCategory) {
    insights.push(`"${quality.topCategory}" 카테고리에 집중되어 있어 전문성 점수가 잘 누적되고 있어요.`);
  }

  return {
    total,
    band: bandFor(total),
    activity,
    visibility,
    quality,
    insights: insights.slice(0, 6),
    warnings,
  };
}

export function summarizeRss(rss: RssSummary | null): { items: RssItem[]; warnings: string[] } {
  if (!rss) return { items: [], warnings: ['RSS를 가져오지 못했어요. 비공개 설정·잘못된 ID·일시적 네트워크 오류일 수 있습니다.'] };
  const warnings: string[] = [];
  if (rss.items.length < 5) warnings.push(`최근 글이 ${rss.items.length}편뿐이라 활동성 점수가 보수적으로 산출됐어요.`);
  return { items: rss.items, warnings };
}

/** 검색 결과 풀에서 특정 blogId의 순위를 매핑하는 유틸 (외부에서 hit 리스트 만들 때 사용). */
export function mapHits(
  searchResults: { keyword: string; items: BlogSearchItem[] | null }[],
  blogId: string,
): VisibilityHit[] {
  return searchResults.map(({ keyword, items }) => {
    if (!items) return { keyword, rank: null };
    const needle = blogId.toLowerCase();
    let rank: number | null = null;
    for (let i = 0; i < items.length; i++) {
      const link = (items[i].bloggerlink || items[i].link || '').toLowerCase();
      if (link.includes(`blog.naver.com/${needle}`) || link.includes(`/${needle}/`) || link.endsWith(`/${needle}`)) {
        rank = i + 1;
        break;
      }
    }
    return { keyword, rank };
  });
}
