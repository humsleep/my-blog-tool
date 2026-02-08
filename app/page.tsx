import Link from 'next/link';
import AdPlaceholder from './components/AdPlaceholder';

export default function Home() {
  const features = [
    {
      title: '키워드 분석',
      description: '블로그 포스트에 적합한 키워드를 분석하고 추천합니다.',
      href: '/keyword-analysis',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: '프롬프트 생성',
      description: '키워드와 옵션을 선택하여 블로그 글 작성을 위한 최적의 프롬프트를 생성합니다.',
      href: '/prompt-generator',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: '금칙어 검사기',
      description: '실시간 글자 수 세기와 금칙어 검사 기능이 있는 전문적인 에디터입니다.',
      href: '/editor',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: '이미지 편집',
      description: '이미지 리사이징과 모자이크 처리 등 간단한 편집 기능을 제공합니다.',
      href: '/image-tools',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            블로그 포스팅 도우미
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            전문적인 블로그 포스트를 만들기 위한 필수 도구들을 한 곳에서 만나보세요
          </p>
        </div>

        {/* Ad Banner */}
        <div className="mb-12">
          <AdPlaceholder size="banner" />
        </div>

        {/* Site Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
              블로그 포스팅의 모든 과정을 한 곳에서
            </h2>
            <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
              이 사이트는 실제 블로그 포스팅 순서에 맞게 구성되어 있습니다.
              <br />
              처음부터 끝까지 체계적으로 블로그 포스트를 완성할 수 있습니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/keyword-analysis"
                className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">키워드 찾기</h3>
                  <p className="text-gray-600 text-sm whitespace-nowrap">
                    적합한 키워드를 분석하고 경쟁률을 확인합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/prompt-generator"
                className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">프롬프트 생성</h3>
                  <p className="text-gray-600 text-sm">
                    찾은 키워드로 포스팅하기 위한 최적의 프롬프트를 생성합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/editor"
                className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">금칙어 검사</h3>
                  <p className="text-gray-600 text-sm">
                    작성한 포스팅 내용에 대해 금칙어를 검사하고 수정합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/image-tools"
                className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">이미지 편집</h3>
                  <p className="text-gray-600 text-sm">
                    포스팅에 들어가는 이미지를 편집하고 최적화합니다.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>

        {/* Ad Banner */}
        <div className="mb-12">
          <AdPlaceholder size="banner" />
        </div>
      </div>
    </div>
  );
}
