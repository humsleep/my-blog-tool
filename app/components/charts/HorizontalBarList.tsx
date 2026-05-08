'use client';

import Link from 'next/link';

interface Item {
  /** 표시 라벨 (예: 키워드) */
  label: string;
  /** 막대 길이 산정용 값 */
  value: number;
  /** 우측 표기용 포맷된 값 (예: "12,345") */
  display?: string;
  /** 클릭 시 이동할 href (없으면 정적) */
  href?: string;
  /** 좌측 작은 부가 라벨 (순위 등) */
  rank?: number;
}

interface Props {
  items: Item[];
  /** 막대 색상 컬러 클래스 (기본 emerald) */
  barClassName?: string;
  /** 라벨 + 막대 + 값 한 줄당 높이 (기본 36) */
  rowHeight?: number;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
}

/**
 * 가로 막대 리스트 — 키워드 검색량 비교 / 트렌딩 키워드용.
 * 가장 큰 값을 100% 폭으로 정규화. 클릭 가능한 항목.
 */
export default function HorizontalBarList({
  items,
  barClassName = 'bg-blue-500/80 dark:bg-blue-400/70',
  rowHeight = 36,
  emptyMessage = '표시할 데이터가 없습니다.',
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-3">{emptyMessage}</div>
    );
  }

  const max = Math.max(1, ...items.map((it) => it.value));

  return (
    <ol className="space-y-1.5">
      {items.map((it, i) => {
        const pct = (it.value / max) * 100;
        const inner = (
          <div
            className="relative flex items-center px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-[#1f1f23] transition-colors group"
            style={{ height: rowHeight }}
          >
            {/* Bar background */}
            <div
              className={`absolute inset-y-1 left-2 right-2 rounded-md opacity-30 group-hover:opacity-50 transition-opacity ${barClassName}`}
              style={{ width: `calc((100% - 1rem) * ${pct / 100})` }}
              aria-hidden
            />
            {/* Rank */}
            {it.rank !== undefined && (
              <span className="relative z-10 w-7 text-[11px] tabular text-zinc-400 dark:text-zinc-500 font-semibold">
                {String(it.rank).padStart(2, '0')}
              </span>
            )}
            {/* Label */}
            <span className="relative z-10 flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {it.label}
            </span>
            {/* Value */}
            {it.display && (
              <span className="relative z-10 ml-3 text-xs tabular text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {it.display}
              </span>
            )}
          </div>
        );
        return (
          <li key={`${i}-${it.label}`}>
            {it.href ? (
              <Link href={it.href} className="block">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
