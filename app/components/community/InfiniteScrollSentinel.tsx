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
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="w-4 h-4 border-2 border-zinc-300 border-t-orange-500 rounded-full animate-spin" />
          더 불러오는 중...
        </div>
      ) : hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          더 보기
        </button>
      ) : null}
    </div>
  );
}
