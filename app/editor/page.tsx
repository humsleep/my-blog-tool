'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Quill을 직접 사용 (React 19 호환)
const QuillEditor = dynamic(
  () => import('./QuillEditor'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center text-gray-500">에디터 로딩 중...</div>
  }
);

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

// SEO 가이드 콘텐츠 (2,500자 이상) - 포스팅 에디터와 금칙어 검사에 집중
const SEO_GUIDE_CONTENT = `
<h2>프로페셔널 포스팅 에디터 활용 가이드</h2>

<h3>포스팅 에디터를 활용한 고품질 콘텐츠 작성법</h3>

<p>2026년 현재, 블로그 트래픽의 70% 이상이 모바일 기기를 통해 유입되고 있습니다. 전문적인 포스팅 에디터를 활용하면 모바일 가독성을 높이고, 검색 엔진 최적화를 동시에 달성할 수 있습니다. 포스팅 에디터는 단순히 텍스트를 입력하는 도구가 아니라, 콘텐츠의 품질을 결정하는 핵심 도구입니다.</p>

<p>프로페셔널 포스팅 에디터의 "가독성 자동 최적화" 기능은 마침표와 쉼표 뒤에 자동으로 줄바꿈을 추가하여 모바일 환경에서의 읽기 경험을 크게 개선합니다. 인간의 시각 인지 과정을 살펴보면, 한 줄에 50자 이상의 텍스트가 연속으로 배치되면 시선 이동에 부담이 생기고, 집중력이 급격히 떨어집니다. 모바일 화면에서는 이 현상이 더욱 두드러지는데, 에디터의 자동 최적화 기능이 이를 해결해줍니다.</p>

<p>심리학 연구에 따르면, 적절한 줄바꿈은 독자의 인지 부하를 줄이고 정보 처리 속도를 향상시킵니다. 포스팅 에디터를 사용하면 마침표나 쉼표 뒤에 자연스러운 줄바꿈을 자동으로 제공하여, 독자가 문장의 의미 단위를 더 쉽게 파악할 수 있습니다. 이는 단순히 가독성을 높이는 것을 넘어서, 콘텐츠의 이해도를 크게 개선합니다.</p>

<p>실제로 구글의 알고리즘은 사용자의 체류 시간과 스크롤 깊이를 중요한 랭킹 요소로 평가합니다. 포스팅 에디터의 가독성 최적화 기능을 활용하면, 사용자는 더 오래 머물고 더 깊이 스크롤하게 됩니다. 이는 검색 엔진에게 "이 콘텐츠가 사용자에게 유용하다"는 신호를 보내는 것입니다.</p>

<h3>실시간 금칙어 검사의 중요성과 기술적 원리</h3>

<p>프로페셔널 포스팅 에디터의 실시간 금칙어 검사 기능은 블로그 포스팅의 품질을 보장하는 핵심 도구입니다. 구글과 네이버 같은 검색 엔진은 단순히 키워드 매칭만으로 콘텐츠를 평가하지 않습니다. 최신 알고리즘은 자연어 처리(NLP) 기술을 활용하여 콘텐츠의 품질을 다각도로 분석하며, 특히 금칙어나 저품질 신호를 감지하는 메커니즘은 매우 정교합니다.</p>

<p>포스팅 에디터의 실시간 금칙어 검사 기능은 검색 엔진이 사용하는 것과 유사한 방식으로 작동합니다. 검색 엔진의 봇은 먼저 콘텐츠를 토큰화(tokenization) 과정을 거칩니다. 이 과정에서 텍스트를 단어 단위로 분해하고, 각 단어의 의미와 맥락을 분석합니다. 에디터의 금칙어 검사 기능도 마찬가지로 텍스트를 분석하여 금칙어를 실시간으로 하이라이트합니다.</p>

<p>검색 엔진은 TF-IDF(Term Frequency-Inverse Document Frequency) 알고리즘을 사용하여 특정 단어의 출현 빈도를 분석합니다. 금칙어가 과도하게 반복되거나, 자연스럽지 않은 패턴으로 등장하면, 이는 스팸 신호로 간주됩니다. 포스팅 에디터를 사용하면 글을 작성하는 동안 실시간으로 금칙어를 확인하고 수정할 수 있어, 검색 엔진에 의해 저품질 콘텐츠로 판단되는 것을 사전에 방지할 수 있습니다.</p>

<p>더욱 중요한 것은, 검색 엔진은 콘텐츠의 전체적인 맥락을 평가한다는 점입니다. 단순히 금칙어가 없다고 해서 고품질 콘텐츠로 인정받는 것은 아닙니다. 콘텐츠의 주제와 관련성이 높은지, 사용자에게 실제로 유용한 정보를 제공하는지, 그리고 자연스러운 문장 구조를 가지고 있는지 등을 종합적으로 평가합니다.</p>

<p>최근 구글의 BERT(Bidirectional Encoder Representations from Transformers) 알고리즘은 문맥을 이해하는 능력이 크게 향상되었습니다. 이는 단어의 순서와 맥락을 고려하여 콘텐츠의 의도를 파악합니다. 따라서 금칙어를 단순히 피하는 것이 아니라, 자연스럽고 유용한 콘텐츠를 작성하는 것이 더욱 중요해졌습니다.</p>

<h3>2026년 SEO 핵심 트렌드: 키워드 밀도보다 중요한 사용자 의도</h3>

<p>과거 SEO는 키워드 밀도에 집중했습니다. 특정 키워드를 얼마나 많이 사용하느냐가 검색 순위를 결정하는 주요 요소였습니다. 그러나 2026년 현재, SEO의 패러다임은 완전히 바뀌었습니다. 이제는 키워드 밀도보다 사용자 의도(User Intent)를 이해하고 충족시키는 것이 핵심입니다.</p>

<p>사용자 의도는 크게 네 가지로 분류됩니다: 정보성(Informational), 탐색성(Navigational), 거래성(Transactional), 상업적 조사(Commercial Investigation). 검색 엔진은 사용자의 검색 쿼리를 분석하여 어떤 의도로 검색했는지 파악하고, 그에 맞는 콘텐츠를 상위에 노출시킵니다. 예를 들어, "블로그 포스팅 방법"이라는 검색어는 정보성 의도를 가지고 있으므로, 단순히 키워드를 반복하는 것이 아니라 실제로 유용한 가이드를 제공하는 콘텐츠가 상위에 노출됩니다.</p>

<p>2026년 SEO의 또 다른 핵심 트렌드는 E-E-A-T(Experience, Expertise, Authoritativeness, Trustworthiness)입니다. 이는 경험, 전문성, 권위성, 신뢰성을 의미합니다. 검색 엔진은 콘텐츠 작성자가 해당 주제에 대한 실제 경험과 전문 지식을 가지고 있는지 평가합니다. 단순히 정보를 나열하는 것이 아니라, 실제 경험을 바탕으로 한 통찰을 제공하는 콘텐츠가 더 높은 평가를 받습니다.</p>

<p>또한, 콘텐츠의 깊이와 포괄성도 중요한 요소입니다. 얕은 정보만 제공하는 콘텐츠보다는, 주제를 다각도로 다루고 깊이 있게 분석하는 콘텐츠가 더 높은 순위를 받습니다. 이는 사용자가 한 페이지에서 필요한 모든 정보를 얻을 수 있도록 하는 것을 의미합니다.</p>

<p>모바일 최적화도 2026년 SEO의 필수 요소입니다. 구글은 모바일 우선 인덱싱(Mobile-First Indexing)을 기본으로 사용하고 있습니다. 이는 모바일 버전의 콘텐츠를 기준으로 검색 순위를 결정한다는 의미입니다. 따라서 모바일에서의 가독성, 로딩 속도, 사용자 경험이 검색 순위에 직접적인 영향을 미칩니다.</p>

<p>마지막으로, 사용자 참여 지표(User Engagement Metrics)의 중요성이 계속 증가하고 있습니다. 체류 시간, 이탈률, 스크롤 깊이, 클릭률 등이 검색 순위에 영향을 미칩니다. 이는 콘텐츠가 사용자에게 실제로 유용하고 매력적이어야 한다는 것을 의미합니다. 단순히 검색 엔진을 위한 최적화가 아니라, 사용자를 위한 콘텐츠 작성이 최종적으로 SEO 성공의 열쇠입니다.</p>

<h3>실전 포스팅 작성 전략</h3>

<p>위에서 설명한 원칙들을 실제 포스팅 작성에 적용하려면, 체계적인 접근이 필요합니다. 먼저 주제를 선정할 때는 사용자의 검색 의도를 명확히 파악해야 합니다. 그 다음, 해당 주제에 대한 깊이 있는 정보를 수집하고, 자신의 경험과 통찰을 결합하여 고유한 콘텐츠를 만들어야 합니다.</p>

<p>글을 작성할 때는 자연스러운 문장 구조를 유지하면서도, 적절한 줄바꿈을 통해 가독성을 높여야 합니다. 금칙어를 피하는 것은 물론이지만, 더 중요한 것은 사용자에게 실제로 유용한 정보를 제공하는 것입니다. 마지막으로, 모바일 환경에서의 가독성을 반드시 확인하고, 필요하다면 포맷을 조정해야 합니다.</p>

<p>이러한 전략을 꾸준히 적용하면, 단기적으로는 검색 엔진의 평가를 받고, 장기적으로는 독자들의 신뢰를 얻어 지속적인 트래픽을 확보할 수 있습니다. 2026년의 SEO는 더 이상 기술적 트릭이 아니라, 진정한 콘텐츠 품질과 사용자 경험에 기반한 경쟁입니다.</p>
`;

export default function EditorPage() {
  const [content, setContent] = useState('');
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [isSeoGuideOpen, setIsSeoGuideOpen] = useState(false);
  const quillEditorRef = useRef<any>(null);

  // Quill 모듈 설정
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'link'
  ];

  const stats = useMemo(() => {
    // HTML 태그 제거하여 순수 텍스트만 추출
    const textContent = content.replace(/<[^>]*>/g, '');
    const withSpaces = textContent.length;
    const withoutSpaces = textContent.replace(/\s/g, '').length;
    
    const foundWords: string[] = [];
    const foundPositions: Array<{ word: string; index: number; lineNumber: number; column: number }> = [];
    
    FORBIDDEN_WORDS.forEach((word) => {
      const regex = new RegExp(word, 'gi');
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(textContent)) !== null) {
        if (!foundWords.includes(word)) {
          foundWords.push(word);
        }
        const lineNumber = textContent.substring(0, match.index).split('\n').length;
        const lineStart = textContent.lastIndexOf('\n', match.index) + 1;
        const column = match.index - lineStart + 1;
        foundPositions.push({ 
          word, 
          index: match.index,
          lineNumber,
          column
        });
      }
    });

    foundPositions.sort((a, b) => {
      if (a.lineNumber !== b.lineNumber) {
        return a.lineNumber - b.lineNumber;
      }
      return a.column - b.column;
    });

    return { withSpaces, withoutSpaces, foundWords, foundPositions };
  }, [content]);

  // 금칙어 하이라이트를 위한 커스텀 스타일 적용 (debounce 사용)
  useEffect(() => {
    if (typeof window === 'undefined' || !content || !quillEditorRef.current) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const quill = quillEditorRef.current?.getEditor();
        if (!quill || typeof quill.getText !== 'function') return;
        
        const text = quill.getText();
        const length = quill.getLength();
        
        if (length === 0) return;
        
        // 기존 하이라이트 제거
        try {
          quill.formatText(0, length - 1, 'background', false, 'user');
        } catch (e) {
          // 무시
        }
        
        // 금칙어 찾아서 하이라이트
        FORBIDDEN_WORDS.forEach((word) => {
          const regex = new RegExp(word, 'gi');
          let match;
          regex.lastIndex = 0;
          while ((match = regex.exec(text)) !== null) {
            try {
              if (match.index < length && typeof quill.formatText === 'function') {
                quill.formatText(match.index, Math.min(word.length, length - match.index), 'background', '#fee2e2', 'user');
              }
            } catch (e) {
              // 인덱스 오류 무시
            }
          }
        });
      } catch (e) {
        // 에러 무시
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [content]);

  // 가독성 자동 최적화 함수
  const optimizeReadability = useCallback(() => {
    if (typeof window === 'undefined' || !quillEditorRef.current) return;
    
    try {
      const quill = quillEditorRef.current?.getEditor();
      if (!quill || typeof quill.getText !== 'function') return;
      
      let text = quill.getText();
      
      // 마침표와 쉼표 뒤에 줄바꿈 추가 (이미 줄바꿈이 있으면 중복 방지)
      text = text.replace(/([.,])(?!\s*\n)/g, '$1\n');
      // 연속된 줄바꿈 정리 (3개 이상을 2개로)
      text = text.replace(/\n{3,}/g, '\n\n');
      
      // Quill에 텍스트 설정
      if (quill.clipboard && typeof quill.clipboard.convert === 'function') {
        const delta = quill.clipboard.convert({ html: text.replace(/\n/g, '<br>') });
        quill.setContents(delta, 'silent');
        
        // content state 업데이트
        const html = quillEditorRef.current?.getHTML();
        if (html) {
          setContent(html);
        }
      }
    } catch (e) {
      console.error('가독성 최적화 오류:', e);
    }
  }, []);

  // 금칙어 대체 함수
  const handleReplace = useCallback((pos: { word: string; index: number; lineNumber: number; column: number }, replacementValue: string) => {
    if (!replacementValue.trim()) {
      alert('대체 단어를 입력해주세요.');
      return;
    }
    
    if (typeof window === 'undefined' || !quillEditorRef.current) return;
    
    try {
      const quill = quillEditorRef.current?.getEditor();
      if (!quill || typeof quill.getText !== 'function') return;
      
      const text = quill.getText();
      
      const beforeText = text.substring(0, pos.index);
      const afterText = text.substring(pos.index + pos.word.length);
      const newText = beforeText + replacementValue + afterText;
      
      if (quill.clipboard && typeof quill.clipboard.convert === 'function') {
        const delta = quill.clipboard.convert({ html: newText.replace(/\n/g, '<br>') });
        quill.setContents(delta, 'silent');
        
        const html = quillEditorRef.current?.getHTML();
        if (html) {
          setContent(html);
        }
      }
      
      // 대체 입력 필드 초기화
      const replacementKey = `${pos.index}-${pos.word}`;
      setReplacements(prev => {
        const newReplacements = { ...prev };
        delete newReplacements[replacementKey];
        return newReplacements;
      });
    } catch (e) {
      console.error('대체 오류:', e);
    }
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">프로페셔널 포스팅 에디터</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">실시간 금칙어 검사와 가독성 최적화 기능이 있는 전문적인 에디터입니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <label className="block text-sm sm:text-base font-medium text-gray-700">
                  본문 작성 {stats.foundWords.length > 0 && (
                    <span className="text-red-600 text-xs sm:text-sm ml-2">
                      ({stats.foundWords.length}개 금칙어 발견)
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && quillEditorRef.current) {
                        const quill = quillEditorRef.current?.getEditor();
                        if (quill && quill.clipboard && typeof quill.clipboard.convert === 'function') {
                          const delta = quill.clipboard.convert({ html: SAMPLE_TEXT.replace(/\n/g, '<br>') });
                          quill.setContents(delta, 'silent');
                          const html = quillEditorRef.current?.getHTML();
                          if (html) {
                            setContent(html);
                          }
                        }
                      }
                    }}
                    className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                  >
                    샘플 텍스트
                  </button>
                  <button
                    onClick={optimizeReadability}
                    className="px-4 py-2.5 text-sm bg-green-600 text-white hover:bg-green-700 active:bg-green-800 rounded-lg transition-colors min-h-[44px] touch-manipulation font-medium"
                  >
                    가독성 자동 최적화
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && quillEditorRef.current) {
                        const text = quillEditorRef.current?.getText();
                        if (text) {
                          navigator.clipboard.writeText(text);
                          alert('내용이 클립보드에 복사되었습니다.');
                        }
                      }
                    }}
                    disabled={!content.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
                  >
                    복사 하기
                  </button>
                </div>
              </div>
              
              {/* Quill Editor */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <QuillEditor
                  key="quill-editor"
                  ref={quillEditorRef}
                  value={content}
                  onChange={setContent}
                  placeholder="여기에 글을 작성하세요..."
                  modules={modules}
                  formats={formats}
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
                                onClick={() => handleReplace(pos, replacementValue)}
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

            {/* SEO 가이드 섹션 (아코디언) */}
            <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              <button
                onClick={() => setIsSeoGuideOpen(!isSeoGuideOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  블로그 성공을 위한 포스팅 완벽 가이드
                </h2>
                <svg
                  className={`w-6 h-6 text-gray-600 transform transition-transform ${isSeoGuideOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSeoGuideOpen && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div 
                    className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
                    dangerouslySetInnerHTML={{ __html: SEO_GUIDE_CONTENT }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Stats */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
