'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };
  const features = [
    {
      title: '경쟁 블로그 분석',
      description: '상위 노출된 경쟁 블로그 포스트를 분석하여 차별화 전략을 수립하세요.',
      href: '/competitor-analysis',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      highlight: true,
    },
    {
      title: '포스팅 연구실',
      description: '블로그 포스팅 관련 연구와 실험 결과를 공유하는 공간입니다.',
      href: '/lab',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            블로그 포스팅 도우미
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2 mb-8 sm:mb-10">
            전문적인 블로그 포스트를 만들기 위한 필수 도구들을 한 곳에서 만나보세요
          </p>
          
          {/* 키워드 검색창 - 눈에 띄게 강조 */}
          <div className="max-w-3xl mx-auto px-4 mb-8 sm:mb-12">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-3 sm:mb-4 shadow-lg">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                  키워드 분석 시작하기
                </h2>
                <p className="text-blue-50 text-sm sm:text-base">
                  검색량, 경쟁률, 문서 수를 한 번에 확인하세요
                </p>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="키워드를 입력하세요 (예: 블로그 포스팅, SEO 최적화)"
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 text-base sm:text-lg md:text-xl border-0 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-lg bg-white text-gray-900 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>분석하기</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Site Introduction */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center px-2">
              블로그 포스팅의 모든 과정을 한 곳에서
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8 text-center leading-relaxed px-2">
              이 사이트는 실제 블로그 포스팅 순서에 맞게 구성되어 있습니다.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              처음부터 끝까지 체계적으로 블로그 포스트를 완성할 수 있습니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Link
                href="/keyword-analysis"
                className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-base">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-sm">키워드 찾기</h3>
                  <p className="text-gray-600 text-sm sm:text-xs">
                    적합한 키워드를 분석하고 경쟁률을 확인합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/prompt-generator"
                className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-base">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-sm">프롬프트 생성</h3>
                  <p className="text-gray-600 text-sm sm:text-xs">
                    찾은 키워드로 포스팅하기 위한 최적의 프롬프트를 생성합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/editor"
                className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-base">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-sm">금칙어 검사</h3>
                  <p className="text-gray-600 text-sm sm:text-xs">
                    작성한 포스팅 내용에 대해 금칙어를 검사하고 수정합니다.
                  </p>
                </div>
              </Link>
              
              <Link
                href="/image-tools"
                className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-base">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-sm">이미지 편집</h3>
                  <p className="text-gray-600 text-sm sm:text-xs">
                    포스팅에 들어가는 이미지를 편집하고 최적화합니다.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Trending Keywords Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🔥 실시간 인기 검색어 트렌드
            </h2>
            <p className="text-purple-50 text-sm sm:text-base">
              네이버 검색광고 API 기반 인기 검색어를 확인하고 블로그 포스팅에 활용하세요
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/trending"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              인기 검색어 보기
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {features.map((feature) => {
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="bg-white rounded-lg shadow-md hover:shadow-lg active:shadow-xl transition-all p-5 sm:p-6 border border-gray-100 hover:border-blue-200 touch-manipulation"
              >
                <div className="text-blue-600 mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
