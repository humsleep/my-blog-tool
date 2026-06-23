/**
 * 네이버 메이트 인용 준비도 분석 — AI API 0.
 *
 *  사용자의 최근 12편(RSS 메타 + contentSnippet)에서
 *  AI 인용에 유리한 구조적 특성을 휴리스틱으로 측정.
 *
 *  5개 체크 항목:
 *   1. 소제목(구분자)에 키워드 포함 여부
 *   2. 첫 200자 안에 핵심 답변(팩트) 존재 여부
 *   3. 본문에 숫자/데이터 충분한지
 *   4. 질문형 제목 활용 여부
 *   5. 글 길이가 AI 인용에 유리한 1,200자 이상인지
 *
 *  반환: 항목별 통과율 + 종합 준비도 점수(0~100) + 개선 팁
 */
import type { RssItem } from './naver-blog';

export interface MateCheckItem {
  label: string;
  description: string;
  passCount: number;
  totalCount: number;
  passRate: number;
  status: 'good' | 'warn' | 'bad';
  tip: string;
}

export interface MateReadinessReport {
  sampleSize: number;
  score: number;
  grade: 'excellent' | 'good' | 'needs-work' | 'low';
  checks: MateCheckItem[];
  topTip: string;
}

const QUESTION_PATTERNS = [
  /어떻게/, /방법/, /차이/, /비교/, /추천/, /뭐가/, /무엇/, /왜/,
  /언제/, /얼마/, /몇/, /할까/, /될까/, /인가/, /일까/, /나요/,
  /\?/, /vs/i,
];

const DATA_PATTERNS = [
  /\d{1,3}(,\d{3})*\s*(원|만원|억|천|%|퍼센트|개|건|명|회|번|시간|분|초|일|주|개월|년|kg|g|ml|l|cm|mm|m|km)/,
  /\d+\s*(배|倍|배율)/,
  /\d+\.\d+/,
  /약\s*\d+/,
  /평균\s*\d+/,
  /대비\s*\d+/,
  /전년|전월|지난\s*(달|해|주)/,
];

const SUBHEADING_MARKERS = [
  /^[①②③④⑤⑥⑦⑧⑨⑩]/,
  /^\d+[.)]\s/,
  /^[■□●○▶▷★☆►]/,
  /^#+\s/,
  /^【.*】/,
  /^<b>|<strong>/i,
];

/** 도입부가 "질문에 곧장 답하는" 구조인지 — 정의·단정·방법 안내 패턴.
 *  AI 브리핑은 도입부에서 답을 명확히 제시하는 글을 우선 인용한다. */
const ANSWER_LEAD_PATTERNS = [
  /(이란|란|라는|이라는)\b/,        // 정의: "OO란 ..."
  /(입니다|이다|이에요|예요|랍니다)/, // 단정형 답변
  /(하는\s*방법|방법은|하려면|순서는|단계는)/, // 방법/절차 안내
  /(결론부터|결론적으로|요약하면|핵심은)/,     // 답 먼저
];

/** 요약·결론 블록 존재 여부 — AI 가 추출·인용하기 좋은 정리 구간.
 *  본문(실측 텍스트) 어디든 등장하면 통과. */
const SUMMARY_PATTERNS = [
  /요약/, /정리/, /결론/, /마무리/, /핵심\s*(정리|만)/,
  /한\s*줄\s*(요약|정리)/, /tl;?\s*dr/i,
];

/** AI 인용 준비도 항목별 가중치 — 체크 순서와 1:1 대응. 합 = 1.0.
 *  도입부 답변·구조·데이터를 우선(생성형 검색 인용에 직접 기여), 질문형 제목은 보조. */
export const MATE_WEIGHTS = [0.20, 0.22, 0.18, 0.15, 0.13, 0.12] as const;

export function analyzeMateReadiness(
  items: RssItem[],
  categoryKeywords: string[],
): MateReadinessReport {
  if (items.length === 0) {
    return {
      sampleSize: 0,
      score: 0,
      grade: 'low',
      checks: [],
      topTip: '분석할 글이 없습니다.',
    };
  }

  const categoryTokens = Array.from(
    new Set(
      categoryKeywords
        .flatMap((k) => k.toLowerCase().split(/\s+/))
        .filter((t) => t.length >= 2),
    ),
  );

  const total = items.length;
  const perPost = items.map((it) => analyzeForMate(it, categoryTokens));

  const subheadingPass = perPost.filter((p) => p.hasStructuredSubheadings).length;
  const answerLeadPass = perPost.filter((p) => p.hasAnswerLead).length;
  const dataPass = perPost.filter((p) => p.hasDataPoints).length;
  const summaryPass = perPost.filter((p) => p.hasSummaryBlock).length;
  const lengthPass = perPost.filter((p) => p.sufficientLength).length;
  const questionPass = perPost.filter((p) => p.hasQuestionTitle).length;

  // ⚠️ 순서가 MATE_WEIGHTS 와 1:1 대응해야 함.
  const checks: MateCheckItem[] = [
    {
      label: '구조화된 소제목',
      description: '번호·기호·볼드 등으로 구분된 소제목이 본문에 있는지',
      passCount: subheadingPass,
      totalCount: total,
      passRate: subheadingPass / total,
      status: gradeStatus(subheadingPass / total),
      tip: '본문에 ①②③ 또는 1. 2. 3. 같은 소제목을 넣으면 AI 브리핑이 정보를 구조적으로 추출·인용하기 쉬워집니다.',
    },
    {
      label: '답변 우선 도입부',
      description: '첫 200자 안에 핵심 키워드 + 정의/단정/방법 등 "답"이 바로 나오는지',
      passCount: answerLeadPass,
      totalCount: total,
      passRate: answerLeadPass / total,
      status: gradeStatus(answerLeadPass / total),
      tip: '"안녕하세요~" 대신 "○○란 △△입니다" 처럼 첫 문장에 답을 배치하세요. AI 브리핑은 도입부 답변을 그대로 인용합니다.',
    },
    {
      label: '숫자·데이터 포함',
      description: '본문에 구체적인 수치, 비교 데이터, 통계가 있는지',
      passCount: dataPass,
      totalCount: total,
      passRate: dataPass / total,
      status: gradeStatus(dataPass / total),
      tip: '"좋았다" 대신 "2주 사용 후 전기세 12% 절감" 같은 구체적 수치를 넣으면 AI 인용 확률이 올라갑니다.',
    },
    {
      label: '요약·결론 블록',
      description: '글 안에 요약/정리/결론 구간이 있어 핵심을 추출하기 쉬운지',
      passCount: summaryPass,
      totalCount: total,
      passRate: summaryPass / total,
      status: gradeStatus(summaryPass / total, 0.5, 0.25),
      tip: '본문 끝(또는 앞)에 "한 줄 요약 / 결론" 블록을 두면 AI가 그 부분을 인용 답변으로 뽑아갑니다.',
    },
    {
      label: '충분한 글 길이',
      description: '본문 1,200자 이상으로 AI가 인용할 깊이가 있는지',
      passCount: lengthPass,
      totalCount: total,
      passRate: lengthPass / total,
      status: gradeStatus(lengthPass / total),
      tip: 'AI 요약보다 깊은 내용을 제공해야 클릭 후 체류가 발생합니다. 최소 1,200자 이상을 권장합니다.',
    },
    {
      label: '질문형 제목',
      description: '제목에 질문 키워드나 물음표가 포함되어 있는지',
      passCount: questionPass,
      totalCount: total,
      passRate: questionPass / total,
      status: gradeStatus(questionPass / total, 0.3, 0.15),
      tip: 'AI는 질문에 답하는 것이 목적이므로 "○○ 어떻게?", "○○ vs ○○" 같은 제목이 인용에 유리합니다.',
    },
  ];

  const score = Math.round(
    checks.reduce((sum, c, i) => sum + c.passRate * MATE_WEIGHTS[i], 0) * 100,
  );

  const grade = score >= 75 ? 'excellent'
    : score >= 55 ? 'good'
    : score >= 35 ? 'needs-work'
    : 'low';

  const worstCheck = [...checks].sort((a, b) => a.passRate - b.passRate)[0];
  const topTip = worstCheck
    ? `가장 개선이 필요한 항목: "${worstCheck.label}" — ${worstCheck.tip}`
    : '현재 패턴을 유지하세요.';

  return { sampleSize: total, score, grade, checks, topTip };
}

interface PostMateAnalysis {
  hasStructuredSubheadings: boolean;
  hasAnswerLead: boolean;
  hasDataPoints: boolean;
  hasSummaryBlock: boolean;
  sufficientLength: boolean;
  hasQuestionTitle: boolean;
}

function analyzeForMate(item: RssItem, categoryTokens: string[]): PostMateAnalysis {
  const title = item.title || '';
  const titleLower = title.toLowerCase();
  const snippet = item.contentSnippet || '';
  const snippetLower = snippet.toLowerCase();
  const lead200 = snippetLower.slice(0, 200);

  const hasQuestionTitle = QUESTION_PATTERNS.some((p) => p.test(titleLower));

  const lines = snippet.split(/\n|<br\s*\/?>|\. /i);
  const hasStructuredSubheadings = lines.some((line) =>
    SUBHEADING_MARKERS.some((p) => p.test(line.trim())),
  );

  // 답변 우선 도입부 — 키워드 + (숫자 또는 정의/단정/방법 패턴).
  const leadHasKeyword = categoryTokens.some((t) => lead200.includes(t));
  const leadHasNumber = /\d/.test(lead200);
  const leadHasAnswerPattern = ANSWER_LEAD_PATTERNS.some((p) => p.test(lead200));
  const hasAnswerLead = leadHasKeyword && (leadHasNumber || leadHasAnswerPattern);

  const hasDataPoints = DATA_PATTERNS.some((p) => p.test(snippet));

  // 요약·결론 블록 — 실측 본문(있으면 길다)에서 정리/결론 구간 탐지.
  const hasSummaryBlock = SUMMARY_PATTERNS.some((p) => p.test(snippet));

  const sufficientLength = item.contentLength >= 1200;

  return {
    hasStructuredSubheadings,
    hasAnswerLead,
    hasDataPoints,
    hasSummaryBlock,
    sufficientLength,
    hasQuestionTitle,
  };
}

function gradeStatus(rate: number, goodThreshold = 0.6, warnThreshold = 0.3): 'good' | 'warn' | 'bad' {
  if (rate >= goodThreshold) return 'good';
  if (rate >= warnThreshold) return 'warn';
  return 'bad';
}

export const GRADE_LABEL: Record<MateReadinessReport['grade'], string> = {
  excellent: 'AI 인용 준비 완료',
  good: '양호 — 일부 개선 필요',
  'needs-work': '개선 필요',
  low: '구조 재설계 권장',
};

export const GRADE_COLOR: Record<MateReadinessReport['grade'], string> = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-orange-600 dark:text-orange-400',
  'needs-work': 'text-amber-600 dark:text-amber-400',
  low: 'text-red-600 dark:text-red-400',
};
