'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * /lp/keyword — "여러분 키워드는 황금일까요?" 영상에서 유입된 사용자용 LP.
 *
 *   목표: 키워드 1개 입력 → /keyword-analysis 결과 페이지로 즉시 이동.
 *   useSearchParams 대신 window.location.search 사용해 Suspense wrap 회피.
 */
export default function KeywordLandingPage() {
  const router = useRouter();
  const [kw, setKw] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
      .map((k) => [k, params.get(k)])
      .filter(([, v]) => v) as [string, string][];
    if (utm.length) {
      try {
        sessionStorage.setItem('utm', JSON.stringify(Object.fromEntries(utm)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = kw.trim();
    if (!trimmed) return;
    router.push(`/keyword-analysis?keyword=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-amber-950/15 dark:to-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-20">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 실제 검색량
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 회원가입 X
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 무제한 무료
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 text-center tracking-tight leading-[1.2]">
          여러분 키워드는
          <br />
          <span className="text-orange-500 dark:text-orange-400">황금일까요, 쓰레기일까요?</span>
        </h1>

        <p className="mt-5 sm:mt-6 text-center text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
          네이버 검색광고 API의 <strong>실측 월간 검색량</strong>과 블로그 OpenAPI의
          <br className="hidden sm:block" /> 발행 문서 수로 경쟁률·황금 키워드를 자동 추출합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="예: 환절기 비염, 노트북 추천"
              className="flex-1 px-4 py-3.5 rounded-lg bg-white dark:bg-zinc-900 border-2 border-orange-200 dark:border-orange-900/50 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 shadow-sm"
              aria-label="분석할 키워드"
              required
              maxLength={50}
            />
            <button
              type="submit"
              className="btn-base btn-primary btn-lg shadow-md hover:shadow-lg whitespace-nowrap"
            >
              30초 분석 시작 →
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            자동완성으로 연관 키워드 30개+ 자동 추출 · 검색량 / 경쟁률 / 황금 키워드 표시
          </p>
        </form>

        <section className="mt-14 sm:mt-20 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400 mb-2">
            예시 — 한 글자 차이로 100배
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-4">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">✗ 환절기 건강관리</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">검색량 12 / 경쟁 8,000</p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✓ 환절기 비염 약</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">검색량 9,400 / 경쟁 320</p>
            </div>
          </div>
        </section>

        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              Boheme BlogLab 홈
            </Link>
            <span className="mx-2">·</span>
            <Link href="/blog-diagnose" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              블로그 진단
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
