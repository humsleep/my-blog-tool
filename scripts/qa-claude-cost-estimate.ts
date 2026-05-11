/**
 * Claude API 비용 추정 — /api/ai-draft 1회 호출당 평균 비용.
 *
 *  방법:
 *    1. buildSystemPrompt() 의 기본 옵션 출력 → 문자열 길이 측정
 *    2. Anthropic SDK 의 messages.countTokens 가 있으면 사용 (정확)
 *       없으면 한국어 ≈ 1.5 tok/char, 영문 ≈ 0.25 tok/char 휴리스틱
 *    3. Sonnet 4.6 가격으로 1회당 cost 산출 (cache hit / miss 두 시나리오)
 */

import Anthropic from '@anthropic-ai/sdk';

// ── buildSystemPrompt 와 동일한 출력 생성 ──────────────────────────
interface DraftOptions {
  style: 'haeyo' | 'pyeongseo';
  length: 'compact' | 'standard';
  titleMode: 'single' | 'multi';
  sectionCount: 5 | 6 | 7;
  accuracyTargets: string;
  imagePrompts: boolean;
  sources: boolean;
  selfReview: boolean;
}

// Phase 36.1 부터 ai-writer 기본 옵션이 single + imagePrompts=false 로 변경됨.
//  여기서는 "현행 기본값" 과 "비싼 옵션 모두 ON" 을 모두 표시.
const DEFAULTS: DraftOptions = {
  style: 'haeyo',
  length: 'standard',
  titleMode: 'single',
  sectionCount: 5,
  accuracyTargets: '',
  imagePrompts: false,
  sources: false,
  selfReview: true,
};

// route.ts의 buildSystemPrompt 동일 로직 (변경 시 동기화 필요)
function buildSystemPrompt(opts: DraftOptions): string {
  const titleMode = opts.titleMode;
  const sections  = opts.sectionCount;
  const charRange = opts.length === 'compact'
    ? '공백 제외 1,300자~1,700자'
    : '공백 제외 1,700자~2,200자';
  const styleGuide = opts.style === 'haeyo'
    ? '친근한 해요체. "솔직히", "진짜로", "~더라고요" 같은 구어체를 자연스럽게 섞고, 도입부는 "작년 여름이었나..." 같은 자연스러운 기억·에피소드로 시작. 짧은 문장과 긴 문장 번갈아, 수사 의문문·감탄·여담도 자연스럽게.'
    : '평서체(~이다, ~했다, ~된다, ~보인다). 존댓말 금지. 차분하고 단정한 정보 전달 톤. 1인 블로거의 시각이지만 문장은 단호하고 객관적으로.';
  return `당신은 네이버 블로그 홈판 노출을 목표로 하는 전문 블로그 글 작성 에이전트입니다.
사용자가 제공한 프롬프트를 바탕으로 아래 6단계를 모두 거쳐 네이버 블로그에 최적화된 완성 글을 만들어 출력합니다.
출력은 반드시 아래에서 지정한 마크다운 헤더(## 1. ...) 구조를 그대로 사용합니다.

================================================================
[작업 6단계 — 모두 내부에서 처리하고, 최종 출력만 사용자에게 보여줌]
================================================================

## 1단계 — 사실 정보 사전 검증 (출력 안 함)
- 본문 작성 전, 주제와 관련된 수치·일정·인물·통계 등 사실 정보가 필요하면 학습된 지식을 우선 사용하고, 불확실한 부분은 "[확인 필요: ~]" placeholder로 표시.
- 출처가 불분명한 정보는 본문에 절대 포함하지 않음.
- 메인 키워드와 보조 키워드를 미리 정리.
${opts.sources ? '- 본문에 활용한 참고 출처 후보 10개 이상을 카테고리별(공식/언론/전문매체/커뮤니티)로 메모해 두었다가 `## 1. 참고 출처` 섹션에 deep-link 형태로 출력.' : ''}

## 2단계 — 제목 ${titleMode === 'multi' ? '20개 후보' : '1개 (베스트)'}
${titleMode === 'multi' ? '다음 4개 카테고리에서 각 5개씩 총 20개 제목을 만들어 `## 2. 제목 후보` 섹션에 카테고리 부제목과 함께 1~20번 번호로 출력.' : '메인 키워드를 맨 앞에 배치한 베스트 제목 1개만 `## 2. 제목 후보` 섹션에 한 줄로 출력.'}

## 3단계 — 소제목 구성 (10~15자 명사형, ${sections}개)
- 독자 체류시간을 늘리는 스토리텔링 흐름.
- 비슷한 주제는 묶고, 명사형으로 간결하게.

## 4단계 — 본문 작성
- **분량**: ${charRange}.
- **문체**: ${styleGuide}

## 5단계 — 해시태그 (\`## 4. 해시태그\`에 출력)
- **전체 30개**: 높은 검색량 태그 + 니치 태그 조합.
- **추천 10개**: 위 30개 중 가장 효과 좋을 것으로 예상되는 10개.

${opts.imagePrompts ? '## 6단계 — 이미지 프롬프트\n- 본문 ▣ 소제목 ' + sections + '개에 대응하는 영문 프롬프트.' : ''}

[자체 검토] 금지 표현 점검: 무조건/최고/절대/100%/보장/완벽, YMYL 위험(죽다/낫는다/효과 있다), 광고성(최저가/특가).
${opts.selfReview ? '검토 결과를 `## 6. 자체 검토` 섹션에 ✓/✗ 체크리스트로 출력.' : ''}

[최종 출력 규칙] 다른 설명 없이 섹션 헤더 그대로 순서대로 출력.`;
}

// ── 토큰 카운트 ─────────────────────────────────────────────────
// 한국어/한자 1글자 ≈ 1.5 tok, 영문/공백/기호 ≈ 0.25 tok (보수적 평균)
function heuristicTokens(s: string): number {
  let korean = 0, other = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    // CJK Unified, Hangul Syllables, Hangul Jamo
    if ((cp >= 0xAC00 && cp <= 0xD7A3) ||      // 한글 음절
        (cp >= 0x1100 && cp <= 0x11FF) ||      // 한글 자모
        (cp >= 0x3130 && cp <= 0x318F) ||      // 호환 자모
        (cp >= 0x4E00 && cp <= 0x9FFF)) {      // CJK
      korean++;
    } else {
      other++;
    }
  }
  return Math.round(korean * 1.5 + other * 0.25);
}

async function countTokensExact(systemPrompt: string, userPrompt: string): Promise<number | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const result = await client.messages.countTokens({
      model: 'claude-sonnet-4-6' as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return result.input_tokens;
  } catch (err) {
    console.error('countTokens 실패 → 휴리스틱으로 fallback:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── 시나리오별 input/output 추정 ──────────────────────────────
const systemPromptDefault = buildSystemPrompt(DEFAULTS);
const systemPromptFull = buildSystemPrompt({ ...DEFAULTS, sources: true, accuracyTargets: '삼성 갤럭시 Z폴드7' });

// 일반 사용자 입력 — 보통 prompt-generator가 생성한 ~500자 프롬프트
const typicalUserPrompt = `다음 조건으로 네이버 블로그 글을 작성해주세요.

[키워드 정보]
- 메인 키워드: 강남 디저트 카페 추천
- 보조 키워드: 데이트 코스, 가성비, 분위기, 인스타 핫플
- 검색 의도: 정보 + 추천

[타겟 독자]
20대~30대 여성, 데이트 또는 친구 모임 장소 검색 중

[글 스타일]
- 친근하고 따뜻한 해요체
- 직접 다녀온 듯한 1인칭 경험담
- 분위기·가격·메뉴·접근성 위주

[추가 정보]
- 강남역, 신논현, 논현 일대 5~7곳 추천
- 가격대는 1인 1~2만원 선
- 사진 찍기 좋은 곳 우선
- 영업시간·휴무일 정보 포함
`;

(async () => {
  console.log('═════════════════════════════════════════════════════');
  console.log('Claude API (/api/ai-draft) 1회 호출 비용 추정');
  console.log('  Model: claude-sonnet-4-6');
  console.log('  Prompt caching: ephemeral (5분)');
  console.log('═════════════════════════════════════════════════════\n');

  const sysLenDefault = systemPromptDefault.length;
  const sysLenFull    = systemPromptFull.length;
  const userLen       = typicalUserPrompt.length;

  console.log('── 입력 문자열 길이 (chars) ──');
  console.log(`  system prompt (기본 옵션): ${sysLenDefault.toLocaleString()}`);
  console.log(`  system prompt (full opts): ${sysLenFull.toLocaleString()}`);
  console.log(`  user prompt (전형적):       ${userLen.toLocaleString()}\n`);

  // 1) 정확 토큰 카운트 시도
  const exactDefault = await countTokensExact(systemPromptDefault, typicalUserPrompt);
  const exactFull    = await countTokensExact(systemPromptFull,    typicalUserPrompt);

  // 2) Fallback: 휴리스틱
  const heurSysDefault  = heuristicTokens(systemPromptDefault);
  const heurSysFull     = heuristicTokens(systemPromptFull);
  const heurUser        = heuristicTokens(typicalUserPrompt);

  const inputTokDefault = exactDefault ?? (heurSysDefault + heurUser);
  const inputTokFull    = exactFull    ?? (heurSysFull    + heurUser);

  console.log('── 입력 토큰 (input) ──');
  console.log(`  기본 옵션: ${inputTokDefault.toLocaleString()} ${exactDefault ? '(SDK countTokens)' : '(휴리스틱)'}`);
  console.log(`  full 옵션: ${inputTokFull.toLocaleString()} ${exactFull    ? '(SDK countTokens)' : '(휴리스틱)'}\n`);

  // 출력 토큰 추정 — 기본값(single + no-image-prompts) 기준
  //   본문 1700~2200자 + 제목 1개 + 해시태그 + 자체 검토 ≈ 2000~2700자
  //   한국어 1.5 tok/char → 2000*1.5 ≈ 3,000 tokens
  const outputCharsMin = 2000;
  const outputCharsMax = 2700;
  const outputTokMin = Math.round(outputCharsMin * 1.45);
  const outputTokMax = Math.round(outputCharsMax * 1.55);

  console.log('── 출력 토큰 (output, 추정 — 기본값) ──');
  console.log(`  본문(1700~2200자) + 제목 1개 + 해시태그 + 자체검토`);
  console.log(`  ≈ ${outputCharsMin.toLocaleString()}~${outputCharsMax.toLocaleString()}자 → ${outputTokMin.toLocaleString()}~${outputTokMax.toLocaleString()} tokens\n`);

  // 비싼 옵션 모두 ON 시
  const outputCharsHeavy = 4500;
  const outputTokHeavy = Math.round(outputCharsHeavy * 1.55);
  console.log(`── 비싼 옵션 모두 ON (multi titles + image prompts) ──`);
  console.log(`  ≈ 출력 ${outputCharsHeavy.toLocaleString()}자 → ${outputTokHeavy.toLocaleString()} tokens\n`);

  // 가격 (Anthropic 공식 — Sonnet 4.6)
  const PRICE_INPUT_PER_M       = 3.00;   // $/M tokens
  const PRICE_OUTPUT_PER_M      = 15.00;
  const PRICE_CACHE_WRITE_PER_M = 3.75;   // 1.25x base
  const PRICE_CACHE_READ_PER_M  = 0.30;   // 0.1x base

  function fmt(n: number) {
    return '$' + n.toFixed(4);
  }
  function won(n: number, rate = 1450) {
    return '₩' + Math.round(n * rate).toLocaleString();
  }

  console.log('── 시나리오 A: cache miss (첫 호출 / 5분 이상 간격) ──');
  for (const [label, inputTok] of [['기본 옵션', inputTokDefault], ['full 옵션', inputTokFull]] as const) {
    for (const [outLabel, outTok] of [['최소', outputTokMin], ['최대', outputTokMax]] as const) {
      // 첫 호출 — system prompt를 cache write 가격(1.25x)으로 청구
      const cacheWriteCost = (inputTok - heurUser) / 1_000_000 * PRICE_CACHE_WRITE_PER_M;
      const nonCachedCost  = heurUser / 1_000_000 * PRICE_INPUT_PER_M;
      const outputCost     = outTok / 1_000_000 * PRICE_OUTPUT_PER_M;
      const total = cacheWriteCost + nonCachedCost + outputCost;
      console.log(`  ${label} · 출력 ${outLabel}: ${fmt(total)} (${won(total)})  [in=${inputTok.toLocaleString()}, out=${outTok.toLocaleString()}]`);
    }
  }

  console.log('\n── 시나리오 B: cache hit (5분 이내 후속 호출) ──');
  for (const [label, inputTok] of [['기본 옵션', inputTokDefault], ['full 옵션', inputTokFull]] as const) {
    for (const [outLabel, outTok] of [['최소', outputTokMin], ['최대', outputTokMax]] as const) {
      // system prompt = cache read 가격 (0.1x), user prompt만 base 가격
      const cacheReadCost  = (inputTok - heurUser) / 1_000_000 * PRICE_CACHE_READ_PER_M;
      const nonCachedCost  = heurUser / 1_000_000 * PRICE_INPUT_PER_M;
      const outputCost     = outTok / 1_000_000 * PRICE_OUTPUT_PER_M;
      const total = cacheReadCost + nonCachedCost + outputCost;
      console.log(`  ${label} · 출력 ${outLabel}: ${fmt(total)} (${won(total)})  [in=${inputTok.toLocaleString()}, out=${outTok.toLocaleString()}]`);
    }
  }

  // 월간 사용량 시나리오
  console.log('\n── 월간 사용량 시나리오 (cache miss 기준, 기본 옵션 · 출력 중간) ──');
  const inMid  = inputTokDefault;
  const outMid = Math.round((outputTokMin + outputTokMax) / 2);
  const cwCost = (inMid - heurUser) / 1_000_000 * PRICE_CACHE_WRITE_PER_M;
  const ncCost = heurUser / 1_000_000 * PRICE_INPUT_PER_M;
  const oCost  = outMid / 1_000_000 * PRICE_OUTPUT_PER_M;
  const perCall = cwCost + ncCost + oCost;

  const scenarios = [
    { label: '소규모 (DAU 50, 평균 1회/일, 한달 1,500회)', calls: 1500 },
    { label: '중간 (DAU 200, 평균 1회/일, 한달 6,000회)', calls: 6000 },
    { label: '활성 (DAU 500, 평균 2회/일, 한달 30,000회)', calls: 30000 },
  ];
  for (const s of scenarios) {
    const total = perCall * s.calls;
    console.log(`  ${s.label}`);
    console.log(`     → ${fmt(total)} / 월 (${won(total)})`);
  }

  console.log('\n참고:');
  console.log(`  - Sonnet 4.6 가격: input $${PRICE_INPUT_PER_M}/M, output $${PRICE_OUTPUT_PER_M}/M`);
  console.log(`                cache write $${PRICE_CACHE_WRITE_PER_M}/M, cache read $${PRICE_CACHE_READ_PER_M}/M`);
  console.log('  - 비로그인 1회/일 · 로그인 5회/일 한도가 있어 사용자당 월 최대 30~150회');
  console.log('  - 환율 1,450원/$ 기준');
})();
