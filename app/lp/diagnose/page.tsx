'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * /lp/diagnose — 인스타·쇼츠에서 유입된 사용자를 위한 진단 1버튼 랜딩.
 *
 *   영상 후킹: "여러분 블로그는 몇 점일까요?"
 *   목표: URL 입력 1개 → 30초 진단 시작
 *
 *   UTM 파라미터는 URL 그대로 유지되어 Vercel Analytics에서 자동 추적됨.
 *   sessionStorage에도 저장해 다음 페이지에서 참조 가능.
 *   useSearchParams 대신 window.location.search 사용해 Suspense wrap 회피.
 */
export default function DiagnoseLandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  useEffect(() => {
    // UTM 파라미터 보존 — Vercel Analytics가 자동 인식 + sessionStorage 백업
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
      .map((k) => [k, params.get(k)])
      .filter(([, v]) => v) as [string, string][];
    if (utm.length) {
      try {
        sessionStorage.setItem('utm', JSON.stringify(Object.fromEntries(utm)));
      } catch {
        /* ignore quota errors */
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    // 도구 페이지로 URL 전달 — useSearchParams 로 자동 채워짐
    router.push(`/blog-diagnose?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="relative overflow-hidden min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-amber-950/15 dark:to-zinc-950">
      {/* 장식 앰비언트 글로우 (Phase 51 — supanova 흡수, aria-hidden) */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-gradient-to-b from-orange-200/40 to-transparent blur-3xl dark:from-orange-900/20" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-20">
        {/* 신뢰 칩 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-up">
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 30초 진단
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 회원가입 X
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 완전 무료
          </span>
        </div>

        {/* H1 — 영상 후킹과 동일 */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 text-center tracking-tight leading-[1.2] animate-fade-up stagger-1">
          여러분 블로그는
          <br />
          <span className="text-orange-500 dark:text-orange-400">몇 점일까요?</span>
        </h1>

        <p className="mt-5 sm:mt-6 text-center text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed animate-fade-up stagger-2">
          최근 12편 본문과 카테고리 핵심 키워드 30개로
          <br className="hidden sm:block" /> <strong>활동성·노출·품질</strong> 점수를 매겨드립니다.
        </p>

        {/* 1입력창 폼 */}
        <form onSubmit={handleSubmit} className="mt-10 max-w-xl mx-auto animate-fade-up stagger-3">
          <div className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-ambient p-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://blog.naver.com/내아이디"
              className="flex-1 px-4 py-3 rounded-xl bg-transparent border border-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="네이버 블로그 URL"
              required
            />
            <button
              type="submit"
              className="btn-base btn-primary btn-lg rounded-xl whitespace-nowrap"
            >
              30초 진단 시작 →
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            네이버 블로그만 지원 · 다음 단계에서 분야 1번만 선택해주시면 끝
          </p>
        </form>

        {/* 진단 결과 미리보기 — 무엇을 받을 수 있는지 */}
        <section className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: '📊', title: '0~100점 총점', desc: '5단계 band — top5 · top15 · top35 · mid · growing' },
            { icon: '🎯', title: '활동성·노출·품질', desc: '3축 분해 + 어디서 막혔는지 정확히' },
            { icon: '📅', title: '30일 액션 플랜', desc: '점수 올리려면 뭘 해야 할지 자동 추천' },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="text-2xl mb-2">{c.icon}</div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{c.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </section>

        {/* Footer mini — 다른 도구로 가는 보조 링크 */}
        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              Boheme BlogLab 홈
            </Link>
            <span className="mx-2">·</span>
            <Link href="/keyword-analysis" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              키워드 분석
            </Link>
            <span className="mx-2">·</span>
            <Link href="/ai-writer" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              AI 글쓰기
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
