/**
 * 휴리스틱 코치 — 진단 v2.1 (Phase 54).
 *
 *  사용자의 최근 글 12편(RSS 메타 + contentSnippet)에서 글 스타일, 약점, 즉시 실행 가능한 quick wins 추출.
 *  AI API 사용 0. 한국어 형태소 분석기 없이 키워드 패턴 매칭 + 정규식만으로 강력한 인사이트.
 *
 *  반환:
 *   - styleProfile: 글 스타일 분포 (정보형/후기형/일상형/기타)
 *   - weakSignals: 12편 중 N편에서 누락된 약점 패턴 (배열, 빈도 내림차순)
 *   - quickWins: 즉시 실행 가능한 짧은 조언 (배열, 최대 4개)
 *   - sampleSize: 분석한 글 수
 */
import type { RssItem } from './naver-blog';

/* ── 키워드 사전 — 한국어 블로그 글 스타일 분류 ──────────
 *  제목 + contentSnippet 에서 다음 토큰이 발견되면 해당 스타일로 가중치.
 *  단어 부분 매칭이므로 "방문기", "가봤다" 같은 변형도 잡힘. */
const STYLE_KEYWORDS = {
  info: [
    '방법', '어떻게', '추천', '베스트', '정리', '가이드', '노하우', '팁',
    '비교', '차이', '꿀팁', '리스트', '총정리', '완벽', '기초', '입문',
  ],
  review: [
    '후기', '리뷰', '방문', '가봤', '먹어봤', '써본', '솔직', '경험',
    '체험', '내돈내산', '추천템', '비추', '실사용', '직접',
  ],
  daily: [
    '오늘', '어제', '일상', '데일리', '일기', '기록', '잡담', '근황',
    '하루', '생각', '감상', '소소한', '브이로그',
  ],
} as const;

type StyleKey = keyof typeof STYLE_KEYWORDS;

export interface StyleProfile {
  info: number;     // 0~1
  review: number;
  daily: number;
  other: number;
  dominant: StyleKey | 'other';
}

export interface WeakSignal {
  /** 사용자에게 보이는 짧은 라벨. 예: "제목 첫 12자에 핵심 키워드 누락" */
  label: string;
  /** 12편 중 몇 편에서 발견됐는지 */
  affectedCount: number;
  /** 영향 강도 — 우선순위 ↑ */
  severity: 'high' | 'mid' | 'low';
  /** 사용자에게 보이는 한 줄 처방 */
  fix: string;
}

export interface QuickWin {
  /** "다음 글에서 즉시" 적용 가능한 짧은 액션. */
  label: string;
  detail: string;
}

export interface CoachReport {
  sampleSize: number;
  styleProfile: StyleProfile;
  weakSignals: WeakSignal[];
  quickWins: QuickWin[];
  /** 가장 약점이 많은 글의 제목 — 예시로 사용 */
  worstPostTitle: string | null;
}

/* ── 본 분석 ──────────────────────────────────────── */
export function analyzeCoach(
  items: RssItem[],
  categoryKeywords: string[],
): CoachReport {
  if (items.length === 0) {
    return {
      sampleSize: 0,
      styleProfile: { info: 0, review: 0, daily: 0, other: 1, dominant: 'other' },
      weakSignals: [],
      quickWins: [],
      worstPostTitle: null,
    };
  }

  /* 카테고리 키워드 토큰 — 길이 2자 이상만. 매칭 효율 위해 lowercase. */
  const categoryTokens = Array.from(
    new Set(
      categoryKeywords
        .flatMap((k) => k.toLowerCase().split(/\s+/))
        .filter((t) => t.length >= 2),
    ),
  );

  /* 각 글 분석 */
  const perPost = items.map((it) => analyzePost(it, categoryTokens));

  /* 1) 스타일 분포 — 글별 dominant style 카운트 */
  const styleCounts = { info: 0, review: 0, daily: 0, other: 0 };
  for (const p of perPost) styleCounts[p.style]++;
  const total = perPost.length;
  const styleProfile: StyleProfile = {
    info: styleCounts.info / total,
    review: styleCounts.review / total,
    daily: styleCounts.daily / total,
    other: styleCounts.other / total,
    dominant: dominantStyle(styleCounts),
  };

  /* 2) 약한 시그널 — 12편 중 몇 편에서 발견 */
  const weakSignals: WeakSignal[] = [];
  const titleNoKeyword = perPost.filter((p) => !p.titleHasCategoryKeyword).length;
  const bodyNoKeyword  = perPost.filter((p) => !p.bodyHasCategoryKeyword).length;
  const noImage        = perPost.filter((p) => p.imageCount === 0).length;
  const shortBody      = perPost.filter((p) => p.contentLength > 0 && p.contentLength < 800).length;
  const titleNoNumber  = perPost.filter((p) => !p.titleHasNumber).length;
  const titleTooShort  = perPost.filter((p) => p.titleLength < 15).length;

  if (titleNoKeyword > 0) {
    weakSignals.push({
      label: '제목 첫 12자 안에 카테고리 키워드 없음',
      affectedCount: titleNoKeyword,
      severity: titleNoKeyword >= total * 0.5 ? 'high' : 'mid',
      fix: '핵심 키워드를 제목 앞쪽으로 옮겨 검색 노출을 강화하세요. 예: "후기" → "수원 OO 카페 후기"',
    });
  }
  if (bodyNoKeyword > 0) {
    weakSignals.push({
      label: '본문 도입부에 카테고리 키워드 없음',
      affectedCount: bodyNoKeyword,
      severity: bodyNoKeyword >= total * 0.5 ? 'high' : 'mid',
      fix: '본문 첫 1~2 문장에 핵심 키워드를 자연스럽게 포함하세요. 네이버 인덱서가 가장 먼저 보는 영역입니다.',
    });
  }
  if (noImage > 0) {
    weakSignals.push({
      label: '이미지 없는 글',
      affectedCount: noImage,
      severity: noImage >= total * 0.3 ? 'high' : 'low',
      fix: '글 한 편당 최소 3장 이상 이미지를 권장. 체류 시간 / 노출 모두 +.',
    });
  }
  if (shortBody > 0) {
    weakSignals.push({
      label: '본문 800자 미만 글',
      affectedCount: shortBody,
      severity: shortBody >= total * 0.5 ? 'high' : 'mid',
      fix: '검색 상위 글은 1,500~2,500자가 표준. 핵심 정보 + 개인 경험 + 결론 3블록으로 늘리세요.',
    });
  }
  if (titleNoNumber > total * 0.7) {
    weakSignals.push({
      label: '제목에 숫자 거의 안 씀',
      affectedCount: titleNoNumber,
      severity: 'low',
      fix: '"베스트 5", "3가지 팁" 같은 숫자 표현은 CTR(클릭률)을 평균 +20% 올립니다.',
    });
  }
  if (titleTooShort > total * 0.5) {
    weakSignals.push({
      label: '제목이 15자 미만 (짧음)',
      affectedCount: titleTooShort,
      severity: 'low',
      fix: '제목 25~35자가 검색 노출과 클릭률 양쪽에 유리. 키워드를 더 풀어 써보세요.',
    });
  }

  /* severity → 정렬 */
  const sevOrder = { high: 0, mid: 1, low: 2 } as const;
  weakSignals.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || b.affectedCount - a.affectedCount);

  /* 3) Quick Wins — 가장 임팩트 큰 약점을 즉시 실행 액션으로 */
  const quickWins: QuickWin[] = [];
  if (titleNoKeyword >= total * 0.4) {
    quickWins.push({
      label: '다음 글 제목: 핵심 키워드 + 후크',
      detail: '예: "방문 후기" → "[지역] [업체명] 솔직 후기 — N가지 포인트"',
    });
  }
  if (bodyNoKeyword >= total * 0.4) {
    quickWins.push({
      label: '본문 첫 문장에 키워드 박기',
      detail: '"오늘은 ..." 같은 도입부 대신 "[키워드]가 궁금한 분들을 위해 ..." 로 시작.',
    });
  }
  if (shortBody >= total * 0.4) {
    quickWins.push({
      label: '글 길이 1,500자 이상',
      detail: '도입(150자) + 본문 3블록(각 400자) + 마무리(100자) 템플릿으로 늘리세요.',
    });
  }
  if (styleProfile.review < 0.2 && styleProfile.dominant !== 'review') {
    quickWins.push({
      label: '후기형 글 1편 추가',
      detail: '직접 경험·방문·사용 후기는 노출 + 신뢰도 양쪽에 유리. 정보형 일색이면 다양성 ↓.',
    });
  }
  if (quickWins.length === 0) {
    quickWins.push({
      label: '현 패턴 유지',
      detail: '주요 약점이 없습니다. 현재 흐름을 유지하면서 발행 페이스를 올려보세요.',
    });
  }

  /* 4) 가장 약점이 많은 글 — 예시로 노출 */
  let worst = perPost[0];
  for (const p of perPost) {
    if (p.weakCount > worst.weakCount) worst = p;
  }

  return {
    sampleSize: total,
    styleProfile,
    weakSignals,
    quickWins: quickWins.slice(0, 4),
    worstPostTitle: worst.weakCount >= 2 ? worst.title : null,
  };
}

/* ── 글 한 편 분석 ────────────────────────────────── */
interface PostAnalysis {
  title: string;
  titleLength: number;
  titleHasNumber: boolean;
  titleHasCategoryKeyword: boolean;
  bodyHasCategoryKeyword: boolean;
  contentLength: number;
  imageCount: number;
  style: StyleKey | 'other';
  weakCount: number;
}

function analyzePost(item: RssItem, categoryTokens: string[]): PostAnalysis {
  const title = item.title || '';
  const titleLower = title.toLowerCase();
  const titleHead = titleLower.slice(0, 12);
  const snippetLower = (item.contentSnippet || '').toLowerCase();
  /* "본문 도입부" — 첫 ~200자 (snippet 자체가 280자이므로 일부 잘라 사용). */
  const bodyHead = snippetLower.slice(0, 200);

  const titleHasNumber = /[0-9]/.test(title);
  const titleHasCategoryKeyword = categoryTokens.some((t) => titleHead.includes(t));
  const bodyHasCategoryKeyword  = categoryTokens.some((t) => bodyHead.includes(t));

  /* 스타일 — 제목 + snippet 합쳐서 매칭 카운트 */
  const combined = `${titleLower} ${snippetLower}`;
  const scores: Record<StyleKey, number> = { info: 0, review: 0, daily: 0 };
  for (const [k, words] of Object.entries(STYLE_KEYWORDS) as [StyleKey, readonly string[]][]) {
    for (const w of words) {
      if (combined.includes(w)) scores[k]++;
    }
  }
  const maxScore = Math.max(scores.info, scores.review, scores.daily);
  const style: StyleKey | 'other' =
    maxScore === 0
      ? 'other'
      : scores.info === maxScore
        ? 'info'
        : scores.review === maxScore
          ? 'review'
          : 'daily';

  let weakCount = 0;
  if (!titleHasCategoryKeyword) weakCount++;
  if (!bodyHasCategoryKeyword) weakCount++;
  if (item.imageCount === 0) weakCount++;
  if (item.contentLength > 0 && item.contentLength < 800) weakCount++;

  return {
    title,
    titleLength: title.length,
    titleHasNumber,
    titleHasCategoryKeyword,
    bodyHasCategoryKeyword,
    contentLength: item.contentLength,
    imageCount: item.imageCount,
    style,
    weakCount,
  };
}

function dominantStyle(counts: Record<'info' | 'review' | 'daily' | 'other', number>): StyleKey | 'other' {
  const entries = Object.entries(counts) as Array<[keyof typeof counts, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/* ── 라벨 (UI 에서 사용) ────────────────────────────── */
export const STYLE_LABEL: Record<StyleKey | 'other', string> = {
  info: '정보형',
  review: '후기형',
  daily: '일상형',
  other: '기타',
};
export const STYLE_COLOR: Record<StyleKey | 'other', string> = {
  info:   'bg-orange-500 dark:bg-orange-400',
  review: 'bg-amber-500 dark:bg-amber-400',
  daily:  'bg-zinc-400 dark:bg-zinc-500',
  other:  'bg-zinc-300 dark:bg-zinc-700',
};
export const STYLE_DESC: Record<StyleKey | 'other', string> = {
  info:   '방법·추천·정리 — 검색 노출에 유리',
  review: '직접 경험·방문·사용 — 신뢰도·체류시간에 유리',
  daily:  '일상·감상·기록 — 충성도 / 정기 독자에게',
  other:  '명확한 스타일 없음',
};
