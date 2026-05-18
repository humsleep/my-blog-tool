'use client';

import Link from 'next/link';

/**
 * 글쓰기 마법사 — 4단계 sticky step bar.
 *
 * P2 UX 재정비 — Phase 48.
 *  키워드분석 → 프롬프트 → AI 글쓰기 → 에디터 를 시각적으로 하나의 흐름으로.
 *  4페이지(/keyword-analysis, /prompt-generator, /ai-writer, /editor) 상단에
 *  공통 삽입. 페이지 자체는 독립 유지 (라우트·로직 변경 없음).
 *
 *  - 데스크탑: 한 줄에 4개 dot + 라벨, 현재 단계 강조.
 *  - 모바일: 동일 한 줄, 라벨은 현재 단계만 표시.
 *  - 모든 단계는 항상 클릭 가능 (자유 이동). sessionStorage 핸드오프가 있으면
 *    자연스럽게 진행, 없으면 빈 상태로 새로 시작.
 *  - sticky top: navbar(56px) 아래에 고정.
 */
interface Step {
  href: string;
  label: string;
}

const WRITING_STEPS: Step[] = [
  { href: '/keyword-analysis', label: '키워드분석' },
  { href: '/prompt-generator', label: '프롬프트' },
  { href: '/ai-writer',        label: 'AI 글쓰기' },
  { href: '/editor',           label: '에디터' },
];

interface Props {
  /** 현재 단계 1~4. */
  current: 1 | 2 | 3 | 4;
}

export default function WizardStepBar({ current }: Props) {
  return (
    <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="글쓰기 마법사 진행">
        <span className="text-[10px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400 whitespace-nowrap">
          글쓰기 {current}/4
        </span>
        <ol className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {WRITING_STEPS.map((s, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4;
            const isCurrent = stepNum === current;
            const isDone = stepNum < current;
            return (
              <li key={s.href} className="flex items-center gap-1 sm:gap-2 min-w-0">
                <Link
                  href={s.href}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`group flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                      : isDone
                      ? 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold tabular-nums ${
                      isCurrent
                        ? 'bg-orange-500 text-white'
                        : isDone
                        ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                    aria-hidden
                  >
                    {isDone ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                      isCurrent ? 'inline' : 'hidden sm:inline'
                    }`}
                  >
                    {s.label}
                  </span>
                </Link>
                {i < WRITING_STEPS.length - 1 && (
                  <span
                    className={`hidden sm:inline-block w-4 h-px ${
                      isDone ? 'bg-orange-300 dark:bg-orange-700' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
