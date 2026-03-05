import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Boheme <span className="text-indigo-600 dark:text-indigo-400">BlogLab</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              전문적인 블로그 포스팅을 위한<br />필수 도구 모음입니다.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">서비스</h3>
            <ul className="space-y-2">
              {[
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
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">문의</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <a
                  href="mailto:boheme88@naver.com?subject=사이트 개선 제안"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  boheme88@naver.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/80">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <p>&copy; 2026 Boheme BlogLab. All rights reserved.</p>
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
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
