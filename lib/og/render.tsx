import { ImageResponse } from 'next/og';
import { loadGoogleFont } from './font';

/**
 * Open Graph / Twitter 카드 이미지 동적 생성.
 *
 *  - app/opengraph-image.tsx 와 app/twitter-image.tsx 가 이 헬퍼를 공유한다.
 *  - 빌드 시 한 번 prerender 되어 정적 PNG 처럼 서빙됨 (Vercel CDN 캐시).
 *  - 카피를 바꾸려면 본 파일의 `MAIN_LINE_1` / `MAIN_LINE_2` / `BRAND` 만 수정.
 *
 *  한글 폰트는 lib/og/font.ts 의 loadGoogleFont 헬퍼 사용 — 필요한 글리프만 fetch.
 */

export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png' as const;
export const alt = 'Boheme BlogLab — 블로그 운영의 모든 것을 한 곳에서';

const BRAND = 'Boheme BlogLab';
const MAIN_LINE_1 = '블로그 운영의';
const MAIN_LINE_2 = '모든 것을 한 곳에서';
const DOMAIN = 'bohemebloglab.com';

export async function renderOgImage() {
  // 사용 글리프 합집합 — 한 번에 모두 받아 한 번만 호출
  const text = `${BRAND}${MAIN_LINE_1}${MAIN_LINE_2}${DOMAIN}`;

  const [bold, medium] = await Promise.all([
    loadGoogleFont('Noto+Sans+KR', 800, text),
    loadGoogleFont('Noto+Sans+KR', 500, text),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px',
          background:
            'linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 80%, #c2410c 100%)',
          position: 'relative',
          color: 'white',
          fontFamily: 'Noto Sans KR',
        }}
      >
        {/* 우상단 빛 구체 — 깊이감 */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 540,
            height: 540,
            borderRadius: 9999,
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }}
        />
        {/* 좌하단 빛 구체 */}
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -160,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }}
        />
        {/* 미세 그리드 텍스처 — 너무 미니멀한 그라데이션에 살짝 결을 더함 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            display: 'flex',
          }}
        />

        {/* 상단: 로고 + 브랜드명 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 14px 32px rgba(120, 30, 0, 0.28)',
            }}
          >
            <span
              style={{
                color: '#ea580c',
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1,
                marginTop: -4,
              }}
            >
              B
            </span>
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              opacity: 0.96,
            }}
          >
            {BRAND}
          </span>
        </div>

        {/* 중앙: 메인 카피 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              textShadow: '0 4px 18px rgba(120, 30, 0, 0.2)',
            }}
          >
            {MAIN_LINE_1}
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              textShadow: '0 4px 18px rgba(120, 30, 0, 0.2)',
            }}
          >
            {MAIN_LINE_2}
          </span>
        </div>

        {/* 하단: 도메인 + 미세한 강조선 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 4,
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '0.01em',
              opacity: 0.94,
            }}
          >
            {DOMAIN}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans KR', data: bold, weight: 800, style: 'normal' },
        { name: 'Noto Sans KR', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
}
