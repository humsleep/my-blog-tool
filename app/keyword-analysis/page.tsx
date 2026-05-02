'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsPanel, { type NewsItem } from '../components/NewsPanel';
import FlowNav from '../components/FlowNav';
import { clientFetchJson, ApiError } from '../lib/clientFetch';

interface KeywordData {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  documentCount: number;
  competitionRatio: number;
  id: string;
}

interface NaverKeywordItem {
  relKeyword?: string;
  monthlyPcQcCnt?: string | number;
  monthlyMobileQcCnt?: string | number;
}

function KeywordAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputKeywords, setInputKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [currentProgress, setCurrentProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState('');
  const [wikiViews, setWikiViews] = useState<Record<string, number | null>>({});
  const [newsKeyword, setNewsKeyword] = useState<string | null>(null);
  const [actionKeyword, setActionKeyword] = useState<string | null>(null);

  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);

  useEffect(() => {
    const keyword = searchParams.get('keyword');
    if (keyword) {
      setInputKeywords(keyword);
      setShouldAutoAnalyze(true);
    }
  }, [searchParams]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
    return num.toString();
  };

  const searchDocumentCount = async (keyword: string): Promise<number> => {
    try {
      const data = await clientFetchJson<{ count: number }>('/api/document-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      return data.count || 0;
    } catch (error) {
      console.error('문서수 조회 오류:', error);
      return 0;
    }
  };

  const analyzeKeywords = async () => {
    if (!inputKeywords.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }

    if (keywordData.length >= 100) {
      if (!confirm('분석 결과가 100개를 초과합니다. 전체 삭제 후 진행하시겠습니까?')) return;
      setKeywordData([]);
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLastInput(inputKeywords);
    setCurrentProgress('키워드 검색 중...');

    const keywords = inputKeywords.split(',').map((k) => k.trim()).filter((k) => k);

    if (keywords.length > 10) {
      alert('키워드는 최대 10개까지만 입력할 수 있습니다.');
      setIsLoading(false);
      setCurrentProgress('');
      return;
    }

    const newResults: KeywordData[] = [];
    const searched = new Set<string>();
    const existingKeywords = new Set(keywordData.map((item) => item.keyword));

    try {
      for (const originalKeyword of keywords) {
        const keywordForApi = originalKeyword.replace(/\s+/g, '');
        if (searched.has(originalKeyword)) continue;

        setCurrentProgress(`'${originalKeyword}' 검색 중...`);
        searched.add(originalKeyword);

        let data: { keywordList?: NaverKeywordItem[] };
        try {
          data = await clientFetchJson<{ keywordList?: NaverKeywordItem[] }>('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: keywordForApi }),
          });
        } catch (err) {
          console.error(`'${originalKeyword}' 검색 실패:`, err);
          continue;
        }

        const keywordList: NaverKeywordItem[] = data.keywordList || [];

        const matchedItem = keywordList.find((item) => {
          const relKeyword = String(item.relKeyword || '').replace(/\s+/g, '');
          return relKeyword.toLowerCase() === keywordForApi.toLowerCase();
        });

        if (!matchedItem) continue;
        if (existingKeywords.has(originalKeyword)) continue;

        const pcCount = parseInt(String(matchedItem.monthlyPcQcCnt ?? '0')) || 0;
        const mobileCount = parseInt(String(matchedItem.monthlyMobileQcCnt ?? '0')) || 0;
        const totalCount = pcCount + mobileCount;

        setCurrentProgress(`'${originalKeyword}' 문서수 조회 중...`);
        const documentCount = await searchDocumentCount(keywordForApi);
        const competitionRatio = totalCount > 0 ? documentCount / totalCount : 0;

        const newResult = {
          keyword: originalKeyword,
          pcSearchVolume: pcCount,
          mobileSearchVolume: mobileCount,
          totalSearchVolume: totalCount,
          documentCount,
          competitionRatio: Math.round(competitionRatio * 100) / 100,
          id: `${originalKeyword}-${Date.now()}-${Math.random()}`,
        };

        newResults.push(newResult);

        if (keywordData.length + newResults.length >= 100) {
          alert('분석 결과가 100개를 초과합니다. 전체 삭제 후 진행해주세요.');
          setIsLoading(false);
          setCurrentProgress('');
          return;
        }

        setKeywordData((prev) => [...prev, newResult]);
        existingKeywords.add(originalKeyword);
        void loadWikiViews(originalKeyword);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setCurrentProgress('완료!');
    } catch (error) {
      console.error('키워드 분석 오류:', error);
      const message = error instanceof ApiError
        ? error.message
        : '키워드 분석 중 오류가 발생했습니다.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setCurrentProgress('');
    }
  };

  useEffect(() => {
    if (shouldAutoAnalyze && inputKeywords.trim() && !isLoading) {
      setShouldAutoAnalyze(false);
      analyzeKeywords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoAnalyze, inputKeywords]);

  const retryLastSearch = () => {
    if (!lastInput) return;
    setInputKeywords(lastInput);
    setErrorMessage(null);
    setTimeout(() => { void analyzeKeywords(); }, 0);
  };

  const loadWikiViews = async (keyword: string) => {
    if (wikiViews[keyword] !== undefined) return;
    try {
      const data = await clientFetchJson<{ dailyAverage: number; found: boolean }>(
        `/api/wiki-pageviews?keyword=${encodeURIComponent(keyword)}&days=30`,
        { retries: 1, timeoutMs: 10000 }
      );
      setWikiViews((prev) => ({ ...prev, [keyword]: data.found ? data.dailyAverage : null }));
    } catch {
      setWikiViews((prev) => ({ ...prev, [keyword]: null }));
    }
  };

  const deleteKeyword = (id: string) => {
    setKeywordData((prev) => prev.filter((item) => item.id !== id));
  };

  const downloadCSV = () => {
    if (keywordData.length === 0) return;
    const headers = ['키워드', 'PC검색량', '모바일검색량', '월간총검색량', '문서수', '경쟁율'];
    const rows = keywordData.map((item) => [
      item.keyword, item.pcSearchVolume, item.mobileSearchVolume,
      item.totalSearchVolume, item.documentCount, item.competitionRatio,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `키워드분석_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedKeywords = [...keywordData].reverse();

  const competitionConfig = (ratio: number) => {
    if (ratio <= 0.5) return { icon: '🟢', color: 'text-emerald-600 dark:text-emerald-400', label: '최상 (꿀키워드)' };
    if (ratio <= 1.0) return { icon: '🟡', color: 'text-yellow-600 dark:text-yellow-400', label: '상 (우수)' };
    if (ratio <= 3.0) return { icon: '⚫', color: 'text-slate-700 dark:text-slate-300', label: '중 (보통)' };
    if (ratio <= 7.0) return { icon: '🟠', color: 'text-orange-600 dark:text-orange-400', label: '하 (치열)' };
    return { icon: '🔴', color: 'text-red-600 dark:text-red-400', label: '최하 (위험)' };
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">키워드 분석</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5">
            네이버 검색광고 API를 사용하여 키워드 검색량과 경쟁률을 분석합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">

            {/* Input Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
              <div className="space-y-3">
                <label htmlFor="keywords-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  검색할 키워드 <span className="text-slate-400 dark:text-slate-500 font-normal">(쉼표로 구분, 최대 10개)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="keywords-input"
                    type="text"
                    value={inputKeywords}
                    onChange={(e) => setInputKeywords(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading && inputKeywords.trim()) analyzeKeywords();
                    }}
                    placeholder="예: 꽃배달, flower, 화환"
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <button
                    onClick={analyzeKeywords}
                    disabled={isLoading || !inputKeywords.trim()}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        분석
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  여러 키워드를 쉼표로 구분하여 입력하세요. 결과는 최대 100개까지 표시됩니다.
                </p>
              </div>

              {isLoading && currentProgress && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg border border-orange-200 dark:border-orange-700 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-orange-500 dark:text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm text-orange-600 dark:text-orange-300 font-medium">{currentProgress}</p>
                </div>
              )}
              {errorMessage && !isLoading && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between gap-2">
                  <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                  {lastInput && (
                    <button
                      onClick={retryLastSearch}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results Table */}
            {sortedKeywords.length > 0 && (
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      분석 결과 <span className="text-slate-500 dark:text-slate-400 font-normal text-sm">({sortedKeywords.length}개)</span>
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      키워드 클릭 시 다음 단계 선택 (상위노출 분석 / 프롬프트 생성)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadCSV}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors min-h-[36px]"
                    >
                      CSV 다운로드
                    </button>
                    <button
                      onClick={() => confirm('모든 분석 결과를 삭제하시겠습니까?') && setKeywordData([])}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors min-h-[36px]"
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {['키워드', 'PC', '모바일', '총검색량', '문서수', '경쟁율', '위키(일평균)', '뉴스', '액션'].map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {sortedKeywords.map((item) => {
                        const comp = competitionConfig(item.competitionRatio);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-left"
                                onClick={() => setActionKeyword(item.keyword)}
                              >
                                {item.keyword}
                              </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                              {formatNumber(item.pcSearchVolume)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                              {formatNumber(item.mobileSearchVolume)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-semibold text-orange-500 dark:text-orange-400 text-sm">
                                {formatNumber(item.totalSearchVolume)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                              {formatNumber(item.documentCount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{comp.icon}</span>
                                <span className={`text-xs font-medium ${comp.color}`}>
                                  {item.competitionRatio.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {wikiViews[item.keyword] === undefined ? (
                                <span className="text-slate-300 dark:text-slate-600">…</span>
                              ) : wikiViews[item.keyword] === null ? (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {formatNumber(wikiViews[item.keyword] as number)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => setNewsKeyword(item.keyword)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 border border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all min-h-[32px]"
                                title="관련 뉴스 보기 + 프롬프트로 가져가기"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                뉴스 보기
                              </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => deleteKeyword(item.id)}
                                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                title="삭제"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* How to use */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">사용 방법</h2>
              <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                {[
                  '키워드를 쉼표로 구분하여 입력 (최대 10개)',
                  '검색 버튼 클릭',
                  '결과는 최대 100개까지 표시',
                  '삭제 아이콘으로 개별 삭제 가능',
                  'CSV 파일로 다운로드',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 dark:text-orange-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Competition Guide */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">경쟁률 가이드</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  { icon: '🟢', label: '최상 (꿀키워드)', range: '0.5 이하', desc: '검색량 대비 문서 매우 적음', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400' },
                  { icon: '🟡', label: '상 (우수)', range: '0.5 ~ 1.0', desc: '상단 노출 확률 높음', bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400' },
                  { icon: '⚫', label: '중 (보통)', range: '1.0 ~ 3.0', desc: '블로그 지수에 따라 결정', bg: 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-300' },
                  { icon: '🟠', label: '하 (치열)', range: '3.0 ~ 7.0', desc: '고퀄리티 포스팅 필요', bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400' },
                  { icon: '🔴', label: '최하 (위험)', range: '7.0 이상', desc: '대형 블로그 외 노출 어려움', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
                ].map((item) => (
                  <div key={item.label} className={`p-3 rounded-lg border ${item.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{item.icon}</span>
                      <span className={`font-semibold ${item.text}`}>{item.label}</span>
                      <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {item.range}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 ml-5">{item.desc}</p>
                  </div>
                ))}
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-1">
                  경쟁률 = 문서수 ÷ 검색량
                </p>
              </div>
            </div>

            {/* Stats */}
            {keywordData.length > 0 && (
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">통계</h2>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400">총 키워드</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{keywordData.length}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400">평균 검색량</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatNumber(Math.round(keywordData.reduce((s, i) => s + i.totalSearchVolume, 0) / keywordData.length))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 액션 선택 모달 */}
        {actionKeyword && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setActionKeyword(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  &ldquo;{actionKeyword}&rdquo; 다음 단계 선택
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  이 키워드로 어떻게 진행하시겠어요?
                </p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    router.push(`/competitor-analysis?keyword=${encodeURIComponent(actionKeyword)}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">상위노출 분석</div>
                    <div className="text-xs text-orange-100 mt-0.5">상위 블로그 포스트 패턴 파악</div>
                  </div>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    router.push(`/prompt-generator?keyword=${encodeURIComponent(actionKeyword)}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-orange-400 dark:hover:border-orange-500 rounded-lg transition-colors"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">프롬프트 바로 생성</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">경쟁 분석 건너뛰고 글쓰기</div>
                  </div>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => setActionKeyword(null)}
                  className="w-full px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 뉴스 모달 */}
        {newsKeyword && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setNewsKeyword(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  &ldquo;{newsKeyword}&rdquo; 관련 최신 뉴스
                </h3>
                <button
                  onClick={() => setNewsKeyword(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
                  aria-label="닫기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4">
                <NewsPanel
                  keyword={newsKeyword}
                  variant="modal"
                  display={15}
                  sort="sim"
                  selectable
                  onCreatePrompt={(items: NewsItem[]) => {
                    sessionStorage.setItem(
                      'promptNewsContext',
                      JSON.stringify({ keyword: newsKeyword, items }),
                    );
                    setNewsKeyword(null);
                    router.push(`/prompt-generator?keyword=${encodeURIComponent(newsKeyword)}`);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 다음 단계 */}
        {keywordData.length > 0 && (
          <FlowNav
            currentStep={2}
            totalSteps={8}
            stepLabel="키워드분석"
            note={`"${sortedKeywords[0].keyword}" 키워드로 이어서 진행할 수 있습니다.`}
            actions={[
              {
                href: `/competitor-analysis?keyword=${encodeURIComponent(sortedKeywords[0].keyword)}`,
                label: '상위노출 분석',
                description: '상위 블로그 포스트 분석',
              },
              {
                href: `/prompt-generator?keyword=${encodeURIComponent(sortedKeywords[0].keyword)}`,
                label: '프롬프트 바로 생성',
                description: '경쟁 분석 건너뛰고 글쓰기',
                variant: 'secondary',
              },
            ]}
          />
        )}

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

export default function KeywordAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500 dark:text-slate-400">로딩 중...</div>
      </div>
    }>
      <KeywordAnalysisContent />
    </Suspense>
  );
}
