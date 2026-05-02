import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '커뮤니티 - Boheme BlogLab',
  description: '서이추, 정보 공유, 체험단 동행 — 블로거들이 모이는 공간.',
};

interface MenuCard {
  href: string;
  emoji: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  iconBg: string;
  span?: string;
}

const MENUS: MenuCard[] = [
  {
    href: '/community/swap',
    emoji: '🤝',
    title: '서이추 해요',
    description: '같은 분야 블로거를 만나 서로이웃 추가하세요. 분야와 닉네임으로 빠르게 찾을 수 있습니다.',
    badge: '매칭',
    gradient: 'from-orange-50 via-orange-50 to-amber-50 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-amber-950/30',
    iconBg: 'bg-orange-100 dark:bg-orange-950/60',
    span: 'md:col-span-2',
  },
  {
    href: '/community/tips',
    emoji: '💡',
    title: '정보 공유',
    description: '운영 노하우·질문·트러블슈팅을 자유롭게 나눠요.',
    badge: '게시판',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
  },
  {
    href: '/community/companions',
    emoji: '🚶‍♂️',
    title: '체험단 동행해요',
    description: '체험단 선정 후 함께 갈 동행자를 지역·날짜로 찾아보세요.',
    badge: '동행',
    gradient: 'from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
  },
];

export default function CommunityHubPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-6 pb-10 sm:pt-8 sm:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Community
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            블로거들이 모이는 곳
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            서이추로 이웃 늘리고, 운영 정보 나누고, 체험단 동행자도 함께 찾아보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${menu.gradient} border border-white/60 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${menu.span ?? ''}`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/30 dark:bg-white/5 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${menu.iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
                    {menu.emoji}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 px-2 py-1 rounded-full">
                    {menu.badge}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {menu.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {menu.description}
                </p>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                  바로가기
                  <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: '읽기는 누구나', desc: '비로그인도 모든 글을 볼 수 있어요.', icon: '👀' },
            { title: '쓰기는 로그인', desc: '닉네임 등록 후 자유롭게 작성하세요.', icon: '✍️' },
            { title: '안전한 만남', desc: '체험단 동행은 오픈채팅으로 시작하세요.', icon: '🛡️' },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 flex items-start gap-3"
            >
              <div className="text-2xl">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
