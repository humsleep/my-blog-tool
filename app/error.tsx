'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Next.js App Router — 라우트 세그먼트 에러 바운더리.
 *  렌더 오류 / Server Component 에러를 잡아 친근한 페이지를 보여준다.
 *  (root layout 자체의 에러는 global-error.tsx 가 처리)
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel 로그에서 검색 가능하도록 한 줄 요약
    console.error('[route-error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                페이지를 표시할 수 없어요
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>
          </div>

          {error.digest && (
            <div className="mb-4 px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              오류 ID: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => reset()} className="btn-base btn-primary btn-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              다시 시도
            </button>
            <Link href="/" className="btn-base btn-secondary btn-md">
              홈으로
            </Link>
            <Link href="/contact" className="btn-base btn-ghost btn-md">
              문의하기
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            계속 같은 오류가 발생하면 위 <strong>오류 ID</strong>를 포함해 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
