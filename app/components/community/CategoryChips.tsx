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
    <div className="flex flex-wrap gap-1.5">
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
  );
}

function chipClass(active: boolean) {
  return [
    'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
    'border',
    active
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
  ].join(' ');
}
