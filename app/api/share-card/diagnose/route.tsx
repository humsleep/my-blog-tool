import { ImageResponse } from 'next/og';
import { loadGoogleFont } from '@/lib/og/font';
import type { NextRequest } from 'next/server';

/**
 * 진단 결과를 1080×1920 (인스타 스토리 / 9:16) PNG 으로 동적 생성.
 *
 *  쿼리 파라미터로 결과 데이터를 받아 즉시 PNG 반환 — 별도 DB 조회 없음.
 *    /api/share-card/diagnose?total=78&band=top15&activity=80&visibility=72&quality=85&category=여행
 *
 *  목적: 사용자가 진단 후 "📤 인스타에 공유" 버튼을 누르면 카드 PNG 다운로드 →
 *        본인 인스타 스토리에 업로드 → 친구·팔로워가 우리 도메인 노출됨 → 유기적 확산.
 *
 *  Edge runtime — Vercel CDN 캐시로 같은 점수 조합은 한 번만 생성 후 재활용.
 */

export const runtime = 'edge';

type Band = 'top5' | 'top15' | 'top35' | 'mid' | 'growing';

// band 별 라벨 + 컬러
const BAND_META: Record<Band, { label: string; bg: string; accent: string }> = {
  top5:     { label: '상위 5%',  bg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', accent: '#dcfce7' },
  top15:    { label: '상위 15%', bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', accent: '#dbeafe' },
  top35:    { label: '상위 35%', bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', accent: '#fed7aa' },
  mid:      { label: '중위권',   bg: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)', accent: '#e4e4e7' },
  growing:  { label: '성장 중',  bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', accent: '#ffe4e6' },
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseScore(v: string | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : fallback;
}

function parseBand(v: string | null): Band {
  const list: Band[] = ['top5', 'top15', 'top35', 'mid', 'growing'];
  return (list.includes(v as Band) ? v : 'mid') as Band;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const total = parseScore(searchParams.get('total'));
  const band = parseBand(searchParams.get('band'));
  const activity = parseScore(searchParams.get('activity'));
  const visibility = parseScore(searchParams.get('visibility'));
  const quality = parseScore(searchParams.get('quality'));
  const category = (searchParams.get('category') || '').slice(0, 12);

  const meta = BAND_META[band];

  // 카드에 사용할 모든 글자 (한글 + 숫자) 모음 → 글리프만 다운로드
  const allText =
    `내 블로그 진단 결과 점Boheme BlogLab bohemebloglab.com 활동성 노출 품질 분야 여러분도 30초 무료 ${meta.label} ${category}0123456789`;

  const [bold, medium] = await Promise.all([
    loadGoogleFont('Noto+Sans+KR', 800, allText),
    loadGoogleFont('Noto+Sans+KR', 500, allText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: meta.bg,
          color: 'white',
          fontFamily: 'Noto Sans KR',
          position: 'relative',
          padding: '80px 72px',
        }}
      >
        {/* 좌상단 빛 구체 */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: -200,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }}
        />
        {/* 우하단 빛 구체 */}
        <div
          style={{
            position: 'absolute',
            bottom: -260,
            right: -180,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }}
        />
        {/* 미세 그리드 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* 상단: 브랜드 + 카테고리 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              }}
            >
              <span style={{ color: meta.accent, fontSize: 40, fontWeight: 800, marginTop: -4 }}>B</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 500, opacity: 0.96 }}>
              Boheme BlogLab
            </span>
          </div>
          {category && (
            <div
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.4)',
                fontSize: 24,
                fontWeight: 500,
                display: 'flex',
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* 중앙 핵심: 큰 점수 + band */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            marginTop: 40,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 500, opacity: 0.92, marginBottom: 8 }}>
            내 블로그 진단 결과
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontSize: 360,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.05em',
                textShadow: '0 14px 48px rgba(0,0,0,0.22)',
              }}
            >
              {total}
            </span>
            <span style={{ fontSize: 64, fontWeight: 500, opacity: 0.7 }}>점</span>
          </div>
          <div
            style={{
              marginTop: 24,
              padding: '14px 36px',
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.4)',
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              display: 'flex',
            }}
          >
            {meta.label}
          </div>
        </div>

        {/* 3축 지표 — 가로 막대 3개 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, zIndex: 1, marginBottom: 32 }}>
          {[
            { label: '활동성', value: activity },
            { label: '노출',   value: visibility },
            { label: '품질',   value: quality },
          ].map((m) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontSize: 30, fontWeight: 500, width: 130, opacity: 0.92 }}>{m.label}</span>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  position: 'relative',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${m.value}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'white',
                    display: 'flex',
                  }}
                />
              </div>
              <span style={{ fontSize: 36, fontWeight: 800, width: 80, textAlign: 'right', letterSpacing: '-0.02em' }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* 하단: CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 500, opacity: 0.94, marginBottom: 6 }}>
            여러분도 30초, 무료
          </span>
          <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '0.01em' }}>
            bohemebloglab.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Noto Sans KR', data: bold, weight: 800, style: 'normal' },
        { name: 'Noto Sans KR', data: medium, weight: 500, style: 'normal' },
      ],
      // 다운로드 친화 헤더 — 브라우저가 직접 다운로드 받기 유도
      headers: {
        'Content-Disposition': `inline; filename="bohemebloglab-diagnose-${total}.png"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    },
  );
}
