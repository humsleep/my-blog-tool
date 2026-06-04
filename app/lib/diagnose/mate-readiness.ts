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
  const factLeadPass = perPost.filter((p) => p.hasFactInLead).length;
  const dataPass = perPost.filter((p) => p.hasDataPoints).length;
  const questionPass = perPost.filter((p) => p.hasQuestionTitle).length;
  const lengthPass = perPost.filter((p) => p.sufficientLength).length;

  const checks: MateCheckItem[] = [
    {
      label: '구조화된 소제목',
      description: '번호·기호·볼드 등으로 구분된 소제목이 본문에 있는지',
      passCount: subheadingPass,
      totalCount: total,
      passRate: subheadingPass / total,
      status: gradeStatus(subheadingPass / total),
      tip: '본문에 ①②③ 또는 1. 2. 3. 같은 소제목을 넣으면 AI가 정보를 구조적으로 추출할 수 있습니다.',
    },
    {
      label: '도입부 팩트 배치',
      description: '첫 200자 안에 숫자·키워드가 포함된 핵심 정보가 있는지',
      passCount: factLeadPass,
      totalCount: total,
      passRate: factLeadPass / total,
      status: gradeStatus(factLeadPass / total),
      tip: '"안녕하세요~" 대신 핵심 답변을 첫 문장에 배치하세요. AI는 도입부에 가장 높은 가중치를 둡니다.',
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
      label: '질문형 제목',
      description: '제목에 질문 키워드나 물음표가 포함되어 있는지',
      passCount: questionPass,
      totalCount: total,
      passRate: questionPass / total,
      status: gradeStatus(questionPass / total, 0.3, 0.15),
      tip: 'AI는 질문에 답하는 것이 목적이므로 "○○ 어떻게?", "○○ vs ○○" 같은 제목이 인용에 유리합니다.',
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
  ];

  const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
  const score = Math.round(
    checks.reduce((sum, c, i) => sum + c.passRate * weights[i], 0) * 100,
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
  hasFactInLead: boolean;
  hasDataPoints: boolean;
  hasQuestionTitle: boolean;
  sufficientLength: boolean;
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

  const leadHasKeyword = categoryTokens.some((t) => lead200.includes(t));
  const leadHasNumber = /\d/.test(lead200);
  const hasFactInLead = leadHasKeyword && leadHasNumber;

  const hasDataPoints = DATA_PATTERNS.some((p) => p.test(snippet));

  const sufficientLength = item.contentLength >= 1200;

  return {
    hasStructuredSubheadings,
    hasFactInLead,
    hasDataPoints,
    hasQuestionTitle,
    sufficientLength,
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
