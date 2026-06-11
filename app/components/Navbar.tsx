'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useUser, signOut } from '../lib/supabase/useUser';

interface ToolItem {
  href: string;
  label: string;
  description: string;
}

interface ToolGroup {
  groupLabel: string;
  range?: string;
  items: ToolItem[];
}

/** 글쓰기 — 드롭다운. P2 마법사 4단계 진입로 + /start 빠른 시작. */
const WRITING_MENU: ToolItem[] = [
  { href: '/start',             label: '빠른 시작',    description: '키워드 한 단어로 1분 만에' },
  { href: '/keyword-analysis',  label: '키워드부터',   description: '검색량·경쟁률 분석 후 시작' },
  { href: '/ai-writer',         label: 'AI 글쓰기',    description: 'AI 가 자동으로 초안 작성' },
  { href: '/editor',            label: '에디터 (발행)', description: '금칙어·맞춤법 마지막 점검' },
];

/** 커뮤니티 — 드롭다운. */
const COMMUNITY_MENU: ToolItem[] = [
  { href: '/community/swap',       label: '서이추 해요',     description: '같은 분야 블로거 매칭' },
  { href: '/community/tips',       label: '정보 공유',        description: '운영 노하우·질문 게시판' },
  { href: '/community/companions', label: '체험단 동행해요', description: '체험단 동행자 모집' },
];

/** 더보기 — 메가패널. 고급 도구 + 보조 + 연구실. 글쓰기 4단계와 진단은 메인 메뉴에 있어 제외. */
const MORE_MENU: ToolGroup[] = [
  {
    groupLabel: '키워드 리서치',
    items: [
      { href: '/competitor-analysis',  label: '상위노출 분석',  description: '상위 블로그 패턴 분석' },
    ],
  },
  {
    groupLabel: '글쓰기 보조',
    items: [
      { href: '/prompt-generator',     label: '프롬프트 생성',  description: '무료 무제한 (AI 호출 없음)' },
    ],
  },
  {
    groupLabel: '이미지 · 기타',
    items: [
      { href: '/image-search',         label: '이미지 검색',    description: '무료 저작권 이미지' },
      { href: '/image-tools',          label: '이미지 편집',    description: '크롭·모자이크·필터' },
      { href: '/lab',                  label: '연구실',         description: '에디토리얼 가이드·실험' },
    ],
  },
];

/** 활성 강조 — 드롭다운 안 어느 항목에 들어와 있으면 부모 메뉴를 활성 톤으로. */
const WRITING_PATHS = WRITING_MENU.map((m) => m.href);
const MORE_PATHS = MORE_MENU.flatMap((g) => g.items.map((it) => it.href));

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [writingOpen, setWritingOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, configured } = useUser();
  const writingRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const writingCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const communityCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (writingRef.current && !writingRef.current.contains(e.target as Node)) {
        setWritingOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
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
    setWritingOpen(false);
    setMoreOpen(false);
    setCommunityOpen(false);
    setIsMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  /** 150ms 호버 종료 시 닫기 — 마우스가 잠깐 벗어나도 안 닫히게. */
  const makeOpen = (
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    setOpen: (v: boolean) => void,
  ) => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(true);
  };
  const makeScheduleClose = (
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    setOpen: (v: boolean) => void,
  ) => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const openWriting = makeOpen(writingCloseTimerRef, setWritingOpen);
  const scheduleCloseWriting = makeScheduleClose(writingCloseTimerRef, setWritingOpen);
  const openMore = makeOpen(moreCloseTimerRef, setMoreOpen);
  const scheduleCloseMore = makeScheduleClose(moreCloseTimerRef, setMoreOpen);
  const openCommunity = makeOpen(communityCloseTimerRef, setCommunityOpen);
  const scheduleCloseCommunity = makeScheduleClose(communityCloseTimerRef, setCommunityOpen);

  const isDiagnoseActive = pathname === '/blog-diagnose' || pathname.startsWith('/blog-diagnose/');
  const isTrendingActive = pathname === '/trending' || pathname.startsWith('/trending/');
  const isCommunityActive = pathname.startsWith('/community');
  const isWritingActive = WRITING_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isMoreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

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

          {/* Desktop Menu — Phase 48 P3: 4개 슬롯 (글쓰기 / 진단 / 커뮤니티 / 더보기).
              Phase 52: 간격 gap-1 → gap-2 / lg:gap-3 + 메뉴 항목 px-3 → px-4 로 보기 좋게. */}
          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            {/* 글쓰기 ▼ — 드롭다운 (P2 마법사 4단계 진입로 + /start) */}
            <div
              className="relative"
              ref={writingRef}
              onMouseEnter={openWriting}
              onMouseLeave={scheduleCloseWriting}
            >
              <button
                type="button"
                onClick={() => setWritingOpen((v) => !v)}
                aria-expanded={writingOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isWritingActive
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                    : writingOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                글쓰기
                <svg className={`w-3.5 h-3.5 transition-transform ${writingOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {writingOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden p-1.5"
                  role="menu"
                >
                  {WRITING_MENU.map((it) => {
                    const isActive = pathname === it.href || pathname.startsWith(it.href + '/');
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setWritingOpen(false)}
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

            {/* 진단 — 평면 단일 메뉴 (차별화 포인트, 클릭률 높임) */}
            <Link
              href="/blog-diagnose"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDiagnoseActive
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              진단
            </Link>

            {/* 인기검색어 — 평면 단일 메뉴 (Phase 52: 더보기 메가패널에서 상단으로 승격, 발견성 ↑) */}
            <Link
              href="/trending"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isTrendingActive
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              인기검색어
            </Link>

            {/* 커뮤니티 ▼ — 호버 / 클릭 드롭다운 */}
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
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCommunityActive
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                    : communityOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                커뮤니티
                <svg className={`w-3.5 h-3.5 transition-transform ${communityOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {communityOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden p-1.5"
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

            {/* 더보기 ▼ — 메가패널. 고급 도구 + 보조 + 연구실 */}
            <div
              className="relative"
              ref={moreRef}
              onMouseEnter={openMore}
              onMouseLeave={scheduleCloseMore}
            >
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMoreActive
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                    : moreOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                더보기
                <svg className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreOpen && (
                <div
                  className="absolute top-full right-0 mt-1 w-[680px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                  role="menu"
                >
                  <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-700/60">
                    {MORE_MENU.map((group) => (
                      <div key={group.groupLabel} className="p-3">
                        <div className="px-2 mb-2">
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {group.groupLabel}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((it) => {
                            const isActive = pathname === it.href || pathname.startsWith(it.href + '/');
                            return (
                              <Link
                                key={it.href}
                                href={it.href}
                                onClick={() => setMoreOpen(false)}
                                className={`block px-2 py-2 rounded-lg text-sm transition-colors ${
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
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
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              aria-label={isMobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileOpen}
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
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 max-h-[calc(100vh-56px-64px)] overflow-y-auto">
          <div className="px-3 py-3 pb-6 space-y-4">
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
              {(() => {
                const isActive = pathname === '/trending' || pathname.startsWith('/trending/');
                return (
                  <Link
                    href="/trending"
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-start gap-2 px-4 py-2.5 rounded-lg min-h-[44px] ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">인기검색어</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-orange-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        네이버 실시간 인기 키워드
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>

            {/* 글쓰기 — P2 마법사 진입로 4개. 데스크탑 "글쓰기 ▼" 와 정합. */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="px-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">글쓰기</span>
              </div>
              {WRITING_MENU.map((it) => {
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

            {/* 더보기 — 고급 도구 + 보조 + 연구실. 데스크탑 "더보기 ▼" 와 정합. */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
              <div className="px-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">더보기</span>
              </div>
              {MORE_MENU.map((group) => (
                <div key={group.groupLabel} className="space-y-1">
                  <div className="px-4">
                    <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {group.groupLabel}
                    </span>
                  </div>
                  {group.items.map((it) => {
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
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
