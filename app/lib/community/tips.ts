export const TIPS_CATEGORIES = [
  '질문', '정보공유', '노하우', '트러블슈팅', '수익후기', '잡담',
] as const;

export type TipsCategory = (typeof TIPS_CATEGORIES)[number];

export function isTipsCategory(value: unknown): value is TipsCategory {
  return typeof value === 'string' && (TIPS_CATEGORIES as readonly string[]).includes(value);
}

export function categoryBadgeClass(cat: string): string {
  switch (cat) {
    case '질문':       return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
    case '정보공유':   return 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300';
    case '노하우':     return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
    case '트러블슈팅': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300';
    case '수익후기':   return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
    default:           return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  }
}
