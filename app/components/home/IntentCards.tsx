'use client';

import Link from 'next/link';

/**
 * 홈 — "오늘 뭘 할까요?" 의도(intent) 진입 카드.
 *
 * P1 UX 재정비 — Phase 48.
 *  도구 카탈로그 대신 "사용자의 할 일"을 4개로 묶어 첫 진입 직관성 ↑.
 *  variant 두 종류:
 *    - 'full'    : 비로그인 hero 아래 2×2 큰 카드 (강한 어필).
 *    - 'compact' : 로그인 hero 아래 1×4 컴팩트 행 (다른 위젯과 공존).
 *
 *  4개 의도 — 사이트의 모든 가치 진입로:
 *    1) 진단 — 차별화 포인트, 신규에게 첫 wow
 *    2) 글쓰기 — 가장 자주 쓰는 행동, /start 로 마법사 진입
 *    3) 키워드 찾기 — 파워 유저용 데이터 진입
 *    4) 커뮤니티 — 같은 분야 블로거 매칭
 */
interface Intent {
  emoji: string;
  title: string;
  desc: string;
  meta: string;
  href: string;
  cta: string;
  emphasis?: boolean;
}

const INTENTS: Intent[] = [
  {
    emoji: '🩺',
    title: '내 블로그 진단',
    desc: 'URL 한 줄로 0~100점 + 30일 액션 플랜.',
    meta: '30초 · 무료',
    href: '/blog-diagnose',
    cta: '진단 시작',
    emphasis: true,
  },
  {
    emoji: '📝',
    title: '글 한 편 쓰기',
    desc: '키워드 한 단어 → AI 초안 → 발행까지 한 흐름.',
    meta: '비로그인 1회/일 무료',
    href: '/start',
    cta: '지금 시작하기',
  },
  {
    emoji: '🔍',
    title: '키워드 찾기',
    desc: '검색량 · 경쟁률 · 황금 키워드 한 표에.',
    meta: '무료 · 무제한',
    href: '/keyword-analysis',
    cta: '키워드 분석',
  },
  {
    emoji: '👥',
    title: '블로거 만나기',
    desc: '서이추 · 정보공유 · 체험단 동행. 같은 분야 매칭.',
    meta: '커뮤니티',
    href: '/community',
    cta: '둘러보기',
  },
];

interface Props {
  variant?: 'full' | 'compact';
  /** 섹션 상단 헤드라인 — 변형 가능. 비로그인 vs 로그인 카피 분리. */
  heading?: string;
  subheading?: string;
}

export default function IntentCards({
  variant = 'full',
  heading = '오늘 뭘 할까요?',
  subheading,
}: Props) {
  if (variant === 'compact') {
    return (
      <section aria-labelledby="intent-heading">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="intent-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {heading}
          </h2>
          {subheading && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">{subheading}</span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {INTENTS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`group relative flex items-center gap-2.5 rounded-md border p-3 transition-colors ${
                it.emphasis
                  ? 'border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-700'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className="text-xl flex-shrink-0" aria-hidden>{it.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                  {it.title}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{it.meta}</div>
              </div>
              <svg
                className="w-3.5 h-3.5 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // full variant (비로그인 — 2×2 큰 카드)
  return (
    <section aria-labelledby="intent-heading">
      <div className="mb-6 sm:mb-8">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500">
          Get started
        </span>
        <h2 id="intent-heading" className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {heading}
        </h2>
        {subheading && (
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{subheading}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
        {INTENTS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`group h-full flex flex-col rounded-lg border p-5 sm:p-6 transition-all hover:-translate-y-0.5 ${
              it.emphasis
                ? 'bg-gradient-to-br from-orange-50 via-amber-50/60 to-white dark:from-orange-950/30 dark:via-amber-950/15 dark:to-zinc-900 border-orange-200 dark:border-orange-900/50 ring-1 ring-orange-500/15 hover:ring-orange-500/30 hover:shadow-md'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl sm:text-4xl flex-shrink-0" aria-hidden>{it.emoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {it.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {it.desc}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-3 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
                {it.meta}
              </span>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                it.emphasis
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-zinc-700 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400'
              }`}>
                {it.cta}
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
