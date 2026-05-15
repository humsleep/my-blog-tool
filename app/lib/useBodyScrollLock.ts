'use client';

import { useEffect } from 'react';

/**
 * 모달/드로어가 열려 있는 동안 body 스크롤을 잠근다.
 *
 * - locked=false 일 때는 아무 것도 하지 않는다.
 * - 여러 모달이 중첩되어도 카운트 기반(`__bodyScrollLockCount`)으로 안전하게 동작.
 *   마지막 모달이 닫혔을 때만 원래 overflow 를 복원.
 * - SSR 안전 (typeof window 가드).
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof window === 'undefined') return;
    const body = document.body;
    const w = window as typeof window & { __bodyScrollLockCount?: number; __bodyScrollLockPrev?: string };
    const count = w.__bodyScrollLockCount ?? 0;
    if (count === 0) {
      w.__bodyScrollLockPrev = body.style.overflow;
      body.style.overflow = 'hidden';
    }
    w.__bodyScrollLockCount = count + 1;
    return () => {
      const next = (w.__bodyScrollLockCount ?? 1) - 1;
      w.__bodyScrollLockCount = next;
      if (next <= 0) {
        body.style.overflow = w.__bodyScrollLockPrev ?? '';
        w.__bodyScrollLockCount = 0;
      }
    };
  }, [locked]);
}
