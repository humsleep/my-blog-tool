'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import type { TrendingItem } from '@/app/lib/dashboard/types';

interface Response {
  keywords: TrendingItem[];
}

interface Props {
  /** 카테고리 힌트 (전체 / 여행 / IT/기술 ...). 미지정 시 "전체" */
  category?: string;
  /** 최대 표시 개수 (기본 10) */
  limit?: number;
  /** 카드 좌상단 라벨 */
  label?: string;
  /** 부제 (없으면 카테고리·기간으로 자동) */
  subtitle?: string;
}

/**
 * 데일리 대시보드 — 인기 키워드 가로 스크롤 티커.
 * 클릭 시 /keyword-analysis?keyword=... 로 즉시 점프.
 */
export default function TrendingTicker({
  category = '전체',
  limit = 10,
  label = '오늘의 트렌드',
  subtitle,
}: Props) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    clientFetchJson<Response>(
      `/api/trending-keywords?category=${encodeURIComponent(category)}&period=daily&limit=${limit}`,
    )
      .then((data) => {
        if (!cancelled) setItems(data.keywords ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, limit]);

  return (
    <section className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <header className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
            {label}
          </span>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {category === '전체' ? '실시간 인기 검색어' : `${category} 분야 인기 키워드`}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle ?? '클릭하면 검색량·경쟁률을 바로 볼 수 있어요.'}
          </p>
        </div>
        <Link
          href="/trending"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap"
        >
          전체 보기 →
        </Link>
      </header>

      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-28 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-2">
            인기 검색어를 불러오지 못했어요. {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-2">
            지금은 가져올 키워드가 없어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {items.map((it) => (
              <Link
                key={`${it.rank}-${it.keyword}`}
                href={`/keyword-analysis?keyword=${encodeURIComponent(it.keyword)}`}
                className="group flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
              >
                <span className="text-[11px] tabular font-semibold text-zinc-400 group-hover:text-orange-500 dark:group-hover:text-orange-400">
                  {String(it.rank).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {it.keyword}
                </span>
                {it.totalCount > 0 && (
                  <span className="text-[11px] tabular text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {Intl.NumberFormat('ko-KR').format(it.totalCount)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
