import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  badge?: string;
  actions?: ReactNode;
}

/**
 * Modern SaaS Analytics 페이지 헤더 (Phase 27).
 *  - 작은 라벨(badge/step) → 큰 sans-serif 타이틀 → 회색 subtitle
 *  - hairline rule·italic·세리프 모두 제거
 *  - 우측 actions slot 유지
 */
export default function PageHeader({ title, subtitle, step, totalSteps, badge, actions }: PageHeaderProps) {
  const hasMeta = (step && totalSteps) || badge;
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {hasMeta ? (
            <div className="flex items-center gap-2 mb-2">
              {step && totalSteps ? (
                <span className="pill pill-accent">STEP {step} / {totalSteps}</span>
              ) : null}
              {badge ? <span className="pill pill-neutral">{badge}</span> : null}
            </div>
          ) : null}

          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
