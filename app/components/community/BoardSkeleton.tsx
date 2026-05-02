/** 게시판 행 리스트용 스켈레톤 — N행 렌더링 */
export default function BoardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="hidden md:block px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 h-9" />
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="px-4 sm:px-5 py-3 flex items-center gap-3">
            <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-700/60 animate-pulse" />
            </div>
            <div className="hidden md:block h-3 w-16 rounded bg-slate-100 dark:bg-slate-700/60 animate-pulse flex-shrink-0" />
            <div className="hidden md:block h-3 w-12 rounded bg-slate-100 dark:bg-slate-700/60 animate-pulse flex-shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
