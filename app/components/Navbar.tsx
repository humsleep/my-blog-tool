'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useUser, signOut } from '../lib/supabase/useUser';

interface ToolItem {
  step: number;
  href: string;
  label: string;
  description: string;
}

interface ToolGroup {
  groupLabel: string;
  range: string;
  items: ToolItem[];
}

/** 핵심 도구 — 평면 노출 (가장 자주 쓰는 노드). 블로그 진단을 맨 앞에. */
const CORE_TOOLS: { href: string; label: string }[] = [
  { href: '/blog-diagnose', label: '블로그 진단' },
  { href: '/keyword-analysis', label: '키워드분석' },
  { href: '/ai-writer', label: 'AI 글쓰기' },
  { href: '/editor', label: '에디터' },
];

/** 커뮤니티 — 메뉴 (드롭다운). */
const COMMUNITY_MENU: { href: string; label: string; description: string }[] = [
  { href: '/community/swap',       label: '서이추 해요',     description: '같은 분야 블로거 매칭' },
  { href: '/community/tips',       label: '정보 공유',        description: '운영 노하우·질문 게시판' },
  { href: '/community/companions', label: '체험단 동행해요', description: '체험단 동행자 모집' },
];

/** 8단계 워크플로우 — "모든 도구" 메가패널에 워크플로우 순서로 노출 */
const WORKFLOW: ToolGroup[] = [
  {
    groupLabel: '키워드 리서치',
    range: '1~3',
    items: [
      { step: 1, href: '/trending', label: '인기검색어', description: '네이버 실시간 인기 키워드' },
      { step: 2, href: '/keyword-analysis', label: '키워드분석', description: '검색량·경쟁률 분석' },
      { step: 3, href: '/competitor-analysis', label: '상위노출 분석', description: '상위 블로그 패턴 분석' },
    ],
  },
  {
    groupLabel: '글쓰기',
    range: '4~6',
    items: [
      { step: 4, href: '/prompt-generator', label: '프롬프트 생성', description: '무료 무제한 (AI 호출 없음)' },
      { step: 5, href: '/ai-writer', label: 'AI 글쓰기', description: 'Claude AI 자동 작성' },
      { step: 6, href: '/editor', label: '금칙어·맞춤법', description: '포스팅 에디터' },
    ],
  },
  {
    groupLabel: '이미지',
    range: '7~8',
    items: [
      { step: 7, href: '/image-search', label: '이미지 검색', description: '무료 저작권 이미지' },
      { step: 8, href: '/image-tools', label: '이미지 편집', description: '크롭·모자이크·필터' },
    ],
  },
];

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, configured } = useUser();
  const megaRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const communityCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setCommunityOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 페이지 이동 시 모든 메뉴 닫기
  useEffect(() => {
    setMegaOpen(false);
    setCommunityOpen(false);
    setIsMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const openMega = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMegaOpen(true);
  };

  const scheduleCloseMega = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMegaOpen(false), 150);
  };

  const openCommunity = () => {
    if (communityCloseTimerRef.current) {
      clearTimeout(communityCloseTimerRef.current);
      communityCloseTimerRef.current = null;
    }
    setCommunityOpen(true);
  };

  const scheduleCloseCommunity = () => {
    if (communityCloseTimerRef.current) clearTimeout(communityCloseTimerRef.current);
    communityCloseTimerRef.current = setTimeout(() => setCommunityOpen(false), 150);
  };

  const isCommunityActive = pathname.startsWith('/community');

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = displayName?.charAt(0).toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Wordmark — Pretendard sans-serif (Phase 27) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm leading-none">B</span>
              </div>
              <span className="text-[0.95rem] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Boheme<span className="text-orange-500 dark:text-orange-400 ml-1">BlogLab</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {/* 핵심 도구 평면 — SaaS: pill 호버 + 액티브 시 액센트 배경 */}
            {CORE_TOOLS.map((t) => {
              const isActive = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}

            {/* 모든 도구 — 호버 / 클릭 메가패널 */}
            <div
              className="relative"
              ref={megaRef}
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                type="button"
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                  megaOpen
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                모든 도구
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {megaOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[680px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                  role="menu"
                >
                  <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-700/60">
                    {WORKFLOW.map((group) => (
                      <div key={group.groupLabel} className="p-3">
                        <div className="px-2 mb-2 flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider">
                            STEP {group.range}
                          </span>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            {group.groupLabel}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((it) => {
                            const isActive = pathname === it.href;
                            return (
                              <Link
                                key={it.href}
                                href={it.href}
                                onClick={() => setMegaOpen(false)}
                                className={`block px-2 py-2 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                                }`}
                              >
                                <div className="flex items-baseline gap-1.5">
                                  <span className={`text-[11px] font-bold ${isActive ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    {it.step}
                                  </span>
                                  <span className="font-medium">{it.label}</span>
                                </div>
                                <div className={`text-[11px] mt-0.5 ${isActive ? 'text-orange-500/80 dark:text-orange-400/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                  {it.description}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 커뮤니티 — 호버 / 클릭 드롭다운 */}
            <div
              className="relative"
              ref={communityRef}
              onMouseEnter={openCommunity}
              onMouseLeave={scheduleCloseCommunity}
            >
              <button
                type="button"
                onClick={() => setCommunityOpen((v) => !v)}
                aria-expanded={communityOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isCommunityActive
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                    : communityOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                커뮤니티
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${communityOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {communityOpen && (
                <div
                  className="absolute top-full right-0 mt-1 w-72 bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden p-1.5"
                  role="menu"
                >
                  {COMMUNITY_MENU.map((it) => {
                    const isActive = pathname === it.href || pathname.startsWith(it.href + '/');
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setCommunityOpen(false)}
                        className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <div className="font-medium">{it.label}</div>
                        <div className={`text-[11px] mt-0.5 ${isActive ? 'text-orange-500/80 dark:text-orange-400/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {it.description}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 연구실 */}
            {(() => {
              const isActive = pathname === '/lab' || pathname.startsWith('/lab/');
              return (
                <Link
                  href="/lab"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  연구실
                </Link>
              );
            })()}
          </div>

          {/* Right side: Auth + Dark toggle + Mobile hamburger */}
          <div className="flex items-center gap-2">
            {configured && (
              user ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={28}
                        height={28}
                        className="rounded-full border border-zinc-200 dark:border-zinc-700"
                        unoptimized
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center">
                        {initial}
                      </span>
                    )}
                    <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</div>
                      </div>
                      <Link
                        href="/profile/setup"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700"
                      >
                        프로필 수정
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-orange-500 dark:hover:text-orange-400 rounded-lg transition-colors"
                >
                  로그인
                </Link>
              )
            )}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트모드로 전환' : '다크모드로 전환'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
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
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
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

      {/* Mobile Menu — 8단계 워크플로우 평면 노출 */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 max-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="px-3 py-3 space-y-4">
            {/* Auth on mobile */}
            {configured && (
              user ? (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="rounded-full flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Link
                      href="/profile/setup"
                      onClick={() => setIsMobileOpen(false)}
                      className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline"
                    >
                      프로필
                    </Link>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <button
                      onClick={() => signOut()}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg text-center min-h-[44px] flex items-center justify-center"
                >
                  로그인 · Google
                </Link>
              )
            )}

            {/* 블로그 진단 — 워크플로우와 별개의 메타 도구 (Phase 26: 맨 앞 우선) */}
            <div className="space-y-1">
              <div className="px-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">분석</span>
              </div>
              {(() => {
                const isActive = pathname === '/blog-diagnose' || pathname.startsWith('/blog-diagnose/');
                return (
                  <Link
                    href="/blog-diagnose"
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-start gap-2 px-4 py-2.5 rounded-lg min-h-[44px] ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">블로그 진단</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-orange-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        카테고리 상위 % · 약점 분석
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>

            {WORKFLOW.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                <div className="px-4 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider">
                    STEP {group.range}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {group.groupLabel}
                  </span>
                </div>
                {group.items.map((it) => {
                  const isActive = pathname === it.href;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-start gap-2 px-4 py-2.5 rounded-lg min-h-[44px] ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${isActive ? 'text-orange-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {it.step}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{it.label}</div>
                        <div className={`text-xs mt-0.5 ${isActive ? 'text-orange-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {it.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* 커뮤니티 */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="px-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">커뮤니티</span>
              </div>
              {COMMUNITY_MENU.map((it) => {
                const isActive = pathname === it.href || pathname.startsWith(it.href + '/');
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-start gap-2 px-4 py-2.5 rounded-lg min-h-[44px] ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{it.label}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-orange-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {it.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 연구실 */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <Link
                href="/lab"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ${
                  pathname === '/lab' || pathname.startsWith('/lab/')
                    ? 'bg-orange-500 text-white'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                연구실
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
