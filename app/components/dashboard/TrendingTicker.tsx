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
 * 데일리 대시보드 — 인기 키워드 랭킹 보드.
 *
 *  TOP 3는 medal 카드(메달 아이콘 + 큰 폰트), 4~10위는 컴팩트한 가로 리스트.
 *  클릭 시 /keyword-analysis?keyword=... 로 즉시 점프.
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

  const top3 = items.slice(0, 3);
  const rest = items.slice(3, 10);
  const fmt = Intl.NumberFormat('ko-KR');

  return (
    <section className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <header className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
            {label}
          </span>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {category === '전체' ? '실시간 인기 검색어 TOP 10' : `${category} 분야 인기 키워드 TOP 10`}
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
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
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
          <>
            {/* ── TOP 3 — 포디움 ─────────────────────────────────── */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {top3.map((it) => {
                  const tone = PODIUM_TONES[it.rank as 1 | 2 | 3] ?? PODIUM_TONES[3];
                  return (
                    <Link
                      key={`${it.rank}-${it.keyword}`}
                      href={`/keyword-analysis?keyword=${encodeURIComponent(it.keyword)}`}
                      className={`group relative overflow-hidden rounded-md border ${tone.border} ${tone.bg} px-3.5 py-3 hover:shadow-sm transition-all hover:-translate-y-0.5`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold tabular-nums ${tone.medalBg} ${tone.medalText} shadow-sm`}
                          aria-label={`${it.rank}위`}
                        >
                          {it.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`text-[10px] font-semibold tracking-[0.12em] uppercase ${tone.label}`}>
                            {it.rank === 1 ? 'GOLD' : it.rank === 2 ? 'SILVER' : 'BRONZE'}
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                            {it.keyword}
                          </div>
                          {it.totalCount > 0 && (
                            <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
                              월 {fmt.format(it.totalCount)} 검색
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── 4~10위 — 컴팩트 리스트 ───────────────────────── */}
            {rest.length > 0 && (
              <ol className="rounded-md border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                {rest.map((it) => (
                  <li key={`${it.rank}-${it.keyword}`}>
                    <Link
                      href={`/keyword-analysis?keyword=${encodeURIComponent(it.keyword)}`}
                      className="group flex items-center gap-3 px-3 py-2 hover:bg-orange-50/60 dark:hover:bg-orange-950/20 transition-colors"
                    >
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-zinc-400 dark:text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {it.rank}
                      </span>
                      <span className="flex-1 min-w-0 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-orange-700 dark:group-hover:text-orange-300">
                        {it.keyword}
                      </span>
                      {it.totalCount > 0 && (
                        <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {fmt.format(it.totalCount)}
                        </span>
                      )}
                      <svg className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ── 포디움 톤 (1위 골드 / 2위 실버 / 3위 브론즈) ─────────────── */
const PODIUM_TONES: Record<1 | 2 | 3, {
  border: string;
  bg: string;
  medalBg: string;
  medalText: string;
  label: string;
}> = {
  1: {
    border: 'border-orange-300 dark:border-orange-800/70',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20',
    medalBg: 'bg-orange-500 dark:bg-orange-400',
    medalText: 'text-white dark:text-zinc-950',
    label: 'text-orange-700 dark:text-orange-300',
  },
  2: {
    border: 'border-zinc-300 dark:border-zinc-700',
    bg: 'bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/60 dark:to-zinc-900',
    medalBg: 'bg-zinc-400 dark:bg-zinc-500',
    medalText: 'text-white',
    label: 'text-zinc-600 dark:text-zinc-400',
  },
  3: {
    border: 'border-amber-200 dark:border-amber-900/60',
    bg: 'bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10',
    medalBg: 'bg-amber-600 dark:bg-amber-500',
    medalText: 'text-white',
    label: 'text-amber-700 dark:text-amber-400',
  },
};
