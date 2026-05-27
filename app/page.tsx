'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/lib/supabase/useUser';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import TrendingTicker from '@/app/components/dashboard/TrendingTicker';
import LatestDiagnoseCard from '@/app/components/dashboard/LatestDiagnoseCard';
import IntentCards from '@/app/components/home/IntentCards';
import OnboardingTour from '@/app/components/onboarding/OnboardingTour';
import { COMMUNITY_TO_TRENDING_CATEGORY } from '@/app/lib/dashboard/types';

/**
 * 홈 — 데일리 대시보드 (Phase 28 → 46 → 48).
 *
 * Phase 48 (P1 UX 재정비):
 *   "도구 카탈로그" 대신 "사용자의 의도(intent)" 4개로 첫 진입을 단순화.
 *   기존 features(4 KPI) 섹션은 IntentCards 로 흡수, 8단계 그리드는 details
 *   로 접어 입문자 시야를 깨끗하게.
 *
 * 비로그인: Hero(검색+진단 CTA) + IntentCards(full) + TrendingTicker
 *           + (접힌) 8단계 + 클로징
 * 로그인:   인사 + (검색 + 진단 카드 dashboard) + IntentCards(compact)
 *           + TrendingTicker(내 분야) + (접힌) 8단계 + 클로징
 */
export default function Home() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchMyProfile().then(setProfile);
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const myCategoryLabel = profile?.category
    ? COMMUNITY_TO_TRENDING_CATEGORY[profile.category]
    : null;

  // 닉네임은 프로필이 있으면 사용, 없으면 이메일 앞부분, 그것도 없으면 "블로거"
  const greetingName =
    profile?.nickname ?? (user?.email ? user.email.split('@')[0] : '블로거');

  /** 8단계 워크플로우 — Phase 48 에서 details 로 접어 부담 ↓.
   *  파워 유저가 "전체 도구 보기" 클릭 시 펼쳐서 빠른 진입. */
  const steps = [
    { num: 1, title: '인기 검색어',  desc: '실시간 트렌드 키워드',         href: '/trending' },
    { num: 2, title: '키워드 분석',  desc: '검색량 · 경쟁률 분석',         href: '/keyword-analysis' },
    { num: 3, title: '상위노출 분석', desc: '경쟁 블로그 패턴 추적',         href: '/competitor-analysis' },
    { num: 4, title: '프롬프트 생성', desc: '맞춤형 AI 지시문',              href: '/prompt-generator' },
    { num: 5, title: 'AI 글쓰기',    desc: 'Claude 자동 작성',              href: '/ai-writer' },
    { num: 6, title: '에디터',       desc: '금칙어 · 맞춤법 · 발행 전 정리', href: '/editor' },
    { num: 7, title: '이미지 검색',  desc: '무료 저작권 이미지 통합 검색',   href: '/image-search' },
    { num: 8, title: '이미지 편집',  desc: '크롭 · 모자이크 · 필터',         href: '/image-tools' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 첫 진입 온보딩 (Phase 48 P4) — 비로그인 첫 방문자만, sessionStorage 1회 표시. */}
      <OnboardingTour />

      {/* ── Hero — 분기 ──────────────────────────────────────────── */}
      {userLoading ? (
        <HeroSkeleton />
      ) : user ? (
        <LoggedInHero
          greetingName={greetingName}
          myCategoryLabel={myCategoryLabel}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          onSubmit={handleSearch}
          savedKeywords={profile?.saved_keywords ?? []}
        />
      ) : (
        <AnonHero
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          onSubmit={handleSearch}
        />
      )}

      {/* ── Intent cards — 비로그인 한정 (로그인은 hero 아래 compact). ── */}
      {!userLoading && !user && (
        <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <IntentCards
              variant="full"
              heading="오늘 뭘 할까요?"
              subheading="네 개의 진입로. 하나만 누르면 흐름이 자동으로 이어집니다."
            />
          </div>
        </section>
      )}

      {/* ── 인기 키워드 티커 (모두 표시, 카테고리만 분기) ────────── */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <TrendingTicker
            category={myCategoryLabel ?? '전체'}
            label={myCategoryLabel ? '내 분야 트렌드' : '오늘의 트렌드'}
            limit={10}
          />
        </div>
      </section>

      {/* ── 전체 도구 (8-step) — 기본 접힘, 펼치면 8단계 그리드 ─────
       *  파워 유저용. 입문자 시야에선 헤더만 보임.
       *  CSS: globals.css 의 .group-open 변형 없이 details/summary 기본 동작. */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <details className="group">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-3 py-2 select-none">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  전체 도구 보기 (8단계)
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  키워드 리서치부터 이미지 편집까지 — 단계별 도구를 직접 고를 수 있어요.
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 group-open:hidden">
                펼치기
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span className="flex-shrink-0 hidden group-open:inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                접기
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </span>
            </summary>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
              {steps.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group/step h-full flex flex-col rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors p-4"
                >
                  <div className="text-2xl font-semibold text-zinc-300 dark:text-zinc-700 group-hover/step:text-orange-300 dark:group-hover/step:text-orange-700 transition-colors mb-2 tabular">
                    {String(s.num).padStart(2, '0')}
                  </div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-0.5 group-hover/step:text-orange-600 dark:group-hover/step:text-orange-400 transition-colors">
                    {s.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.desc}</div>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
            데이터로 시작하면 결과가 다릅니다.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            회원가입 없이 키워드 분석부터 시작할 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/keyword-analysis" className="btn-base btn-primary btn-lg">
              키워드 분석으로 시작
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/blog-diagnose" className="btn-base btn-secondary btn-lg">
              내 블로그 진단
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Hero variants
 * ──────────────────────────────────────────────────────────────── */

function HeroSkeleton() {
  return (
    <section className="relative border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-3xl space-y-4">
          <div className="h-6 w-40 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-10 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-12 w-full max-w-xl rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function AnonHero({
  searchKeyword,
  setSearchKeyword,
  onSubmit,
}: {
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section className="relative border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <span className="pill pill-accent mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
            네이버 API 기반 실시간 분석
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4 leading-[1.15]">
            내 블로그의 위치를 알고,<br />
            <span className="text-orange-500 dark:text-orange-400">데이터로</span> 글을 씁니다.
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-2xl">
            블로그 진단, 키워드 분석, AI 글쓰기까지 — 한국 블로거를 위한 데이터 기반 글쓰기 워크플로우.
          </p>

          {/* Search */}
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCapitalize="none"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="분석할 키워드 입력 (예: 수원 맛집)"
                aria-label="분석할 키워드 입력"
                className="w-full pl-10 pr-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button type="submit" className="btn-base btn-primary btn-md sm:btn-lg whitespace-nowrap">
              키워드 분석
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href="/blog-diagnose" className="btn-base btn-secondary btn-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              내 블로그 진단하기
            </Link>
            <Link href="/start" className="btn-base btn-ghost btn-md">
              3분 만에 첫 글 만들기 →
            </Link>
          </div>

          {/* 증거 스트립 — 추상적 약속 대신 측정 가능한 사실로 신뢰 형성. */}
          <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-2xl border-t border-zinc-200 dark:border-zinc-800 pt-6">
            {[
              { value: '30개', label: '카테고리 키워드로\n1페이지 진입율 측정' },
              { value: '12편', label: '최근 본문 자동 분석\n글자수 · 이미지' },
              { value: '0원', label: '진단 · 키워드 분석\nAI API 미사용' },
              { value: '8단계', label: '검색어 → 발행까지\n끊김 없는 흐름' },
            ].map((s) => (
              <div key={s.value}>
                <dt className="text-2xl sm:text-3xl font-bold tabular text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-snug whitespace-pre-line">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function LoggedInHero({
  greetingName,
  myCategoryLabel,
  searchKeyword,
  setSearchKeyword,
  onSubmit,
  savedKeywords,
}: {
  greetingName: string;
  myCategoryLabel: string | null;
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  savedKeywords: string[];
}) {
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <section className="relative border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Greeting line */}
        <div className="mb-6 sm:mb-8">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase text-zinc-500">
            {dateLabel} · 오늘의 작업대
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greetingName}님, 오늘도 데이터로 시작해볼까요?
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {myCategoryLabel
              ? `${myCategoryLabel} 분야 인기 키워드와 마지막 진단 점수를 한눈에 확인하세요.`
              : '프로필에서 분야를 등록하면 내 분야 맞춤 키워드를 보여드려요.'}
          </p>
        </div>

        {/* Dashboard grid: 키워드 검색 ↔ 진단 카드 — Phase 50 에서 1:1 비율로.
            items-stretch (grid 기본값) + 자식의 h-full 로 두 카드 높이 동일. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div className="h-full">
            <LoggedInSearchCard
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSubmit={onSubmit}
              savedKeywords={savedKeywords}
            />
          </div>
          <div className="h-full">
            <LatestDiagnoseCard />
          </div>
        </div>

        {/* Phase 48 — IntentCards compact: dashboard 카드 아래 4 의도 진입.
            기존 메뉴를 거치지 않고 자주 쓰는 행동 4개를 한 줄에. */}
        <div className="mt-6 sm:mt-8">
          <IntentCards variant="compact" heading="다른 작업도 시작해보세요" />
        </div>
      </div>
    </section>
  );
}

/**
 * 로그인 hero 좌측 키워드 검색 카드 — Phase 46 에서 즐겨찾기 칩 통합.
 *
 * 입력창 + "키워드 분석 시작" 버튼이 메인 행동.
 * profile.saved_keywords (최대 10개) 가 있으면 칩으로 즉시 분석 진입.
 * 즐겨찾기는 키워드 분석 결과 페이지에서 ⭐ 버튼으로 추가/삭제 가능.
 */
function LoggedInSearchCard({
  searchKeyword,
  setSearchKeyword,
  onSubmit,
  savedKeywords,
}: {
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  savedKeywords: string[];
}) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col rounded-xl border border-orange-200 dark:border-orange-900/40 ring-1 ring-orange-500/10 bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-amber-950/15 dark:to-zinc-900 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-700 dark:text-orange-300">
          Quick search
        </span>
        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          무료 무제한
        </span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        키워드 바로 검색
      </h3>
      <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
        검색량 · 경쟁률 · 황금 키워드까지 한 표에 펼쳐드립니다.
      </p>

      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="relative">
          <svg
            className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="none"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="예: 수원 맛집"
            className="w-full pl-11 pr-3 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            aria-label="분석할 키워드 입력"
          />
        </div>
        <button type="submit" className="btn-base btn-primary btn-lg w-full text-base">
          키워드 분석 시작 →
        </button>
      </form>

      {/* 즐겨찾기 키워드 — 칩 클릭 시 즉시 그 키워드로 자동 분석 (autoAnalyze=1 명시) */}
      <div className="mt-auto pt-5">
        {savedKeywords.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-[0.12em] uppercase text-zinc-600 dark:text-zinc-400">
                ⭐ 즐겨찾기 키워드
              </span>
              <Link
                href="/profile/setup"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 underline-offset-2 hover:underline"
              >
                관리
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/keyword-analysis?keyword=${encodeURIComponent(kw)}&autoAnalyze=1`,
                    )
                  }
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors"
                  aria-label={`'${kw}' 키워드 자동 분석`}
                  title={`'${kw}' 클릭 시 자동으로 분석을 시작합니다`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            💡 키워드 분석 결과의 <strong className="text-zinc-900 dark:text-zinc-100">⭐ 버튼</strong>을 누르면 자주 쓰는 키워드를 여기에 저장할 수 있어요.
          </p>
        )}
      </div>
    </div>
  );
}
