'use client';

import { useEffect } from 'react';

/**
 * 모바일 전용 필터 바텀시트 (Phase 60.3).
 *  - 목록 페이지의 카테고리/정렬/지역 필터를 모바일에서 하단 시트로 모은다.
 *  - sm 이상에선 렌더 자체를 하지 않음(데스크탑은 인라인 필터 사용).
 *  - 배경 backdrop 탭 / 완료 버튼으로 닫기. 열려 있는 동안 배경 스크롤 잠금.
 */
export default function FilterBottomSheet({
  open,
  onClose,
  title = '필터',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="sm:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] flex flex-col rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl animate-sheet-up safe-bottom">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-m-2 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-5">{children}</div>

        <div className="px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center min-h-[48px] rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
