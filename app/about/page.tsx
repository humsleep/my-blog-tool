import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개 - Boheme BlogLab',
  description: 'Boheme BlogLab은 네이버·티스토리 블로거를 위한 데이터 기반 글쓰기 도구를 제공합니다.',
};

/**
 * 운영자 본인 블로그 URL — 신뢰성 신호용 (선택).
 *  설정되어 있으면 §운영자 노트에 링크 칩이 표시되고, 없으면 그 부분만 숨겨진다.
 *  공개해도 무방한 운영자 본인의 네이버 블로그(또는 티스토리) 주소를
 *  Vercel 환경변수 NEXT_PUBLIC_OPERATOR_BLOG_URL 에 입력.
 */
const OPERATOR_BLOG_URL = process.env.NEXT_PUBLIC_OPERATOR_BLOG_URL?.trim() || '';

export default function AboutPage() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">서비스 소개</h1>

          <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Boheme BlogLab이란?</h2>
              <p className="leading-relaxed">
                Boheme BlogLab은 네이버 블로그·티스토리 블로거를 위한 올인원 글쓰기 도구입니다.
                블로그 진단, 키워드 분석, AI 글쓰기, 금칙어·맞춤법 검사, 이미지 검색·편집까지
                — 한국 블로거에게 필요한 데이터 기반 워크플로우를 한 곳에 모았습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">핵심 도구</h2>

              <div className="space-y-5 mt-4">
                {[
                  {
                    n: 1,
                    title: '블로그 진단',
                    desc: '네이버 블로그 RSS와 카테고리 핵심 키워드 30개를 분석해 활동성·노출·품질 3축 점수를 매기고, 30일 액션 플랜까지 자동 추천합니다.',
                    href: '/blog-diagnose',
                    cta: '내 블로그 진단하기',
                  },
                  {
                    n: 2,
                    title: '키워드 분석',
                    desc: '네이버 검색광고 API의 실제 월간 검색량과 블로그 OpenAPI의 발행 문서 수로 검색량·경쟁률·황금 키워드를 한 표에 펼칩니다.',
                    href: '/keyword-analysis',
                    cta: '키워드 분석',
                  },
                  {
                    n: 3,
                    title: 'AI 글쓰기',
                    desc: 'Claude Sonnet 4.6이 6단계로 제목·본문·해시태그·이미지 프롬프트까지 한 번에 만듭니다. 비로그인 1회/일, 로그인 5회/일 무료.',
                    href: '/ai-writer',
                    cta: 'AI 글쓰기',
                  },
                  {
                    n: 4,
                    title: '금칙어·맞춤법',
                    desc: '실시간 글자수 카운트 + 네이버 정책 위반 가능 단어 검사 + LanguageTool 기반 맞춤법 점검까지 발행 전에 한 번에.',
                    href: '/editor',
                    cta: '에디터로 정리',
                  },
                  {
                    n: 5,
                    title: '이미지 검색·편집',
                    desc: 'Pexels·Unsplash 무료 저작권 이미지 통합 검색과 크롭·모자이크·필터 등 간단한 편집 기능을 제공합니다.',
                    href: '/image-search',
                    cta: '이미지 검색',
                  },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="border-l-4 border-orange-500 dark:border-orange-400 pl-4"
                  >
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      {s.n}. {s.title}
                    </h3>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{s.desc}</p>
                    <Link
                      href={s.href}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium mt-2 inline-block"
                    >
                      {s.cta} →
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">서비스 특징</h2>
              <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <li><strong>대부분 무료, 회원가입 없이 시작:</strong> 키워드 분석·인기 검색어·프롬프트 생성·이미지 검색은 회원가입 없이 무제한 사용 가능합니다.</li>
                <li><strong>로그인 시 추가 혜택:</strong> AI 글쓰기 일일 5회, 진단 점수 추적, 즐겨찾기 키워드, 커뮤니티 글 작성을 위해 Google 로그인이 필요합니다.</li>
                <li><strong>실제 데이터 기반:</strong> 네이버 검색광고·OpenAPI·블로그 RSS·PostView 본문을 직접 호출해 추정값이 아닌 실측치를 사용합니다.</li>
                <li><strong>개인정보 최소 수집:</strong> Google OAuth로 받은 이메일과 사용자가 자발적으로 입력한 닉네임·블로그 URL 외 민감정보를 수집하지 않습니다.</li>
                <li><strong>커뮤니티 동행:</strong> 같은 분야 블로거 매칭(서이추), 운영 노하우 공유(정보 공유), 체험단 동행 — 혼자 운영하는 블로거의 동료 찾기를 돕습니다.</li>
                <li><strong>지속적 개선:</strong> 사용자 피드백을 반영해 매주 도구를 업데이트합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">이용 대상</h2>
              <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <li>네이버 블로그·티스토리 운영자</li>
                <li>블로그 포스팅을 준비하는 콘텐츠 크리에이터</li>
                <li>SEO·키워드 전략을 데이터로 검증하고 싶은 블로거</li>
                <li>AI 글쓰기를 효율적으로 활용하고 싶은 사용자</li>
                <li>같은 분야 블로거와 교류하고 싶은 분</li>
              </ul>
            </section>

            {/* ── 운영자 노트 — 신뢰성 신호 ─────────────────────── */}
            <section className="rounded-lg border border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/70 to-amber-50/40 dark:from-orange-950/30 dark:to-amber-950/15 p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-base leading-none">B</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-orange-700 dark:text-orange-300">
                    Founder note
                  </span>
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    운영자도 블로거입니다
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <p>
                  Boheme BlogLab은 <strong>1인 블로거가 직접 만드는 블로거용 도구</strong>입니다.
                  키워드 분석 사이트 여러 개 띄워놓고, 검색량 캡쳐해서 엑셀에 옮기고, AI 글 결과를 다시 다듬느라
                  발행 한 편에 두세 시간씩 쓰던 본인 경험에서 시작됐어요. &ldquo;이 흐름을 한 곳에서 끝낼 수 있다면&rdquo; 하는 생각으로 만들었습니다.
                </p>
                <p>
                  네이버 검색광고·OpenAPI·블로그 RSS·PostView 본문 등 <strong>실제 데이터</strong>만 사용합니다.
                  추정값으로 점수를 매기지 않고, AI에는 사실 검증 안내를 함께 띄워 무비판적인 발행을 막습니다.
                  광고 정책에 위배되는 양산 발행은 사용자를 위해서도, 서비스를 위해서도 권장하지 않습니다.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  운영 원칙 · 도구는 무료로 유지, AI는 비용을 부담할 수 있는 만큼만 / 데이터·계정은 최소 수집·로컬 우선 /
                  사용자 피드백은 한 주 안에 반영하려고 노력합니다.
                </p>
              </div>

              {OPERATOR_BLOG_URL && (
                <div className="mt-4 pt-4 border-t border-orange-200/60 dark:border-orange-900/40">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">운영자 본인 블로그</p>
                  <a
                    href={OPERATOR_BLOG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.656 0l3 3a4 4 0 01-5.656 5.656l-1.102-1.101m-.758-4.899a4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.1-1.1" />
                    </svg>
                    {OPERATOR_BLOG_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">문의 및 제안</h2>
              <p className="leading-relaxed">
                서비스 개선을 위한 제안이나 문의사항이 있으시면 언제든지 연락주세요.
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg mt-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">이메일</p>
                <a
                  href="mailto:boheme88@naver.com?subject=서비스 개선 제안"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                >
                  boheme88@naver.com
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">법적 안내</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/privacy"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  개인정보처리방침 →
                </Link>
                <Link
                  href="/terms"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  이용약관 →
                </Link>
                <Link
                  href="/contact"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  문의 →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
