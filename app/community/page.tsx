import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '커뮤니티 - Boheme BlogLab',
  description: '서이추, 정보 공유, 체험단 동행 — 블로거들이 모이는 공간.',
};

const MENUS = [
  {
    href: '/community/swap',
    title: '서이추 해요',
    description: '같은 분야 블로거를 만나 서로이웃 추가하세요. 분야·닉네임으로 빠르게 찾을 수 있습니다.',
    badge: '매칭',
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    href: '/community/tips',
    title: '정보 공유',
    description: '운영 노하우·질문·트러블슈팅을 자유롭게 나눠요. 카테고리별로 정리된 게시판.',
    badge: '게시판',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/community/companions',
    title: '체험단 동행해요',
    description: '체험단 선정 후 동행자가 필요할 때. 지역·날짜로 함께할 사람을 찾아보세요.',
    badge: '동행',
    accent: 'from-orange-500 to-amber-500',
  },
];

export default function CommunityHubPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">커뮤니티</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5">
            블로거들이 만나서 서로이웃 추가하고, 운영 정보를 나누고, 체험단 동행자를 찾는 공간입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group relative overflow-hidden bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${menu.accent}`} />
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {menu.title}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {menu.badge}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{menu.description}</p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                바로가기
                <svg className="ml-1.5 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
          <p className="font-medium mb-1">커뮤니티 이용 안내</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>읽기는 누구나 가능합니다. 글쓰기·댓글·좋아요는 로그인 후 닉네임을 등록하면 이용할 수 있습니다.</li>
            <li>광고성·욕설·개인정보 노출 게시물은 관리자가 임의로 삭제할 수 있습니다.</li>
            <li>체험단 동행 시 연락은 가급적 오픈채팅으로 진행해주세요. 전화번호 직접 노출은 권장하지 않습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
