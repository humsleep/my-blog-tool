'use client';

import { useState } from 'react';
import Link from 'next/link';
import GuideSection from '../components/GuideSection';

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

            {/* 💡 분석 인사이트 — 통계 바로 아래 */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">💡 분석 인사이트</h3>
              <ul className="space-y-1.5 text-sm text-indigo-700 dark:text-indigo-400">
                <li>• 평균 제목 길이: <strong>{data.averageTitleLength}자</strong> — 이 길이를 참고하여 제목을 작성하세요</li>
                <li>• 자주 사용되는 단어를 활용하면 검색 노출 가능성이 높아집니다</li>
                <li>• 상위 블로거들의 포스팅 패턴을 참고하여 콘텐츠 전략을 수립하세요</li>
                <li>• 경쟁이 치열한 키워드입니다. 차별화된 콘텐츠가 필요합니다</li>
              </ul>
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

        {/* 가이드 콘텐츠 */}
        <GuideSection
          title="경쟁 블로그 분석으로 차별화된 콘텐츠 전략 세우기"
          items={[
            {
              title: '경쟁 블로그 분석이 중요한 이유',
              content: `블로그 운영에서 가장 흔한 실수 중 하나는 '좋은 글을 쓰면 알아서 노출된다'는 믿음입니다. 현실은 다릅니다. 같은 키워드로 이미 수십 개의 블로그가 경쟁하고 있으며, 이들의 패턴을 모르고 글을 쓰는 것은 눈을 감고 과녁을 맞히려는 것과 같습니다.

경쟁 블로그 분석은 상위 노출된 블로거들이 어떤 제목을 쓰고, 어떤 단어를 반복 사용하며, 어떤 구조로 글을 작성하는지 파악하는 과정입니다. 이 데이터를 바탕으로 더 나은 전략을 수립하면, 같은 시간을 투자하고도 훨씬 높은 성과를 거둘 수 있습니다.`,
            },
            {
              title: '분석 결과에서 읽어야 할 핵심 지표',
              content: `평균 제목 길이: 상위 노출 블로그의 평균 제목 글자 수를 참고하세요. 네이버는 약 30~40자 길이의 제목을 선호하는 경향이 있습니다. 너무 짧으면 정보가 부족하고, 너무 길면 잘립니다.

자주 사용되는 단어: 상위 블로거들이 공통으로 사용하는 단어는 네이버 알고리즘이 해당 키워드와 관련 있다고 판단하는 단어입니다. 이 단어들을 자연스럽게 본문에 포함시키면 주제 연관성이 높아집니다.

블로거 분포: 파워블로거와 일반 블로거 비율을 확인하세요. 파워블로거가 많은 키워드는 경쟁이 치열하므로, 틈새 키워드나 롱테일 키워드로 우회하는 전략이 효과적입니다.`,
            },
            {
              title: '차별화된 콘텐츠를 만드는 실전 전략',
              content: `경쟁 분석이 끝났다면 이제 차별화 전략을 수립할 차례입니다.

구조 차별화: 경쟁 블로그가 일반적인 나열식이라면 비교표, Q&A 형식 등 독자가 정보를 빠르게 찾을 수 있는 구조를 활용하세요.

깊이 차별화: 표면적인 정보만 다루는 경쟁 블로그보다 더 심층적인 내용을 담으세요. 실제 경험, 수치, 사례를 추가하면 독자의 신뢰도가 높아집니다.

키워드 조합 차별화: 분석에서 나온 자주 쓰는 단어를 참고하되, 경쟁자가 미처 다루지 않은 세부 키워드를 조합하여 틈새 시장을 공략하세요.`,
            },
            {
              title: '경쟁 분석을 통한 블로그 성장 사이클',
              content: `경쟁 블로그 분석은 한 번으로 끝나는 작업이 아닙니다. 포스팅 전에 분석하고, 포스팅 후 2~4주가 지나면 내 글의 순위를 확인하고, 다시 경쟁자 현황을 체크하는 지속적인 사이클이 필요합니다.

꾸준히 이 과정을 반복하면 어떤 유형의 콘텐츠가 내 블로그와 독자에게 더 잘 맞는지 데이터로 확인할 수 있게 됩니다. 경험이 쌓일수록 분석 시간은 줄어들고 포스팅의 품질과 노출률은 높아집니다.`,
            },
          ]}
        />
      </div>
    </div>
  );
}

