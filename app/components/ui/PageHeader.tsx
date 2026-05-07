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
 * Editorial Magazine 스타일 페이지 헤더.
 *  - 상단 hairline rule + eyebrow 라벨
 *  - 디스플레이 세리프(IBM Plex Serif + Noto Serif KR) 헤드라인
 *  - subtitle은 본문 폰트, 좁은 max-width로 매거진 인트로 느낌
 */
export default function PageHeader({ title, subtitle, step, totalSteps, badge, actions }: PageHeaderProps) {
  const hasEyebrow = (step && totalSteps) || badge;
  return (
    <header className="mb-10 pt-2">
      {/* 상단 가는 룰 */}
      <hr className="ed-rule mb-5" />

      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          {hasEyebrow ? (
            <div className="ed-eyebrow mb-3">
              {step && totalSteps ? <span>STEP {step} · {totalSteps}</span> : null}
              {step && totalSteps && badge ? <span aria-hidden>—</span> : null}
              {badge ? <span>{badge}</span> : null}
            </div>
          ) : null}

          <h1 className="ed-display text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] tracking-tighter">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 text-[15px] sm:text-base text-ink-muted leading-[1.7] max-w-[58ch]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
