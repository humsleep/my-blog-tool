import Link from 'next/link';

/** Modern SaaS Footer (Phase 27) — 매거진 colophon 제거. */
export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand row */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-base leading-none">B</span>
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">
              Boheme<span className="text-blue-500 dark:text-blue-400 ml-1">BlogLab</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 leading-tight">한국 블로거를 위한 글쓰기 분석 도구</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-3">소개</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              네이버·티스토리 블로거가 키워드 리서치부터 이미지 편집까지 한 도구에서 끝낼 수 있도록 만들어졌습니다.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-3">도구</h3>
            <ul className="space-y-2">
              {[
                { href: '/blog-diagnose', label: '블로그 진단' },
                { href: '/keyword-analysis', label: '키워드 분석' },
                { href: '/competitor-analysis', label: '경쟁 블로그 분석' },
                { href: '/trending', label: '인기 검색어' },
                { href: '/prompt-generator', label: '프롬프트 생성' },
                { href: '/editor', label: '금칙어 검사기' },
                { href: '/image-tools', label: '이미지 편집' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-3">문의</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <a
                  href="mailto:boheme88@naver.com?subject=사이트 개선 제안"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  boheme88@naver.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
            <p>© 2026 Boheme BlogLab. All rights reserved.</p>
            <div className="flex gap-5">
              {[
                { href: '/about', label: '서비스 소개' },
                { href: '/contact', label: '문의하기' },
                { href: '/terms', label: '이용약관' },
                { href: '/privacy', label: '개인정보처리방침' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
