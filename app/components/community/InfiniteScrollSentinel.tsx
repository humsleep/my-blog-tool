'use client';

import { useEffect, useRef } from 'react';

interface InfiniteScrollSentinelProps {
  /** 다음 페이지가 있는가 */
  hasMore: boolean;
  /** 현재 로딩 중인가 (중복 호출 방지) */
  loading: boolean;
  /** 다음 페이지 로드 콜백 */
  onLoadMore: () => void;
  /** 트리거 거리 (rootMargin) — 기본 200px 전 미리 로드 */
  rootMargin?: string;
}

/**
 * IntersectionObserver 기반 sentinel.
 * 리스트 마지막에 두면 스크롤 진입 직전에 onLoadMore() 호출.
 */
export default function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '200px',
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, rootMargin]);

  if (!hasMore && !loading) return null;

  return (
    <div ref={ref} className="py-6 flex items-center justify-center">
      {loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
          더 불러오는 중...
        </div>
      ) : hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          더 보기
        </button>
      ) : null}
    </div>
  );
}
