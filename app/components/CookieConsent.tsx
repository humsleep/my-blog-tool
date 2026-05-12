'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdSense from './AdSense';
import { Analytics } from '@vercel/analytics/next';

/**
 * 쿠키 동의 배너 + 동의 기반 스크립트 게이트.
 *
 *  - 미동의 상태에서는 AdSense / Vercel Analytics 가 마운트되지 않음
 *    (GDPR / KISA 가이드 기본값 = "동의 전 비활성")
 *  - 동의(또는 거부) 상태가 localStorage 에 저장돼 재방문 시 배너 미노출
 *  - 거부한 사용자에게는 절대 광고/분석 쿠키가 적재되지 않음
 *
 *  hydration mismatch 방지를 위해 첫 페인트에는 `null` 을 반환하고
 *  useEffect 이후에 실제 UI를 그린다.
 */

const STORAGE_KEY = 'bbl_cookie_consent';
type ConsentStatus = 'unset' | 'accepted' | 'rejected';

function readStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'unset';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'accepted' || v === 'rejected' ? v : 'unset';
  } catch {
    return 'unset';
  }
}

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>('unset');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatus(readStatus());
    // 다른 탭에서 동의 상태가 바뀌면 동기화 — 멀티탭 사용자 대응
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStatus(readStatus());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = (next: ConsentStatus) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setStatus(next);
  };

  // hydration mismatch 방지 — 첫 페인트에는 아무것도 그리지 않음
  if (!mounted) return null;

  return (
    <>
      {/* 동의 시점에만 분석·광고 스크립트 마운트 */}
      {status === 'accepted' && (
        <>
          <AdSense />
          <Analytics />
        </>
      )}

      {/* 미설정 사용자에게만 배너 노출 */}
      {status === 'unset' && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="쿠키 동의"
          className="fixed inset-x-0 bottom-0 z-50 safe-bottom pointer-events-none"
        >
          <div className="mx-auto max-w-3xl px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-auto">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-lg p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="hidden sm:flex w-9 h-9 rounded-md bg-orange-500 items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z M8 14c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm6-4a2 2 0 11.001-4 2 2 0 010 4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    쿠키 사용에 동의해주세요
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    서비스 운영에 필요한 필수 쿠키 외에, 사용 통계(Vercel Analytics)·광고(Google AdSense) 쿠키를 사용해도 될까요? 거부해도 모든 기능을 사용할 수 있어요.
                    {' '}
                    <Link href="/privacy" className="text-orange-600 dark:text-orange-400 underline hover:no-underline font-medium">
                      자세히 보기
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => persist('rejected')}
                  className="btn-base btn-ghost btn-sm"
                >
                  필수만 허용
                </button>
                <button
                  type="button"
                  onClick={() => persist('accepted')}
                  className="btn-base btn-primary btn-sm"
                >
                  전체 동의
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
