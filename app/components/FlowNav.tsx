'use client';

import Link from 'next/link';

export interface FlowAction {
  href: string;
  label: string;
  description?: string;
  variant?: 'primary' | 'secondary';
}

interface FlowNavProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  actions: FlowAction[];
  note?: string;
}

const STEP_LABELS = [
  '인기검색어',
  '키워드분석',
  '상위노출 분석',
  '프롬프트 생성',
  '금칙어·맞춤법',
  '이미지 검색',
  '이미지 편집',
];

export default function FlowNav({ currentStep, totalSteps, stepLabel, actions, note }: FlowNavProps) {
  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 sm:p-6">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            STEP {currentStep} / {totalSteps}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stepLabel}
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep
                  ? 'bg-indigo-500 dark:bg-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              title={STEP_LABELS[i]}
            />
          ))}
        </div>
      </div>

      {/* Heading */}
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
        다음 단계로 이동
      </h3>
      {note && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{note}</p>
      )}

      {/* Actions */}
      <div className={`grid gap-3 ${actions.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {actions.map((action, idx) => {
          const isPrimary = action.variant !== 'secondary';
          return (
            <Link
              key={idx}
              href={action.href}
              className={`group flex items-center justify-between gap-3 px-5 py-4 rounded-lg border transition-all ${
                isPrimary
                  ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{action.label}</div>
                {action.description && (
                  <div
                    className={`text-xs mt-0.5 ${
                      isPrimary ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {action.description}
                  </div>
                )}
              </div>
              <svg
                className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
