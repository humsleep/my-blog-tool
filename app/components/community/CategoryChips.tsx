'use client';

import { CATEGORIES } from '@/app/lib/community/categories';

interface CategoryChipsProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  /** 옵션 앞에 "전체" 칩 추가 (null로 매핑) */
  includeAll?: boolean;
  /** 사용할 카테고리만 노출 */
  options?: readonly string[];
}

export default function CategoryChips({
  selected,
  onSelect,
  includeAll = true,
  options = CATEGORIES,
}: CategoryChipsProps) {
  return (
    <div className="-mx-1 px-1 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,#000_calc(100%_-_28px),transparent)] [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%_-_28px),transparent)]">
      <div className="flex items-center gap-1.5 whitespace-nowrap pb-0.5">
        {includeAll && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={chipClass(selected === null)}
          >
            전체
          </button>
        )}
        {options.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={chipClass(selected === cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

function chipClass(active: boolean) {
  return [
    'flex-shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 text-sm font-medium rounded-full transition-colors',
    'border',
    active
      ? 'bg-orange-500 text-white border-orange-500'
      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
  ].join(' ');
}
