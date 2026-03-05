'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  postdate: string;
}

interface AnalysisResult {
  totalPosts: number;
  topPosts: BlogPost[];
  averageTitleLength: number;
  commonWords: Array<{ word: string; count: number }>;
  topBloggers: Array<{ name: string; count: number }>;
  dateDistribution: Record<string, number>;
}

export default function CompetitorAnalysisPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeCompetitors = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), limit: 50 }),
      });

      if (!response.ok) {
        throw new Error('분석에 실패했습니다.');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}년 ${dateStr.substring(4, 6)}월 ${dateStr.substring(6, 8)}일`;
    } else if (dateStr.length === 6) {
      return `${dateStr.substring(0, 4)}년 ${dateStr.substring(4, 6)}월`;
    }
    return dateStr;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            경쟁 블로그 분석
          </h1>
          <p className="text-gray-600">
            특정 키워드로 상위 노출된 블로그 포스트를 분석하여 경쟁력을 파악하세요
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeCompetitors()}
              placeholder="분석할 키워드를 입력하세요 (예: 블로그 포스팅, SEO 최적화)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <button
              onClick={analyzeCompetitors}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? '분석 중...' : '분석하기'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">경쟁 블로그를 분석하는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* 통계 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <div className="text-sm text-gray-600 mb-1">전체 포스트 수</div>
                <div className="text-3xl font-bold text-blue-600">{data.totalPosts.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <div className="text-sm text-gray-600 mb-1">평균 제목 길이</div>
                <div className="text-3xl font-bold text-green-600">{data.averageTitleLength}자</div>
              </div>
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <div className="text-sm text-gray-600 mb-1">분석된 포스트</div>
                <div className="text-3xl font-bold text-purple-600">{data.topPosts.length}개</div>
              </div>
            </div>

            {/* 자주 사용되는 단어 */}
            {data.commonWords.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  자주 사용되는 단어 (키워드 제외)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.commonWords.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {item.word} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 상위 블로거 */}
            {data.topBloggers.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  상위 노출 블로거
                </h2>
                <div className="space-y-2">
                  {data.topBloggers.map((blogger, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{blogger.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{blogger.count}개 포스트</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상위 포스트 목록 */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  상위 노출 포스트 TOP {data.topPosts.length}
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {data.topPosts.map((post, idx) => (
                  <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                          idx < 3 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                            dangerouslySetInnerHTML={{ __html: post.title }}
                          />
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {post.description.replace(/<[^>]*>/g, '')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👤 {post.bloggername}</span>
                          <span>📅 {formatDate(post.postdate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 인사이트 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 분석 인사이트</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• 평균 제목 길이: <strong>{data.averageTitleLength}자</strong> - 이 길이를 참고하여 제목을 작성하세요</li>
                <li>• 자주 사용되는 단어를 활용하면 검색 노출 가능성이 높아집니다</li>
                <li>• 상위 블로거들의 포스팅 패턴을 참고하여 콘텐츠 전략을 수립하세요</li>
                <li>• 경쟁이 치열한 키워드입니다. 차별화된 콘텐츠가 필요합니다</li>
              </ul>
            </div>
          </div>
        )}

        {/* 사용 가이드 */}
        {!data && !loading && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">사용 방법</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <span>분석하고 싶은 키워드를 입력하세요</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <span>네이버 블로그에서 상위 노출된 포스트들을 자동으로 분석합니다</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <span>경쟁 포스트의 제목, 내용, 블로거 정보를 확인하여 차별화 전략을 수립하세요</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

