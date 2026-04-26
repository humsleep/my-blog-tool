import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  badge?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, step, totalSteps, badge, actions }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {(step && totalSteps) || badge ? (
            <div className="flex items-center gap-2 mb-2">
              {step && totalSteps ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                  STEP {step} / {totalSteps}
                </span>
              ) : null}
              {badge ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                  {badge}
                </span>
              ) : null}
            </div>
          ) : null}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
