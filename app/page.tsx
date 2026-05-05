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

      {/* ── How it works (실제 사용법 3분 가이드) ── */}
      <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-semibold uppercase tracking-wider mb-3">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              30분이면 첫 글 1편이 완성됩니다
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              복잡한 키워드 분석도, AI 글쓰기도 처음이라면 아래 4단계만 따라해보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                num: '1',
                title: '키워드를 정합니다',
                desc: '인기검색어와 키워드분석으로 "검색량 500+ / 경쟁률 0.3-" 황금 키워드를 찾으세요.',
                color: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
                href: '/keyword-analysis',
                cta: '키워드 분석하기',
              },
              {
                num: '1.5',
                badge: 'Boheme 차별화',
                title: '📰 트렌드를 더합니다 (선택)',
                desc: '키워드 분석 결과에서 [📰 트렌드 반영] 버튼을 누르면 네이버 최신 뉴스를 자동으로 AI 프롬프트에 전달합니다. 트렌드를 반영한 글이 노출에 유리해요.',
                color: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20',
                href: '/keyword-analysis',
                cta: '뉴스 함께 가져오기',
              },
              {
                num: '2',
                title: '프롬프트를 만듭니다',
                desc: '분야·어투·글 스타일을 선택하면 AI에게 줄 최적의 지시문이 자동으로 만들어져요. 무료·무제한.',
                color: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20',
                href: '/prompt-generator',
                cta: '프롬프트 생성',
              },
              {
                num: '3',
                title: 'AI가 초안을 씁니다',
                desc: 'Claude Sonnet 4.6이 1분 안에 1500~2000자 초안을 만들어줍니다. 비로그인 1회/일, 로그인 5회/일.',
                color: 'from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20',
                href: '/ai-writer',
                cta: 'AI 글쓰기',
              },
              {
                num: '4',
                title: '발행 전 마무리',
                desc: '에디터에서 금칙어·맞춤법 점검, 이미지 검색·편집까지. 마크다운 그대로 복사해 네이버/티스토리에 붙여넣기.',
                color: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20',
                href: '/editor',
                cta: '에디터 열기',
              },
            ].map((s) => {
              const isOptional = s.num === '1.5';
              return (
                <div
                  key={s.num}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} ${
                    isOptional
                      ? 'border-2 border-dashed border-rose-300 dark:border-rose-700/60'
                      : 'border border-white/60 dark:border-slate-700/60'
                  } p-6`}
                >
                  {s.badge && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white rounded-full shadow-sm">
                      {s.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${isOptional ? 'w-14 h-12' : 'w-12 h-12'} rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-black ${
                      isOptional ? 'text-base text-rose-500 dark:text-rose-400' : 'text-2xl text-orange-500 dark:text-orange-400'
                    }`}>
                      {s.num}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{s.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{s.desc}</p>
                      <Link
                        href={s.href}
                        className={`inline-flex items-center text-sm font-semibold hover:underline ${
                          isOptional ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {s.cta}
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Boheme (핵심 가치) ── */}
      <section className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              왜 Boheme BlogLab인가요?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { emoji: '⚡', title: '한 곳에서 모두', desc: '키워드부터 발행까지 8단계 워크플로우. 여러 도구를 옮겨다닐 필요 없어요.' },
              { emoji: '🇰🇷', title: '네이버 API 기반', desc: '실제 네이버 검색량·경쟁률·상위노출 데이터로 분석. 한국 블로그에 최적화.' },
              { emoji: '🆓', title: '무료부터 시작', desc: '회원가입 없이 키워드 분석·프롬프트 생성 무제한. AI 글쓰기도 비로그인 1회 무료.' },
            ].map((v) => (
              <div key={v.title} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center">
                <div className="text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{v.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
            자주 묻는 질문
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center">
            여기 없는 질문은 <a href="mailto:boheme88@naver.com" className="text-orange-500 dark:text-orange-400 hover:underline">boheme88@naver.com</a>로 보내주세요.
          </p>
          <div className="space-y-3">
            {[
              {
                q: '회원가입을 꼭 해야 하나요?',
                a: '아니요. 키워드 분석·인기검색어·프롬프트 생성·이미지 검색은 회원가입 없이 무제한 사용 가능합니다. 회원가입은 AI 글쓰기 일일 5회(비로그인 1회), 커뮤니티 글 작성, 옵션 자동 저장 기능을 위해 필요합니다.',
              },
              {
                q: 'AI 글쓰기는 정말 무료인가요?',
                a: '네. 비로그인 일일 1회, 로그인 일일 5회까지 완전 무료입니다. 향후 한도 추가 충전이나 유료 멤버십이 도입될 수 있지만, 기존 무료 한도는 유지됩니다.',
              },
              {
                q: '네이버 블로그에 바로 사용할 수 있나요?',
                a: 'AI 글쓰기 결과를 마크다운/HTML 형태로 복사한 뒤 네이버 블로그 에디터에 붙여넣으면 됩니다. 에디터 페이지에서 금칙어·맞춤법까지 점검한 후 발행하시면 좋습니다.',
              },
              {
                q: '키워드 데이터는 어디서 오나요?',
                a: '네이버 검색광고 API의 실제 월간 검색량과 네이버 블로그 OpenAPI의 발행 문서 수를 기반으로 합니다. 일·주·월 단위로 비례 환산하여 표시됩니다.',
              },
              {
                q: '내가 입력한 키워드나 글이 다른 사람에게 공개되나요?',
                a: '아니요. 키워드 분석·AI 글쓰기 결과는 본인 화면에만 표시되며 저장되지 않습니다. 커뮤니티에 직접 작성한 글만 공개됩니다.',
              },
              {
                q: '협찬·체험단 글도 작성할 수 있나요?',
                a: '네. 프롬프트 생성 고급 모드에서 "광고·협찬 표시"를 선택하면 네이버 가이드에 맞는 협찬 명시 문구가 도입부에 자동 포함됩니다. 이렇게 작성하면 미표시 광고 페널티를 피할 수 있습니다.',
              },
            ].map((item) => (
              <details key={item.q} className="group bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{item.q}</span>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            지금 바로 첫 글을 시작해보세요
          </h2>
          <p className="text-orange-100 mb-7 text-sm sm:text-base">
            회원가입 없이도 키워드 분석부터 시작할 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/keyword-analysis"
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-orange-50 text-orange-600 text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              키워드 분석으로 시작
            </Link>
            <Link
              href="/lab/post_11"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/30 transition-all"
            >
              📖 사용 가이드 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
