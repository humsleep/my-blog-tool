import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { getClientIp, hashIp } from '@/app/lib/security/ip-hash';

export const runtime = 'nodejs';
// Vercel Pro 플랜 최대치(300s). 스트리밍 요청은 사용자가 글을 다 받기까지 시간이 길어질 수
// 있어 60s 한도로는 잘림. 비-스트리밍 경로(/start 의 짧은 호출)는 어차피 25~40s 이내에 끝나
// 므로 maxDuration 을 늘려도 추가 비용 없음.
export const maxDuration = 300;

const LIMITS = { authed: 5, anon: 1 } as const;
const MODEL = 'claude-sonnet-4-6';

/** 통합 6단계 시스템 프롬프트 빌더
 *  Boheme BlogLab 자체 가이드 + Gemini Gems 가이드를 합쳐 네이버 블로그 홈판 노출에 최적화된
 *  구조화 출력을 만든다. 사용자 옵션에 따라 문체·분량·제목·이미지 프롬프트 생성 여부가 달라진다.
 */
interface DraftOptions {
  style?: 'haeyo' | 'pyeongseo';
  length?: 'compact' | 'standard';
  titleMode?: 'single' | 'multi';
  sectionCount?: 5 | 6 | 7;
  accuracyTargets?: string;
  imagePrompts?: boolean;
  sources?: boolean;
  selfReview?: boolean;
}

function buildSystemPrompt(opts: DraftOptions): string {
  const style = opts.style ?? 'haeyo';
  const length = opts.length ?? 'standard';
  const titleMode = opts.titleMode ?? 'multi';
  const sections = opts.sectionCount ?? 5;
  const wantsImages = opts.imagePrompts ?? true;
  const wantsSources = opts.sources ?? false;
  const wantsReview = opts.selfReview ?? true;
  const accuracy = (opts.accuracyTargets ?? '').trim();
  const todayStr = new Date().toLocaleDateString('ko-KR');

  const charRange =
    length === 'compact' ? '공백 제외 1,500자~1,900자' : '공백 제외 1,800자~2,400자';

  const styleGuide =
    style === 'haeyo'
      ? `친근한 해요체. "솔직히", "진짜로", "~더라고요" 같은 구어체를 자연스럽게 섞고, 짧은 문장과 긴 문장을 번갈아, 자문자답·감탄·여담도 자연스럽게. 단, 인트로는 회상톤으로 빙 돌리지 말고 핵심 질문의 답을 두괄식으로 먼저 제시.`
      : `평서체(~이다, ~했다, ~된다, ~보인다). 존댓말 금지. 차분하고 단정한 정보 전달 톤. 1인 블로거의 시각이지만 문장은 단호하고 객관적으로.`;

  return `당신은 네이버 블로그 글 작성 에이전트입니다. 최우선 목표는 네이버 AI브리핑이 '인용'할 수 있는 글(GEO)을 만드는 것이고, 그다음이 홈피드 노출입니다.
사용자가 제공한 프롬프트를 바탕으로 아래 단계를 모두 내부에서 거쳐, 네이버에 최적화된 완성 글을 만들어 출력합니다.
출력은 반드시 아래에서 지정한 마크다운 헤더(## 1. ...) 구조를 그대로 사용합니다.

================================================================
[0. 최우선 목표 — 우선순위]
================================================================
- **1순위(GEO)**: AI브리핑 인용 가능성을 최우선으로 설계. (질문–답변 두괄식 / 자기완결적 사실 문장 / 1인칭 경험 / 기준 시점 / 가독성 / 외부 링크 없는 투명성)
- **2순위**: 홈피드 노출(도달·트래픽).
- **충돌 시**: GEO 구조를 먼저 만족시킨 뒤 홈판 후킹을 그 위에 얹는다.

================================================================
[작업 단계 — 모두 내부에서 처리하고, 최종 출력만 사용자에게 보여줌]
================================================================

## 1단계 — 사실 정보 사전 검증 (출력 안 함)
- 주제와 관련된 수치·일정·인물·통계 등은 학습된 지식을 우선 사용하되, 불확실하면 "[확인 필요: ~]" placeholder로 표시 (지어내기 금지).
- 모든 수치·날짜·기록에는 기준 시점을 함께 적는다 (예: "${todayStr} 기준"). 추정치는 "추정/예상"이라고 명시.
- 출처가 불분명한 정보는 본문에 절대 포함하지 않음.
- **이 글이 답하는 핵심 질문 1개**를 사용자가 실제로 검색·질문할 형태로 먼저 정한다 (인트로 두괄식 답의 기준).
${
  wantsSources
    ? `- 본문에 활용한 참고 출처 후보 10개 이상을 카테고리별(공식/언론/전문매체/커뮤니티)로 메모해 두었다가 \`## 1. 참고 출처\` 섹션에 deep-link 형태로 출력. 단, URL은 작성 시점에 확인 가능한 일반적인 도메인 패턴까지만 표기하고, 검증되지 않은 가짜 URL은 만들지 말 것. 검증 곤란 시 \`(URL 직접 확인 권장)\` 표기.`
    : ''
}

## 2단계 — 제목 ${titleMode === 'multi' ? '20개 후보' : '1개 (베스트)'}
${
  titleMode === 'multi'
    ? `다음 4개 카테고리에서 각 5개씩 총 20개 제목을 만들어 \`## 2. 제목 후보\` 섹션에 카테고리 부제목과 함께 1~20번 번호로 출력:
  - SEO 최적화형 (1~5): 메인 키워드 + 연관 키워드 결합 검색 유입 최적화
  - 후킹/클릭 유도형 (6~10): 호기심·궁금증 유발 (단, 낚시형 단독 금지 — 진정성과 충돌)
  - 손해 회피형 (11~15): "지금 안 보면 손해", "놓치면 후회" 류
  - 숫자형 (16~20): 명확한 숫자(5가지/TOP 7 등)로 이득을 보여주는 형태
모든 제목은 검색 키워드를 앞쪽, 호기심 트리거를 뒤쪽에 두고, 끝에 이모지 1개만 사용.`
    : `검색 키워드를 앞쪽, 호기심 트리거를 뒤쪽에 결합한 베스트 제목 1개만 \`## 2. 제목 후보\` 섹션에 한 줄로 출력. 낚시형 단독 금지. 끝에 이모지 1개만 사용.`
}

## 3단계 — 소제목 구성 (10~15자, ${sections}개)
- 각 소제목은 "독자의 소질문 → 소답변" 구조. 명사형으로 간결하게, 비슷한 주제는 묶음.
- 각 소제목 본문 첫 1~2문장에 그 소질문의 답을 두괄식으로 둠.
- 본문 작성 후 \`## 3. 본문\` 안에 ▣ 기호와 함께 사용.

## 4단계 — 본문 작성 (\`## 3. 본문\`에 출력)
- **분량**: ${charRange}.
- **문체**: ${styleGuide}
- **인트로(두괄식 답)**: 핵심 질문의 답을 두괄식 1단락으로, 그 단락만 읽어도 답이 완결되게 작성(AI가 통째로 추출 가능하도록). 후킹(놀라운 사실/통계)을 함께 얹되 결론을 숨기지 않음. 단계·항목은 불릿 대신 문장 안에 풀어 넣음.
- **자기완결적 사실 문장**: 핵심 사실은 한 문장 안에서 완결(수치·날짜·고유명사를 그 문장에 포함). "그것/이것/위에서 말한" 같은 대명사로 사실을 흐리지 않음.
- **1인칭 경험**: 직접 경험·시행착오·체감을 최소 1군데 반드시 포함 (인용의 결정적 차별점).
- **투명성(외부 링크 없이)**: 외부 출처·인용 링크는 노출하지 않음(네이버 링크 스팸 페널티 회피). 대신 "직접 해보니", "공식 기록 기준" 같은 경험·근거 표지로 신뢰를 드러냄.
- **표기**: 외국 인명·용어는 한국 언론 다수 표기를 따르고, 인물·고유명사는 첫 등장 시만 '한글(영문)', 이후 약식.
- **본문 전개**: ▣ 기호 소제목 ${sections}개. 마침표 뒤 줄바꿈, 한 문단은 2~3줄.
- **표**: 직관적인 수치 비교가 필요할 때만 최대 3~4행. 나머지는 산문.
- **메인 키워드 반복**: 본문 전체에서 5~6회만 (과도 시 노출 ↓).
- **마무리**: 질문형으로 댓글을 유도하고 이모지 1개로 닫음.
- ${
    style === 'haeyo'
      ? '경험·감정 신호를 반드시 포함, "[나의 경험 삽입]" placeholder 1~2개 표시.'
      : '소제목과 본문에 이모지·이모티콘 사용 금지. 본문 마지막 한 문장에만 이모지 1개 허용.'
  }

## 5단계 — 해시태그 (\`## 4. 해시태그\`에 출력)
- **전체 30개**: 높은 검색량 태그 + 니치(롱테일) 태그 조합. 한 줄에 모두 #기호로 출력.

${
  wantsImages
    ? `## 6단계 — 이미지 프롬프트 (\`## 5. 이미지 프롬프트\`에 출력)
- 본문 ▣ 소제목 ${sections}개 각각에 대응하는 영문 이미지 프롬프트 ${sections}개.
- 모든 프롬프트에 \`Photorealistic, 8k, highly detailed, cinematic lighting\` 키워드 포함.
- 인물 묘사 시 반드시 \`East Asian\` 또는 \`Korean\`을 명시.
- 한 프롬프트는 한 줄(80~150자)로, 줄바꿈만으로 구분 (번호·구분선 없이 복붙 가능하게).
${accuracy ? `- 다음 실제 인물·제품은 상상 합성하지 말고 최신 실물 형태를 정확히 묘사: **${accuracy}**. 이 대상이 등장하는 프롬프트에는 \`accurate likeness of ${accuracy}\`를 명시.` : ''}`
    : ''
}

================================================================
[자체 검토 — 출력 직전 필수]
================================================================
다음 금지 표현이 본문에 있는지 점검 후, 발견 시 인용형("~한다고 해요" / "~라는 의견이 많아요")으로 바꿉니다:
- 절대적·과장 표현: 무조건, 최고, 1순위, 절대, 100%, 보장, 완벽
- 자극·단정 표현: 죽다, 큰일 난다 → "무리가 갈 수 있다"; 효능 단정 → "~한다고 해요" (의학·금융 등 YMYL)
- 광고성 단어: 최저가, 특가, 할인쿠폰, 수익보장, 무료체험
- 키워드 과다 반복 / 외부 출처·인용 링크 노출 / 결론 은폐(두괄식 답 누락)
또한 GEO 핵심을 점검: 핵심 질문 1개가 명확한가 · 인트로에 두괄식 답 1단락이 있는가 · 핵심 사실 문장이 자기완결적인가 · 1인칭 경험이 1군데 이상 있는가 · 기준 시점이 명시됐는가 · 소제목이 소질문–소답변 구조인가.
${wantsReview ? `검토 결과를 \`## 6. 자체 검토\` 섹션에 체크리스트(✓ 또는 ✗ + 한 줄 코멘트)로 출력.` : '검토 결과는 출력하지 말고 본문에만 반영.'}

================================================================
[최종 출력 규칙 — 매우 중요]
================================================================
다른 설명·인사·메타코멘트 없이 아래 섹션을 순서대로 출력합니다. 섹션 헤더는 정확히 그대로 사용하세요:

${wantsSources ? '## 1. 참고 출처\n(deep-link 10개 이상, [사이트명](URL) 형태)\n\n' : ''}## 2. 제목 후보
${titleMode === 'multi' ? '### SEO 최적화형\n1. ...\n### 후킹/클릭 유도형\n6. ...\n### 손해 회피형\n11. ...\n### 숫자형\n16. ...' : '(베스트 제목 1줄)'}

## 3. 본문
(인트로 두괄식 답 + ▣ 소제목 ${sections}개 + 본문 ${charRange})

## 4. 해시태그
(#기호로 시작하는 30개의 태그를 한 줄에 모두 출력)

${wantsImages ? '## 5. 이미지 프롬프트\n(영문 프롬프트 ' + sections + '줄, 줄바꿈만으로 구분)\n\n' : ''}${wantsReview ? '## 6. 자체 검토\n- ✓/✗ 핵심 질문 1개 명확 + 인트로 두괄식 답\n- ✓/✗ 자기완결적 사실 문장 + 기준 시점\n- ✓/✗ 1인칭 경험 1군데 이상\n- ✓/✗ 절대·과장/자극·단정/광고성 표현 없음\n- ✓/✗ 외부 링크 미노출\n- ✓/✗ 메인 키워드 반복 5~6회 + 분량 ' + charRange + '\n' : ''}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface UsageState {
  used: number;
  limit: number;
  authenticated: boolean;
}

async function getAuthedUsage(userId: string): Promise<UsageState | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_draft_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today())
    .maybeSingle();
  return {
    used: data?.count ?? 0,
    limit: LIMITS.authed,
    authenticated: true,
  };
}

async function getAnonUsage(ipHash: string): Promise<UsageState | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from('anon_draft_usage')
    .select('count')
    .eq('ip_hash', ipHash)
    .eq('date', today())
    .maybeSingle();
  return {
    used: data?.count ?? 0,
    limit: LIMITS.anon,
    authenticated: false,
  };
}

async function incrementAuthedUsage(userId: string, newCount: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ai_draft_usage')
    .upsert(
      { user_id: userId, date: today(), count: newCount },
      { onConflict: 'user_id,date' }
    );
  if (error) console.error('ai_draft_usage upsert failed:', error);
}

async function incrementAnonUsage(ipHash: string, newCount: number) {
  const admin = getAdminClient();
  if (!admin) {
    console.error('Admin client unavailable; cannot record anon usage.');
    return;
  }
  const { error } = await admin
    .from('anon_draft_usage')
    .upsert(
      { ip_hash: ipHash, date: today(), count: newCount },
      { onConflict: 'ip_hash,date' }
    );
  if (error) console.error('anon_draft_usage upsert failed:', error);
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI 기능이 아직 설정되지 않았습니다. 운영자에게 문의해주세요.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let usage: UsageState | null;
  let ipHash: string | null = null;

  if (user) {
    usage = await getAuthedUsage(user.id);
  } else {
    try {
      const ip = getClientIp(request);
      ipHash = hashIp(ip);
    } catch (err) {
      console.error('IP 해시 실패:', err);
      return NextResponse.json(
        { error: '비로그인 사용자 추적 시스템이 설정되지 않았습니다. 로그인 후 이용해주세요.', code: 'IP_HASH_NOT_CONFIGURED' },
        { status: 503 }
      );
    }
    usage = await getAnonUsage(ipHash);
    if (!usage) {
      return NextResponse.json(
        { error: '비로그인 사용자 추적 시스템이 설정되지 않았습니다. 로그인 후 이용해주세요.', code: 'ADMIN_NOT_CONFIGURED' },
        { status: 503 }
      );
    }
  }

  if (!usage) {
    return NextResponse.json({ error: '사용량 조회에 실패했습니다.' }, { status: 500 });
  }

  if (usage.used >= usage.limit) {
    return NextResponse.json(
      {
        error: user
          ? `오늘 무료 생성 한도(${usage.limit}회)를 모두 사용했습니다. 내일 다시 시도해주세요.`
          : `비로그인 일일 한도(${usage.limit}회)를 사용했습니다. 로그인하면 하루 ${LIMITS.authed}회까지 가능합니다.`,
        code: 'RATE_LIMITED',
        used: usage.used,
        limit: usage.limit,
        authenticated: usage.authenticated,
      },
      { status: 429 }
    );
  }

  let body: { prompt?: string; keyword?: string; options?: DraftOptions; stream?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { prompt, keyword, options, stream: wantsStream } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: '프롬프트가 비어있습니다.' }, { status: 400 });
  }
  if (prompt.length > 8000) {
    return NextResponse.json({ error: '프롬프트가 너무 깁니다 (8000자 초과).' }, { status: 400 });
  }

  const safeOptions: DraftOptions = {
    style: options?.style === 'pyeongseo' ? 'pyeongseo' : 'haeyo',
    length: options?.length === 'compact' ? 'compact' : 'standard',
    titleMode: options?.titleMode === 'single' ? 'single' : 'multi',
    sectionCount: ([5, 6, 7] as const).includes(options?.sectionCount as 5 | 6 | 7)
      ? (options!.sectionCount as 5 | 6 | 7)
      : 5,
    accuracyTargets: typeof options?.accuracyTargets === 'string' ? options.accuracyTargets.slice(0, 500) : '',
    imagePrompts: options?.imagePrompts !== false,
    sources: options?.sources === true,
    selfReview: options?.selfReview !== false,
  };

  const systemPrompt = buildSystemPrompt(safeOptions);
  // 인스턴스 자체에는 default timeout 을 두지 않고, 요청마다 per-request 로 지정.
  //   - 스트리밍 (긴 출력): 290s — Vercel maxDuration 300s 직전
  //   - 비-스트리밍 (짧은 출력): 58s — 60s 미만 (구 동작 유지)
  const anthropic = new Anthropic({ apiKey, maxRetries: 0 });

  // 출력 토큰 한도 — 출력 시간 = 토큰 수에 거의 비례하므로 timeout 직결.
  // Phase 36.1 이후 기본 옵션이 single titles + no image prompts 라
  // 실제 평균 출력은 3,000~3,500 토큰 (본문 + 제목 1개 + 해시태그 + 자체검토).
  // 한도를 그에 맞춰 낮추면 P99 응답시간도 30~40s 이내로 안정.
  const maxTokens = safeOptions.titleMode === 'multi' ? 5000 : 3500;

  // ── Streaming 분기 ─────────────────────────────────────────
  // 출력 토큰이 많을 때(3,000+ tok) Vercel 60s 한도를 초과해 timeout 이 발생.
  // 스트리밍으로 토큰을 즉시 흘려보내면:
  //   1) Vercel 은 함수가 byte 를 내보내는 한 끊지 않음 → 60s 넘어도 OK
  //   2) 사용자는 글이 만들어지는 걸 실시간으로 보고 timeout 체감 X
  //   3) Anthropic 도 connection-level timeout 안 잡힘
  if (wantsStream) {
    const encoder = new TextEncoder();
    const sendEvent = (controller: ReadableStreamDefaultController, data: object) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    const readableStream = new ReadableStream({
      async start(controller) {
        const t0 = Date.now();
        let firstChunkAt: number | null = null;
        let fullText = '';
        try {
          // per-request timeout 290s — Vercel maxDuration 300s 직전.
          // 인스턴스 default(없음)가 아닌 호출별로 지정해 비-스트리밍 경로와 분리.
          const aiStream = anthropic.messages.stream(
            {
              model: MODEL,
              max_tokens: maxTokens,
              system: [
                { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
              ],
              messages: [{ role: 'user', content: prompt }],
            },
            { timeout: 290_000 },
          );

          aiStream.on('text', (text) => {
            if (firstChunkAt === null) firstChunkAt = Date.now();
            fullText += text;
            sendEvent(controller, { type: 'chunk', text });
          });

          // 스트림 종료까지 대기 — 실패 시 throw 됨
          await aiStream.finalMessage();

          if (!fullText) {
            sendEvent(controller, { type: 'error', error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' });
          } else {
            // 사용량 누적
            const newCount = (usage?.used ?? 0) + 1;
            try {
              if (user) await incrementAuthedUsage(user.id, newCount);
              else if (ipHash) await incrementAnonUsage(ipHash, newCount);
            } catch (e) {
              console.error('[ai-draft stream] usage increment failed:', e instanceof Error ? e.constructor.name : 'Unknown');
            }
            sendEvent(controller, {
              type: 'done',
              keyword: keyword ?? null,
              authenticated: usage?.authenticated ?? false,
              usage: {
                used: newCount,
                limit: usage?.limit ?? LIMITS.anon,
                remaining: Math.max(0, (usage?.limit ?? LIMITS.anon) - newCount),
              },
            });
          }
        } catch (err) {
          const errObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
          const errName = typeof errObj.name === 'string' ? errObj.name : '';
          const msg = err instanceof Error ? err.message.slice(0, 300) : '';
          const httpStatus = typeof errObj.status === 'number' ? errObj.status : undefined;
          const elapsedAtFail = Date.now() - t0;
          const ttfbAtFail = firstChunkAt !== null ? firstChunkAt - t0 : -1;
          console.error(`[ai-draft stream] failed — name=${errName} status=${httpStatus ?? 'none'} elapsedMs=${elapsedAtFail} ttfbMs=${ttfbAtFail} outChars=${fullText.length} msg="${msg}"`);

          let userMsg = 'AI 생성 중 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
          if (errName === 'APIConnectionTimeoutError' || /time(?:d|out)|aborted|abort/i.test(msg)) {
            userMsg = 'AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요.';
          } else if (httpStatus === 401 || httpStatus === 403) {
            userMsg = 'AI 서버 인증에 문제가 있어요. 운영자에게 알려주세요.';
          } else if (httpStatus === 429) {
            userMsg = 'AI 서버 호출량이 한도를 넘었어요. 잠시 후 다시 시도해주세요.';
          } else if (httpStatus === 529 || httpStatus === 503) {
            userMsg = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.';
          }
          sendEvent(controller, { type: 'error', error: userMsg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ── 기존 non-streaming 경로 ────────────────────────────────
  try {
    // per-request timeout 58s — /start 의 짧은 호출용. 60s 한도 직전에 abort.
    const response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: maxTokens,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: prompt }],
      },
      { timeout: 58_000 },
    );

    const textBlock = response.content.find((b) => b.type === 'text');
    const draftText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    if (!draftText) {
      return NextResponse.json({ error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' }, { status: 502 });
    }

    const newCount = usage.used + 1;
    if (user) {
      await incrementAuthedUsage(user.id, newCount);
    } else if (ipHash) {
      await incrementAnonUsage(ipHash, newCount);
    }

    return NextResponse.json({
      draft: draftText,
      keyword: keyword ?? null,
      authenticated: usage.authenticated,
      usage: {
        used: newCount,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - newCount),
      },
    });
  } catch (err) {
    // Anthropic SDK 는 APIError 의 subclass(BadRequestError / AuthenticationError /
    // RateLimitError / InternalServerError / OverloadedError / APIConnectionTimeoutError 등)로 throw.
    // 다만 Vercel production minify 가 constructor.name 을 'eB' 같은 1~2자로 압축하므로
    // class 이름에 의존하지 않고 status + err.name (명시적 설정값, minify-safe) + message 로만 분기.
    const errObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
    const cls = err instanceof Error ? err.constructor.name : 'UnknownError';
    const errName = typeof errObj.name === 'string' ? errObj.name : '';
    const msg = err instanceof Error ? err.message.slice(0, 300) : '';
    const httpStatus = typeof errObj.status === 'number' ? errObj.status : undefined;

    // Vercel 로그에서 한 줄로 추적할 수 있게 모두 기록 (사용자 응답엔 일반화된 메시지만).
    console.error(`[ai-draft] Claude call failed — class=${cls} name=${errName} status=${httpStatus ?? 'none'} msg="${msg}"`);

    // timeout 시그널: SDK 의 명시적 .name, message 패턴 ("Request timed out.", "timeout", "aborted"),
    // err.code (AbortError) 모두 커버.
    const isTimeout =
      errName === 'APIConnectionTimeoutError' ||
      errName === 'AbortError' ||
      /time(?:d|out)|aborted|abort/i.test(msg);

    // connection 시그널: SDK APIConnectionError + 흔한 network 키워드.
    const isConnectionError =
      errName === 'APIConnectionError' ||
      /fetch failed|network|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(msg);

    let status = 502;
    let userMsg = 'AI 생성 중 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';

    if (isTimeout) {
      status = 504;
      userMsg = 'AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요. (글 길이를 줄이거나 옵션을 단순화하면 안정적입니다)';
    } else if (httpStatus === 401 || httpStatus === 403) {
      status = 503;
      userMsg = 'AI 서버 인증에 문제가 있어요. 운영자에게 알려주세요.';
    } else if (httpStatus === 404) {
      status = 503;
      userMsg = 'AI 모델 설정에 문제가 있어요. 운영자에게 알려주세요.';
    } else if (httpStatus === 429) {
      status = 429;
      userMsg = 'AI 서버 호출량이 한도를 넘었어요. 잠시 후 다시 시도해주세요.';
    } else if (httpStatus === 529 || httpStatus === 503) {
      status = 503;
      userMsg = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.';
    } else if (httpStatus === 400 || httpStatus === 422) {
      status = 400;
      userMsg = '프롬프트가 너무 길거나 형식이 맞지 않아요. 줄여서 다시 시도해주세요.';
    } else if (httpStatus && httpStatus >= 500) {
      status = 502;
      userMsg = 'AI 서버에서 오류 응답을 받았어요. 잠시 후 다시 시도해주세요.';
    } else if (isConnectionError) {
      status = 502;
      userMsg = 'AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.';
    }

    return NextResponse.json({ error: userMsg }, { status });
  }
}

export async function GET(request: Request) {
  // fail-safe: 어떤 단계에서 환경변수 미설정 등으로 throw 되더라도
  // 클라이언트가 깨지지 않도록 항상 valid JSON 반환.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const usage = await getAuthedUsage(user.id);
      if (!usage) {
        return NextResponse.json({ authenticated: true, used: 0, limit: LIMITS.authed, remaining: LIMITS.authed });
      }
      return NextResponse.json({
        authenticated: true,
        used: usage.used,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.used),
      });
    }

    let ipHash: string;
    try {
      ipHash = hashIp(getClientIp(request));
    } catch {
      return NextResponse.json({
        authenticated: false,
        used: 0,
        limit: LIMITS.anon,
        remaining: LIMITS.anon,
        authedLimit: LIMITS.authed,
      });
    }
    const usage = await getAnonUsage(ipHash);

    if (!usage) {
      return NextResponse.json({
        authenticated: false,
        used: 0,
        limit: LIMITS.anon,
        remaining: LIMITS.anon,
        authedLimit: LIMITS.authed,
      });
    }

    return NextResponse.json({
      authenticated: false,
      used: usage.used,
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.used),
      authedLimit: LIMITS.authed,
    });
  } catch (err) {
    const cls = err instanceof Error ? err.constructor.name : 'UnknownError';
    console.error(`[ai-draft GET] usage probe failed: ${cls}`);
    return NextResponse.json({
      authenticated: false,
      used: 0,
      limit: LIMITS.anon,
      remaining: LIMITS.anon,
      authedLimit: LIMITS.authed,
    });
  }
}
