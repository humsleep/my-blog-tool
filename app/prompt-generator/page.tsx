'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdPlaceholder from '../components/AdPlaceholder';

const CATEGORIES = {
  '엔터테인먼트·예술': [
    '문학·책',
    '영화',
    '미술·디자인',
    '공연·전시',
    '음악',
    '드라마',
    '스타·연예인',
    '만화·애니',
    '방송',
  ],
  '생활·노하우·쇼핑': [
    '일상·생각',
    '육아·결혼',
    '반려동물',
    '좋은글·이미지',
    '패션·미용',
    '인테리어·DIY',
    '요리·레시피',
    '상품리뷰',
    '원예·재배',
  ],
  '취미·여가·여행': [
    '게임',
    '스포츠',
    '사진',
    '자동차',
    '취미',
    '국내여행',
    '세계여행',
    '맛집',
  ],
  '지식·동향': [
    'IT·컴퓨터',
    '사회·정치',
    '건강·의학',
    '비즈니스·경제',
    '어학·외국어',
    '교육·학문',
  ],
};

const TITLE_STYLES = [
  '리스트형',
  '질문형',
  '후기형',
  '비교형',
];

const CONTENT_STYLES = [
  '정보형',
  '후기형',
  '리뷰형',
  '가이드/튜토리얼형',
  '비교형',
  '스토리텔링형',
];

const TARGET_AUDIENCES = [
  '완전 초보',
  '중급자/매니아',
  '구매 고민층',
  '2030',
  '직장인',
  '전체',
];

const TONES = [
  '친근한 이웃(해요체)',
  '전문적/신뢰감(합니다체)',
  '감성적/에세이',
  '유머러스/재치',
  '단호한/팩트중심',
];

const EMOJI_USAGE = [
  '풍부하게',
  '적당히',
  '없음',
];

const LENGTHS = [
  { value: 'short', label: '짧은 글 (500-1000자)' },
  { value: 'medium', label: '중간 글 (1000-2000자)' },
  { value: 'long', label: '긴 글 (2000자 이상)' },
  { value: 'flexible', label: '유연함' },
];

const ADDITIONAL_OPTIONS = [
  '제목 후보 3개 제안',
  '소제목(H태그) 포함 구조',
  '이미지 삽입 위치 및 캡션 가이드',
  '핵심 3줄 요약 박스 포함',
  '연관 해시태그 30개 추천',
];

function PromptGeneratorContent() {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [titleStyle, setTitleStyle] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [emojiUsage, setEmojiUsage] = useState('적당히');
  const [length, setLength] = useState('flexible');
  const [additionalOptions, setAdditionalOptions] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // URL 쿼리 파라미터에서 키워드 가져오기
  useEffect(() => {
    const keywordParam = searchParams.get('keyword');
    if (keywordParam) {
      setKeyword(decodeURIComponent(keywordParam));
    }
  }, [searchParams]);

  // 선택된 카테고리에서 대분류와 세부 분야 추출
  const getCategoryInfo = (category: string) => {
    for (const [mainCat, subCats] of Object.entries(CATEGORIES)) {
      if (subCats.includes(category)) {
        return { mainCategory: mainCat, subCategory: category };
      }
    }
    return { mainCategory: '', subCategory: category };
  };

  const toggleAdditionalOption = (option: string) => {
    setAdditionalOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const toggleAllAdditionalOptions = () => {
    if (additionalOptions.length === ADDITIONAL_OPTIONS.length) {
      // 모두 선택되어 있으면 모두 해제
      setAdditionalOptions([]);
    } else {
      // 일부만 선택되어 있거나 아무것도 선택되지 않았으면 모두 선택
      setAdditionalOptions([...ADDITIONAL_OPTIONS]);
    }
  };

  const generatePrompt = () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }
    if (!selectedCategory) {
      alert('분야를 선택해주세요.');
      return;
    }
    if (!tone) {
      alert('어투를 선택해주세요.');
      return;
    }

    setIsGenerating(true);

    const { mainCategory, subCategory } = getCategoryInfo(selectedCategory);

    // 프롬프트 생성 로직
    let prompt = `다음 조건에 맞는 네이버 블로그 상위 노출을 위한 최적화된 글을 작성해주세요.\n\n`;
    
    // 기본 정보
    prompt += `**주제/키워드**: ${keyword}\n\n`;
    prompt += `**분야**: ${mainCategory} > ${subCategory}\n\n`;
    
    // 제목 스타일
    if (titleStyle) {
      prompt += `**제목 스타일**: ${titleStyle}\n`;
      if (titleStyle === '리스트형') {
        prompt += `  - 예시: "${keyword}하는 법 5가지", "${keyword} 추천 TOP 10"\n`;
      } else if (titleStyle === '질문형') {
        prompt += `  - 예시: "아직도 ${keyword}하시나요?", "${keyword} 정말 괜찮을까?"\n`;
      } else if (titleStyle === '후기형') {
        prompt += `  - 예시: "${keyword} 직접 써보니...", "${keyword} 솔직 후기"\n`;
      } else if (titleStyle === '비교형') {
        prompt += `  - 예시: "${keyword} A vs B 비교", "${keyword} 어떤 게 나을까?"\n`;
      }
      prompt += `\n`;
    }
    
    // 글 스타일
    if (contentStyle) {
      prompt += `**글 스타일**: ${contentStyle}\n`;
      if (contentStyle === '정보형') {
        prompt += `  - 객관적이고 정확한 정보를 제공하는 형식으로 작성하세요.\n`;
        prompt += `  - 팩트 중심의 내용을 체계적으로 정리하여 전달하세요.\n`;
      } else if (contentStyle === '후기형') {
        prompt += `  - 실제 경험을 바탕으로 한 주관적이고 솔직한 후기 형식으로 작성하세요.\n`;
        prompt += `  - 경험담과 느낌을 생생하게 전달하세요.\n`;
      } else if (contentStyle === '리뷰형') {
        prompt += `  - 제품, 서비스, 콘텐츠 등을 객관적이고 상세하게 평가하는 형식으로 작성하세요.\n`;
        prompt += `  - 장단점을 균형있게 제시하고 구체적인 평가 기준을 포함하세요.\n`;
      } else if (contentStyle === '가이드/튜토리얼형') {
        prompt += `  - 단계별로 명확하게 설명하는 가이드 형식으로 작성하세요.\n`;
        prompt += `  - 독자가 따라할 수 있도록 구체적이고 실용적인 내용을 제공하세요.\n`;
      } else if (contentStyle === '비교형') {
        prompt += `  - 여러 대상을 비교 분석하는 형식으로 작성하세요.\n`;
        prompt += `  - 각 항목별로 명확한 비교 기준과 장단점을 제시하세요.\n`;
      } else if (contentStyle === '스토리텔링형') {
        prompt += `  - 이야기 형식으로 흥미롭게 전개하는 형식으로 작성하세요.\n`;
        prompt += `  - 독자의 몰입도를 높이는 서사 구조를 활용하세요.\n`;
      }
      prompt += `\n`;
    }
    
    // 타겟 독자
    if (targetAudience) {
      prompt += `**타겟 독자**: ${targetAudience}\n`;
      if (targetAudience === '완전 초보') {
        prompt += `  - 초보자도 이해할 수 있도록 쉽고 친절하게 설명하세요.\n`;
      } else if (targetAudience === '중급자/매니아') {
        prompt += `  - 전문 용어와 심화 내용을 포함하세요.\n`;
      } else if (targetAudience === '구매 고민층') {
        prompt += `  - 구매 결정에 도움이 되는 비교 정보와 추천을 포함하세요.\n`;
      } else if (targetAudience === '2030') {
        prompt += `  - 젊은 세대의 관심사와 트렌드를 반영하세요.\n`;
      } else if (targetAudience === '직장인') {
        prompt += `  - 바쁜 일상에 맞는 실용적이고 간결한 정보를 제공하세요.\n`;
      }
      prompt += `\n`;
    }
    
    // 어투/톤앤매너
    prompt += `**어투/톤앤매너**: ${tone}\n`;
    if (tone === '친근한 이웃(해요체)') {
      prompt += `  - 해요체를 사용하여 친근하고 편안한 느낌을 주세요.\n`;
    } else if (tone === '전문적/신뢰감(합니다체)') {
      prompt += `  - 합니다체를 사용하여 전문적이고 신뢰감 있는 톤을 유지하세요.\n`;
    } else if (tone === '감성적/에세이') {
      prompt += `  - 감성적이고 서정적인 표현을 사용하여 독자의 감정을 자극하세요.\n`;
    } else if (tone === '유머러스/재치') {
      prompt += `  - 적절한 유머와 재치 있는 표현으로 재미있게 작성하세요.\n`;
    } else if (tone === '단호한/팩트중심') {
      prompt += `  - 명확하고 단호한 톤으로 팩트 중심의 정보를 제공하세요.\n`;
    }
    prompt += `\n`;
    
    // 이모지 활용도
    if (emojiUsage) {
      prompt += `**이모지 활용도**: ${emojiUsage}\n`;
      if (emojiUsage === '풍부하게') {
        prompt += `  - 적절한 위치에 이모지를 사용하여 활기찬 느낌을 주세요.\n`;
      } else if (emojiUsage === '적당히') {
        prompt += `  - 가독성을 해치지 않는 선에서 필요한 곳에만 이모지를 사용하세요.\n`;
      } else if (emojiUsage === '없음') {
        prompt += `  - 이모지를 사용하지 않고 깔끔하고 전문적인 느낌을 유지하세요.\n`;
      }
      prompt += `\n`;
    }
    
    // 글 길이
    if (length !== 'flexible') {
      const lengthLabel = LENGTHS.find(l => l.value === length)?.label || length;
      prompt += `**글 길이**: ${lengthLabel}\n\n`;
    }
    
    // 기본 요구사항
    prompt += `**기본 요구사항**:\n`;
    prompt += `- SEO를 고려한 자연스러운 키워드 배치 (메인 키워드를 본문에 적절히 배치)\n`;
    prompt += `- 독자에게 유용하고 실용적인 정보 제공\n`;
    prompt += `- 읽기 쉽고 이해하기 쉬운 구조\n`;
    prompt += `- 도입부, 본문, 결론의 명확한 구성\n`;
    prompt += `- 네이버 블로그 상위 노출을 위한 최적화된 구조\n`;
    
    // 추가 구성 옵션
    if (additionalOptions.length > 0) {
      prompt += `**추가 구성 옵션**:\n`;
      if (additionalOptions.includes('제목 후보 3개 제안')) {
        prompt += `- 제목 후보 3개를 제안해주세요 (각각 다른 스타일로)\n`;
      }
      if (additionalOptions.includes('소제목(H태그) 포함 구조')) {
        prompt += `- 소제목(H2, H3 태그)을 포함한 구조화된 글 작성\n`;
      }
      if (additionalOptions.includes('이미지 삽입 위치 및 캡션 가이드')) {
        prompt += `- 이미지 삽입 위치와 각 이미지에 대한 캡션 가이드 제공\n`;
      }
      if (additionalOptions.includes('핵심 3줄 요약 박스 포함')) {
        prompt += `- 글 상단 또는 하단에 핵심 내용을 3줄로 요약한 박스 포함\n`;
      }
      if (additionalOptions.includes('연관 해시태그 30개 추천')) {
        prompt += `- 글과 관련된 해시태그 30개를 추천해주세요\n`;
      }
      prompt += `\n`;
    }
    
    // 분야별 맞춤 요구사항
    if (mainCategory === '엔터테인먼트·예술') {
      prompt += `**분야별 요구사항**:\n`;
      prompt += `- 작품이나 콘텐츠에 대한 깊이 있는 분석과 감상\n`;
      prompt += `- 독자의 공감을 이끌어낼 수 있는 표현\n\n`;
    } else if (mainCategory === '생활·노하우·쇼핑') {
      prompt += `**분야별 요구사항**:\n`;
      prompt += `- 실용적이고 구체적인 정보 제공\n`;
      prompt += `- 독자가 바로 적용할 수 있는 팁과 노하우\n\n`;
    } else if (mainCategory === '취미·여가·여행') {
      prompt += `**분야별 요구사항**:\n`;
      prompt += `- 생생한 경험과 감동을 전달하는 스토리텔링\n`;
      prompt += `- 사진이나 이미지로 보완할 수 있는 내용 구성\n\n`;
    } else if (mainCategory === '지식·동향') {
      prompt += `**분야별 요구사항**:\n`;
      prompt += `- 정확하고 신뢰할 수 있는 정보 제공\n`;
      prompt += `- 최신 트렌드와 동향을 반영한 내용\n\n`;
    }

    prompt += `위 조건에 맞는 완성도 높은 네이버 블로그 글을 작성해주세요.`;

    // 약간의 딜레이를 주어 생성 중임을 표시
    setTimeout(() => {
      setGeneratedPrompt(prompt);
      setIsGenerating(false);
    }, 500);
  };

  const copyToClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    alert('프롬프트가 클립보드에 복사되었습니다.');
  };

  const resetForm = () => {
    setKeyword('');
    setSelectedCategory('');
    setTitleStyle('');
    setContentStyle('');
    setTargetAudience('');
    setTone('');
    setEmojiUsage('적당히');
    setLength('flexible');
    setAdditionalOptions([]);
    setGeneratedPrompt('');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">프롬프트 생성</h1>
          <p className="text-gray-600 mt-2">
            키워드와 옵션을 선택하여 블로그 글 작성을 위한 최적의 프롬프트를 생성하세요
          </p>
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdPlaceholder size="banner" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">프롬프트 설정</h2>
              
              <div className="space-y-6">
                {/* Keyword Input */}
                <div>
                  <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                    키워드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예: 수원 맛집 추천"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    블로그 글의 주제가 될 키워드를 입력하세요
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    분야 <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(CATEGORIES).map(([mainCat, subCats]) => (
                      <div key={mainCat} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <h3 className="text-xs font-semibold text-gray-800 mb-2">{mainCat}</h3>
                        <div className="space-y-1.5">
                          {subCats.map((subCat) => (
                            <button
                              key={subCat}
                              type="button"
                              onClick={() => setSelectedCategory(subCat)}
                              className={`w-full p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                                selectedCategory === subCat
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {subCat}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Title Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    제목 스타일
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {TITLE_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setTitleStyle(titleStyle === style ? '' : style)}
                          className={`flex-1 min-w-[100px] p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            titleStyle === style
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    글 스타일
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setContentStyle(contentStyle === style ? '' : style)}
                          className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            contentStyle === style
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Audience Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    타겟 독자
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {TARGET_AUDIENCES.map((audience) => (
                        <button
                          key={audience}
                          type="button"
                          onClick={() => setTargetAudience(targetAudience === audience ? '' : audience)}
                          className={`flex-1 min-w-[100px] p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            targetAudience === audience
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {audience}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    어투/톤앤매너 <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            tone === t
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emoji Usage Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    이모지 활용도
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_USAGE.map((usage) => (
                        <button
                          key={usage}
                          type="button"
                          onClick={() => setEmojiUsage(usage)}
                          className={`flex-1 min-w-[100px] p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            emojiUsage === usage
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {usage}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Length Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    글 길이
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {LENGTHS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setLength(l.value)}
                          className={`w-full p-2 rounded-lg border-2 transition-colors text-xs font-medium text-center ${
                            length === l.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      추가 구성 옵션
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllAdditionalOptions}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {additionalOptions.length === ADDITIONAL_OPTIONS.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="space-y-2">
                      {ADDITIONAL_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={additionalOptions.includes(option)}
                            onChange={() => toggleAdditionalOption(option)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={generatePrompt}
                    disabled={isGenerating || !keyword.trim() || !selectedCategory || !tone}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isGenerating ? '생성 중...' : '프롬프트 생성'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Prompt */}
            {generatedPrompt && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">생성된 프롬프트</h2>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    복사하기
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {generatedPrompt}
                  </pre>
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
                  <span>블로그 글의 주제가 될 키워드를 입력하세요 (필수)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  <span>분야와 어투/톤앤매너를 선택하세요 (필수)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  <span>제목 스타일, 글 스타일, 타겟 독자 등을 선택하세요 (선택)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  <span>이모지 활용도, 글 길이, 추가 구성 옵션을 선택하세요 (선택)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  <span>"프롬프트 생성" 버튼을 클릭하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">6.</span>
                  <span>생성된 프롬프트를 복사하여 AI 도구에 사용하세요</span>
                </li>
              </ol>
            </div>

            {/* Tips Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">팁</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>키워드는 구체적이고 명확하게 입력하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>제목 스타일을 선택하면 상위 노출 확률을 높일 수 있습니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>타겟 독자를 선택하면 해당 독자층에 맞는 내용으로 작성됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>추가 구성 옵션을 선택하면 더욱 완성도 높은 프롬프트가 생성됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>생성된 프롬프트는 필요에 따라 수정하여 사용할 수 있습니다</span>
                </li>
              </ul>
            </div>

            {/* Ad Sidebar */}
            <AdPlaceholder size="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromptGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">프롬프트 생성</h1>
            <p className="text-gray-600 mt-2">
              키워드와 옵션을 선택하여 블로그 글 작성을 위한 최적의 프롬프트를 생성하세요
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PromptGeneratorContent />
    </Suspense>
  );
}

