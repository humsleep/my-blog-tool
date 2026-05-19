/**
 * 경쟁 블로거 패턴 분석 (Phase 53 — 진단 v2.0).
 *
 *  사용자 카테고리에서 "상위 블로거"를 자동 식별하고, 그들의 최근 글 메타 데이터에서
 *  휴리스틱 패턴(제목 길이, 발행 시간대 등)을 추출. AI 호출 없음, 통계·정규식만 사용.
 *
 *  흐름:
 *    1) 카테고리 시드 키워드에서 5개 샘플 → 네이버 블로그 검색 OpenAPI
 *    2) 검색 결과의 bloggerlink 에서 blogId 추출 → 빈도 카운트 → 상위 5명
 *    3) 각 블로거 RSS → 최근 5편 메타 (제목, pubDate, contentLength, imageCount)
 *    4) 휴리스틱 집계: 평균/중앙값, 비율, 시간대 mode
 *
 *  비용: 카테고리당 검색 5회 + RSS 5회 = 10회 외부 호출. 24h 캐시로 같은 카테고리
 *  사용자가 늘어도 1번만 측정.
 */
import { fetchRss, searchBlogByQuery, type BlogSearchItem, type RssItem } from './naver-blog';
import { CATEGORY_SEEDS, type DiagnoseCategory } from './category-seeds';
import { getCache } from '@/app/lib/cache';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cache = getCache<CompetitorPatterns>('competitor-patterns', CACHE_TTL_MS, 64);

/** 분석 한 글의 휴리스틱 특성. */
export interface PostFeatures {
  titleLength: number;
  titleHasNumber: boolean;          // 제목에 아라비아 숫자 포함
  titleStartsWithKeyword: boolean;  // 제목 첫 12자 안에 카테고리 시드 키워드 토큰 포함
  charCount: number;                // RSS contentLength (참고치)
  imageCount: number;               // RSS 안 <img> 개수
  publishHour: number;              // 0~23 (KST 기준)
  publishDow: number;               // 0=일 ~ 6=토 (KST 기준)
}

interface NumStats {
  avg: number;
  median: number;
  min: number;
  max: number;
}

/** 카테고리 단위 패턴 집계 결과. */
export interface CompetitorPatterns {
  category: DiagnoseCategory;
  categoryLabel: string;
  sampleSize: number;        // 분석한 글 수
  bloggerCount: number;      // 분석한 상위 블로거 수
  collectedAt: string;       // ISO
  titleLength: NumStats;
  charCount: NumStats;
  imageCount: NumStats;
  titleHasNumberRatio: number;     // 0~1
  titleStartsWithKeywordRatio: number;
  /** 발행 시간대 분포 (0~23 → 글 수) */
  publishHourHistogram: number[];
  /** 가장 많이 발행한 시간대 (0~23) */
  publishHourMode: number;
  /** 가장 많이 발행한 요일 (0=일) */
  publishDowMode: number;
  /** 분석한 상위 블로거 — 사용자에게 투명하게 노출 */
  sampledBloggers: Array<{ blogId: string; postCount: number }>;
}

/** 사용자 블로그 한 명의 글 features (CompetitorPatterns 와 같은 휴리스틱으로 비교). */
export function extractUserFeatures(
  items: RssItem[],
  categoryKeywords: string[],
): PostFeatures[] {
  return items.map((it) => extractFeatures(it, categoryKeywords));
}

/** RSS 한 글 → features. category keyword 토큰은 split 공백 기준. */
function extractFeatures(item: RssItem, categoryKeywords: string[]): PostFeatures {
  const title = item.title || '';
  const titleHead = title.slice(0, 12).toLowerCase();
  const tokens = new Set(
    categoryKeywords
      .flatMap((k) => k.toLowerCase().split(/\s+/))
      .filter((t) => t.length >= 2),
  );
  const titleStartsWithKeyword = Array.from(tokens).some((t) => titleHead.includes(t));
  const titleHasNumber = /[0-9]/.test(title);

  const d = new Date(item.pubDate);
  // KST 변환 — 서버는 UTC 가정.
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const publishHour = Number.isNaN(d.getTime()) ? 0 : kst.getUTCHours();
  const publishDow  = Number.isNaN(d.getTime()) ? 0 : kst.getUTCDay();

  return {
    titleLength: title.length,
    titleHasNumber,
    titleStartsWithKeyword,
    charCount: item.contentLength,
    imageCount: item.imageCount,
    publishHour,
    publishDow,
  };
}

/** blog.naver.com/<blogId> URL 에서 blogId 추출. 실패 시 null. */
function blogIdFromUrl(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:m\.)?blog\.naver\.com\/([A-Za-z0-9_-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** 5개 키워드 균등 추출 — 시드 30개 중 0/7/14/21/28번째 (헤드·미드·롱테일 분포 유지). */
function sampleKeywords(keywords: string[]): string[] {
  const n = keywords.length;
  if (n <= 5) return keywords.slice();
  const idx = [0, Math.floor(n * 0.2), Math.floor(n * 0.4), Math.floor(n * 0.6), Math.floor(n * 0.8)];
  return idx.map((i) => keywords[i]);
}

/** 메인 — 카테고리 패턴 분석. 캐시 hit 즉시 반환. */
export async function fetchCompetitorPatterns(
  category: DiagnoseCategory,
): Promise<CompetitorPatterns | null> {
  const cached = cache.get(category);
  if (cached) return cached;

  const seed = CATEGORY_SEEDS.find((c) => c.value === category);
  if (!seed) return null;

  /* 1) 5개 키워드 → 검색 → blogId 빈도 집계 */
  const queries = sampleKeywords(seed.keywords);
  const searchResults = await Promise.all(queries.map((q) => searchBlogByQuery(q, 20)));
  const blogIdFreq = new Map<string, number>();
  for (const list of searchResults) {
    if (!list) continue;
    /* 같은 검색 결과 안에서 같은 블로거가 여러 번 나오면 1로 counting (overweight 방지). */
    const seen = new Set<string>();
    for (const item of list as BlogSearchItem[]) {
      const id = blogIdFromUrl(item.bloggerlink || item.link);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      blogIdFreq.set(id, (blogIdFreq.get(id) ?? 0) + 1);
    }
  }
  if (blogIdFreq.size === 0) return null;

  /* 2) 빈도 상위 5명 선정 */
  const topBloggers = Array.from(blogIdFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* 3) 각 블로거 RSS → 최근 5편 features */
  const rssResults = await Promise.all(topBloggers.map(([id]) => fetchRss(id)));
  const sampledBloggers: Array<{ blogId: string; postCount: number }> = [];
  const allFeatures: PostFeatures[] = [];
  rssResults.forEach((rss, i) => {
    if (!rss || rss.items.length === 0) return;
    const items = rss.items.slice(0, 5);
    sampledBloggers.push({ blogId: topBloggers[i][0], postCount: items.length });
    for (const item of items) {
      allFeatures.push(extractFeatures(item, seed.keywords));
    }
  });

  if (allFeatures.length === 0) return null;

  /* 4) 집계 */
  const patterns: CompetitorPatterns = {
    category,
    categoryLabel: seed.label,
    sampleSize: allFeatures.length,
    bloggerCount: sampledBloggers.length,
    collectedAt: new Date().toISOString(),
    titleLength: numStats(allFeatures.map((f) => f.titleLength)),
    charCount: numStats(allFeatures.map((f) => f.charCount)),
    imageCount: numStats(allFeatures.map((f) => f.imageCount)),
    titleHasNumberRatio: ratio(allFeatures, (f) => f.titleHasNumber),
    titleStartsWithKeywordRatio: ratio(allFeatures, (f) => f.titleStartsWithKeyword),
    publishHourHistogram: histogram(allFeatures.map((f) => f.publishHour), 24),
    publishHourMode: mode(allFeatures.map((f) => f.publishHour)),
    publishDowMode: mode(allFeatures.map((f) => f.publishDow)),
    sampledBloggers,
  };

  cache.set(category, patterns);
  return patterns;
}

/* ── 통계 헬퍼 ───────────────────────────────────────────────── */
function numStats(values: number[]): NumStats {
  if (values.length === 0) return { avg: 0, median: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { avg, median, min: sorted[0], max: sorted[sorted.length - 1] };
}
function ratio<T>(arr: T[], pred: (v: T) => boolean): number {
  if (arr.length === 0) return 0;
  return arr.filter(pred).length / arr.length;
}
function histogram(values: number[], buckets: number): number[] {
  const out = new Array(buckets).fill(0);
  for (const v of values) if (v >= 0 && v < buckets) out[v]++;
  return out;
}
function mode(values: number[]): number {
  if (values.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0];
  let bestC = -1;
  for (const [v, c] of counts) {
    if (c > bestC) { best = v; bestC = c; }
  }
  return best;
}

/* ── 사용자 vs 상위 비교 ───────────────────────────────────── */
export interface PatternComparison {
  patterns: CompetitorPatterns;
  user: {
    sampleSize: number;
    titleLength: NumStats;
    charCount: NumStats;
    imageCount: NumStats;
    titleHasNumberRatio: number;
    titleStartsWithKeywordRatio: number;
    publishHourMode: number;
    publishDowMode: number;
  };
  /** 항목별 +/- 비교 (사용자가 상위 대비 얼마나 부족/충분한지) */
  diffs: {
    titleLength: { diff: number; percent: number; hint: 'short' | 'long' | 'ok' };
    charCount: { diff: number; percent: number; hint: 'short' | 'long' | 'ok' };
    imageCount: { diff: number; percent: number; hint: 'short' | 'long' | 'ok' };
    titleHasNumberRatio: { diff: number; hint: 'under' | 'over' | 'ok' };
    titleStartsWithKeywordRatio: { diff: number; hint: 'under' | 'over' | 'ok' };
  };
}

export function compareToPatterns(
  patterns: CompetitorPatterns,
  userFeatures: PostFeatures[],
): PatternComparison {
  const u = {
    sampleSize: userFeatures.length,
    titleLength: numStats(userFeatures.map((f) => f.titleLength)),
    charCount: numStats(userFeatures.map((f) => f.charCount)),
    imageCount: numStats(userFeatures.map((f) => f.imageCount)),
    titleHasNumberRatio: ratio(userFeatures, (f) => f.titleHasNumber),
    titleStartsWithKeywordRatio: ratio(userFeatures, (f) => f.titleStartsWithKeyword),
    publishHourMode: mode(userFeatures.map((f) => f.publishHour)),
    publishDowMode: mode(userFeatures.map((f) => f.publishDow)),
  };

  /** -25% 이상 차이를 약점으로 본다. */
  const judge = (uVal: number, pVal: number): 'short' | 'long' | 'ok' => {
    if (pVal === 0) return 'ok';
    const ratio = (uVal - pVal) / pVal;
    if (ratio < -0.25) return 'short';
    if (ratio > 0.25) return 'long';
    return 'ok';
  };
  const judgeRatio = (uVal: number, pVal: number): 'under' | 'over' | 'ok' => {
    const diff = uVal - pVal;
    if (diff < -0.2) return 'under';
    if (diff > 0.2) return 'over';
    return 'ok';
  };

  return {
    patterns,
    user: u,
    diffs: {
      titleLength: {
        diff: u.titleLength.avg - patterns.titleLength.avg,
        percent: patterns.titleLength.avg ? (u.titleLength.avg - patterns.titleLength.avg) / patterns.titleLength.avg : 0,
        hint: judge(u.titleLength.avg, patterns.titleLength.avg),
      },
      charCount: {
        diff: u.charCount.avg - patterns.charCount.avg,
        percent: patterns.charCount.avg ? (u.charCount.avg - patterns.charCount.avg) / patterns.charCount.avg : 0,
        hint: judge(u.charCount.avg, patterns.charCount.avg),
      },
      imageCount: {
        diff: u.imageCount.avg - patterns.imageCount.avg,
        percent: patterns.imageCount.avg ? (u.imageCount.avg - patterns.imageCount.avg) / patterns.imageCount.avg : 0,
        hint: judge(u.imageCount.avg, patterns.imageCount.avg),
      },
      titleHasNumberRatio: {
        diff: u.titleHasNumberRatio - patterns.titleHasNumberRatio,
        hint: judgeRatio(u.titleHasNumberRatio, patterns.titleHasNumberRatio),
      },
      titleStartsWithKeywordRatio: {
        diff: u.titleStartsWithKeywordRatio - patterns.titleStartsWithKeywordRatio,
        hint: judgeRatio(u.titleStartsWithKeywordRatio, patterns.titleStartsWithKeywordRatio),
      },
    },
  };
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
export function formatDow(d: number): string {
  return DAY_NAMES[d] ?? '?';
}
export function formatHourRange(h: number): string {
  const start = h.toString().padStart(2, '0');
  const end = ((h + 1) % 24).toString().padStart(2, '0');
  return `${start}~${end}시`;
}
