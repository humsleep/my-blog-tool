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
 * 데일리 대시보드 — 인기 키워드 랭킹 보드 (Phase 49 재디자인).
 *
 *  각 행을 3-컬럼 grid 로 명확화:
 *    [01~10 순위 박스]  [키워드 + 검색량 비율 progress bar]  [월 검색량 큰 숫자]
 *
 *  1·2·3위는 강한 색 배지 + 행 배경 그라데이션으로 시각 우세 부여.
 *  4~10위도 동일한 박스 배지(회색)로 1~10위가 한눈에 비교됨.
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
  /** 모바일에서 자릿수가 많을 때 짧게 표시 — 12,345 → 12K, 1,234,567 → 1.2M */
  const fmtCompact = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return fmt.format(n);
  };
  const maxCount = items[0]?.totalCount ?? 0;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <header className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400">
            {label}
          </span>
          <h3 className="mt-1 text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {category === '전체' ? '실시간 인기 검색어 TOP 10' : `${category} 분야 인기 키워드 TOP 10`}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle ?? '클릭하면 검색량·경쟁률을 바로 볼 수 있어요.'}
          </p>
        </div>
        <Link
          href="/trending"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap flex-shrink-0 mt-1"
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
          <ol className="space-y-1.5">
            {items.slice(0, 10).map((it) => (
              <RankRow key={`${it.rank}-${it.keyword}`} item={it} maxCount={maxCount} fmt={fmt} fmtCompact={fmtCompact} />
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
  fmtCompact,
}: {
  item: TrendingItem;
  maxCount: number;
  fmt: Intl.NumberFormat;
  fmtCompact: (n: number) => string;
}) {
  const isTop3 = item.rank <= 3;
  const tone = isTop3 ? MEDAL_TONES[item.rank as 1 | 2 | 3] : null;
  const ratio = maxCount > 0 ? (item.totalCount / maxCount) * 100 : 0;

  return (
    <li>
      <Link
        href={`/keyword-analysis?keyword=${encodeURIComponent(item.keyword)}`}
        className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-lg border transition-all hover:-translate-y-px hover:shadow-sm ${
          isTop3
            ? `${tone!.rowBorder} ${tone!.rowBg}`
            : 'border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:border-orange-200 dark:hover:border-orange-900/40 hover:bg-orange-50/30 dark:hover:bg-orange-950/10'
        }`}
      >
        {/* 순위 박스 — 01~10 모두 같은 형태. 1·2·3위는 강한 색, 4~10위는 회색. */}
        <span
          className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg shadow-sm ${
            isTop3
              ? `${tone!.rankBg} text-white`
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-orange-100 group-hover:text-orange-600 dark:group-hover:bg-orange-950/50 dark:group-hover:text-orange-400'
          } transition-colors`}
          aria-label={`${item.rank}위`}
        >
          <span className="text-base sm:text-lg font-extrabold tabular-nums leading-none">
            {String(item.rank).padStart(2, '0')}
          </span>
        </span>

        {/* 키워드 + 검색량 비율 progress bar */}
        <div className="min-w-0">
          <div
            className={`truncate transition-colors ${
              isTop3
                ? 'text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50'
                : 'text-sm sm:text-[15px] font-semibold text-zinc-800 dark:text-zinc-100'
            } group-hover:text-orange-700 dark:group-hover:text-orange-300`}
          >
            {item.keyword}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isTop3
                  ? tone!.barFill
                  : 'bg-gradient-to-r from-orange-300 to-orange-400 dark:from-orange-700 dark:to-orange-500'
              }`}
              style={{ width: `${Math.max(4, ratio)}%` }}
              aria-hidden
            />
          </div>
        </div>

        {/* 월 검색량 — 큰 굵은 숫자 + 작은 "월 검색" 라벨 */}
        {item.totalCount > 0 ? (
          <div
            className="flex-shrink-0 text-right pl-1"
            title={`월 ${fmt.format(item.totalCount)}회 검색`}
          >
            <div
              className={`text-base sm:text-lg font-bold tabular-nums leading-tight ${
                isTop3
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400'
              } transition-colors`}
            >
              <span className="sm:hidden">{fmtCompact(item.totalCount)}</span>
              <span className="hidden sm:inline">{fmt.format(item.totalCount)}</span>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
              월 검색
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
            —
          </div>
        )}
      </Link>
    </li>
  );
}

/* ── 로딩 스켈레톤 — 10행 ──────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[58px] sm:h-[64px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
        />
      ))}
    </div>
  );
}

/* ── 메달 톤 (1·2·3위 강조) ──────────────────────────────────────
 *  rankBg: 순위 박스 배경 (강한 색)
 *  barFill: 검색량 비율 막대 색
 *  rowBg / rowBorder: 행 전체 배경 그라데이션
 */
const MEDAL_TONES: Record<1 | 2 | 3, {
  rankBg: string;
  barFill: string;
  rowBg: string;
  rowBorder: string;
}> = {
  1: {
    rankBg: 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30',
    barFill: 'bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400',
    rowBg: 'bg-gradient-to-r from-orange-50 via-amber-50/60 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 dark:to-transparent',
    rowBorder: 'border-orange-200 dark:border-orange-900/60',
  },
  2: {
    rankBg: 'bg-gradient-to-br from-zinc-400 to-zinc-500 dark:from-zinc-300 dark:to-zinc-400 shadow-zinc-400/20',
    barFill: 'bg-gradient-to-r from-zinc-400 to-zinc-500 dark:from-zinc-300 dark:to-zinc-400',
    rowBg: 'bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-800/40 dark:to-transparent',
    rowBorder: 'border-zinc-200 dark:border-zinc-700',
  },
  3: {
    rankBg: 'bg-gradient-to-br from-amber-700 to-orange-800 dark:from-amber-600 dark:to-orange-700 shadow-amber-700/20',
    barFill: 'bg-gradient-to-r from-amber-600 to-orange-700 dark:from-amber-500 dark:to-orange-600',
    rowBg: 'bg-gradient-to-r from-amber-50/70 to-transparent dark:from-amber-950/25 dark:to-transparent',
    rowBorder: 'border-amber-200/80 dark:border-amber-900/50',
  },
};
