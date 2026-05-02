import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** 미니 일러스트 변종 — 'swap' | 'tips' | 'companions' | undefined(generic) */
  variant?: 'swap' | 'tips' | 'companions';
  /** 작은 도움말 / 가이드 항목 */
  hints?: string[];
}

export default function EmptyState({ icon, title, description, action, variant, hints }: EmptyStateProps) {
  const illustration = icon ?? <DefaultIllustration variant={variant} />;
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10 text-center">
      <div className="mx-auto mb-4 flex justify-center">{illustration}</div>
      <p className="text-slate-700 dark:text-slate-200 font-semibold text-base">{title}</p>
      {description && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{description}</p>}
      {hints && hints.length > 0 && (
        <ul className="mt-4 inline-flex flex-col gap-1 text-left">
          {hints.map((h) => (
            <li key={h} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-orange-500 flex-shrink-0">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function DefaultIllustration({ variant }: { variant?: 'swap' | 'tips' | 'companions' }) {
  // 부드러운 그라데이션 배경 + 이모지 — 가벼운 일러스트 효과
  const map: Record<string, { emoji: string; gradient: string }> = {
    swap:       { emoji: '🤝', gradient: 'from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40' },
    tips:       { emoji: '💡', gradient: 'from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40' },
    companions: { emoji: '🚶‍♂️', gradient: 'from-rose-100 to-orange-100 dark:from-rose-950/40 dark:to-orange-950/40' },
  };
  const cfg = (variant && map[variant]) || { emoji: '✨', gradient: 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800' };

  return (
    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-4xl shadow-sm`}>
      {cfg.emoji}
    </div>
  );
}
