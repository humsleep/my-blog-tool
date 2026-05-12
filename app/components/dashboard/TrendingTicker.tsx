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
 * 데일리 대시보드 — 인기 키워드 랭킹 보드 (Phase 38 재디자인).
 *
 *  포디움(시상대) 비유 제거. 1~10위를 동일한 행 디자인으로 통일하되
 *  1·2·3위만 메달 색 + 진한 배경으로 강조 → 정보 위계가 명확하고
 *  스캔/비교가 빠른 "리더보드" 스타일.
 *
 *  각 행:
 *   [순위 배지 + 메달 아이콘 / 번호] [키워드 (검색량 비율 막대 배경)] [월 검색량]
 *
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

  const fmt = Intl.NumberFormat('ko-KR');
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

      <div className="p-2 sm:p-3">
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-3 py-4">
            인기 검색어를 불러오지 못했어요. {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-3 py-4">
            지금은 가져올 키워드가 없어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : (
          <ol className="space-y-1">
            {items.slice(0, 10).map((it) => (
              <RankRow key={`${it.rank}-${it.keyword}`} item={it} maxCount={maxCount} fmt={fmt} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ── 랭킹 행 ──────────────────────────────────────────────────── */
function RankRow({
  item,
  maxCount,
  fmt,
}: {
  item: TrendingItem;
  maxCount: number;
  fmt: Intl.NumberFormat;
}) {
  const isTop3 = item.rank <= 3;
  const tone = isTop3 ? MEDAL_TONES[item.rank as 1 | 2 | 3] : null;
  const ratio = maxCount > 0 ? Math.max(6, (item.totalCount / maxCount) * 100) : 0;

  return (
    <li>
      <Link
        href={`/keyword-analysis?keyword=${encodeURIComponent(item.keyword)}`}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
          isTop3
            ? `${tone!.rowBorder} ${tone!.rowBg}`
            : 'border-transparent hover:bg-orange-50/60 dark:hover:bg-orange-950/20'
        }`}
      >
        {/* 검색량 비율 막대 — 행 배경에 깔리는 옅은 색 */}
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 rounded-md transition-all ${
            isTop3
              ? `${tone!.barFill} opacity-60`
              : 'bg-gradient-to-r from-orange-100/50 to-transparent dark:from-orange-950/30 dark:to-transparent'
          }`}
          style={{ width: `calc(${ratio}% - 8px)` }}
        />

        {/* 순위 배지 */}
        <span
          className={`relative flex items-center justify-center flex-shrink-0 ${
            isTop3
              ? `w-8 h-8 rounded-full ${tone!.medalBg} ${tone!.medalRing} shadow-sm`
              : 'w-8 h-8 rounded-md text-xs font-bold tabular-nums text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500'
          }`}
          aria-label={`${item.rank}위`}
        >
          {isTop3 ? <MedalIcon rank={item.rank} /> : item.rank}
        </span>

        {/* 키워드 */}
        <span
          className={`relative flex-1 min-w-0 truncate ${
            isTop3
              ? 'text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50'
              : 'text-sm font-medium text-zinc-800 dark:text-zinc-200'
          } group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors`}
        >
          {item.keyword}
        </span>

        {/* 월 검색량 */}
        {item.totalCount > 0 && (
          <span className="relative text-[11px] sm:text-xs tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1">
            <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            월 {fmt.format(item.totalCount)}
          </span>
        )}

        {/* 화살표 */}
        <svg
          className="relative w-3.5 h-3.5 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </li>
  );
}

/* ── 메달 아이콘 (1·2·3위 전용) ───────────────────────────────── */
function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M5 16h14l1.5-9-5 3.5L12 4 8.5 10.5 3.5 7 5 16zm0 2h14v2H5v-2z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
    </svg>
  );
}

/* ── 로딩 스켈레톤 — 10행 ──────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
        />
      ))}
    </div>
  );
}

/* ── 메달 톤 (1·2·3위만 사용) ──────────────────────────────────
 *  rowBg/rowBorder: 행 전체 배경·테두리 (강조)
 *  barFill: 검색량 막대 배경색
 *  medalBg/medalRing: 메달 배지
 */
const MEDAL_TONES: Record<1 | 2 | 3, {
  rowBg: string;
  rowBorder: string;
  barFill: string;
  medalBg: string;
  medalRing: string;
}> = {
  1: {
    rowBg: 'bg-gradient-to-r from-orange-50 via-amber-50/70 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 dark:to-transparent',
    rowBorder: 'border-orange-200 dark:border-orange-900/60',
    barFill: 'bg-gradient-to-r from-orange-200/70 to-orange-100/30 dark:from-orange-900/40 dark:to-orange-950/10',
    medalBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    medalRing: 'ring-2 ring-orange-200/80 dark:ring-orange-800/60',
  },
  2: {
    rowBg: 'bg-gradient-to-r from-zinc-100 to-transparent dark:from-zinc-800/60 dark:to-transparent',
    rowBorder: 'border-zinc-200 dark:border-zinc-700',
    barFill: 'bg-gradient-to-r from-zinc-200/70 to-transparent dark:from-zinc-700/40 dark:to-transparent',
    medalBg: 'bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-400 dark:to-zinc-500',
    medalRing: 'ring-2 ring-zinc-200/80 dark:ring-zinc-700/60',
  },
  3: {
    rowBg: 'bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-950/30 dark:to-transparent',
    rowBorder: 'border-amber-200/80 dark:border-amber-900/50',
    barFill: 'bg-gradient-to-r from-amber-200/60 to-transparent dark:from-amber-900/30 dark:to-transparent',
    medalBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    medalRing: 'ring-2 ring-amber-200/70 dark:ring-amber-800/50',
  },
};
