'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GuideSection from '../components/GuideSection';

interface TrendingKeyword {
  rank: number;
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalCount: number;
  category: string;
}

interface TrendingData {
  period: string;
  category: string;
  keywords: TrendingKeyword[];
  total: number;
}

const CATEGORIES = [
  { value: '전체', label: '전체' },
  { value: 'IT/기술', label: 'IT/기술' },
  { value: '요리/음식', label: '요리/음식' },
  { value: '여행', label: '여행' },
  { value: '뷰티/패션', label: '뷰티/패션' },
  { value: '건강/운동', label: '건강/운동' },
  { value: '교육/학습', label: '교육/학습' },
  { value: '경제/투자', label: '경제/투자' },
  { value: '육아/결혼', label: '육아/결혼' },
  { value: '인테리어', label: '인테리어' },
  { value: '반려동물', label: '반려동물' },
  { value: '자동차', label: '자동차' },
  { value: '스포츠', label: '스포츠' },
  { value: '게임', label: '게임' },
  { value: '부동산', label: '부동산' },
  { value: '영화/드라마', label: '영화/드라마' },
];

const PERIODS = [
  { value: 'monthly', label: '월간' },
  { value: 'weekly', label: '주간' },
  { value: 'daily', label: '일간' },
];

export default function TrendingPage() {
  const [category, setCategory] = useState('전체');
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trending-keywords?category=${encodeURIComponent(category)}&period=${period}&limit=50`);
      if (!response.ok) throw new Error('인기 검색어를 불러오는데 실패했습니다.');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingKeywords();
  }, [category, period]);

  const handleKeywordClick = (keyword: string) => {
    window.location.href = `/keyword-analysis?keyword=${encodeURIComponent(keyword)}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            인기 검색어 트렌드
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            네이버 검색광고 API를 활용한 실시간 인기 검색어를 확인하세요
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6 shadow-sm space-y-4">

          {/* 카테고리 칩 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">카테고리</label>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      period === p.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={fetchTrendingKeywords}
                  disabled={loading}
                  className="ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '조회 중...' : '새로고침'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && !data && (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">인기 검색어를 불러오는 중...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results Table */}
        {data && data.keywords.length > 0 && (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {category} 카테고리 인기 검색어{' '}
                <span className="text-slate-500 dark:text-slate-400 font-normal text-sm">({data.total}개)</span>
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {PERIODS.find((p) => p.value === period)?.label} 검색량 기준
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/30">
                  <tr>
                    {['순위', '검색어', 'PC 검색량', '모바일 검색량', '총 검색량', '분석'].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
                          i >= 2 && i <= 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {data.keywords.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          item.rank <= 3
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                            : item.rank <= 10
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleKeywordClick(item.keyword)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium text-sm text-left"
                        >
                          {item.keyword}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm text-slate-600 dark:text-slate-400">
                        {item.monthlyPcQcCnt.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm text-slate-600 dark:text-slate-400">
                        {item.monthlyMobileQcCnt.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {item.totalCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <Link
                          href={`/keyword-analysis?keyword=${encodeURIComponent(item.keyword)}`}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          분석하기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && data.keywords.length === 0 && !loading && (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 이용 안내 */}
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">💡 이용 안내</h3>
          <ul className="space-y-1.5 text-sm text-indigo-700 dark:text-indigo-400">
            {[
              '인기 검색어는 네이버 검색광고 API를 통해 제공됩니다.',
              '검색량은 월간 기준으로 표시됩니다.',
              '검색어를 클릭하면 해당 키워드의 상세 분석 페이지로 이동합니다.',
              '카테고리와 기간을 변경하여 다양한 인기 검색어를 확인할 수 있습니다.',
              'API 호출 제한으로 인해 일부 데이터가 지연될 수 있습니다.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 가이드 콘텐츠 */}
        <GuideSection
          title="인기 검색어 트렌드를 활용한 블로그 포스팅 전략"
          items={[
            {
              title: '인기 검색어 트렌드란 무엇인가요?',
              content: `인기 검색어 트렌드는 특정 기간 동안 사람들이 네이버에서 가장 많이 검색한 키워드를 집계한 데이터입니다. 이 데이터를 분석하면 지금 이 순간 대중의 관심사가 어디에 있는지 파악할 수 있고, 그에 맞는 블로그 포스팅 주제를 빠르게 선정할 수 있습니다.

Boheme BlogLab의 인기 검색어 트렌드는 네이버 검색광고 API를 기반으로 실제 검색량 데이터를 제공합니다. IT/기술, 요리/음식, 여행, 뷰티/패션 등 16개 카테고리로 분류되어 있어 자신의 블로그 분야에 맞는 키워드를 골라볼 수 있습니다.`,
            },
            {
              title: '트렌드 키워드를 포스팅에 활용하는 방법',
              content: `트렌드 키워드는 단순히 검색량이 높은 키워드가 아니라, 지금 사람들이 실제로 궁금해하는 정보를 담고 있는 신호입니다. 이를 효과적으로 활용하려면 다음 순서를 따르세요.

1. 관심 카테고리에서 상위 키워드를 확인합니다.
2. '분석하기' 버튼을 눌러 해당 키워드의 경쟁률을 확인합니다.
3. 경쟁률이 낮은(1.0 이하) 키워드를 우선 공략합니다.
4. 해당 키워드로 프롬프트를 생성하여 AI 글쓰기에 활용합니다.

트렌드 키워드는 시즌에 따라 크게 변하므로, 월간·주간·일간 데이터를 함께 비교하며 타이밍을 잡는 것이 중요합니다.`,
            },
            {
              title: '카테고리별 트렌드 키워드 활용 팁',
              content: `IT/기술: 최신 소프트웨어 업데이트, AI 도구, 스마트폰 신제품 출시 전후에 검색량이 급증합니다. 출시 직전·직후 리뷰 포스팅이 효과적입니다.

요리/음식: 계절 식재료, 명절 음식, 다이어트 레시피 등 시즌성이 강합니다. 명절 2~3주 전부터 관련 키워드 검색량이 늘어납니다.

여행: 연휴 전 1~2개월 전부터 여행지 검색이 급증합니다. 실제 방문 후기 형식의 글이 신뢰도가 높아 상위 노출에 유리합니다.

뷰티/패션: 신제품 출시와 계절 변화에 민감합니다. 성분 분석, 전후 비교 등 구체적인 정보가 담긴 포스팅이 인기입니다.

경제/투자: 금리 변화, 정부 정책 발표 등 뉴스와 연동되는 경우가 많습니다. 빠른 정보 전달과 쉬운 설명이 핵심입니다.`,
            },
            {
              title: '트렌드 키워드로 블로그 성장을 가속화하는 전략',
              content: `성공적인 블로거들의 공통점은 트렌드를 '빠르게' 캐치한다는 것입니다. 같은 키워드라도 먼저 포스팅한 사람이 유리합니다. 트렌드 키워드를 매일 확인하고, 관심 분야에서 갑자기 검색량이 오른 키워드를 발견하면 빠르게 포스팅하는 습관을 들이세요.

또한 트렌드 키워드는 단독으로 사용하기보다 자신의 블로그 전문성과 결합했을 때 더욱 강력합니다. 예를 들어 요리 블로거라면 단순히 '레시피'를 넘어 '여름 다이어트 레시피'처럼 트렌드 + 전문성의 조합으로 차별화하세요.`,
            },
          ]}
        />
      </div>
    </div>
  );
}
