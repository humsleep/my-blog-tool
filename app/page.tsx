'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const features = [
    {
      title: '인기 검색어',
      description: '네이버 실시간 인기 검색어로 지금 뜨는 주제를 발견하세요.',
      href: '/trending',
      group: '리서치',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: '키워드 분석',
      description: '검색량·경쟁률·문서 수를 한 번에 분석합니다.',
      href: '/keyword-analysis',
      group: '리서치',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: '상위노출 분석',
      description: '상위 노출 블로그 포스트의 패턴을 파악합니다.',
      href: '/competitor-analysis',
      group: '리서치',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: '프롬프트 생성',
      description: 'AI 글쓰기용 프롬프트를 자동으로 만들어드립니다. (무료 무제한)',
      href: '/prompt-generator',
      group: '글쓰기',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'AI 글쓰기',
      description: 'Claude AI가 완성된 블로그 글을 작성합니다. HTML·마크다운·일반 3가지 포맷.',
      href: '/ai-writer',
      group: '글쓰기',
      badge: 'NEW',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: '금칙어·맞춤법',
      description: '실시간 금칙어 검사와 맞춤법 교정을 제공합니다.',
      href: '/editor',
      group: '글쓰기',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: '이미지 검색 + 편집',
      description: '무료 저작권 이미지를 찾고 크롭·모자이크까지 한 번에.',
      href: '/image-search',
      group: '이미지',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const steps = [
    { step: '01', title: '키워드 찾기', desc: '검색량·경쟁률 분석', href: '/keyword-analysis' },
    { step: '02', title: '프롬프트 생성', desc: '맞춤형 AI 지시문', href: '/prompt-generator' },
    { step: '03', title: 'AI 글쓰기', desc: 'Claude가 완성 초안', href: '/ai-writer' },
    { step: '04', title: '금칙어·이미지', desc: '발행 전 마무리', href: '/editor' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-100/60 dark:bg-orange-800/20 blur-3xl" />
          <div className="absolute -top-16 right-0 w-80 h-80 rounded-full bg-amber-100/60 dark:bg-amber-900/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-300 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              네이버 API 기반 실시간 분석
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4 tracking-tight leading-tight">
              블로그 포스팅을 더 쉽고<br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-400">
                {' '}스마트하게
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
              키워드 리서치부터 AI 초안 생성, 이미지 편집까지 한 곳에서
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <div className="absolute left-4 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="분석할 키워드를 입력하세요 (예: 블로그 포스팅)"
                  className="w-full pl-11 pr-32 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150"
                >
                  분석하기
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">

        {/* ── Steps ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">포스팅 워크플로우</h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md transition-all"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-px w-3 h-px bg-slate-300 dark:bg-slate-600 -translate-y-1/2" />
                )}
                <div className="text-2xl font-black text-slate-100 dark:text-slate-700 group-hover:text-orange-100 dark:group-hover:text-orange-800 transition-colors mb-2 select-none">
                  {s.step}
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trending Banner ── */}
        <section>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 p-6 sm:p-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-2xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-lg sm:text-xl font-bold text-white">실시간 인기 검색어 트렌드</h2>
                </div>
                <p className="text-orange-100 text-sm">
                  네이버 API 기반 인기 검색어를 블로그 포스팅에 활용하세요
                </p>
              </div>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-lg border border-white/30 transition-all whitespace-nowrap backdrop-blur-sm"
              >
                인기 검색어 보기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">전체 도구</h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group card p-5 hover:border-orange-300 dark:hover:border-orange-500 transition-all relative"
              >
                {feature.badge && (
                  <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold tracking-wider">
                    {feature.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400">
                  {feature.icon}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {feature.group}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

      </div>
      {/* 홈 가이드 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <a
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            더 자세한 사용법은 연구실에서 확인하세요
          </a>
        </div>
      </div>
    </div>
  );
}
