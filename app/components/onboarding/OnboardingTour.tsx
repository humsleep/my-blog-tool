'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/app/lib/supabase/useUser';
import { useBodyScrollLock } from '@/app/lib/useBodyScrollLock';

/**
 * 첫 진입 온보딩 투어 — 3슬라이드.
 *
 * P4 UX 재정비 — Phase 48.
 *  비로그인 첫 방문자에게 사이트 가치를 3장으로 안내 후 P1 의도 카드 /
 *  P2 마법사로 자연 진입.
 *
 *  표시 조건:
 *    - 비로그인 사용자만 (user === null)
 *    - sessionStorage 'onboardingSeen' 없음
 *    - 홈(/)에서만 (호출 위치로 보장)
 *    - mount 후에 결정 → SSR/CSR hydration 불일치 방지
 *
 *  닫기:
 *    - X 버튼 / 백드롭 클릭 / ESC / "건너뛰기" 링크
 *    - 마지막 슬라이드 CTA 클릭 시 자동 dismiss
 *    - 한 번 닫으면 sessionStorage 에 기록 → 같은 세션에서 안 보임
 */

interface Slide {
  emoji: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  accent: string;   // 배경 그라데이션 tailwind 클래스
  accentDark: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🩺',
    eyebrow: 'STEP 1 · 진단',
    title: '내 블로그의 위치, 30초면 알아요',
    body: '내가 실제로 쓴 글이 검색 상위에 뜨는지로 1페이지 진입율을 측정해 활동성·노출·품질 3축 점수와 30일 액션 플랜을 만들어드려요.',
    cta: { label: '진단 받아보기', href: '/blog-diagnose' },
    accent: 'from-orange-50 via-amber-50/60 to-white',
    accentDark: 'dark:from-orange-950/40 dark:via-amber-950/20 dark:to-zinc-900',
  },
  {
    emoji: '📝',
    eyebrow: 'STEP 2 · 글쓰기',
    title: '데이터로 글을 씁니다',
    body: '키워드 검색량·경쟁률을 한 표에 펼치고, AI 가 네이버 톤으로 초안을 만들고, 에디터에서 발행 전 마지막 점검까지 — 한 흐름.',
    cta: { label: '글쓰기 시작', href: '/start' },
    accent: 'from-amber-50 via-orange-50/60 to-white',
    accentDark: 'dark:from-amber-950/40 dark:via-orange-950/20 dark:to-zinc-900',
  },
  {
    emoji: '👥',
    eyebrow: 'STEP 3 · 커뮤니티',
    title: '같은 분야 블로거와 만나요',
    body: '서이추로 이웃을 늘리고, 정보 공유로 노하우를 주고받고, 체험단 동행자를 찾아 함께 가요.',
    cta: { label: '둘러보기', href: '/community' },
    accent: 'from-orange-50/80 via-white to-amber-50/40',
    accentDark: 'dark:from-orange-950/30 dark:via-zinc-900 dark:to-amber-950/15',
  },
];

const STORAGE_KEY = 'onboardingSeen';

export default function OnboardingTour() {
  const { user, loading: userLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // mount 후에만 sessionStorage 검사 — hydration mismatch 방지
  useEffect(() => {
    if (userLoading) return;
    if (user) return; // 로그인 사용자는 안 보임
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }
    setOpen(true);
  }, [user, userLoading]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // private 모드 등 — 같은 세션 내 메모리 dismiss
    }
  }, []);

  // ESC 닫기 + 좌우 화살표 네비
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  useBodyScrollLock(open);

  if (!open) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const isFirst = index === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 sm:px-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" aria-hidden />
        </div>

        {/* 상단 — 건너뛰기 */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
            처음이신가요?
          </span>
          <button
            type="button"
            onClick={close}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 -mr-2"
          >
            건너뛰기
          </button>
        </div>

        {/* 슬라이드 컨텐츠 */}
        <div className={`px-5 sm:px-7 py-6 sm:py-8 bg-gradient-to-br ${slide.accent} ${slide.accentDark}`}>
          <div className="text-5xl sm:text-6xl mb-4" aria-hidden>{slide.emoji}</div>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400 mb-2">
            {slide.eyebrow}
          </p>
          <h2 id="onboarding-title" className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-50 leading-tight mb-3">
            {slide.title}
          </h2>
          <p className="text-sm sm:text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {slide.body}
          </p>
        </div>

        {/* 하단 — dot indicator + 네비 */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            {/* dot indicator */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`슬라이드 ${i + 1}로 이동`}
                  aria-current={i === index ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? 'w-6 bg-orange-500 dark:bg-orange-400'
                      : 'w-1.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>

            {/* 좌우 네비 + CTA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={isFirst}
                aria-label="이전 슬라이드"
                className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {isLast ? (
                <Link
                  href={slide.cta.href}
                  onClick={close}
                  className="btn-base btn-primary btn-md whitespace-nowrap"
                >
                  {slide.cta.label}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}
                  className="btn-base btn-primary btn-md whitespace-nowrap"
                >
                  다음
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 마지막 슬라이드에서 다른 CTA 도 가까이 */}
          {isLast && (
            <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
              다른 도구는 메뉴 <strong className="text-zinc-700 dark:text-zinc-300">키워드 리서치 · 글쓰기 · 진단 · 커뮤니티 · 더보기</strong> 에서 언제든.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
