'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * /lp/ai — "1분 만에 AI 초안" 영상에서 유입된 사용자용 LP.
 *
 *   AI 글쓰기는 프롬프트 생성이 선행되어야 효과 ↑ 이므로,
 *   "프롬프트 생성 → AI 글쓰기" 흐름의 진입점인 /prompt-generator 로 보낸다.
 *   useSearchParams 대신 window.location.search 사용해 Suspense wrap 회피.
 */
export default function AiLandingPage() {
  const router = useRouter();

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-amber-950/15 dark:to-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-20">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ Claude Sonnet 4.6
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 네이버 홈판 패턴 학습
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
            ✓ 로그인 5회·비로그인 1회 무료
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 text-center tracking-tight leading-[1.2]">
          여러분 글을
          <br />
          <span className="text-orange-500 dark:text-orange-400">1분 만에 초안으로</span>
        </h1>

        <p className="mt-5 sm:mt-6 text-center text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
          제목 · 본문 (해요체/평서체) · 해시태그 30개 · 자체 검토까지
          <br className="hidden sm:block" /> <strong>한 번 실행으로 발행 가능한 초안</strong>을 만듭니다.
        </p>

        {/* AI 글쓰기는 프롬프트 생성이 선행되는 게 품질 ↑ */}
        <div className="mt-10 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/prompt-generator')}
            className="btn-base btn-primary btn-lg shadow-md hover:shadow-lg w-full text-base"
          >
            프롬프트 만들고 AI 초안 받기 →
          </button>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            먼저 무료 프롬프트 생성기에서 글의 뼈대를 잡고 → AI 초안으로 살을 붙입니다.
            <br />
            중간 단계는 모두 자동 — 클릭 한 번으로 다음으로 넘어갑니다.
          </p>
        </div>

        {/* AI 결과로 받는 것 */}
        <section className="mt-14 sm:mt-20">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400 mb-4 text-center">
            기본 옵션으로 받는 것
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: '✍️', label: '베스트 제목 1개' },
              { icon: '📄', label: '본문 (5~7 소제목)' },
              { icon: '🏷️', label: '해시태그 30개' },
              { icon: '✅', label: '자체 검토 리포트' },
              { icon: '📊', label: '표는 실제 표로' },
              { icon: '📝', label: '네이버 paste 호환' },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-lg bg-white/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-3 text-center"
              >
                <div className="text-xl mb-1">{c.icon}</div>
                <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{c.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            제목 20개·이미지 프롬프트·참고 출처는 결과 페이지의 <strong>옵션 패널</strong>에서 추가 선택할 수 있어요.
          </p>
        </section>

        {/* AdSense 정책 안내 — 우리 약관 §8 정합 */}
        <div className="mt-10 max-w-xl mx-auto rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            💡 AI 초안은 본인 경험·검증을 더해 발행하시는 게 가장 안전합니다.
            그대로 발행 시 광고 플랫폼 정책에 영향을 줄 수 있습니다.
          </p>
        </div>

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
            <Link href="/keyword-analysis" className="hover:text-orange-500 dark:hover:text-orange-400 underline underline-offset-4">
              키워드 분석
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
