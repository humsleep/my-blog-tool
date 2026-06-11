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
    match: ['/tools', '/trending', '/keyword-analysis', '/competitor-analysis', '/prompt-generator', '/ai-writer', '/editor', '/image-search', '/image-tools', '/start'],
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

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 safe-bottom"
      aria-label="하단 네비게이션"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                active
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon(active)}
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
