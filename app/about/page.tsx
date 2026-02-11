import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개 - Boheme PostLab',
  description: 'Boheme PostLab은 네이버/티스토리 블로거를 위한 전문적인 포스팅 도구를 제공합니다.',
};

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">서비스 소개</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Boheme PostLab이란?</h2>
              <p>
                Boheme PostLab은 네이버 블로그와 티스토리 블로거를 위한 전문적인 포스팅 도구 모음 서비스입니다. 
                블로그 포스트 작성에 필요한 다양한 기능을 한 곳에서 제공하여, 더 효율적이고 품질 높은 콘텐츠를 만들 수 있도록 도와드립니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 서비스</h2>
              
              <div className="space-y-6 mt-6">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. 키워드 분석</h3>
                  <p className="text-gray-700">
                    블로그 포스트에 적합한 키워드를 분석하고 추천합니다. 네이버 검색광고 API를 활용하여 
                    검색량, 경쟁도, 문서 수 등을 종합적으로 분석하여 최적의 키워드를 찾을 수 있습니다.
                  </p>
                  <Link href="/keyword-analysis" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    키워드 분석 도구 사용하기 →
                  </Link>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. 프롬프트 생성</h3>
                  <p className="text-gray-700">
                    AI 도구를 활용한 블로그 글 작성을 위한 최적의 프롬프트를 생성합니다. 
                    키워드, 분야, 스타일, 타겟 독자 등을 선택하면 네이버 블로그 상위 노출을 위한 
                    최적화된 프롬프트가 자동으로 생성됩니다.
                  </p>
                  <Link href="/prompt-generator" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    프롬프트 생성 도구 사용하기 →
                  </Link>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. 금칙어 검사기</h3>
                  <p className="text-gray-700">
                    실시간 글자 수 세기와 금칙어 검사 기능이 있는 전문적인 에디터입니다. 
                    네이버 블로그 정책에 위배될 수 있는 금칙어를 자동으로 검사하고, 
                    글자 수를 실시간으로 확인할 수 있습니다.
                  </p>
                  <Link href="/editor" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    금칙어 검사기 사용하기 →
                  </Link>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4. 이미지 편집</h3>
                  <p className="text-gray-700">
                    이미지 리사이징, 모자이크 처리 등 블로그 포스트에 필요한 간단한 이미지 편집 기능을 제공합니다. 
                    별도의 이미지 편집 프로그램 없이 웹 브라우저에서 바로 이미지를 편집할 수 있습니다.
                  </p>
                  <Link href="/image-tools" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    이미지 편집 도구 사용하기 →
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">서비스 특징</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>무료 사용:</strong> 모든 기능을 무료로 제공합니다.</li>
                <li><strong>간편한 사용:</strong> 복잡한 설치나 가입 없이 바로 사용할 수 있습니다.</li>
                <li><strong>실시간 처리:</strong> 모든 작업이 브라우저에서 실시간으로 처리됩니다.</li>
                <li><strong>개인정보 보호:</strong> 사용자의 개인정보를 수집하지 않습니다.</li>
                <li><strong>지속적 개선:</strong> 사용자 피드백을 반영하여 지속적으로 서비스를 개선합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이용 대상</h2>
              <p>
                Boheme PostLab은 다음과 같은 분들에게 유용합니다:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>네이버 블로그 운영자</li>
                <li>티스토리 블로그 운영자</li>
                <li>블로그 포스팅을 준비하는 콘텐츠 크리에이터</li>
                <li>SEO 최적화가 필요한 블로거</li>
                <li>효율적인 포스팅 작성 도구를 찾는 사용자</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">문의 및 제안</h2>
              <p>
                서비스 개선을 위한 제안이나 문의사항이 있으시면 언제든지 연락주세요.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-medium text-gray-900">이메일</p>
                <a 
                  href="mailto:boheme88@naver.com?subject=서비스 개선 제안"
                  className="text-blue-600 hover:text-blue-700"
                >
                  boheme88@naver.com
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">개인정보처리방침</h2>
              <p>
                본 사이트의 개인정보 처리에 대한 자세한 내용은 개인정보처리방침을 참고해주세요.
              </p>
              <Link 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                개인정보처리방침 보기 →
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

