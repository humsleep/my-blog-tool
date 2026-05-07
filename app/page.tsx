'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 홈 (Phase 27 — Modern SaaS Analytics).
 * 매거진 표지 톤(Vol.01 마스트헤드 / italic 디스플레이 헤드라인 / 풀쿼트 / § 마크)
 * 모두 제거. 분석 사이트의 표준 프레임:
 *   1) Hero — 짧고 명확한 타이틀 + 검색 + 두 개 1차 CTA
 *   2) 기능 그리드 (대표 도구 4)
 *   3) 워크플로우 (8단계)
 *   4) FAQ
 *   5) Closing CTA
 */
export default function Home() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  /** 핵심 도구 4개 — KPI 카드처럼 정보 밀도 있게 */
  const features = [
    {
      label: 'Diagnose',
      title: '블로그 진단',
      desc: '카테고리 핵심 키워드 30개로 1페이지 진입율을 측정해 활동성·노출·품질 3축으로 점수를 매깁니다.',
      href: '/blog-diagnose',
      cta: '내 블로그 진단',
      emphasis: true,
    },
    {
      label: 'Research',
      title: '키워드 분석',
      desc: '네이버 검색광고 API로 검색량·경쟁률·문서 수를 한 표에 펼치고 황금 키워드를 골라냅니다.',
      href: '/keyword-analysis',
      cta: '키워드 분석',
    },
    {
      label: 'Writing',
      title: 'AI 글쓰기',
      desc: 'Claude Sonnet 4.6이 6단계로 제목·본문·해시태그·이미지 프롬프트까지 한 번에 만듭니다.',
      href: '/ai-writer',
      cta: 'AI 글쓰기',
    },
    {
      label: 'Trends',
      title: '인기 검색어',
      desc: '네이버 실시간 인기 키워드로 지금 뜨는 주제를 가장 먼저 잡으세요.',
      href: '/trending',
      cta: '트렌드 보기',
    },
  ];

  /** 8단계 워크플로우 */
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <span className="pill pill-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
              네이버 API 기반 실시간 분석
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-4 leading-[1.15]">
              내 블로그의 위치를 알고,<br />
              <span className="text-orange-500 dark:text-orange-400">데이터로</span> 글을 씁니다.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-2xl">
              블로그 진단, 키워드 분석, AI 글쓰기까지 — 한국 블로거를 위한 데이터 기반 글쓰기 워크플로우.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="relative flex-1">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="분석할 키워드 입력 (예: 수원 맛집)"
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
              <button type="submit" className="btn-base btn-primary btn-md sm:btn-lg whitespace-nowrap">
                키워드 분석
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </form>

            {/* Two primary CTAs (under search) */}
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
          </div>
        </div>
      </section>

      {/* ── Feature grid (4 KPI-style cards) ─────────────────────── */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">핵심 도구 4종</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">자주 쓰는 도구를 한 손에.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className={`group block rounded-md border p-5 transition-colors ${
                  f.emphasis
                    ? 'bg-white dark:bg-zinc-900 border-orange-200 dark:border-orange-900/50 ring-1 ring-orange-500/20 hover:ring-orange-500/40'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-500 dark:text-slate-500">
                    {f.label}
                  </span>
                  {f.emphasis && (
                    <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">New</span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {f.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                  {f.cta}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8-step workflow ──────────────────────────────────────── */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">8단계 워크플로우</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              키워드 리서치부터 이미지 편집까지. 각 단계는 다음 단계로 자연스럽게 이어집니다.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group block rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors p-4"
              >
                <div className="text-2xl font-semibold text-slate-300 dark:text-zinc-700 group-hover:text-orange-300 dark:group-hover:text-orange-700 transition-colors mb-2 tabular">
                  {String(s.num).padStart(2, '0')}
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-0.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">자주 묻는 질문</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              여기 없는 질문은 <a href="mailto:boheme88@naver.com" className="text-orange-600 dark:text-orange-400 hover:underline">boheme88@naver.com</a>로 보내주세요.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
            {[
              {
                q: '회원가입을 꼭 해야 하나요?',
                a: '아니요. 키워드 분석·인기검색어·프롬프트 생성·이미지 검색은 회원가입 없이 무제한 사용 가능합니다. 회원가입은 AI 글쓰기 일일 5회(비로그인 1회), 커뮤니티 글 작성, 즐겨찾기 키워드 자동 저장을 위해 필요합니다.',
              },
              {
                q: '블로그 진단은 어떤 데이터로 점수를 매기나요?',
                a: '네이버 블로그 RSS로 최근 글의 발행 빈도·글자수·이미지·카테고리를 수집하고, 카테고리별 핵심 키워드 30개를 검색해 1페이지 진입율을 측정합니다. 활동성 25% / 노출 50% / 품질 25% 가중평균으로 0~100점 산출.',
              },
              {
                q: 'AI 글쓰기는 정말 무료인가요?',
                a: '네. 비로그인 일일 1회, 로그인 일일 5회까지 완전 무료입니다.',
              },
              {
                q: '네이버 블로그에 바로 사용할 수 있나요?',
                a: 'AI 글쓰기 결과를 마크다운/HTML 형태로 복사한 뒤 네이버 블로그 에디터에 붙여넣으면 됩니다. 에디터 페이지에서 금칙어·맞춤법까지 점검한 후 발행하시면 좋습니다.',
              },
              {
                q: '키워드 데이터는 어디서 오나요?',
                a: '네이버 검색광고 API의 실제 월간 검색량과 네이버 블로그 OpenAPI의 발행 문서 수를 기반으로 합니다.',
              },
              {
                q: '내가 입력한 키워드나 글이 다른 사람에게 공개되나요?',
                a: '아니요. 키워드 분석·AI 글쓰기 결과는 본인 화면에만 표시되며 저장되지 않습니다. 커뮤니티에 직접 작성한 글만 공개됩니다.',
              },
            ].map((item) => (
              <details key={item.q} className="group">
                <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">{item.q}</span>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
            데이터로 시작하면 결과가 다릅니다.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
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
