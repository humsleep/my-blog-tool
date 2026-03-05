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
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            경쟁 블로그 분석
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            특정 키워드로 상위 노출된 블로그 포스트를 분석하여 경쟁력을 파악하세요
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeCompetitors()}
              placeholder="분석할 키워드를 입력하세요 (예: 블로그 포스팅, SEO 최적화)"
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              onClick={analyzeCompetitors}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '분석 중...' : '분석하기'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">경쟁 블로그를 분석하는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* 통계 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">전체 포스트 수</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{data.totalPosts.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">평균 제목 길이</div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.averageTitleLength}자</div>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">분석된 포스트</div>
                <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{data.topPosts.length}개</div>
              </div>
            </div>

            {/* 자주 사용되는 단어 */}
            {data.commonWords.length > 0 && (
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  자주 사용되는 단어 <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">(키워드 제외)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.commonWords.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800"
                    >
                      {item.word} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 상위 블로거 */}
            {data.topBloggers.length > 0 && (
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">상위 노출 블로거</h2>
                <div className="space-y-2">
                  {data.topBloggers.map((blogger, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{blogger.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{blogger.count}개 포스트</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상위 포스트 목록 */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  상위 노출 포스트 TOP {data.topPosts.length}
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {data.topPosts.map((post, idx) => (
                  <div key={idx} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold ${
                          idx < 3
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                            dangerouslySetInnerHTML={{ __html: post.title }}
                          />
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-2 line-clamp-2">
                          {post.description.replace(/<[^>]*>/g, '')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
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
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">💡 분석 인사이트</h3>
              <ul className="space-y-1.5 text-sm text-indigo-700 dark:text-indigo-400">
                <li>• 평균 제목 길이: <strong>{data.averageTitleLength}자</strong> — 이 길이를 참고하여 제목을 작성하세요</li>
                <li>• 자주 사용되는 단어를 활용하면 검색 노출 가능성이 높아집니다</li>
                <li>• 상위 블로거들의 포스팅 패턴을 참고하여 콘텐츠 전략을 수립하세요</li>
                <li>• 경쟁이 치열한 키워드입니다. 차별화된 콘텐츠가 필요합니다</li>
              </ul>
            </div>
          </div>
        )}

        {/* 사용 가이드 */}
        {!data && !loading && (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">사용 방법</h2>
            <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              {[
                '분석하고 싶은 키워드를 입력하세요',
                '네이버 블로그에서 상위 노출된 포스트들을 자동으로 분석합니다',
                '경쟁 포스트의 제목, 내용, 블로거 정보를 확인하여 차별화 전략을 수립하세요',
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

