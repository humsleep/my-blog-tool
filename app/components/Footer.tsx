import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-paper-deep border-t border-rule mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Editorial colophon — masthead style */}
        <div className="mb-10">
          <div className="ed-eyebrow mb-3">Colophon</div>
          <div className="flex items-baseline flex-wrap gap-3">
            <span className="font-display italic text-3xl font-semibold text-ink leading-none">
              Boheme
            </span>
            <span className="text-sm font-semibold tracking-[0.22em] uppercase text-orange-600 dark:text-orange-400">
              BlogLab
            </span>
            <span className="text-ink-faint text-sm font-display italic">
              — 한국 블로거를 위한 글쓰기 도구
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t border-rule-soft">
          {/* About */}
          <div>
            <h3 className="ed-byline mb-3">About</h3>
            <p className="text-sm text-ink-muted leading-[1.7]">
              네이버·티스토리 블로거가 키워드 리서치부터 이미지 편집까지<br />한 도구에서 끝낼 수 있도록 만들어졌습니다.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="ed-byline mb-3">Sections</h3>
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
                    className="text-sm text-ink-muted hover:text-ink dark:text-ink-muted dark:hover:text-ink transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="ed-byline mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-ink-muted hover:text-ink dark:text-ink-muted dark:hover:text-ink transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <a
                  href="mailto:boheme88@naver.com?subject=사이트 개선 제안"
                  className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  boheme88@naver.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-rule-soft">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-ink-faint">
            <p className="font-display italic">© 2026 Boheme BlogLab. All rights reserved.</p>
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
                  className="hover:text-ink dark:hover:text-ink transition-colors"
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
