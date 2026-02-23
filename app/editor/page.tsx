'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import AdSense from '../components/AdSense';

// 확장된 금칙어 리스트
const FORBIDDEN_WORDS = [
  // 불법/위험 관련
  '도박', '마약', '사기', '사행성', '불법', '해킹', '피싱', '스팸',
  // 광고/마케팅 관련
  '추천인', '최저가', '수익보장', '무료체험', '특가', '할인쿠폰', '이벤트 당첨',
  '광고', '홍보', '협찬', '제휴', '파트너십',
  // 부적절한 콘텐츠
  '성인', '음란', '폭력', '혐오',
  // 개인정보/금융 관련
  '개인정보', '신용카드', '계좌번호', '연락처', '전화번호',
  // 기타
  '클릭', '링크', '바로가기', '지금 바로', '한정 특가'
];

// 금칙어 테스트용 샘플 텍스트
const SAMPLE_TEXT = `안녕하세요. 오늘은 블로그 포스트를 작성하려고 합니다.

이 글에는 여러 금칙어가 포함되어 있어요. 예를 들어, 최저가로 구매할 수 있는 특가 상품을 소개하고 싶습니다. 
무료체험 기회를 놓치지 마세요! 지금 바로 클릭하시면 할인쿠폰을 받을 수 있습니다.

또한 이벤트 당첨자에게는 추천인 링크를 통해 수익보장을 약속드립니다. 
한정 특가 상품도 준비되어 있으니 바로가기 버튼을 눌러주세요.

광고와 홍보를 위한 제휴 파트너십 프로그램도 운영 중입니다. 
협찬 받은 제품에 대한 리뷰를 작성할 예정입니다.

개인정보나 신용카드 정보, 계좌번호 같은 민감한 정보는 요청하지 않습니다. 
연락처나 전화번호도 공개하지 않으니 안심하세요.

불법적인 도박이나 마약, 사행성 게임은 절대 추천하지 않습니다. 
해킹이나 피싱, 스팸 같은 불법 행위도 경고합니다.

성인 콘텐츠나 음란물, 폭력적인 내용, 혐오 표현은 포함하지 않겠습니다.`;

export default function EditorPage() {
  const [content, setContent] = useState('');
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const withSpaces = content.length;
    const withoutSpaces = content.replace(/\s/g, '').length;
    
    const foundWords: string[] = [];
    const foundPositions: Array<{ word: string; index: number; lineNumber: number; column: number }> = [];
    
    FORBIDDEN_WORDS.forEach((word) => {
      const regex = new RegExp(word, 'gi');
      let match;
      // regex.exec를 사용하기 전에 lastIndex 초기화
      regex.lastIndex = 0;
      while ((match = regex.exec(content)) !== null) {
        if (!foundWords.includes(word)) {
          foundWords.push(word);
        }
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const column = match.index - lineStart + 1;
        foundPositions.push({ 
          word, 
          index: match.index,
          lineNumber,
          column
        });
      }
    });

    // 줄 번호와 글자 위치 순서로 정렬 (가장 윗줄의 왼쪽부터)
    foundPositions.sort((a, b) => {
      if (a.lineNumber !== b.lineNumber) {
        return a.lineNumber - b.lineNumber;
      }
      return a.column - b.column;
    });

    return { withSpaces, withoutSpaces, foundWords, foundPositions };
  }, [content]);

  // 하이라이트 HTML 생성
  const getHighlightedHTML = useCallback((text: string) => {
    if (!text) return '';
    
    let highlighted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    FORBIDDEN_WORDS.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      highlighted = highlighted.replace(
        regex,
        '<span class="bg-red-200 text-red-800 font-semibold">$1</span>'
      );
    });
    
    return highlighted;
  }, []);

  // textarea 스크롤과 하이라이트 동기화
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // 하이라이트 업데이트
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = getHighlightedHTML(content);
    }
  }, [content, getHighlightedHTML]);


  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">금칙어 검사기</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">실시간으로 글자 수와 금칙어를 확인하세요</p>
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdSense size="banner" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-2">
                <label htmlFor="editor" className="block text-sm sm:text-base font-medium text-gray-700">
                  본문 작성 {stats.foundWords.length > 0 && (
                    <span className="text-red-600 text-xs sm:text-sm ml-2">
                      ({stats.foundWords.length}개 금칙어 발견)
                    </span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                  <button
                    onClick={() => setContent(SAMPLE_TEXT)}
                    className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                  >
                    샘플 텍스트 불러오기
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(content);
                      alert('내용이 클립보드에 복사되었습니다.');
                    }}
                    disabled={!content.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
                  >
                    복사 하기
                  </button>
                </div>
              </div>
              <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                {/* 하이라이트 오버레이 */}
                <div
                  ref={highlightRef}
                  className="absolute inset-0 p-4 pointer-events-none overflow-y-auto whitespace-pre-wrap break-words font-sans text-base leading-normal"
                  style={{
                    color: 'transparent',
                    zIndex: 1,
                    lineHeight: '1.5',
                  }}
                />
                {/* 실제 입력 textarea */}
                <textarea
                  ref={textareaRef}
                  id="editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onScroll={handleScroll}
                  placeholder="여기에 글을 작성하세요..."
                  className="w-full h-[400px] sm:h-[500px] md:h-[600px] p-3 sm:p-4 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-sans text-base sm:text-lg overflow-y-auto relative bg-transparent text-gray-900"
                  style={{
                    zIndex: 2,
                    caretColor: '#000',
                    lineHeight: '1.6',
                  }}
                />
              </div>
              
              {/* 금칙어 위치 정보 및 대체 */}
              {stats.foundPositions.length > 0 && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200 h-64 sm:h-96 flex flex-col">
                  <h3 className="text-sm sm:text-base font-medium text-red-700 mb-3">
                    금칙어 발견 위치 ({stats.foundPositions.length}곳)
                  </h3>
                  <div className="space-y-2 sm:space-y-3 overflow-y-auto flex-1">
                    {stats.foundPositions.map((pos, idx) => {
                      const replacementKey = `${pos.index}-${pos.word}`;
                      const replacementValue = replacements[replacementKey] || '';
                      
                      const handleReplace = () => {
                        if (!replacementValue.trim()) {
                          alert('대체 단어를 입력해주세요.');
                          return;
                        }
                        
                        // 해당 위치의 금칙어를 대체 단어로 교체
                        const beforeText = content.substring(0, pos.index);
                        const afterText = content.substring(pos.index + pos.word.length);
                        const newContent = beforeText + replacementValue + afterText;
                        setContent(newContent);
                        
                        // 해당 대체 입력 필드 초기화
                        setReplacements(prev => {
                          const newReplacements = { ...prev };
                          delete newReplacements[replacementKey];
                          return newReplacements;
                        });
                      };
                      
                      return (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                            <div className="flex gap-2 items-center">
                              <span className="font-semibold text-red-600 text-sm whitespace-nowrap">{pos.word}</span>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{pos.lineNumber}줄 {pos.column}번째</span>
                            </div>
                            <div className="flex-1 flex gap-2 items-center">
                              <input
                                type="text"
                                value={replacementValue}
                                onChange={(e) => setReplacements(prev => ({
                                  ...prev,
                                  [replacementKey]: e.target.value
                                }))}
                                placeholder="대체할 단어 입력"
                                className="flex-1 px-3 py-2.5 text-base border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                              />
                              <button
                                onClick={handleReplace}
                                className="flex-shrink-0 px-4 py-2.5 bg-blue-600 text-white text-sm sm:text-base font-medium rounded hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap min-h-[44px] min-w-[60px] touch-manipulation"
                              >
                                적용
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Stats and Ad */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">실시간 분석</h2>
              
              {/* Character Count */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">글자 수</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">공백 포함</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {stats.withSpaces.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">공백 제외</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {stats.withoutSpaces.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Forbidden Words Check */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">금칙어 검사</h3>
                {stats.foundWords.length === 0 ? (
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <span className="text-sm text-green-700 font-medium">✓ 금칙어 없음</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600 font-medium mb-2">
                        {stats.foundWords.length}개의 금칙어 발견
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {stats.foundWords.map((word) => (
                          <span
                            key={word}
                            className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Sidebar */}
            <AdSense size="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

