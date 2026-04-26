'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useUser, signOut } from '../lib/supabase/useUser';

interface MenuChild {
  href: string;
  label: string;
  description?: string;
}

interface MenuGroup {
  label: string;
  children: MenuChild[];
}

interface MenuLink {
  href: string;
  label: string;
}

type MenuItem = MenuGroup | MenuLink;

const MENU: MenuItem[] = [
  {
    label: '키워드 리서치',
    children: [
      { href: '/trending', label: '인기검색어', description: '네이버 실시간 인기 키워드' },
      { href: '/keyword-analysis', label: '키워드분석', description: '검색량·경쟁률 분석' },
      { href: '/competitor-analysis', label: '상위노출 분석', description: '상위 블로그 포스트 분석' },
    ],
  },
  {
    label: '글쓰기',
    children: [
      { href: '/prompt-generator', label: '프롬프트 생성', description: '무료 무제한 (AI 호출 없음)' },
      { href: '/ai-writer', label: 'AI 글쓰기', description: 'Claude AI 자동 작성' },
      { href: '/editor', label: '금칙어·맞춤법', description: '포스팅 에디터' },
    ],
  },
  {
    label: '이미지',
    children: [
      { href: '/image-search', label: '이미지 검색', description: '무료 저작권 이미지' },
      { href: '/image-tools', label: '이미지 편집', description: '크롭·모자이크·필터' },
    ],
  },
  { href: '/lab', label: '연구실' },
];

function isGroup(item: MenuItem): item is MenuGroup {
  return 'children' in item;
}

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, configured } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown((prev) => (prev === null ? prev : null));
    setIsMobileOpen((prev) => (prev ? false : prev));
    setUserMenuOpen((prev) => (prev ? false : prev));
  }, [pathname]);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = displayName?.charAt(0).toUpperCase() || '?';

  const isChildActive = (group: MenuGroup) =>
    group.children.some((c) => c.href === pathname);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-indigo-200 dark:group-hover:shadow-indigo-900 transition-shadow">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Boheme <span className="text-indigo-600 dark:text-indigo-400">BlogLab</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:gap-1" ref={dropdownRef}>
            {MENU.map((item) => {
              if (!isGroup(item)) {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              const isOpen = openDropdown === item.label;
              const groupActive = isChildActive(item);

              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                      groupActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`block px-4 py-3 text-sm transition-colors ${
                              isActive
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="font-medium">{child.label}</div>
                            {child.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {child.description}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side: Auth + Dark toggle + Mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Auth */}
            {configured && (
              user ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                        {initial}
                      </span>
                    )}
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{displayName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                >
                  로그인
                </Link>
              )
            )}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트모드로 전환' : '다크모드로 전환'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="메뉴 열기"
            >
              {!isMobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="px-3 py-3 space-y-3">
            {/* Auth on mobile */}
            {configured && (
              user ? (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg text-center min-h-[44px] flex items-center justify-center"
                >
                  로그인 · Google
                </Link>
              )
            )}

            {MENU.map((item) => {
              if (!isGroup(item)) {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div key={item.label} className="space-y-1">
                  <div className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {item.label}
                  </div>
                  {item.children.map((child) => {
                    const isActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex flex-col px-4 py-2.5 rounded-lg min-h-[44px] ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm font-medium">{child.label}</span>
                        {child.description && (
                          <span className={`text-xs mt-0.5 ${
                            isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {child.description}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
