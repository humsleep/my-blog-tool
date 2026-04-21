import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/app/lib/fetchRetry';

const ALLOWED_HOSTS = new Set([
  'images.pexels.com',
  'images.unsplash.com',
  'plus.unsplash.com',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');
    if (!target) {
      return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return NextResponse.json({ error: '잘못된 URL입니다.' }, { status: 400 });
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return NextResponse.json({ error: '허용되지 않은 호스트입니다.' }, { status: 400 });
    }

    const upstream = await fetchWithRetry(parsed.toString(), { retries: 1, timeoutMs: 15000 });
    if (!upstream.ok) {
      return NextResponse.json({ error: `이미지 다운로드 실패 (${upstream.status})` }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('이미지 프록시 오류:', error);
    const message = error instanceof Error ? error.message : '이미지 프록시 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
