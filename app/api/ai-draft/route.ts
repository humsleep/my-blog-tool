import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { getClientIp, hashIp } from '@/app/lib/security/ip-hash';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const charRange =
    length === 'compact' ? '공백 제외 1,300자~1,700자' : '공백 제외 1,700자~2,200자';

  const styleGuide =
    style === 'haeyo'
      ? `친근한 해요체. "솔직히", "진짜로", "~더라고요" 같은 구어체를 자연스럽게 섞고, 도입부는 "작년 여름이었나..." 같은 자연스러운 기억·에피소드로 시작. 짧은 문장과 긴 문장 번갈아, 수사 의문문·감탄·여담도 자연스럽게.`
      : `평서체(~이다, ~했다, ~된다, ~보인다). 존댓말 금지. 차분하고 단정한 정보 전달 톤. 1인 블로거의 시각이지만 문장은 단호하고 객관적으로.`;

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
  - 후킹/클릭 유도형 (6~10): 호기심·궁금증 유발, 유튜브 썸네일 스타일
  - 손해 회피형 (11~15): "지금 안 보면 손해", "놓치면 후회" 류
  - 숫자형 (16~20): 명확한 숫자(5가지/TOP 7 등)로 이득을 보여주는 형태
모든 제목은 메인 키워드를 맨 앞에 배치하고 끝에 이모지 1개만 사용.`
    : `메인 키워드를 맨 앞에 배치한 베스트 제목 1개만 \`## 2. 제목 후보\` 섹션에 한 줄로 출력. 끝에 이모지 1개만 사용.`
}

## 3단계 — 소제목 구성 (10~15자 명사형, ${sections}개)
- 독자 체류시간을 늘리는 스토리텔링 흐름.
- 핵심 정보 섹션과 블로거 견해 섹션을 분리.
- 비슷한 주제는 묶고, 명사형으로 간결하게.
- 본문 작성 후 \`## 3. 본문\` 안에 ▣ 기호와 함께 사용.

## 4단계 — 본문 작성 (\`## 3. 본문\`에 출력)
- **분량**: ${charRange}.
- **문체**: ${styleGuide}
- **도입부**: 핵심을 바로 말하지 않음. 자연스러운 일화·기억·관찰로 시작하고, 메인 키워드를 첫 두 문장 안에 자연스럽게 녹임.
- **본문 전개**: ▣ 기호 소제목 ${sections}개. 한 문단은 2~3줄.
- **표**: 직관적인 수치 비교가 필요할 때만 최대 3~4행. 나머지는 산문.
- **메인 키워드 반복**: 본문 전체에서 5~6회만 (과도 시 노출 ↓).
- **마무리**: 이모지 1개와 함께 자연스럽게 닫음.
- ${
    style === 'haeyo'
      ? '경험·감정 신호를 반드시 포함, "[나의 경험 삽입]" placeholder 1~2개 표시.'
      : '소제목과 본문에 이모지·이모티콘 사용 금지. 본문 마지막 한 문장에만 이모지 1개 허용.'
  }

## 5단계 — 해시태그 (\`## 4. 해시태그\`에 출력)
- **전체 30개**: 높은 검색량 태그 + 니치(롱테일) 태그 조합. 한 줄에 모두 #기호로 출력.
- **추천 10개**: 위 30개 중 가장 효과 좋을 것으로 예상되는 10개를 별도 줄에 따로 표시.

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
- YMYL 위험 문구: 죽다, 큰일 난다, 손목 나간다, 낫는다, 치료된다, "효과가 있다"(의학·금융)
- 광고성 단어: 최저가, 특가, 할인쿠폰, 수익보장, 무료체험
${wantsReview ? `검토 결과를 \`## 6. 자체 검토\` 섹션에 체크리스트(✓ 또는 ✗ + 한 줄 코멘트)로 출력.` : '검토 결과는 출력하지 말고 본문에만 반영.'}

================================================================
[최종 출력 규칙 — 매우 중요]
================================================================
다른 설명·인사·메타코멘트 없이 아래 섹션을 순서대로 출력합니다. 섹션 헤더는 정확히 그대로 사용하세요:

${wantsSources ? '## 1. 참고 출처\n(deep-link 10개 이상, [사이트명](URL) 형태)\n\n' : ''}## 2. 제목 후보
${titleMode === 'multi' ? '### SEO 최적화형\n1. ...\n### 후킹/클릭 유도형\n6. ...\n### 손해 회피형\n11. ...\n### 숫자형\n16. ...' : '(베스트 제목 1줄)'}

## 3. 본문
(▣ 소제목 ${sections}개 + 본문 ${charRange})

## 4. 해시태그
**전체 30개**: #...
**추천 10개**: #...

${wantsImages ? '## 5. 이미지 프롬프트\n(영문 프롬프트 ' + sections + '줄, 줄바꿈만으로 구분)\n\n' : ''}${wantsReview ? '## 6. 자체 검토\n- ✓/✗ 절대적·과장 표현\n- ✓/✗ YMYL 위험 문구\n- ✓/✗ 광고성 단어\n- ✓/✗ 메인 키워드 반복 5~6회\n- ✓/✗ 분량 ' + charRange + '\n' : ''}`;
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

  let body: { prompt?: string; keyword?: string; options?: DraftOptions };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { prompt, keyword, options } = body;
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
  // Vercel maxDuration 60s 보다 짧게 잡아, 응답이 안 오면 함수가 강제 종료되어
  // plain-text "An error occurred ..." 으로 떨어지지 않도록 우리가 먼저 abort.
  const anthropic = new Anthropic({ apiKey, timeout: 55_000, maxRetries: 0 });

  // 20개 제목·이미지 프롬프트·출처까지 포함하면 출력이 길어지므로 토큰 한도 상향
  const maxTokens = (safeOptions.titleMode === 'multi' ? 6000 : 4500);

  try {
    const response = await anthropic.messages.create({
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
    });

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
    // 사용자에게는 일반화된 메시지, 서버 로그에는 에러 클래스명만 (응답 본문 누설 방지)
    const cls = err instanceof Error ? err.constructor.name : 'UnknownError';
    const msg = err instanceof Error ? err.message : '';
    console.error(`[ai-draft] Claude call failed: ${cls}`);

    // Anthropic SDK 에러 타입 별 사용자 메시지 분기
    //   - APIConnectionTimeoutError / AbortError → timeout
    //   - 529 (overload) → 일시 혼잡
    //   - 401/403 → 운영자 설정 문제 (사용자 책임 X)
    //   - 400 → 입력 문제
    let status = 502;
    let userMsg = 'AI 생성 중 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';

    if (cls === 'APIConnectionTimeoutError' || cls === 'AbortError' || /timeout/i.test(msg)) {
      status = 504;
      userMsg = 'AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요.';
    } else if (cls === 'APIError' && err && typeof err === 'object' && 'status' in err) {
      const httpStatus = (err as { status?: number }).status;
      if (httpStatus === 529 || httpStatus === 503) {
        status = 503;
        userMsg = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.';
      } else if (httpStatus === 401 || httpStatus === 403) {
        status = 503;
        userMsg = 'AI 서버 인증에 문제가 있어요. 운영자에게 알려주세요.';
      } else if (httpStatus === 400) {
        status = 400;
        userMsg = '프롬프트가 너무 길거나 형식이 맞지 않아요. 줄여서 다시 시도해주세요.';
      }
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
