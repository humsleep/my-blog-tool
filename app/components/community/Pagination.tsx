'use client';

import { useEffect } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** 키보드 ←/→ 단축키 활성화 (input/textarea 포커스 중엔 자동 비활성) */
  enableArrowKeys?: boolean;
}

export default function Pagination({ page, totalPages, onChange, enableArrowKeys = true }: PaginationProps) {
  useEffect(() => {
    if (!enableArrowKeys) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'ArrowLeft' && page > 1) onChange(page - 1);
      if (e.key === 'ArrowRight' && page < totalPages) onChange(page + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [page, totalPages, onChange, enableArrowKeys]);

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-5 flex items-center justify-center gap-1" aria-label="페이지 네비게이션">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="이전 페이지"
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`inline-flex items-center justify-center min-w-[44px] h-11 px-2 text-sm rounded-lg transition-colors tabular-nums ${
            p === page
              ? 'bg-orange-500 text-white font-semibold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="다음 페이지"
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        →
      </button>
    </nav>
  );
}
