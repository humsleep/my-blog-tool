'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsPanel from '../components/NewsPanel';
import FlowNav from '../components/FlowNav';
import HorizontalBarList from '../components/charts/HorizontalBarList';
import MonthlyDistribution from '../components/charts/MonthlyDistribution';
import { clientFetchJson, ApiError } from '../lib/clientFetch';
import { sanitizeSearchHighlight } from '../lib/format/article-formats';

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

function CompetitorAnalysisContent() {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedKeyword, setAnalyzedKeyword] = useState<string>('');
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);

  useEffect(() => {
    const kw = searchParams.get('keyword');
    if (kw) {
      setKeyword(kw);
      setShouldAutoAnalyze(true);
    }
  }, [searchParams]);

  const analyzeCompetitors = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await clientFetchJson<AnalysisResult>('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), limit: 50 }),
      });
      setData(result);
      setAnalyzedKeyword(keyword.trim());
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : '알 수 없는 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldAutoAnalyze && keyword.trim() && !loading) {
      setShouldAutoAnalyze(false);
      analyzeCompetitors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoAnalyze, keyword]);

  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}년 ${dateStr.substring(4, 6)}월 ${dateStr.substring(6, 8)}일`;
    } else if (dateStr.length === 6) {
      return `${dateStr.substring(0, 4)}년 ${dateStr.substring(4, 6)}월`;
    }
    return dateStr;
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
            상위노출 분석
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            네이버 상위 노출 블로그 포스트를 분석하여 제목 길이·사용 단어·상위 블로거 패턴을 파악하세요
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeCompetitors()}
              placeholder="분석할 키워드를 입력하세요 (예: 블로그 포스팅, SEO 최적화)"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            <button
              onClick={analyzeCompetitors}
              disabled={loading}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '분석 중...' : '분석하기'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 dark:border-orange-400 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">경쟁 블로그를 분석하는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={analyzeCompetitors}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors whitespace-nowrap"
            >
              다시 시도
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* 통계 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">전체 포스트 수</div>
                <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">{data.totalPosts.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">평균 제목 길이</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{data.averageTitleLength}자</div>
              </div>
              <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">분석된 포스트</div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{data.topPosts.length}개</div>
              </div>
            </div>

            {/* 💡 분석 인사이트 — 통계 바로 아래 */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-xl p-5">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">💡 분석 인사이트</h3>
              <ul className="space-y-1.5 text-sm text-orange-600 dark:text-orange-400">
                <li>• 평균 제목 길이: <strong>{data.averageTitleLength}자</strong> — 이 길이를 참고하여 제목을 작성하세요</li>
                <li>• 자주 사용되는 단어를 활용하면 검색 노출 가능성이 높아집니다</li>
                <li>• 상위 블로거들의 포스팅 패턴을 참고하여 콘텐츠 전략을 수립하세요</li>
                <li>• 경쟁이 치열한 키워드입니다. 차별화된 콘텐츠가 필요합니다</li>
              </ul>
            </div>

            {/* 발행 시간 분포 — Recharts 월별 막대 (Phase 33) */}
            {Object.keys(data.dateDistribution).length > 0 && (
              <div className="bg-white dark:bg-[#221c17] rounded-xl border border-zinc-200 dark:border-[#2e2723] p-5 shadow-sm">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">발행 시간 분포</h2>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">월별 누적 포스트 수</span>
                </div>
                <MonthlyDistribution data={data.dateDistribution} height={200} />
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  최근 발행이 활발한 시점을 잡아 같은 흐름을 이어가면 노출에 유리합니다.
                </p>
              </div>
            )}

            {/* 자주 사용되는 단어 — 가로 막대 시각화 */}
            {data.commonWords.length > 0 && (
              <div className="bg-white dark:bg-[#221c17] rounded-xl border border-zinc-200 dark:border-[#2e2723] p-5 shadow-sm">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    자주 사용되는 단어 <span className="text-zinc-500 dark:text-zinc-400 font-normal text-sm">(키워드 제외)</span>
                  </h2>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:inline">상위 {Math.min(15, data.commonWords.length)}개</span>
                </div>
                <HorizontalBarList
                  items={data.commonWords.slice(0, 15).map((w, i) => ({
                    rank: i + 1,
                    label: w.word,
                    value: w.count,
                    display: `${w.count}회`,
                  }))}
                />
              </div>
            )}

            {/* 상위 블로거 — 가로 막대 시각화 */}
            {data.topBloggers.length > 0 && (
              <div className="bg-white dark:bg-[#221c17] rounded-xl border border-zinc-200 dark:border-[#2e2723] p-5 shadow-sm">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">상위 노출 블로거</h2>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">블로거별 포스트 수</span>
                </div>
                <HorizontalBarList
                  items={data.topBloggers.map((b, i) => ({
                    rank: i + 1,
                    label: b.name,
                    value: b.count,
                    display: `${b.count}개`,
                  }))}
                />
              </div>
            )}

            {/* 상위 포스트 목록 */}
            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  상위 노출 포스트 TOP {data.topPosts.length}
                </h2>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                {data.topPosts.map((post, idx) => (
                  <div key={idx} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold ${
                          idx < 3
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 text-sm">
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-500 dark:hover:text-orange-400 hover:underline"
                            dangerouslySetInnerHTML={{ __html: sanitizeSearchHighlight(post.title) }}
                          />
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 line-clamp-2">
                          {post.description.replace(/<[^>]*>/g, '')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
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
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">사용 방법</h2>
            <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {[
                '분석하고 싶은 키워드를 입력하세요',
                '네이버 블로그에서 상위 노출된 포스트들을 자동으로 분석합니다',
                '경쟁 포스트의 제목, 내용, 블로거 정보를 확인하여 차별화 전략을 수립하세요',
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 📰 이 키워드 관련 최신 뉴스 */}
        {data && analyzedKeyword && (
          <div className="mt-5">
            <NewsPanel keyword={analyzedKeyword} display={10} sort="date" />
          </div>
        )}

        {/* 다음 단계 */}
        <FlowNav
          currentStep={3}
          totalSteps={8}
          stepLabel="상위노출 분석"
          note={analyzedKeyword
            ? `"${analyzedKeyword}" 키워드로 바로 프롬프트를 생성할 수 있습니다.`
            : '키워드 분석이 끝났다면 프롬프트 생성으로 이동하세요.'}
          actions={[
            {
              href: analyzedKeyword
                ? `/prompt-generator?keyword=${encodeURIComponent(analyzedKeyword)}`
                : '/prompt-generator',
              label: '프롬프트 생성하기',
              description: 'AI 글쓰기용 맞춤 프롬프트',
            },
            {
              href: '/keyword-analysis',
              label: '키워드 추가 분석',
              description: '다른 키워드 더 분석하기',
              variant: 'secondary',
            },
          ]}
        />

                {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <a
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            더 자세한 사용법은 연구실에서 확인하세요
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-500 dark:text-zinc-400">로딩 중...</div>
      </div>
    }>
      <CompetitorAnalysisContent />
    </Suspense>
  );
}
