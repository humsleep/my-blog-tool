'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  /** 활성 매칭 prefix들 — pathname.startsWith() */
  match: string[];
  icon: (active: boolean) => React.ReactNode;
}

/** 좌측 2탭 + 우측 2탭. 가운데는 글쓰기 FAB (Phase 59). */
const NAV: NavItem[] = [
  {
    href: '/',
    label: '홈',
    match: ['/'],
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0v-6h6v6" />
      </svg>
    ),
  },
  {
    href: '/tools',
    label: '도구',
    match: ['/tools', '/trending', '/keyword-analysis', '/competitor-analysis', '/prompt-generator', '/ai-writer', '/editor', '/image-search', '/image-tools'],
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.5a7.5 7.5 0 105.66 12.4l4.22 4.22a1 1 0 001.41-1.41l-4.22-4.22A7.5 7.5 0 0011 3.5z" />
      </svg>
    ),
  },
  {
    href: '/community',
    label: '커뮤니티',
    match: ['/community'],
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3m9-11a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/blog-diagnose',
    label: '진단',
    match: ['/blog-diagnose'],
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // 에디터/작성 페이지는 하단 탭 숨김 (몰입감 향상)
  const HIDE_ON = ['/editor', '/login', '/auth/callback'];
  if (HIDE_ON.some((p) => pathname === p)) return null;

  const isActive = (item: NavItem): boolean => {
    if (item.href === '/') return pathname === '/';
    return item.match.some((m) => pathname === m || pathname.startsWith(m + '/'));
  };

  /** 탭 1개 — Material 3 스타일 "활성 인디케이터 필"(아이콘 뒤 알약) + 탭 시 스케일. */
  const renderTab = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-transform duration-150 active:scale-90 ${
          active ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <span
          className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200 ease-out ${
            active ? 'bg-orange-100 dark:bg-orange-950/60 scale-100' : 'bg-transparent scale-90'
          }`}
        >
          {item.icon(active)}
        </span>
        <span className={`text-[11px] leading-none transition-all ${active ? 'font-semibold' : 'font-medium'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  // /start (빠른 시작) 흐름에 있으면 FAB 활성 톤.
  const writeActive = pathname === '/start' || pathname.startsWith('/start/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 safe-bottom"
      aria-label="하단 네비게이션"
    >
      <div className="relative grid grid-cols-5 max-w-md mx-auto">
        {renderTab(NAV[0])}
        {renderTab(NAV[1])}

        {/* 가운데 글쓰기 FAB — 주요 액션을 엄지 영역에 (Phase 59).
            바 위로 떠올라 시각적 우선순위 ↑. /start(빠른 시작)로 진입. */}
        <div className="flex items-start justify-center pt-1.5">
          <Link
            href="/start"
            aria-label="글쓰기 시작"
            aria-current={writeActive ? 'page' : undefined}
            className={`-mt-5 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg shadow-orange-500/35 ring-4 ring-white dark:ring-zinc-950 transition-transform duration-150 active:scale-90 ${
              writeActive
                ? 'bg-orange-600 dark:bg-orange-500'
                : 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>

        {renderTab(NAV[2])}
        {renderTab(NAV[3])}
      </div>
    </nav>
  );
}
