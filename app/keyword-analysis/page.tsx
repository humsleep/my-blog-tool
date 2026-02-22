'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdPlaceholder from '../components/AdPlaceholder';

interface KeywordData {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  documentCount: number;
  competitionRatio: number;
  id: string; // 고유 ID 추가 (삭제용)
}

export default function KeywordAnalysisPage() {
  const router = useRouter();
  const [inputKeywords, setInputKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [currentProgress, setCurrentProgress] = useState('');

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}만`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}천`;
    } else {
      return num.toString();
    }
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

    // 최대 100개 결과 제한 체크
    if (keywordData.length >= 100) {
      if (!confirm('분석 결과가 100개를 초과합니다. 전체 삭제 후 진행하시겠습니까?')) {
        return;
      }
      setKeywordData([]);
    }

    setIsLoading(true);
    setCurrentProgress('키워드 검색 중...');

    const keywords = inputKeywords.split(',').map((k) => k.trim()).filter((k) => k);
    
    // 최대 10개 키워드 제한
    if (keywords.length > 10) {
      alert('키워드는 최대 10개까지만 입력할 수 있습니다.');
      setIsLoading(false);
      setCurrentProgress('');
      return;
    }

    const newResults: KeywordData[] = [];
    const searched = new Set<string>();

    // 기존 데이터의 키워드 ID 추출 (중복 체크용)
    const existingKeywords = new Set(keywordData.map(item => item.keyword));

    try {
      for (const originalKeyword of keywords) {
        // 화면 표시용으로는 원본 키워드 유지, API 호출용으로는 띄어쓰기 제거
        const keywordForApi = originalKeyword.replace(/\s+/g, '');
        
        if (searched.has(originalKeyword)) continue;

        setCurrentProgress(`'${originalKeyword}' 검색 중...`);
        searched.add(originalKeyword);

        // 네이버 검색광고 API로 키워드 검색 (띄어쓰기 제거된 키워드 사용)
        const response = await fetch('/api/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: keywordForApi }),
        });

        if (!response.ok) {
          console.error(`'${originalKeyword}' 검색 실패`);
          continue;
        }

        const data = await response.json();
        const keywordList = data.keywordList || [];

        // 입력한 키워드와 정확히 일치하는 항목만 찾기 (띄어쓰기 제거된 키워드로 비교)
        const matchedItem = keywordList.find((item: any) => {
          const relKeyword = (item.relKeyword || '').replace(/\s+/g, '');
          return relKeyword.toLowerCase() === keywordForApi.toLowerCase();
        });

        if (!matchedItem) {
          console.warn(`'${originalKeyword}'에 대한 정확한 매칭 결과를 찾을 수 없습니다.`);
          continue;
        }

        // 이미 존재하는 키워드는 건너뛰기 (원본 키워드로 비교)
        if (existingKeywords.has(originalKeyword)) continue;

        const pcCount = parseInt(matchedItem.monthlyPcQcCnt || '0') || 0;
        const mobileCount = parseInt(matchedItem.monthlyMobileQcCnt || '0') || 0;
        const totalCount = pcCount + mobileCount;

        setCurrentProgress(`'${originalKeyword}' 문서수 조회 중...`);
        // 문서수 조회도 띄어쓰기 제거된 키워드 사용
        const documentCount = await searchDocumentCount(keywordForApi);

        const competitionRatio = totalCount > 0 ? documentCount / totalCount : 0;

        const newResult = {
          keyword: originalKeyword, // 화면에는 원본 키워드 표시
          pcSearchVolume: pcCount,
          mobileSearchVolume: mobileCount,
          totalSearchVolume: totalCount,
          documentCount,
          competitionRatio: Math.round(competitionRatio * 100) / 100,
          id: `${originalKeyword}-${Date.now()}-${Math.random()}`, // 고유 ID 생성
        };

        newResults.push(newResult);

        // 최대 100개 제한 체크
        if (keywordData.length + newResults.length >= 100) {
          alert('분석 결과가 100개를 초과합니다. 전체 삭제 후 진행해주세요.');
          setIsLoading(false);
          setCurrentProgress('');
          return;
        }

        // 기존 데이터에 새 결과 추가
        setKeywordData(prev => [...prev, newResult]);
        existingKeywords.add(originalKeyword);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setCurrentProgress('완료!');
      setInputKeywords(''); // 입력 필드 초기화
    } catch (error) {
      console.error('키워드 분석 오류:', error);
      alert('키워드 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setCurrentProgress('');
    }
  };

  const deleteKeyword = (id: string) => {
    setKeywordData(prev => prev.filter(item => item.id !== id));
  };

  const downloadCSV = () => {
    if (keywordData.length === 0) return;

    const headers = [
      '키워드',
      'PC검색량',
      '모바일검색량',
      '월간총검색량',
      '문서수',
      '경쟁율',
    ];

    const rows = keywordData.map((item) => [
      item.keyword,
      item.pcSearchVolume,
      item.mobileSearchVolume,
      item.totalSearchVolume,
      item.documentCount,
      item.competitionRatio,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `키워드분석_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 최신 입력이 위로 오도록 역순 정렬 (배열에 추가된 순서의 역순)
  const sortedKeywords = [...keywordData].reverse();

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">키워드 분석</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            네이버 검색광고 API를 사용하여 키워드 검색량과 블로그 제목을 추천합니다
          </p>
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdPlaceholder size="banner" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="keywords-input"
                    className="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                  >
                    검색할 키워드 (쉼표로 구분, 최대 10개)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="keywords-input"
                      type="text"
                      value={inputKeywords}
                      onChange={(e) => setInputKeywords(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading && inputKeywords.trim()) {
                          analyzeKeywords();
                        }
                      }}
                      placeholder="예: 꽃배달, flower, 화환"
                      className="flex-1 p-3 sm:p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      onClick={analyzeKeywords}
                      disabled={isLoading || !inputKeywords.trim()}
                      className="px-6 py-3 sm:px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-h-[44px] touch-manipulation"
                      title="키워드 분석하기"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    여러 키워드를 쉼표로 구분하여 입력하세요. (최대 10개, 결과는 최대 100개까지 표시)
                  </p>
                </div>

                {isLoading && currentProgress && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-blue-700 font-medium">{currentProgress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {sortedKeywords.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      분석 결과 ({sortedKeywords.length}개)
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      💡 키워드를 클릭하면 해당 키워드로 프롬프트를 자동 생성할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={downloadCSV}
                      className="px-4 py-3 bg-green-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm whitespace-nowrap min-h-[44px] touch-manipulation"
                    >
                      CSV 다운로드
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('모든 분석 결과를 삭제하시겠습니까?')) {
                          setKeywordData([]);
                        }
                      }}
                      className="px-4 py-3 bg-red-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm whitespace-nowrap min-h-[44px] touch-manipulation"
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              키워드
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              PC
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              모바일
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              총검색량
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              문서수
                            </th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              경쟁율
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-14 sm:w-16">
                              삭제
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedKeywords.map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                <div 
                                  className="font-semibold text-sm sm:text-base text-gray-900 cursor-pointer hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation"
                                  onClick={() => {
                                    if (confirm(`"${item.keyword}" 키워드로 프롬프트를 생성하시겠습니까?`)) {
                                      router.push(`/prompt-generator?keyword=${encodeURIComponent(item.keyword)}`);
                                    }
                                  }}
                                >
                                  {item.keyword}
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                {formatNumber(item.pcSearchVolume)}
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                {formatNumber(item.mobileSearchVolume)}
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                <span className="font-semibold text-blue-600 text-sm sm:text-base">
                                  {formatNumber(item.totalSearchVolume)}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                {formatNumber(item.documentCount)}
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                {(() => {
                                  const ratio = item.competitionRatio;
                                  let icon = '';
                                  let colorClass = '';
                                  let label = '';
                                  
                                  if (ratio <= 0.5) {
                                    icon = '🟢';
                                    colorClass = 'text-green-600';
                                    label = '최상 (꿀키워드)';
                                  } else if (ratio <= 1.0) {
                                    icon = '🟡';
                                    colorClass = 'text-yellow-600';
                                    label = '상 (우수)';
                                  } else if (ratio <= 3.0) {
                                    icon = '⚫';
                                    colorClass = 'text-gray-900';
                                    label = '중 (보통)';
                                  } else if (ratio <= 7.0) {
                                    icon = '🟠';
                                    colorClass = 'text-orange-600';
                                    label = '하 (치열)';
                                  } else {
                                    icon = '🔴';
                                    colorClass = 'text-red-600';
                                    label = '최하 (위험)';
                                  }
                                  
                                  return (
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="text-base sm:text-lg">{icon}</span>
                                      <span className={`text-xs sm:text-sm font-medium ${colorClass}`}>
                                        {ratio.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => deleteKeyword(item.id)}
                                  className="text-red-500 hover:text-red-700 active:text-red-800 hover:bg-red-100 active:bg-red-200 p-2 sm:p-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                                  title="삭제"
                                >
                                  <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">사용 방법</h2>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">1.</span>
                  <span>검색할 키워드를 쉼표로 구분하여 입력하세요 (최대 10개)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  <span>검색 아이콘을 클릭하여 분석하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  <span>결과는 최대 100개까지 표시됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  <span>각 행의 삭제 아이콘으로 개별 삭제 가능합니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  <span>결과를 CSV 파일로 다운로드하세요</span>
                </li>
              </ol>
            </div>

            {/* Competition Ratio Guide */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">경쟁률 가이드</h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">🟢</span>
                    <span className="font-semibold text-green-700">최상 (꿀키워드)</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded">0.5 이하</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-8">검색량에 비해 문서가 매우 적음. 무조건 잡아야 함.</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">🟡</span>
                    <span className="font-semibold text-yellow-700">상 (우수)</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded">0.5 ~ 1.0</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-8">경쟁력이 높은 상태. 상단 노출 확률이 매우 높음.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">⚫</span>
                    <span className="font-semibold text-gray-900">중 (보통)</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded">1.0 ~ 3.0</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-8">일반적인 키워드. 블로그 지수에 따라 노출 결정.</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">🟠</span>
                    <span className="font-semibold text-orange-700">하 (치열)</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded">3.0 ~ 7.0</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-8">경쟁이 상당함. 고퀄리티 포스팅이나 지수가 필요함.</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">🔴</span>
                    <span className="font-semibold text-red-700">최하 (위험)</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded">7.0 이상</span>
                  </div>
                  <p className="text-xs text-gray-700 ml-8">문서가 넘쳐남. 대형 블로그가 아니면 상단 노출이 어려움.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-center text-gray-500">
                    <span className="font-medium">경쟁률 = 문서수 / 검색량</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            {keywordData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">통계</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 키워드</span>
                    <span className="font-semibold text-gray-900">
                      {keywordData.length}개
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">평균 검색량</span>
                    <span className="font-semibold text-gray-900">
                      {formatNumber(
                        Math.round(
                          keywordData.reduce((sum, item) => sum + item.totalSearchVolume, 0) /
                            keywordData.length
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Ad Sidebar */}
            <AdPlaceholder size="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
