'use client';

import { useEffect } from 'react';

/**
 * 루트 layout 자체가 죽었을 때만 동작하는 최후 방어선.
 *  - <html>/<body> 를 직접 렌더 (layout 의존 X)
 *  - 외부 컴포넌트/CSS 사용 최소화 (인라인 스타일)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
          background: '#fafafa',
          color: '#18181b',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#fff',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: '2rem 1.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f97316',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            B
          </div>
          <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            서비스에 문제가 발생했어요
          </h1>
          <p
            style={{
              margin: '0.5rem 0 1.25rem',
              fontSize: '0.875rem',
              color: '#71717a',
              lineHeight: 1.6,
            }}
          >
            잠시 후 다시 접속해주세요. 계속 같은 오류가 발생하면 아래 ID와 함께 문의 부탁드립니다.
          </p>
          {error.digest && (
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                color: '#71717a',
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                marginBottom: '1rem',
              }}
            >
              오류 ID: {error.digest}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#f97316',
                color: '#fff',
                border: 0,
                padding: '0.55rem 1rem',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <a
              href="/"
              style={{
                background: '#fff',
                color: '#27272a',
                border: '1px solid #e4e4e7',
                padding: '0.55rem 1rem',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              홈으로
            </a>
            <a
              href="mailto:boheme88@naver.com"
              style={{
                background: 'transparent',
                color: '#71717a',
                padding: '0.55rem 0.5rem',
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              메일 문의
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
