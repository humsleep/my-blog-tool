import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/app/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAILY_LIMIT = 2;
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

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI 기능이 아직 설정되지 않았습니다. 운영자에게 문의해주세요.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: usage } = await supabase
    .from('ai_draft_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  const usedCount = usage?.count ?? 0;
  if (usedCount >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `하루 무료 생성 한도(${DAILY_LIMIT}회)를 모두 사용했습니다. 내일 다시 시도해주세요.`,
        code: 'RATE_LIMITED',
        used: usedCount,
        limit: DAILY_LIMIT,
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
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const draftText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    if (!draftText) {
      return NextResponse.json({ error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' }, { status: 502 });
    }

    // Increment usage count (upsert)
    const { error: upsertError } = await supabase
      .from('ai_draft_usage')
      .upsert(
        { user_id: user.id, date: today, count: usedCount + 1 },
        { onConflict: 'user_id,date' }
      );

    if (upsertError) {
      console.error('ai_draft_usage upsert failed:', upsertError);
    }

    return NextResponse.json({
      draft: draftText,
      keyword: keyword ?? null,
      usage: {
        used: usedCount + 1,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - usedCount - 1),
      },
    });
  } catch (err) {
    console.error('Claude API error:', err);
    const message = err instanceof Error ? err.message : 'AI 호출 실패';
    return NextResponse.json({ error: `AI 생성 중 오류: ${message}` }, { status: 502 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      limit: DAILY_LIMIT,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from('ai_draft_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  const used = usage?.count ?? 0;
  return NextResponse.json({
    authenticated: true,
    used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - used),
  });
}
