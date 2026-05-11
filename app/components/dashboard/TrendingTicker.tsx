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
 *  TOP 3: 실제 시상대 형태 (2위 왼쪽 · 1위 가운데 가장 크게 · 3위 오른쪽)
 *  4~10위: 1위 검색량 대비 막대 그래프가 함께 보이는 가로 리스트
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

  // 1위 검색량 — 4~10위 막대 그래프의 기준값
  const maxCount = items[0]?.totalCount ?? 0;

  return (
    <section className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
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

      <div className="p-3 sm:p-5">
        {loading ? (
          <Skeleton />
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
            {/* ── TOP 3 — 시상대 (2위 · 1위 · 3위) ───────────────── */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 sm:items-end mb-5">
                {top3.map((it) => (
                  <PodiumCard
                    key={`${it.rank}-${it.keyword}`}
                    item={it}
                    fmt={fmt}
                  />
                ))}
              </div>
            )}

            {/* ── 4~10위 — 검색량 막대 그래프가 있는 리스트 ────── */}
            {rest.length > 0 && (
              <ol className="space-y-1">
                {rest.map((it) => {
                  const ratio = maxCount > 0 ? Math.max(8, (it.totalCount / maxCount) * 100) : 0;
                  return (
                    <li key={`${it.rank}-${it.keyword}`}>
                      <Link
                        href={`/keyword-analysis?keyword=${encodeURIComponent(it.keyword)}`}
                        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-orange-50/70 dark:hover:bg-orange-950/20 transition-colors"
                      >
                        {/* 막대 그래프 — 키워드 아래 깔리는 배경 */}
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-orange-100/70 to-orange-50/40 dark:from-orange-950/40 dark:to-orange-950/10 transition-all"
                          style={{ width: `${ratio}%` }}
                        />
                        <span className="relative w-7 text-center text-sm font-bold tabular-nums text-zinc-400 dark:text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {it.rank}
                        </span>
                        <span className="relative flex-1 min-w-0 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-orange-700 dark:group-hover:text-orange-300">
                          {it.keyword}
                        </span>
                        {it.totalCount > 0 && (
                          <span className="relative text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            월 {fmt.format(it.totalCount)}
                          </span>
                        )}
                        <svg className="relative w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ── TOP 3 시상대 카드 ─────────────────────────────────────────── */
function PodiumCard({ item, fmt }: { item: TrendingItem; fmt: Intl.NumberFormat }) {
  const tone = PODIUM_TONES[item.rank as 1 | 2 | 3] ?? PODIUM_TONES[3];

  /** order: 데스크탑에서 [2위 · 1위 · 3위] 배치 — 모바일은 자연 순서 */
  const orderClass =
    item.rank === 1 ? 'sm:order-2' : item.rank === 2 ? 'sm:order-1' : 'sm:order-3';
  /** 1위만 살짝 키운다 — 진짜 시상대 분위기 */
  const heightClass = item.rank === 1 ? 'sm:py-5' : 'sm:py-4';

  return (
    <Link
      href={`/keyword-analysis?keyword=${encodeURIComponent(item.keyword)}`}
      className={`group relative overflow-hidden rounded-lg border ${tone.border} ${tone.bg} px-4 py-4 ${heightClass} ${orderClass} hover:shadow-md hover:-translate-y-0.5 transition-all`}
    >
      {/* 1위 카드 — 은은한 광채 효과 */}
      {item.rank === 1 && (
        <span
          aria-hidden
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-orange-400/20 dark:bg-orange-300/10 blur-2xl"
        />
      )}

      {/* 상단: 메달 + 라벨 */}
      <div className="relative flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center justify-center ${
            item.rank === 1 ? 'w-12 h-12' : 'w-10 h-10'
          } rounded-full ${tone.medalBg} ${tone.medalRing} shadow-md`}
          aria-label={`${item.rank}위`}
        >
          <MedalIcon rank={item.rank} />
        </span>
        <span className={`text-[10px] font-bold tracking-[0.14em] uppercase ${tone.label}`}>
          {item.rank === 1 ? 'GOLD' : item.rank === 2 ? 'SILVER' : 'BRONZE'}
        </span>
      </div>

      {/* 키워드 + 검색량 */}
      <div className="relative">
        <div
          className={`${
            item.rank === 1 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
          } font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors leading-snug`}
        >
          {item.keyword}
        </div>
        {item.totalCount > 0 && (
          <div className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            월 {fmt.format(item.totalCount)} 검색
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── 메달 아이콘 (트로피/메달 SVG) ─────────────────────────────── */
function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    // 1위: 왕관
    return (
      <svg className="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 16h14l1.5-9-5 3.5L12 4 8.5 10.5 3.5 7 5 16zm0 2h14v2H5v-2z" />
      </svg>
    );
  }
  // 2·3위: 메달 (별)
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
    </svg>
  );
}

/* ── 로딩 스켈레톤 ─────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-end">
        <div className="h-24 sm:h-[104px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse sm:order-1" />
        <div className="h-28 sm:h-[120px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse sm:order-2" />
        <div className="h-24 sm:h-[104px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse sm:order-3" />
      </div>
      <div className="space-y-1.5 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ── 포디움 톤 (1위 골드 / 2위 실버 / 3위 브론즈) ─────────────── */
const PODIUM_TONES: Record<1 | 2 | 3, {
  border: string;
  bg: string;
  medalBg: string;
  medalRing: string;
  label: string;
}> = {
  1: {
    border: 'border-orange-300 dark:border-orange-700/70',
    bg: 'bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 dark:from-orange-950/50 dark:via-amber-950/30 dark:to-orange-950/20',
    medalBg: 'bg-gradient-to-br from-orange-400 to-amber-500 dark:from-orange-400 dark:to-amber-500',
    medalRing: 'ring-2 ring-orange-200/80 dark:ring-orange-800/50',
    label: 'text-orange-700 dark:text-orange-300',
  },
  2: {
    border: 'border-zinc-300 dark:border-zinc-700',
    bg: 'bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800/70 dark:to-zinc-900',
    medalBg: 'bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-400 dark:to-zinc-500',
    medalRing: 'ring-2 ring-zinc-200/80 dark:ring-zinc-700/50',
    label: 'text-zinc-600 dark:text-zinc-400',
  },
  3: {
    border: 'border-amber-200 dark:border-amber-900/60',
    bg: 'bg-gradient-to-br from-amber-100/80 via-orange-50/60 to-amber-50/40 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/10',
    medalBg: 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-500 dark:to-orange-600',
    medalRing: 'ring-2 ring-amber-200/70 dark:ring-amber-800/50',
    label: 'text-amber-700 dark:text-amber-400',
  },
};
