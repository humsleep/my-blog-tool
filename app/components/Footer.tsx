import Link from 'next/link';

/**
 * 미니멀 Footer — 한 줄 구성.
 *  좌: 브랜드 마크 + © · 우: 약관 · 개인정보 · 문의
 *  도구·커뮤니티 네비게이션은 Navbar / MobileBottomNav 가 담당하므로
 *  Footer에는 법무 + 연락처만 남긴다 (modern SaaS 트렌드).
 */
export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs leading-none">B</span>
            </div>
            <span className="text-zinc-600 dark:text-zinc-400">
              © 2026 <span className="font-semibold text-zinc-900 dark:text-zinc-100">Boheme BlogLab</span>
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: '/about',                                             label: '소개' },
              { href: '/terms',                                             label: '이용약관' },
              { href: '/privacy',                                           label: '개인정보처리방침' },
              { href: 'mailto:boheme88@naver.com?subject=사이트 개선 제안', label: '문의' },
            ].map((item) => (
              item.href.startsWith('mailto:') ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
