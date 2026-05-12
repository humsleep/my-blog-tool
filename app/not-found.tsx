import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없어요 — Boheme BlogLab',
  robots: { index: false, follow: false },
};

const QUICK_LINKS = [
  { href: '/keyword-analysis', label: '키워드 분석', desc: '검색량 · 경쟁률' },
  { href: '/blog-diagnose', label: '블로그 진단', desc: '내 블로그 점수' },
  { href: '/ai-writer', label: 'AI 글쓰기', desc: 'Claude 자동 작성' },
  { href: '/trending', label: '인기 검색어', desc: '실시간 트렌드' },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-xs font-semibold text-orange-700 dark:text-orange-300 mb-4">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          주소가 잘못되었거나, 페이지가 이동·삭제되었을 수 있어요.<br />
          아래에서 자주 쓰는 도구로 바로 이동해보세요.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6 text-left">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group block rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-300 dark:hover:border-orange-700 transition-colors p-3"
            >
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                {l.label}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{l.desc}</div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Link href="/" className="btn-base btn-primary btn-md">홈으로</Link>
          <Link href="/contact" className="btn-base btn-ghost btn-md">문의하기</Link>
        </div>
      </div>
    </div>
  );
}
