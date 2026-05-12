import { NextRequest, NextResponse } from 'next/server';
import { getCache } from '@/app/lib/cache';
import { fetchWithRetry } from '@/app/lib/fetchRetry';
import { checkRateLimit, tooManyRequestsResponse } from '@/app/lib/security/rate-limit';
import crypto from 'crypto';

export interface SpellMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage: string;
  replacements: string[];
  ruleId: string;
  category: string;
  context: string;
  contextOffset: number;
  contextLength: number;
}

export interface SpellCheckResponse {
  total: number;
  matches: SpellMatch[];
  language: string;
}

const cache = getCache<SpellCheckResponse>('spellcheck', 2 * 60 * 1000);

interface LtMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage?: string;
  replacements?: Array<{ value: string }>;
  rule: { id: string; category: { id: string; name: string } };
  context: { text: string; offset: number; length: number };
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, { limit: 20, windowMs: 60_000, bucket: 'spellcheck' });
    if (!rl.allowed) return tooManyRequestsResponse(rl, '맞춤법 검사 요청이 너무 잦아요. 잠시 후 다시 시도해주세요.');

    const { text, language = 'ko-KR' } = await request.json();

    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: '검사할 텍스트가 필요합니다.' }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: '텍스트가 너무 깁니다. 20,000자 이하로 입력해주세요.' }, { status: 400 });
    }

    const hash = crypto.createHash('sha1').update(text).digest('hex').slice(0, 16);
    const cacheKey = `${language}::${hash}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
    }

    const body = new URLSearchParams({ text, language });
    const res = await fetchWithRetry('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      retries: 1,
      timeoutMs: 15000,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `맞춤법 검사 실패: ${errText || res.statusText}` },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { matches?: LtMatch[]; language?: { code?: string } };
    const matches: SpellMatch[] = (data.matches || []).map((m) => ({
      offset: m.offset,
      length: m.length,
      message: m.message,
      shortMessage: m.shortMessage || '',
      replacements: (m.replacements || []).slice(0, 5).map((r) => r.value),
      ruleId: m.rule.id,
      category: m.rule.category.name,
      context: m.context.text,
      contextOffset: m.context.offset,
      contextLength: m.context.length,
    }));

    const payload: SpellCheckResponse = {
      total: matches.length,
      matches,
      language: data.language?.code || language,
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    console.error('맞춤법 검사 오류:', error);
    const message = error instanceof Error ? error.message : '맞춤법 검사 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
