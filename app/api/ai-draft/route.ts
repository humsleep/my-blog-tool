import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { getClientIp, hashIp } from '@/app/lib/security/ip-hash';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LIMITS = { authed: 5, anon: 1 } as const;
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 네이버 블로그 상위 노출 전문 글쓰기 도우미입니다.

다음 원칙을 반드시 지켜 초안을 작성하세요:
1. 도입부 2~3문장에 메인 키워드를 자연스럽게 포함
2. 1,500~2,500자 분량, 2~4문장마다 줄바꿈
3. 소제목(## H2)은 3~5개 사용, 각 소제목에 키워드 변형 포함
4. 광고성 표현/금칙어 회피 (최저가, 특가, 할인쿠폰, 수익보장, 무료체험 등)
5. 마지막 단락에 독자의 댓글/공감을 유도하는 문장 포함
6. HTML이 아닌 마크다운 형식으로 작성 (네이버 에디터에 붙여넣기 쉽도록)
7. 개인적 경험이 포함될 만한 부분은 "[나의 경험 삽입]" 같은 placeholder로 표시`;

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
    const ip = getClientIp(request);
    ipHash = hashIp(ip);
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

  let body: { prompt?: string; keyword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { prompt, keyword } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: '프롬프트가 비어있습니다.' }, { status: 400 });
  }
  if (prompt.length > 8000) {
    return NextResponse.json({ error: '프롬프트가 너무 깁니다 (8000자 초과).' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
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
    console.error('Claude API error:', err);
    const message = err instanceof Error ? err.message : 'AI 호출 실패';
    return NextResponse.json({ error: `AI 생성 중 오류: ${message}` }, { status: 502 });
  }
}

export async function GET(request: Request) {
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

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
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
}
