import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '커뮤니티 - Boheme BlogLab',
  description: '서이추, 정보 공유, 체험단 동행 — 블로거들이 모이는 공간.',
};

interface MenuCard {
  href: string;
  num: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
}

const MENUS: MenuCard[] = [
  {
    href: '/community/swap',
    num: '01',
    title: '서이추 해요',
    description: '같은 분야 블로거를 만나 서로이웃 추가합니다. 분야와 닉네임으로 빠르게 찾을 수 있어요. 1일 1글 제한으로 광고 도배가 없습니다.',
    badge: 'Matching',
    icon: (
      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-3a4 4 0 00-4-4H8a4 4 0 00-4 4v3m9-11a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/community/tips',
    num: '02',
    title: '정보 공유',
    description: '블로그 운영 노하우, SEO 팁, 네이버 정책 변경 같은 정보를 카테고리별로 모아 공유합니다. 댓글·좋아요로 좋은 글을 띄워주세요.',
    badge: 'Tips',
    icon: (
      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: '/community/companions',
    num: '03',
    title: '체험단 동행해요',
    description: '체험단 선정 후 함께 갈 동행자를 지역·날짜로 찾습니다. 시·군·구까지 좁혀서 검색할 수 있어요.',
    badge: 'Companion',
    icon: (
      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const RULES = [
  { title: '읽기는 누구나', desc: '비로그인도 모든 글을 볼 수 있습니다.' },
  { title: '쓰기는 로그인', desc: 'Google 로그인 후 닉네임을 등록하면 자유롭게 작성할 수 있습니다.' },
  { title: '안전한 만남', desc: '체험단 동행은 오픈채팅 링크로 시작하고, 개인정보는 본문에 적지 마세요.' },
];

export default function CommunityHubPage() {
  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <span>Community — 한국 블로거 커뮤니티</span>
          <span className="hidden sm:inline">읽기 무료 · 쓰기 회원</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        {/* Hero */}
        <header className="mb-8 sm:mb-14 max-w-4xl">
          <div className="ed-eyebrow mb-4">Forum</div>
          <h1 className="text-2xl sm:text-4xl leading-[1.05] tracking-tight text-ink mb-4 sm:mb-5">
            블로거들이<br />
            <span className="text-zinc-500 dark:text-zinc-400">모이는 곳</span>
          </h1>
          <p className="text-base sm:text-xl text-ink-muted leading-[1.6] max-w-[58ch]">
            서이추로 이웃을 늘리고, 운영 정보를 나누고, 체험단 동행자도 함께 찾는 한 줄짜리 커뮤니티.
          </p>
        </header>

        <hr className="ed-rule mb-8 sm:mb-10" />

        {/* Menu — 모바일에서도 한 줄 3열. 컴팩트(아이콘+제목) → sm 이상은 설명까지 풀카드. */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-12 sm:mb-16">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group flex flex-col items-center text-center rounded-xl border border-rule bg-paper hover:border-orange-300 dark:hover:border-orange-700 hover:bg-paper-deep transition-colors p-3 pt-5 sm:p-8"
            >
              <span className="mb-3 sm:mb-5 inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/70 transition-colors">
                {menu.icon}
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-faint mb-2">
                {menu.badge}
              </span>
              <h2
                className="text-[13px] leading-tight sm:text-xl font-semibold text-ink group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
                style={{ wordBreak: 'keep-all' }}
              >
                {menu.title}
              </h2>
              <p className="hidden sm:block text-sm sm:text-base text-ink-muted leading-[1.7] mt-3">
                {menu.description}
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 mt-5 text-xs font-semibold tracking-wider uppercase text-ink group-hover:text-orange-600 dark:group-hover:text-orange-400 border-b border-ink group-hover:border-orange-600 dark:group-hover:border-orange-400 pb-0.5 transition-colors">
                바로가기
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* 커뮤니티 규칙 — 모바일: 아이콘 리스트(세로 구분선), sm 이상: 3열 카드 */}
        <div className="ed-ornament mb-6 sm:mb-8">— 커뮤니티 규칙 —</div>
        <div className="rounded-xl border border-rule bg-paper overflow-hidden divide-y divide-rule-soft sm:divide-y-0 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-rule-soft">
          {RULES.map((item, i) => (
            <div key={item.title} className="flex items-start gap-3.5 p-4 sm:flex-col sm:gap-0 sm:p-7">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-sm sm:text-base font-bold sm:mb-4">
                {`§${i + 1}`}
              </span>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-ink mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-sm text-ink-muted leading-[1.7]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
