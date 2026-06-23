'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * 모바일 전용 컨텍스트 상단 바 (Phase 60).
 *  - 앱처럼 서브페이지에 "뒤로 + 제목"을 sticky 로 제공.
 *  - 전역 Navbar(h-14) 바로 아래(top-14)에 붙는다. sm 이상에선 숨김(데스크탑은 breadcrumb 사용).
 *  - backHref 주면 Link, 없으면 router.back().
 *  - 부모 컨테이너의 좌우 px-4 패딩을 -mx-4 로 상쇄해 가로 풀블리드.
 */
export default function MobileSubHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  const router = useRouter();

  const BackIcon = (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );

  return (
    <div className="sm:hidden sticky top-14 z-30 -mx-4 mb-3 h-12 flex items-center gap-1 px-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-700 dark:text-zinc-200 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
        >
          {BackIcon}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-700 dark:text-zinc-200 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
        >
          {BackIcon}
        </button>
      )}
      <span className="min-w-0 truncate font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
    </div>
  );
}
