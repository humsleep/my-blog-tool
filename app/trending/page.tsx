'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FlowNav from '../components/FlowNav';
import HorizontalBarList from '../components/charts/HorizontalBarList';
import { clientFetchJson, ApiError } from '../lib/clientFetch';

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
  { value: 'daily',   label: '일간' },
  { value: 'weekly',  label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'custom',  label: '직접 설정' },
];

/** YYYY-MM-DD 형식으로 반환 */
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** 날짜 유효성 검사: max 1년 */
function clampEndDate(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const maxEnd = new Date(s);
  maxEnd.setFullYear(maxEnd.getFullYear() + 1);
  return e > maxEnd ? toDateStr(maxEnd) : end;
}

export default function TrendingPage() {
  const [category, setCategory] = useState('전체');
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 직접 설정 날짜 상태 (기본값: 최근 30일)
  const today = toDateStr(new Date());
  const defaultStart = toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);
  const [dateError, setDateError] = useState<string | null>(null);

  const maxDate = today;

  const validateDates = (s: string, e: string): string | null => {
    if (!s || !e) return '시작일과 종료일을 모두 입력해주세요.';
    if (new Date(s) > new Date(e)) return '시작일이 종료일보다 클 수 없습니다.';
    const diff = (new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24);
    if (diff > 365) return '조회 기간은 최대 1년(365일)입니다.';
    return null;
  };

  const fetchTrendingKeywords = async () => {
    if (period === 'custom') {
      const err = validateDates(startDate, endDate);
      if (err) { setDateError(err); return; }
      setDateError(null);
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        period,
        limit: '50',
        ...(period === 'custom' ? { startDate, endDate } : {}),
      });
      const result = await clientFetchJson<TrendingData>(
        `/api/trending-keywords?${params.toString()}`
      );
      setData(result);
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
    if (period !== 'custom') fetchTrendingKeywords();
    // custom 모드는 조회 버튼을 눌러야 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, period]);

  const handleKeywordClick = (keyword: string) => {
    window.location.href = `/keyword-analysis?keyword=${encodeURIComponent(keyword)}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
            인기 검색어 트렌드
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            네이버 검색광고 API를 활용한 실시간 인기 검색어를 확인하세요
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">

          {/* 조회 기간 행 */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">조회 기간</span>
              {/* 세그먼트 컨트롤 */}
              <div className="flex bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                      period === p.value
                        ? 'bg-white dark:bg-slate-600 text-emerald-500 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 조회 버튼 */}
            <button
              onClick={fetchTrendingKeywords}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 ${loading ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>

          {/* 직접 설정 날짜 피커 */}
          {period === 'custom' && (
            <div className="px-5 py-4 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || maxDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      // 종료일이 1년 초과 시 자동 보정
                      if (endDate) setEndDate(clampEndDate(e.target.value, endDate));
                      setDateError(null);
                    }}
                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-end pb-[9px] text-slate-400 dark:text-slate-500 text-sm font-medium select-none">~</div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={maxDate}
                    onChange={(e) => {
                      const clamped = clampEndDate(startDate, e.target.value);
                      setEndDate(clamped);
                      if (clamped !== e.target.value) setDateError('최대 1년(365일)까지 설정할 수 있습니다.');
                      else setDateError(null);
                    }}
                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {startDate && endDate && !dateError && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 pb-[10px]">
                    {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}일
                  </span>
                )}
              </div>
              {dateError && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {dateError}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                최대 조회 기간은 <strong>1년(365일)</strong>입니다.
              </p>
            </div>
          )}

          {/* 카테고리 행 */}
          <div className="px-5 py-4">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 block">카테고리</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                    category === cat.value
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
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
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 dark:border-emerald-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">인기 검색어를 불러오는 중...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchTrendingKeywords}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors whitespace-nowrap"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* TOP 10 시각화 (가로 막대) — 결과가 있을 때만 */}
        {data && data.keywords.length > 0 && (
          <div className="mb-4 bg-white dark:bg-[#161b18] rounded-xl border border-stone-200 dark:border-[#2a322d] p-5 shadow-sm">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                TOP {Math.min(10, data.keywords.length)} 한눈에
              </h2>
              <span className="text-xs text-stone-500 dark:text-stone-400">검색량 비례 막대</span>
            </div>
            <HorizontalBarList
              items={data.keywords.slice(0, 10).map((k) => ({
                rank: k.rank,
                label: k.keyword,
                value: k.totalCount,
                display: k.totalCount.toLocaleString(),
                href: `/keyword-analysis?keyword=${encodeURIComponent(k.keyword)}`,
              }))}
            />
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
                {period === 'custom'
                  ? `${startDate} ~ ${endDate} 기간 검색량 기준`
                  : `${PERIODS.find((p) => p.value === period)?.label} 검색량 기준`}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/30">
                  <tr>
                    {['순위', '검색어',
                      `PC 검색량${period === 'daily' ? ' (일)' : period === 'weekly' ? ' (주)' : period === 'custom' ? ' (기간)' : ' (월)'}`,
                      `모바일 검색량${period === 'daily' ? ' (일)' : period === 'weekly' ? ' (주)' : period === 'custom' ? ' (기간)' : ' (월)'}`,
                      `총 검색량${period === 'daily' ? ' (일)' : period === 'weekly' ? ' (주)' : period === 'custom' ? ' (기간)' : ' (월)'}`,
                      '분석',
                    ].map((h, i) => (
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
                            ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleKeywordClick(item.keyword)}
                          className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:underline font-medium text-sm text-left"
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
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
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
        <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">💡 이용 안내</h3>
          <ul className="space-y-1.5 text-sm text-emerald-600 dark:text-emerald-400">
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

        {/* 다음 단계 */}
        {data && data.keywords.length > 0 && (
          <FlowNav
            currentStep={1}
            totalSteps={8}
            stepLabel="인기검색어"
            note="마음에 드는 키워드를 발견했다면 자세히 분석해보세요. 위 목록에서 키워드를 바로 클릭해도 됩니다."
            actions={[
              {
                href: '/keyword-analysis',
                label: '키워드 분석 시작',
                description: '검색량·경쟁률 직접 입력해 분석',
              },
            ]}
          />
        )}

                {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <a
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-500 dark:text-emerald-400 hover:underline"
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
