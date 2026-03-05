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
      title: '경쟁 블로그 분석',
      description: '상위 노출 경쟁 블로그를 분석하여 차별화 전략을 수립하세요.',
      href: '/competitor-analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: '포스팅 연구실',
      description: '블로그 포스팅 관련 연구와 실험 결과를 공유합니다.',
      href: '/lab',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50',
    },
    {
      title: '키워드 분석',
      description: '검색량, 경쟁률, 문서 수를 한 번에 분석하고 추천합니다.',
      href: '/keyword-analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: '프롬프트 생성',
      description: '키워드로 블로그 글 작성을 위한 최적의 프롬프트를 생성합니다.',
      href: '/prompt-generator',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: '금칙어 검사기',
      description: '실시간 글자 수 세기와 금칙어 검사 기능을 갖춘 전문 에디터입니다.',
      href: '/editor',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: '이미지 편집',
      description: '이미지 리사이징과 모자이크 처리 등 간단한 편집 기능을 제공합니다.',
      href: '/image-tools',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
    },
  ];

  const steps = [
    { step: '01', title: '키워드 찾기', desc: '검색량·경쟁률을 분석합니다', href: '/keyword-analysis' },
    { step: '02', title: '프롬프트 생성', desc: '최적의 글쓰기 프롬프트를 만듭니다', href: '/prompt-generator' },
    { step: '03', title: '금칙어 검사', desc: '작성한 포스팅을 검토합니다', href: '/editor' },
    { step: '04', title: '이미지 편집', desc: '첨부 이미지를 최적화합니다', href: '/image-tools' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-100/60 dark:bg-indigo-900/20 blur-3xl" />
          <div className="absolute -top-16 right-0 w-80 h-80 rounded-full bg-violet-100/60 dark:bg-violet-900/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              네이버 API 기반 실시간 분석
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4 tracking-tight leading-tight">
              블로그 포스팅을 더 쉽고<br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                {' '}스마트하게
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
              키워드 분석부터 이미지 편집까지, 블로그 포스팅의 모든 과정을 한 곳에서
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
                  className="w-full pl-11 pr-32 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150"
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
                className="group relative bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-px w-3 h-px bg-slate-300 dark:bg-slate-600 -translate-y-1/2" />
                )}
                <div className="text-2xl font-black text-slate-100 dark:text-slate-700 group-hover:text-indigo-100 dark:group-hover:text-indigo-900 transition-colors mb-2 select-none">
                  {s.step}
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trending Banner ── */}
        <section>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-700 dark:to-violet-700 p-6 sm:p-8">
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
                <p className="text-indigo-100 text-sm">
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
                className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
    </div>
  );
}
