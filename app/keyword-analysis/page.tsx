'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GuideSection from '../components/GuideSection';

interface KeywordData {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  documentCount: number;
  competitionRatio: number;
  id: string;
}

function KeywordAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputKeywords, setInputKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [currentProgress, setCurrentProgress] = useState('');

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
      const response = await fetch('/api/document-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await response.json();
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

        const response = await fetch('/api/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: keywordForApi }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const keywordList = data.keywordList || [];

        const matchedItem = keywordList.find((item: any) => {
          const relKeyword = (item.relKeyword || '').replace(/\s+/g, '');
          return relKeyword.toLowerCase() === keywordForApi.toLowerCase();
        });

        if (!matchedItem) continue;
        if (existingKeywords.has(originalKeyword)) continue;

        const pcCount = parseInt(matchedItem.monthlyPcQcCnt || '0') || 0;
        const mobileCount = parseInt(matchedItem.monthlyMobileQcCnt || '0') || 0;
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setCurrentProgress('완료!');
    } catch (error) {
      console.error('키워드 분석 오류:', error);
      alert('키워드 분석 중 오류가 발생했습니다.');
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
  }, [shouldAutoAnalyze, inputKeywords, isLoading]);

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
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <button
                    onClick={analyzeKeywords}
                    disabled={isLoading || !inputKeywords.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px]"
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
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{currentProgress}</p>
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
                      키워드 클릭 시 프롬프트 자동 생성
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
                        {['키워드', 'PC', '모바일', '총검색량', '문서수', '경쟁율', ''].map((h, i) => (
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
                                className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                                onClick={() => {
                                  if (confirm(`"${item.keyword}" 키워드로 프롬프트를 생성하시겠습니까?`)) {
                                    router.push(`/prompt-generator?keyword=${encodeURIComponent(item.keyword)}`);
                                  }
                                }}
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
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
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
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mt-0.5">{i + 1}.</span>
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

        {/* SEO 가이드 섹션 */}
        <GuideSection
          title="키워드 분석 완벽 가이드 — 블로그 상위 노출의 첫걸음"
          items={[
            {
              title: '키워드 분석이 블로그 성공의 첫걸음인 이유',
              content: `블로그 포스팅의 성공은 올바른 키워드 선택에서 시작됩니다. 아무리 잘 쓴 글도 사람들이 검색하지 않는 키워드로 작성되었다면 트래픽을 얻기 어렵습니다. 반대로, 검색량이 충분하고 경쟁이 낮은 키워드를 선점하면 글 품질이 조금 부족해도 꾸준한 방문자를 유지할 수 있습니다.

키워드 분석은 내가 쓰려는 주제로 얼마나 많은 사람들이 검색하는지(검색량), 그리고 얼마나 많은 글이 이미 작성되어 있는지(경쟁 환경)를 파악하여, 내 블로그가 실제로 상위에 노출될 가능성을 사전에 평가하는 필수 과정입니다.`,
            },
            {
              title: '경쟁률 계산의 정확한 이해',
              content: `경쟁률은 '네이버 문서 수 ÷ 월간 검색량'으로 계산됩니다. 이 수치가 낮을수록 같은 키워드를 다루는 문서는 많지 않지만 검색하는 사람은 많다는 의미이므로, 상위 노출 가능성이 높습니다.

🟢 0.5 이하 (꿀키워드): 경쟁 문서가 매우 적어 신규 블로거도 상위 노출이 가능합니다. 이런 키워드를 집중 공략하세요.
🟡 0.5 ~ 1.0 (우수): 경쟁률이 낮은 편으로 블로그 지수가 어느 정도 쌓이면 상단 노출 가능성이 충분합니다.
⚫ 1.0 ~ 3.0 (보통): 블로그 지수와 콘텐츠 품질에 따라 결과가 달라집니다.
🟠 3.0 ~ 7.0 (치열): 고퀄리티 포스팅과 꾸준한 업로드가 필요합니다.
🔴 7.0 이상 (위험): 파워블로거나 전문 미디어 외에는 상위 노출이 매우 어렵습니다.`,
            },
            {
              title: '효과적인 키워드 선택 전략 — 롱테일 키워드의 힘',
              content: `단일 키워드보다 2~3개 단어를 조합한 '롱테일 키워드'가 블로그 초보자에게 훨씬 유리합니다. 예를 들어 '다이어트'는 경쟁률이 극히 높지만, '직장인 점심 간단 다이어트 식단'처럼 구체적인 키워드는 경쟁이 훨씬 낮으면서도 명확한 검색 의도를 가진 사람들을 타깃으로 합니다.

롱테일 키워드의 장점:
· 경쟁률이 낮아 상위 노출이 쉽습니다.
· 검색 의도가 명확해 전환율(읽기, 댓글, 공유)이 높습니다.
· 여러 롱테일 키워드를 꾸준히 공략하면 누적 트래픽이 빠르게 늘어납니다.`,
            },
            {
              title: '키워드 분석 데이터를 포스팅에 활용하는 법',
              content: `분석 결과를 얻었다면 이제 실제 포스팅에 적용할 차례입니다.

제목 배치: 선택한 키워드를 제목 앞부분에 배치하세요. 네이버 검색 알고리즘은 제목 앞쪽의 키워드에 더 높은 가중치를 부여합니다.

본문 밀도: 키워드를 너무 많이 반복하면 저품질 처리될 수 있습니다. 1,000자 기준 2~4회 자연스럽게 포함시키는 것이 적정합니다.

연관 키워드 활용: 분석한 메인 키워드와 함께 관련 키워드(LSI Keywords)를 본문에 포함하면 주제 연관성 점수가 높아집니다. '키워드 분석' 도구에서 여러 연관 키워드를 함께 분석해 보세요.`,
            },
          ]}
        />
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
