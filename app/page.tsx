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

  /** 매거진 섹션 — 8단계 워크플로우 */
  const sections: { num: string; group: string; title: string; lede: string; href: string }[] = [
    {
      num: '01', group: 'Research', title: '인기 검색어',
      lede: '네이버 실시간 인기 키워드로 지금 뜨는 주제를 발견합니다.', href: '/trending',
    },
    {
      num: '02', group: 'Research', title: '키워드 분석',
      lede: '검색량·경쟁률·문서 수를 한 표에 펼쳐 읽기 좋게 정렬합니다.', href: '/keyword-analysis',
    },
    {
      num: '03', group: 'Research', title: '상위노출 분석',
      lede: '1페이지에 오른 글들의 공통 패턴을 거꾸로 추적합니다.', href: '/competitor-analysis',
    },
    {
      num: '04', group: 'Writing', title: '프롬프트 생성',
      lede: '분야·어투·구조를 골라 AI에게 줄 지시문을 만듭니다. 무료·무제한.', href: '/prompt-generator',
    },
    {
      num: '05', group: 'Writing', title: 'AI 글쓰기',
      lede: 'Claude가 6단계 워크플로우로 제목·본문·해시태그·이미지 프롬프트를 한 번에.', href: '/ai-writer',
    },
    {
      num: '06', group: 'Writing', title: '금칙어·맞춤법',
      lede: '실시간 금칙어와 맞춤법을 점검하는 포스팅 에디터입니다.', href: '/editor',
    },
    {
      num: '07', group: 'Image', title: '이미지 검색',
      lede: 'Pexels·Unsplash·Wikipedia에서 무료 저작권 이미지를 한 번에 찾습니다.', href: '/image-search',
    },
    {
      num: '08', group: 'Image', title: '이미지 편집',
      lede: '크롭·모자이크·필터·리사이즈를 브라우저 안에서 끝냅니다.', href: '/image-tools',
    },
  ];

  /** 4단계 핵심 워크플로우 — 짧은 가이드 */
  const flow = [
    {
      num: 'I',  title: '키워드를 정합니다',
      desc: '인기검색어와 키워드분석으로 "검색량 500+ / 경쟁률 0.3-" 황금 키워드를 찾습니다.',
      href: '/keyword-analysis', cta: '키워드 분석',
    },
    {
      num: 'II', title: '관련 뉴스를 함께 넣습니다',
      desc: '키워드 옆 [📰 뉴스 보기]를 누르면 최신 네이버 뉴스가 AI 프롬프트로 함께 전달되어 시의성 있는 글이 됩니다.',
      href: '/keyword-analysis', cta: '뉴스 함께 가져오기', optional: true,
    },
    {
      num: 'III', title: '프롬프트를 만듭니다',
      desc: '분야·어투·글 스타일을 선택하면 AI에게 줄 최적의 지시문이 자동으로 만들어집니다.',
      href: '/prompt-generator', cta: '프롬프트 생성',
    },
    {
      num: 'IV', title: 'AI가 초안을 씁니다',
      desc: 'Claude Sonnet 4.6이 1분 안에 1,500~2,000자 초안과 제목 후보 20개를 한 번에 만듭니다.',
      href: '/ai-writer', cta: 'AI 글쓰기',
    },
    {
      num: 'V', title: '발행 전 마무리',
      desc: '에디터에서 금칙어·맞춤법 점검, 이미지 검색·편집까지. HTML 그대로 복사해 네이버에 붙여넣기.',
      href: '/editor', cta: '에디터 열기',
    },
  ];

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen">
      {/* ── Masthead ──────────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <span>Vol. 01 — 한국 블로거 매거진</span>
          <span className="hidden sm:inline">{today}</span>
          <span>네이버 · 티스토리 도구</span>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            {/* Headline + lede — 8 columns */}
            <div className="lg:col-span-8">
              <div className="ed-eyebrow mb-6">이번 호의 표지 기사</div>
              <h1 className="ed-display text-[2.5rem] sm:text-[4rem] lg:text-[5.5rem] leading-[0.95] mb-6">
                키워드부터 발행까지,<br />
                <span className="italic text-ink-muted">한 권의 노트에서</span><br />
                <span className="text-orange-600 dark:text-orange-400">끝낸다.</span>
              </h1>
              <p className="text-lg sm:text-xl text-ink-muted leading-[1.7] max-w-[58ch] font-display italic">
                Boheme BlogLab은 한국 블로거를 위한 8단계 글쓰기 워크플로우입니다. 네이버 검색량 데이터, 관련 뉴스, AI 초안, 이미지 편집을 같은 작업대 위에서 돌립니다.
              </p>
            </div>

            {/* Right column — search + side note (4 columns) */}
            <div className="lg:col-span-4 lg:pl-8 lg:border-l lg:border-rule-soft">
              <div className="ed-byline mb-3">검색창</div>
              <form onSubmit={handleSearch} className="space-y-3">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="분석할 키워드를 입력하세요"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-rule text-ink dark:text-ink text-lg placeholder-ink-faint focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                />
                <button type="submit" className="btn-base btn-primary btn-md w-full">
                  분석하기
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </form>
              <p className="mt-4 text-xs text-ink-faint leading-relaxed">
                — 네이버 검색광고 API 기반의 실제 월간 검색량 데이터.<br />회원가입 없이 무제한 분석 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── First-visit Quick Start banner ──────────────────────── */}
      <section className="border-b border-rule bg-paper-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="ed-eyebrow mb-3">처음 오셨나요</div>
              <h2 className="font-display text-[1.75rem] sm:text-[2.5rem] leading-[1.1] tracking-tight text-ink mb-3">
                3분이면 첫 글 1편이 완성됩니다.
              </h2>
              <p className="text-base text-ink-muted leading-[1.7] max-w-[58ch]">
                키워드 한 단어, 분야와 어투만 골라주시면 AI가 본문을 작성합니다. 8단계 정밀 모드는 그 다음에 익혀도 늦지 않아요.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3 lg:items-end">
              <Link
                href="/start"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-ink text-paper text-base font-semibold tracking-wide hover:bg-orange-600 transition-colors w-full lg:w-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                지금 시작하기 — 3분 미니 모드
              </Link>
              <span className="text-xs text-ink-faint">회원가입 없이 무료 1회 · 로그인 시 5회/일</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-step Lede article ──────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left — section title (3 col) */}
            <div className="lg:col-span-3">
              <div className="ed-eyebrow mb-3">Feature</div>
              <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-[1.1] tracking-tight text-ink mb-4">
                30분이면 첫 글 1편이 완성된다
              </h2>
              <p className="text-sm text-ink-muted leading-[1.7]">
                복잡한 키워드 분석도, AI 글쓰기도 처음이라면 다섯 단계만 따라하세요.
              </p>
            </div>

            {/* Right — five cards in a 2-column magazine grid (9 col) */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {flow.map((s) => (
                  <article key={s.num} className={`relative ${s.optional ? 'pl-5 border-l-2 border-orange-400 dark:border-orange-500' : ''}`}>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-display italic text-2xl text-orange-600 dark:text-orange-400 leading-none">
                        {s.num}.
                      </span>
                      {s.optional && (
                        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-600 dark:text-orange-400">
                          optional
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-ink mb-2 leading-[1.3]">
                      {s.title}
                    </h3>
                    <p className="text-sm text-ink-muted leading-[1.7] mb-3">{s.desc}</p>
                    <Link
                      href={s.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-ink hover:text-orange-600 dark:hover:text-orange-400 transition-colors border-b border-ink hover:border-orange-600 dark:hover:border-orange-400 pb-0.5"
                    >
                      {s.cta}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pull quote — Trending banner ─────────────────────────── */}
      <section className="border-b border-rule bg-paper-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-9">
              <div className="ed-eyebrow mb-3">실시간 — Trending</div>
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-[1.25] text-ink">
                <span className="text-orange-600 dark:text-orange-400">&ldquo;</span>지금 검색되는 단어를 모르면, 정성껏 쓴 글도 묻힌다.<span className="text-orange-600 dark:text-orange-400">&rdquo;</span>
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                네이버 API 기반 인기 검색어로 오늘 뜨는 주제를 가장 먼저 잡으세요.
              </p>
            </div>
            <div className="lg:col-span-3 flex lg:justify-end">
              <Link href="/trending" className="btn-base btn-secondary btn-lg">
                인기 검색어 보기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sections index — 8 tools ─────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="ed-eyebrow mb-3">Sections — 전체 도구</div>
              <h2 className="font-display text-[2rem] sm:text-[2.75rem] leading-[1.05] tracking-tight text-ink">
                여덟 개의 작업대
              </h2>
            </div>
            <div className="text-sm text-ink-muted font-display italic max-w-md">
              한 키워드를 잡아 발행까지 도달하는 동안 거치는 모든 도구가 이 안에 있습니다.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-rule-soft border border-rule-soft">
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative bg-paper hover:bg-paper-deep dark:hover:bg-paper-deep p-6 transition-colors"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-display text-3xl text-ink-faint group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-none">
                    {s.num}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-faint">
                    {s.group}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-ink mb-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-ink-muted leading-[1.6]">{s.lede}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why — three column editorial ─────────────────────────── */}
      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="ed-ornament mb-10">왜 Boheme BlogLab인가</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                head: '한 곳에서 모두',
                body: '키워드 리서치부터 이미지 편집까지 8단계 워크플로우 안에서 끝냅니다. 도구 사이를 옮겨다니며 흐름을 잃을 일이 없어요.',
              },
              {
                head: '네이버에 최적',
                body: '네이버 검색광고 API의 실제 월간 검색량 데이터, 네이버 OpenAPI의 발행 문서 수, 네이버 뉴스 결과를 그대로 가져옵니다.',
              },
              {
                head: '무료부터 시작',
                body: '키워드 분석·프롬프트 생성·이미지 검색은 회원가입 없이 무제한. AI 글쓰기도 비로그인 1회·로그인 5회 무료입니다.',
              },
            ].map((v, i) => (
              <div key={v.head} className={i < 2 ? 'md:pr-8 md:border-r md:border-rule-soft' : ''}>
                <div className="font-display italic text-orange-600 dark:text-orange-400 text-3xl mb-4">{`§ ${i + 1}`}</div>
                <h3 className="font-display text-2xl font-semibold text-ink mb-3 leading-tight">{v.head}</h3>
                <p className="text-sm text-ink-muted leading-[1.7]">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ — Q&A list ───────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <div className="ed-eyebrow justify-center mb-3 inline-flex">독자 편지함</div>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] leading-tight text-ink mb-3">
              자주 묻는 질문
            </h2>
            <p className="text-sm text-ink-muted">
              여기 없는 질문은 <a href="mailto:boheme88@naver.com" className="text-orange-600 dark:text-orange-400 hover:underline">boheme88@naver.com</a>로 보내주세요.
            </p>
          </div>
          <div className="space-y-0 border-y border-rule">
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
              <details key={item.q} className="group border-b border-rule-soft last:border-b-0">
                <summary className="cursor-pointer list-none py-5 flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg sm:text-xl text-ink leading-snug pr-4">{item.q}</span>
                  <svg className="w-5 h-5 text-ink-faint flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="pb-5 pr-9 text-sm text-ink-muted leading-[1.8]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="bg-ink dark:bg-paper-deep text-paper">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="ed-eyebrow justify-center inline-flex mb-5" style={{ color: 'var(--accent)' }}>
            오늘의 마지막 한 줄
          </div>
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.1] mb-6 italic text-paper">
            오늘 한 편을 시작하면<br />
            한 달 뒤에 서른 편이 쌓입니다.
          </h2>
          <p className="text-paper/70 mb-10 text-base sm:text-lg max-w-md mx-auto leading-[1.7]">
            회원가입 없이도 키워드 분석부터 시작할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/keyword-analysis"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold tracking-wider uppercase transition-colors"
            >
              키워드 분석으로 시작
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/lab/post_11"
              className="inline-flex items-center justify-center px-8 py-4 border border-paper/50 hover:border-paper text-paper text-sm font-bold tracking-wider uppercase transition-colors"
            >
              사용 가이드 읽기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
