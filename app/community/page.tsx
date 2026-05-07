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
}

const MENUS: MenuCard[] = [
  {
    href: '/community/swap',
    num: '01',
    title: '서이추 해요',
    description: '같은 분야 블로거를 만나 서로이웃 추가합니다. 분야와 닉네임으로 빠르게 찾을 수 있어요. 1일 1글 제한으로 광고 도배가 없습니다.',
    badge: 'Matching',
  },
  {
    href: '/community/companions',
    num: '02',
    title: '체험단 동행해요',
    description: '체험단 선정 후 함께 갈 동행자를 지역·날짜로 찾습니다. 시·군·구까지 좁혀서 검색할 수 있어요.',
    badge: 'Companion',
  },
];

export default function CommunityHubPage() {
  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <span>Community — 한국 블로거 커뮤니티</span>
          <span>읽기 무료 · 쓰기 회원</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Hero */}
        <header className="mb-14 max-w-4xl">
          <div className="ed-eyebrow mb-4">Forum</div>
          <h1 className="text-2xl sm:text-3xl sm:text-3xl lg:text-3xl sm:text-4xl leading-[0.95] tracking-tight text-ink mb-5">
            블로거들이<br />
            <span className="text-slate-500 dark:text-slate-400">모이는 곳</span>
          </h1>
          <p className="text-lg sm:text-xl text-ink-muted leading-[1.6] max-w-[58ch]">
            서이추로 이웃을 늘리고, 운영 정보를 나누고, 체험단 동행자도 함께 찾는 한 줄짜리 커뮤니티.
          </p>
        </header>

        <hr className="ed-rule mb-10" />

        {/* Menu — two large editorial cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule-soft border border-rule-soft mb-16">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group relative bg-paper hover:bg-paper-deep transition-colors p-8 sm:p-10"
            >
              <div className="flex items-baseline justify-between mb-6">
                <span className="text-5xl text-ink-faint group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-none">
                  {menu.num}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-faint">
                  {menu.badge}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-3 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {menu.title}
              </h2>
              <p className="text-sm sm:text-base text-ink-muted leading-[1.7] mb-6">
                {menu.description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-ink group-hover:text-orange-600 dark:group-hover:text-orange-400 border-b border-ink group-hover:border-orange-600 dark:group-hover:border-orange-400 pb-0.5 transition-colors">
                바로가기
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Three notes */}
        <div className="ed-ornament mb-8">— 커뮤니티 규칙 —</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { title: '읽기는 누구나', desc: '비로그인도 모든 글을 볼 수 있습니다.' },
            { title: '쓰기는 로그인', desc: 'Google 로그인 후 닉네임을 등록하면 자유롭게 작성할 수 있습니다.' },
            { title: '안전한 만남', desc: '체험단 동행은 오픈채팅 링크로 시작하고, 개인정보는 본문에 적지 마세요.' },
          ].map((item, i) => (
            <div key={item.title} className={i < 2 ? 'sm:pr-8 sm:border-r sm:border-rule-soft' : ''}>
              <div className="text-orange-600 dark:text-orange-400 text-2xl mb-3">{`§ ${i + 1}`}</div>
              <h3 className="text-lg font-semibold text-ink mb-2">{item.title}</h3>
              <p className="text-sm text-ink-muted leading-[1.7]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
