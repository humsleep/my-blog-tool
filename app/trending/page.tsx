'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      
      if (!response.ok) {
        throw new Error('인기 검색어를 불러오는데 실패했습니다.');
      }
      
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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            인기 검색어 트렌드
          </h1>
          <p className="text-gray-600">
            네이버 검색광고 API를 활용한 실시간 인기 검색어를 확인하세요
          </p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기간
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={fetchTrendingKeywords}
            disabled={loading}
            className="mt-4 w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>

        {/* 결과 섹션 */}
        {loading && !data && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">인기 검색어를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {data && data.keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {category} 카테고리 인기 검색어 ({data.total}개)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {PERIODS.find(p => p.value === period)?.label} 검색량 기준
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      검색어
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PC 검색량
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      모바일 검색량
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 검색량
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      분석
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.keywords.map((item) => (
                    <tr key={item.rank} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          item.rank <= 3 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : item.rank <= 10
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleKeywordClick(item.keyword)}
                          className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-left"
                        >
                          {item.keyword}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                        {item.monthlyPcQcCnt.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                        {item.monthlyMobileQcCnt.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-base font-semibold text-gray-900">
                          {item.totalCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link
                          href={`/keyword-analysis?keyword=${encodeURIComponent(item.keyword)}`}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-12 text-center">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 안내 섹션 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 이용 안내</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 인기 검색어는 네이버 검색광고 API를 통해 제공됩니다.</li>
            <li>• 검색량은 월간 기준으로 표시됩니다.</li>
            <li>• 검색어를 클릭하면 해당 키워드의 상세 분석 페이지로 이동합니다.</li>
            <li>• 카테고리와 기간을 변경하여 다양한 인기 검색어를 확인할 수 있습니다.</li>
            <li>• API 호출 제한으로 인해 일부 데이터가 지연될 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

