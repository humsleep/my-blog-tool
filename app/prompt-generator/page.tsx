'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import FlowNav from '../components/FlowNav';
import WizardStepBar from '../components/WizardStepBar';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import { useToast } from '../components/ui/Toast';

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
  'FAQ 섹션 추가',
  '비교표 포함 (테이블 형식)',
  '체크리스트 형식 포함',
  '출처·참고자료 명시',
  'CTA 강화 (댓글·공감 유도)',
];

/** 광고·협찬 표시 — 네이버는 미표시 광고성 글에 페널티 적용 */
const SPONSORSHIP_OPTIONS = [
  { value: 'none',     label: '일반 글',         help: '광고·협찬 없는 일반 콘텐츠' },
  { value: 'sponsored', label: '협찬·체험단',     help: '글 상단에 협찬 사실을 명시 (네이버 가이드 준수)' },
  { value: 'affiliate', label: '제휴 마케팅',     help: '제휴 링크 포함 시 광고 표시 의무' },
];

/** 개인 경험 강조도 — E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) */
const EXPERIENCE_LEVELS = [
  { value: 'none',  label: '없음',     help: '객관적 정보만 (뉴스/공식 발표 정리 등)' },
  { value: 'light', label: '약간',     help: '"제 경험상" 정도의 가벼운 언급' },
  { value: 'heavy', label: '경험 중심', help: '실사용·방문 후기 비중 50% 이상 (네이버 노출 ↑)' },
];

/** 글의 목적 — 결말·CTA·문체가 달라짐 */
const PURPOSES = [
  { value: 'info',      label: '정보 가이드',     help: '독자가 모르는 정보·노하우 전달' },
  { value: 'review',    label: '후기·리뷰',       help: '직접 사용·방문한 경험 공유' },
  { value: 'recommend', label: '추천·비교',       help: '제품·서비스·장소 추천 + 비교' },
  { value: 'promo',     label: '모객·홍보',       help: '이벤트·모임 모집, 매장 홍보' },
  { value: 'daily',     label: '일상 공유',       help: '에세이·일상 기록 위주' },
];

/** 본문 구조 — 소제목 개수와 분량 가이드 */
const STRUCTURES = [
  { value: 'flexible',  label: '자유',           help: 'AI 판단에 맡김' },
  { value: 'compact',   label: '짧게 3섹션',     help: '소제목 3개 · 빠른 정보 전달' },
  { value: 'standard',  label: '표준 5섹션',     help: '소제목 5개 · 네이버 표준' },
  { value: 'deep',      label: '심층 7섹션',     help: '소제목 7개 · 가이드/리뷰형' },
];

/** 시기·시즌 — 네이버는 시기성 콘텐츠를 우대 */
const SEASONALITY_OPTIONS = [
  '무관',
  '봄 (3~5월)',
  '여름 (6~8월)',
  '가을 (9~11월)',
  '겨울 (12~2월)',
  '연말연시',
  '명절·연휴',
  '학기·새학기',
  '휴가철',
];

/** CTA 종류 — 결말 메시지의 방향 */
const CTA_TYPES = [
  '댓글 유도 (질문 던지기)',
  '공감·하트 유도',
  '이웃추가 유도',
  '관련 글 유도 (시리즈)',
  '외부 링크 유도 (예약·구매)',
  '없음',
];

function PromptGeneratorContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'beginner' | 'advanced'>('beginner');
  const [keyword, setKeyword] = useState('');
  const [relatedKeywords, setRelatedKeywords] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [titleStyle, setTitleStyle] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [emojiUsage, setEmojiUsage] = useState('적당히');
  const [length, setLength] = useState('flexible');
  const [sponsorship, setSponsorship] = useState<'none' | 'sponsored' | 'affiliate'>('none');
  const [experience, setExperience] = useState<'none' | 'light' | 'heavy'>('light');
  const [purpose, setPurpose] = useState<'info' | 'review' | 'recommend' | 'promo' | 'daily' | ''>('');
  const [location, setLocation] = useState('');
  const [keyFacts, setKeyFacts] = useState('');
  const [differentiator, setDifferentiator] = useState('');
  const [structure, setStructure] = useState<'flexible' | 'compact' | 'standard' | 'deep'>('flexible');
  const [seasonality, setSeasonality] = useState('무관');
  const [ctaType, setCtaType] = useState('');
  const [additionalOptions, setAdditionalOptions] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [newsContext, setNewsContext] = useState<{
    keyword: string;
    items: Array<{ title: string; description: string; pubDate: string; link: string }>;
  } | null>(null);
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [presetUserId, setPresetUserId] = useState<string | null>(null);
  /** "AI 글쓰기로 바로" 버튼 — 프롬프트 미리보기 없이 바로 ai-writer 진입.
   *  generatePrompt() 가 동기적으로 setGeneratedPrompt 호출 → useEffect 가
   *  플래그를 보고 sendToAiWriter() 호출. */
  const [autoGoToWriter, setAutoGoToWriter] = useState(false);

  const sendToAiWriter = () => {
    if (!generatedPrompt) return;
    sessionStorage.setItem('aiWriterPrompt', generatedPrompt);
    if (keyword) sessionStorage.setItem('aiWriterKeyword', keyword);
    router.push('/ai-writer');
  };

  /** generatePrompt 가 generatedPrompt 를 set 한 직후 자동 진입 트리거 */
  useEffect(() => {
    if (autoGoToWriter && generatedPrompt) {
      setAutoGoToWriter(false);
      sendToAiWriter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGoToWriter, generatedPrompt]);

  // URL 쿼리 파라미터에서 키워드 가져오기
  useEffect(() => {
    const keywordParam = searchParams.get('keyword');
    if (keywordParam) {
      setKeyword(decodeURIComponent(keywordParam));
    }
  }, [searchParams]);

  // 로그인 사용자: 마지막 프리셋 자동 복원
  useEffect(() => {
    if (!isSupabaseConfigured()) { setPresetLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { if (!cancelled) setPresetLoaded(true); return; }
      if (!cancelled) setPresetUserId(auth.user.id);

      const { data } = await supabase
        .from('profiles')
        .select('prompt_preset')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      const preset = data?.prompt_preset as Record<string, unknown> | null;
      if (preset && !cancelled) {
        // 키워드는 URL 파라미터 우선이라 복원 안 함
        if (typeof preset.selectedCategory === 'string') setSelectedCategory(preset.selectedCategory);
        if (typeof preset.titleStyle === 'string')       setTitleStyle(preset.titleStyle);
        if (typeof preset.contentStyle === 'string')     setContentStyle(preset.contentStyle);
        if (typeof preset.targetAudience === 'string')   setTargetAudience(preset.targetAudience);
        if (typeof preset.tone === 'string')             setTone(preset.tone);
        if (typeof preset.emojiUsage === 'string')       setEmojiUsage(preset.emojiUsage);
        if (typeof preset.length === 'string')           setLength(preset.length);
        if (preset.sponsorship === 'none' || preset.sponsorship === 'sponsored' || preset.sponsorship === 'affiliate') {
          setSponsorship(preset.sponsorship);
        }
        if (preset.experience === 'none' || preset.experience === 'light' || preset.experience === 'heavy') {
          setExperience(preset.experience);
        }
        if (preset.purpose === 'info' || preset.purpose === 'review' || preset.purpose === 'recommend' || preset.purpose === 'promo' || preset.purpose === 'daily') {
          setPurpose(preset.purpose);
        }
        if (typeof preset.location === 'string')        setLocation(preset.location);
        if (typeof preset.keyFacts === 'string')        setKeyFacts(preset.keyFacts);
        if (typeof preset.differentiator === 'string')  setDifferentiator(preset.differentiator);
        if (preset.structure === 'flexible' || preset.structure === 'compact' || preset.structure === 'standard' || preset.structure === 'deep') {
          setStructure(preset.structure);
        }
        if (typeof preset.seasonality === 'string')     setSeasonality(preset.seasonality);
        if (typeof preset.ctaType === 'string')         setCtaType(preset.ctaType);
        if (Array.isArray(preset.additionalOptions)) {
          setAdditionalOptions(preset.additionalOptions.filter((x): x is string => typeof x === 'string'));
        }
        if (preset.mode === 'beginner' || preset.mode === 'advanced') {
          setMode(preset.mode);
        }
      }
      if (!cancelled) setPresetLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // 로그인 사용자: 옵션 변경 시 프리셋 자동 저장 (디바운스 1초)
  useEffect(() => {
    if (!presetLoaded || !presetUserId) return;
    const t = setTimeout(async () => {
      const supabase = createClient();
      const preset = {
        mode, selectedCategory, titleStyle, contentStyle, targetAudience,
        tone, emojiUsage, length, sponsorship, experience, additionalOptions,
        purpose, location, keyFacts, differentiator, structure, seasonality, ctaType,
      };
      await supabase
        .from('profiles')
        .update({ prompt_preset: preset })
        .eq('user_id', presetUserId);
    }, 1000);
    return () => clearTimeout(t);
  }, [presetLoaded, presetUserId, mode, selectedCategory, titleStyle, contentStyle, targetAudience, tone, emojiUsage, length, sponsorship, experience, additionalOptions, purpose, location, keyFacts, differentiator, structure, seasonality, ctaType]);

  // sessionStorage의 뉴스 컨텍스트 수신 (키워드 분석 → 뉴스 모달 → 프롬프트 만들기 흐름)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('promptNewsContext');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as typeof newsContext;
      if (parsed && parsed.keyword && Array.isArray(parsed.items) && parsed.items.length > 0) {
        setNewsContext(parsed);
        setKeyword(parsed.keyword);
      }
    } catch {
      // ignore malformed
    }
    sessionStorage.removeItem('promptNewsContext');
  }, []);

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
      toast('키워드를 입력해주세요.', 'info');
      return;
    }
    if (!selectedCategory) {
      toast('분야를 선택해주세요.', 'info');
      return;
    }
    if (!tone) {
      toast('어투를 선택해주세요.', 'info');
      return;
    }

    setIsGenerating(true);

    const { mainCategory, subCategory } = getCategoryInfo(selectedCategory);

    // 프롬프트 생성 로직
    let prompt = `다음 조건에 맞는 네이버 블로그 상위 노출을 위한 최적화된 글을 작성해주세요.\n\n`;
    
    // 기본 정보
    prompt += `**주제/키워드**: ${keyword}\n\n`;
    prompt += `**분야**: ${mainCategory} > ${subCategory}\n\n`;

    // 연관 키워드 (LSI) — SEO 핵심
    const lsi = relatedKeywords.split(',').map(s => s.trim()).filter(Boolean);
    if (lsi.length > 0) {
      prompt += `**연관 키워드(자연스럽게 본문에 분산 배치)**: ${lsi.join(', ')}\n\n`;
    }
    
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

    // 광고·협찬 표시 (네이버 가이드 준수)
    if (sponsorship === 'sponsored') {
      prompt += `**광고·협찬 표시**: 협찬·체험단 글입니다. 글 도입부에 "이 글은 협찬을 받아 작성되었습니다" 등 협찬 사실을 명확히 표시하고, 광고성 단어(최저가, 특가, 강력추천 등)는 자제해주세요.\n\n`;
    } else if (sponsorship === 'affiliate') {
      prompt += `**광고·협찬 표시**: 제휴 마케팅 링크가 포함됩니다. "본 글은 제휴 링크를 포함합니다" 안내 문구를 자연스럽게 포함해주세요.\n\n`;
    }

    // 개인 경험 강조도 (E-E-A-T)
    if (experience === 'heavy') {
      prompt += `**개인 경험 비중**: 50% 이상. 실사용·방문 후기, 시행착오, 구체적인 시간·장소·금액 등을 본문에 적극 포함해주세요. "[나의 경험 삽입]" placeholder로 작성자가 채울 부분을 표시해주세요.\n\n`;
    } else if (experience === 'light') {
      prompt += `**개인 경험 비중**: 가벼운 언급. "제 경험상", "직접 써보니" 정도의 표현을 2~3회 자연스럽게 포함하고, "[나의 경험 삽입]" placeholder를 1~2개 위치에 표시해주세요.\n\n`;
    } else {
      prompt += `**개인 경험 비중**: 없음 (객관적 정보 위주, 뉴스/공식 자료 정리 형식).\n\n`;
    }

    // 글의 목적 — 결말·CTA·문체 톤이 달라짐
    if (purpose) {
      const purposeMap: Record<string, string> = {
        info:      '정보 가이드 — 독자가 모르는 정보·노하우를 단계별로 명확하게 전달. 결론에서는 핵심 3줄 요약으로 정리.',
        review:    '후기·리뷰 — 직접 사용/방문한 경험 중심. 장점·단점을 솔직하게 제시하고, 누구에게 추천하는지 결론에 명시.',
        recommend: '추천·비교 — 여러 옵션의 장단점을 비교하고 "이런 상황에는 A, 저런 상황에는 B"식의 실용 가이드를 결론에 포함.',
        promo:     '모객·홍보 — 이벤트·매장·서비스 정보를 정확히 전달. 일정·장소·연락처 등 핵심 정보를 박스로 강조하고 결론에 참여·예약 유도.',
        daily:     '일상 공유 — 에세이·일기 톤으로 자연스럽게. 정보 전달보다는 작가의 시각·감정·관찰을 중심으로 풀어냄.',
      };
      prompt += `**글의 목적**: ${purposeMap[purpose]}\n\n`;
    }

    // 지역 정보 — 네이버 하이퍼로컬 SEO
    if (location.trim()) {
      prompt += `**지역 정보**: ${location.trim()}\n`;
      prompt += `  - 본문에 "${location.trim()}"을(를) 자연스럽게 2~3회 언급하고, 인접 지역명·지하철역·랜드마크도 1~2개 함께 풀어내 지역 검색 노출을 강화하세요.\n`;
      prompt += `  - 해시태그에 #${location.trim().replace(/\s+/g, '')} 및 인접 지역 태그를 반드시 포함하세요.\n\n`;
    }

    // 본문에 꼭 포함할 핵심 정보 (가격/시간/장소/수치 등)
    if (keyFacts.trim()) {
      prompt += `**본문에 반드시 포함할 핵심 정보**:\n`;
      keyFacts.trim().split(/\n+/).forEach((line) => {
        const t = line.trim().replace(/^[-*•]\s*/, '');
        if (t) prompt += `  - ${t}\n`;
      });
      prompt += `  → 위 정보는 절대 누락하지 말고 본문에 정확히 명시하세요. 수치·일정·장소는 임의 변경 금지.\n\n`;
    }

    // 차별화 포인트 — E-E-A-T
    if (differentiator.trim()) {
      prompt += `**이 글만의 차별화 포인트**: ${differentiator.trim()}\n`;
      prompt += `  - 위 관점·경험을 본문 도입부와 결론에서 한 번씩 명확히 드러내, 다른 일반적인 정보 글과 구별되는 색깔을 만들어주세요.\n\n`;
    }

    // 본문 구조 — 소제목 개수 가이드 (3단계에서 활용)
    const structureLabels: Record<string, string> = {
      flexible:  '자유 (AI 판단)',
      compact:   '짧게 — 소제목 3개 (300~500자/섹션, 빠른 정보 전달)',
      standard:  '표준 — 소제목 5개 (350~450자/섹션, 네이버 표준)',
      deep:      '심층 — 소제목 7개 (250~350자/섹션, 가이드/리뷰형)',
    };
    if (structure !== 'flexible') {
      prompt += `**본문 구조**: ${structureLabels[structure]}\n\n`;
    }

    // 시기·시즌 — 네이버는 시기성 콘텐츠 우대
    if (seasonality && seasonality !== '무관') {
      prompt += `**시기·시즌 키워드**: ${seasonality}\n`;
      prompt += `  - "${seasonality}" 시기에 특화된 정보·팁·체크리스트를 1개 섹션 이상 자연스럽게 포함하고, 해시태그에 시즌 키워드를 포함하세요.\n\n`;
    }

    // CTA 종류 — 결말 메시지 방향
    if (ctaType && ctaType !== '없음') {
      const ctaMap: Record<string, string> = {
        '댓글 유도 (질문 던지기)':       '결론 직전 독자의 경험을 묻는 구체적인 질문 1개를 던지고, 마지막 문장에서 "댓글로 들려주세요"식으로 자연스럽게 유도',
        '공감·하트 유도':                '마지막 문장에 "도움 되셨다면 공감 한번 부탁드려요" 등 자연스러운 공감 유도 1줄',
        '이웃추가 유도':                  '마지막 문장에 "비슷한 글 더 보고 싶으시면 이웃추가 환영해요" 등 이웃 유도 1줄',
        '관련 글 유도 (시리즈)':          '결론에서 "다음 글에서는 ~를 다뤄볼 예정이에요" 식의 시리즈 예고 1문장',
        '외부 링크 유도 (예약·구매)':     '결론에 "예약/구매 링크는 본문 중간에 남겨두었어요" 또는 "[링크 삽입]" placeholder 명시',
      };
      const ctaInst = ctaMap[ctaType];
      if (ctaInst) prompt += `**결말 CTA**: ${ctaInst}.\n\n`;
    }

    // 네이버 블로그 글쓰기 지침 — GEO 우선 (AI브리핑 인용 1순위 + 홈피드 노출 2순위)
    const todayStr = new Date().toLocaleDateString('ko-KR');
    const kw = keyword.replace(/\s+/g, '');
    // 본문 구조에 따라 소제목 개수 동적 변경 (GEO 가독성: 소제목 5개 이하 권장)
    const sectionCount = structure === 'compact' ? 3 : structure === 'deep' ? 7 : 5;

    prompt += `**네이버 블로그 글쓰기 지침 (GEO 우선 — 순서대로 처리)**:\n\n`;

    prompt += `[0. 최우선 목표] 1순위는 네이버 AI브리핑 '인용'에 뽑히는 글(GEO), 2순위는 홈피드 노출입니다. 둘이 충돌하면 GEO 구조를 먼저 만족시킨 뒤 후킹 요소를 그 위에 얹으세요.\n\n`;

    prompt += `[1. 정확성·사전 검증]\n`;
    prompt += `- 본문 작성 직전, 수치·일정·인물·통계 등 사실 정보는 web_search로 최신 정보를 확인하고 2개 이상 출처로 교차 검증하세요 (한국어 1차 출처 우선).\n`;
    prompt += `- 모든 수치·날짜·기록에는 기준 시점을 함께 적으세요 (예: "${todayStr} 기준"). 추정치는 "추정/예상"이라고 명시.\n`;
    prompt += `- 검증 안 된 정보는 절대 포함하지 마세요.\n\n`;

    prompt += `[2. AI브리핑 인용 최적화 (1순위)]\n`;
    prompt += `- **핵심 질문 1개**: 이 글이 답하는 핵심 질문 1개를, 사용자가 실제로 검색·질문할 형태로 먼저 정하세요.\n`;
    prompt += `- **두괄식 답**: 인트로 안에 그 질문의 답을 두괄식 1단락으로 쓰되, 그 단락만 읽어도 답이 완결되게 하세요 (AI가 통째로 추출 가능하도록). 단계·항목은 불릿 대신 문장 안에 풀어 넣으세요.\n`;
    prompt += `- **자기완결적 사실 문장**: 핵심 사실은 한 문장 안에서 완결하고(수치·날짜·고유명사를 그 문장에 포함), "그것/이것/위에서 말한" 같은 대명사로 사실을 흐리지 마세요.\n`;
    prompt += `- **1인칭 경험**: 직접 경험·시행착오·체감을 최소 1군데 반드시 넣으세요 (AI가 못 쓰는 차별점 = 인용의 결정적 요소).\n`;
    prompt += `- **소제목 = 소질문→소답변**: 각 소제목은 독자의 소질문 형태로, 첫 1~2문장에 그 답을 두괄식으로 두세요.\n`;
    prompt += `- **투명성(외부 링크 없이)**: 외부 출처·인용 링크는 노출하지 말고(네이버 링크 스팸 페널티 회피), 대신 "직접 해보니", "공식 기록 기준" 같은 경험·근거 표지로 신뢰를 드러내세요.\n\n`;

    prompt += `[3. 홈피드 노출 (2순위 — GEO 위에 얹기)]\n`;
    prompt += `- **제목**: 검색 키워드 "${keyword}"를 앞쪽, 호기심 트리거를 뒤쪽에 결합하세요. 낚시형 단독 제목은 금지(진정성과 충돌). 제목 끝에 이모지 1개, 한 줄.\n`;
    prompt += `- **인트로**: 후킹(인용구/놀라운 사실/통계)과 두괄식 답을 동시에 충족하세요. 회상톤 남발은 금지.\n`;
    prompt += `- **마무리**: 질문형으로 댓글을 유도하고 이모지 1개로 닫으세요.\n\n`;

    prompt += `[4. 본문 형식 (모바일 가독성)]\n`;
    prompt += `- **분량**: 위에서 글 길이를 지정했으면 그 범위를 우선하고, 미지정 시 1,500~2,500자.\n`;
    prompt += `- **소제목**: ▣ 기호 소제목 ${sectionCount}개, 각 소제목 본문은 최소 300자. 명사형으로 간결하게, 비슷한 주제는 묶으세요.\n`;
    prompt += `- **줄바꿈·단락**: 마침표 뒤 줄바꿈, 단락은 빈 줄로 분리하고 단락당 2~3줄.\n`;
    prompt += `- **사람톤**: "솔직히/진짜로/~더라고요"를 섞고, 짧은 문장과 긴 문장을 번갈아, 자문자답·감탄·여담도 자연스럽게.\n`;
    prompt += `- **인용·표기**: 인용은 "~한다고 해요" 귀속형으로. 인물·외국 고유명사는 첫 등장 시만 '한글(영문)', 이후 약식 이름.\n`;
    prompt += `- **메인 키워드 반복**: "${keyword}"는 본문 전체에서 5~6회만 반복 (과도하면 노출 ↓).\n`;
    prompt += `- **표**: 직관적인 수치 비교가 필요할 때만 최대 3~4행. 나머지는 산문으로 풀어내세요.\n`;
    if (newsContext && newsContext.items.length > 0) {
      prompt += `- **🔴 참고 뉴스 반영 (필수)**: 본문 ${sectionCount}개 섹션 중 최소 1개 섹션은 위에 첨부된 "참고 최근 뉴스"의 흐름·수치·사건·인물 중 1~2개를 직접 다루며 풀어내세요. 뉴스 문장을 그대로 베끼지 말고 작가의 톤으로 재구성하되, 시기·수치는 정확히 유지하세요.\n`;
    }
    prompt += `\n`;

    prompt += `[5. 한국 인명·용어 표기]\n`;
    prompt += `- 외국 인명·용어는 한국 언론에서 가장 많이 쓰는 표기를 따르세요. 헷갈리면 작성 직전 검색으로 다수 표기를 채택하세요.\n\n`;

    prompt += `[6. 해시태그]\n`;
    prompt += `- 본문 끝에 해시태그 30개를 한 줄로 제시하세요. 고검색량 태그 + 니치(롱테일) 태그 조합 (예: #${kw} #${kw}추천 등).\n\n`;

    prompt += `[7. 금지 사항 & 자체 검토 — 출력 전 필수]\n`;
    prompt += `다음을 점검하고 위반 시 인용형("~한다고 해요" / "~라는 의견이 많아요")으로 바꾸세요:\n`;
    prompt += `- **절대적·과장 표현**: 무조건, 최고, 1순위, 절대, 100%, 보장, 완벽\n`;
    prompt += `- **자극·단정**: 죽다, 큰일 난다 → "무리가 갈 수 있다"; 효능 단정 → "~한다고 해요"\n`;
    prompt += `- **광고성 단어**: 최저가, 특가, 할인쿠폰, 수익보장, 무료체험\n`;
    prompt += `- **키워드 과다 반복 / 외부 출처·인용 링크 노출 / 결론 은폐(두괄식 답 누락)** 금지\n`;
    if (keyFacts.trim()) {
      prompt += `- **핵심 정보 누락 점검**: 위 "본문에 반드시 포함할 핵심 정보"가 빠짐없이 본문에 정확히 표기되었는지 확인하세요.\n`;
    }
    if (newsContext && newsContext.items.length > 0) {
      prompt += `- **🔴 뉴스 반영 점검 (필수)**: 본문 안에 위 참고 뉴스의 흐름·수치·인물·일정 중 1~2개가 작가의 문장으로 자연스럽게 녹아들었는지 확인하세요. "최근 뉴스에 따르면..." 한 줄로 끝내지 말고 한 섹션의 논지와 연결하세요.\n`;
    }
    prompt += `**GEO 최종 점검**: 핵심 질문 1개가 명확한가 · 인트로에 두괄식 답 1단락이 있는가 · 핵심 사실 문장이 자기완결적인가 · 1인칭 경험이 1군데 이상 있는가 · 기준 시점이 명시됐는가 · 소제목이 소질문–소답변 구조인가.\n`;
    prompt += `점검 후 [제목 → 본문 → 해시태그] 순서로 최종본만 출력하세요.\n\n`;
    
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
        prompt += `- 글과 관련된 해시태그 30개를 추천해주세요 (네이버 #태그 형식)\n`;
      }
      if (additionalOptions.includes('FAQ 섹션 추가')) {
        prompt += `- 본문 끝에 자주 묻는 질문 3~5개와 답변(Q&A 형식)을 포함해주세요\n`;
      }
      if (additionalOptions.includes('비교표 포함 (테이블 형식)')) {
        prompt += `- 핵심 정보를 비교할 수 있는 마크다운 테이블 1개 포함 (3~5행)\n`;
      }
      if (additionalOptions.includes('체크리스트 형식 포함')) {
        prompt += `- 독자가 바로 확인할 수 있는 체크리스트(- [ ] 형식) 1개 포함\n`;
      }
      if (additionalOptions.includes('출처·참고자료 명시')) {
        prompt += `- 정보의 출처·참고자료를 본문 끝에 별도 섹션으로 정리 (신뢰도 향상)\n`;
      }
      if (additionalOptions.includes('CTA 강화 (댓글·공감 유도)')) {
        prompt += `- 결론 직전에 독자의 의견을 묻는 질문 1개, 결론에 공감·댓글 유도 문장 추가\n`;
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

    // 뉴스 컨텍스트가 있으면 프롬프트 상단에 prefix로 주입 — 본문에 반드시 녹아들도록 강한 지침
    if (newsContext && newsContext.items.length > 0) {
      const stripHtml = (s: string) =>
        s.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
      const formatDate = (raw: string) => {
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('ko-KR');
      };
      let prefix = `## 🔴 참고할 최근 관련 뉴스 (${newsContext.items.length}건) — 본문 반영 필수\n\n`;
      newsContext.items.forEach((it, idx) => {
        prefix += `**뉴스 ${idx + 1}**. ${stripHtml(it.title)} _(${formatDate(it.pubDate)})_\n`;
        if (it.description) prefix += `   요약: ${stripHtml(it.description)}\n`;
        prefix += `\n`;
      });
      prefix += `### 위 뉴스를 본문에 반영하는 규칙 (반드시 준수)\n`;
      prefix += `1. **최소 1개 섹션은 위 뉴스의 흐름·수치·사건·인물을 직접 다뤄야 합니다.** 단순한 "최근 ~라고 합니다" 한 줄로 끝내면 안 되고, 해당 섹션 전체가 그 뉴스의 맥락과 자연스럽게 이어져야 합니다.\n`;
      prefix += `2. 뉴스 문장을 그대로 베끼지 말고, 작가의 해요체로 풀어쓰세요. 예: "지난주 발표된 ${newsContext.items[0] ? stripHtml(newsContext.items[0].title).slice(0, 20) : '소식'}... 이슈, 다들 보셨죠?"\n`;
      prefix += `3. 뉴스에 등장하는 **고유명사·날짜·수치**는 정확히 유지하세요 (임의 변형·삭제 금지). 출처가 명확한 정보임을 살려 글의 신뢰도를 높입니다.\n`;
      prefix += `4. 뉴스 흐름이 본문에 자연스럽게 녹아들면 "왜 지금 이 글을 읽어야 하는가"의 시의성이 살아나 네이버 노출에 유리합니다.\n\n`;
      prefix += `---\n\n`;
      prompt = prefix + prompt;
    }

    // 약간의 딜레이를 주어 생성 중임을 표시
    setTimeout(() => {
      setGeneratedPrompt(prompt);
      setIsGenerating(false);
    }, 500);
  };

  const copyToClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    toast('프롬프트가 클립보드에 복사되었습니다.', 'success');
  };

  const resetForm = () => {
    setKeyword('');
    setRelatedKeywords('');
    setSelectedCategory('');
    setTitleStyle('');
    setContentStyle('');
    setTargetAudience('');
    setTone('');
    setEmojiUsage('적당히');
    setLength('flexible');
    setSponsorship('none');
    setExperience('light');
    setPurpose('');
    setLocation('');
    setKeyFacts('');
    setDifferentiator('');
    setStructure('flexible');
    setSeasonality('무관');
    setCtaType('');
    setAdditionalOptions([]);
    setGeneratedPrompt('');
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WizardStepBar current={2} />
        <div className="mt-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">프롬프트 생성</h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1.5">
              키워드와 옵션을 선택하여 블로그 글 작성을 위한 최적의 프롬프트를 생성하세요
            </p>
          </div>
          {/* 초보자 / 고급 모드 토글 */}
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode('beginner')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'beginner'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              초보자 모드
            </button>
            <button
              type="button"
              onClick={() => setMode('advanced')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'advanced'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              고급 모드
            </button>
          </div>
        </div>

        {mode === 'beginner' && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg text-xs text-orange-800 dark:text-orange-300">
            💡 <strong>초보자 모드</strong>: 꼭 필요한 항목(키워드 / 분야 / 어투 / 글 스타일)만 보여드립니다. 익숙해지면 우상단 <strong>고급 모드</strong>로 전환하여 SEO 옵션을 더 세밀하게 조정할 수 있어요.
          </div>
        )}

        {presetUserId && presetLoaded && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-full text-[11px] text-orange-700 dark:text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            로그인 사용자 — 선택한 옵션이 자동 저장되어 다음 방문에 복원됩니다
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 sm:mb-6">프롬프트 설정</h2>

              {/* 뉴스 컨텍스트 미진입 안내 — 더 풍부한 글을 위한 동선 */}
              {!newsContext && (
                <div className="mb-5 sm:mb-6 rounded-lg border border-dashed border-orange-300 dark:border-orange-700/60 bg-orange-50/40 dark:bg-orange-950/20 p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">📰</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      더 풍부한 글을 원하시나요? <span className="text-orange-600 dark:text-orange-400">관련 뉴스</span>를 함께 넣어보세요
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-2 leading-relaxed">
                      <Link href="/keyword-analysis" className="font-medium text-orange-600 dark:text-orange-400 hover:underline">키워드 분석</Link>
                      에서 키워드 옆 <strong>📰 뉴스 보기</strong> 버튼을 누르면, 네이버 최신 뉴스를 골라 이 페이지로 가져올 수 있어요.
                      AI가 그 뉴스의 흐름을 자연스럽게 본문에 녹여 차별화된 글을 만들어줍니다.
                    </p>
                    <Link
                      href={keyword ? `/keyword-analysis?keyword=${encodeURIComponent(keyword)}` : '/keyword-analysis'}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      키워드 분석으로 가기
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}

              {/* 뉴스 컨텍스트 — 키워드 분석 → 뉴스 모달에서 가져온 경우 */}
              {newsContext && newsContext.items.length > 0 && (
                <div className="mb-5 sm:mb-6 rounded-lg border border-orange-200 dark:border-orange-700 bg-orange-50/60 dark:bg-orange-950/30 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-300">
                        가져온 관련 뉴스 ({newsContext.items.length}건)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewsContext(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex-shrink-0"
                      title="뉴스 제거"
                    >
                      제거
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    아래 뉴스의 흐름이 프롬프트 상단에 자동으로 포함되어 글에 반영됩니다.
                  </p>
                  <ul className="space-y-1.5">
                    {newsContext.items.map((it, i) => (
                      <li key={`${it.link}-${i}`} className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-1">
                        <span className="text-orange-500 dark:text-orange-400 font-medium mr-1">{i + 1}.</span>
                        {it.title.replace(/<[^>]*>/g, '')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-5 sm:space-y-6">
                {/* Keyword Input */}
                <div>
                  <label htmlFor="keyword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    키워드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예: 수원 맛집 추천"
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    블로그 글의 주제가 될 키워드를 입력하세요. 검색량이 큰 키워드일수록 노출 효과가 큽니다.
                  </p>
                </div>

                {/* 연관 키워드 (LSI) — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div>
                    <label htmlFor="related" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      연관 키워드 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                    </label>
                    <input
                      id="related"
                      type="text"
                      value={relatedKeywords}
                      onChange={(e) => setRelatedKeywords(e.target.value)}
                      placeholder="예: 수원역 맛집, 수원 데이트, 수원 카페"
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      쉼표(,)로 구분 · 메인 키워드와 의미가 비슷한 보조 키워드를 본문에 자연스럽게 분산 배치 → 네이버 SEO ↑
                    </p>
                  </div>
                )}

                {/* Category Selection — Accordion */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    분야 <span className="text-red-500">*</span>
                    {selectedCategory && (
                      <span className="ml-2 text-xs text-orange-500 dark:text-orange-400 font-normal">
                        선택됨: {selectedCategory}
                      </span>
                    )}
                  </label>
                  <div className="space-y-2">
                    {Object.entries(CATEGORIES).map(([mainCat, subCats]) => {
                      const hasSelected = subCats.includes(selectedCategory);
                      const isOpen = openCategory === mainCat || hasSelected;
                      return (
                        <div
                          key={mainCat}
                          className={`border rounded-lg overflow-hidden transition-colors ${
                            hasSelected
                              ? 'border-orange-300 dark:border-orange-600 bg-orange-50/30 dark:bg-orange-950/20'
                              : 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenCategory(isOpen && !hasSelected ? null : mainCat)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left min-h-[44px] hover:bg-zinc-100/60 dark:hover:bg-zinc-700/60 transition-colors"
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                              {mainCat}
                              <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                                {subCats.length}개
                              </span>
                            </span>
                            <svg
                              className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-3 pt-1">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {subCats.map((subCat) => (
                                  <button
                                    key={subCat}
                                    type="button"
                                    onClick={() => setSelectedCategory(subCat)}
                                    className={`p-2 rounded-lg border transition-colors text-xs font-medium text-center min-h-[36px] touch-manipulation ${
                                      selectedCategory === subCat
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                        : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                                    }`}
                                  >
                                    {subCat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Title Style Selection — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                      제목 스타일 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                    </label>
                    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                      <div className="flex flex-wrap gap-2">
                        {TITLE_STYLES.map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setTitleStyle(titleStyle === style ? '' : style)}
                            className={`px-4 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                              titleStyle === style
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    글 스타일
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setContentStyle(contentStyle === style ? '' : style)}
                          className={`px-4 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                            contentStyle === style
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                              : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 글의 목적 — 양쪽 모드 모두 노출 (결말·CTA가 달라짐) */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    글의 목적 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PURPOSES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPurpose(purpose === opt.value ? '' : opt.value as typeof purpose)}
                        className={`p-2.5 rounded-lg border text-left transition-colors min-h-[56px] ${
                          purpose === opt.value
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'
                            : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${purpose === opt.value ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">{opt.help}</div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    💡 글의 목적에 따라 결말·CTA·전체 톤이 달라집니다.
                  </p>
                </div>

                {/* Target Audience Selection — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                      타겟 독자 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                    </label>
                    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                      <div className="flex flex-wrap gap-2">
                        {TARGET_AUDIENCES.map((audience) => (
                          <button
                            key={audience}
                            type="button"
                            onClick={() => setTargetAudience(targetAudience === audience ? '' : audience)}
                            className={`px-4 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                              targetAudience === audience
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                            }`}
                          >
                            {audience}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    어투/톤앤매너 <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                    <div className="flex flex-wrap gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`px-4 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                            tone === t
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                              : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emoji Usage Selection — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                      이모지 활용도 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                    </label>
                    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_USAGE.map((usage) => (
                          <button
                            key={usage}
                            type="button"
                            onClick={() => setEmojiUsage(usage)}
                            className={`px-4 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                              emojiUsage === usage
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                            }`}
                          >
                            {usage}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Length Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    글 길이 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                  </label>
                  <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LENGTHS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setLength(l.value)}
                          className={`px-3 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                            length === l.value
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                              : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    네이버 노출은 1500~2500자가 가장 안정적입니다.
                  </p>
                </div>

                {/* SEO 강화: 광고·협찬 표시 + 개인 경험 강조도 — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div className="border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 bg-orange-50/40 dark:bg-orange-950/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">SEO 강화</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">최신 네이버 가이드 반영</span>
                    </div>

                    {/* 광고·협찬 표시 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        광고·협찬 표시 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {SPONSORSHIP_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSponsorship(opt.value as typeof sponsorship)}
                            className={`p-2.5 rounded-lg border text-left transition-colors min-h-[56px] ${
                              sponsorship === opt.value
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className={`text-xs font-semibold ${sponsorship === opt.value ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {opt.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.help}</div>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        ⚠️ 협찬·제휴 글에 표시를 누락하면 네이버 검색 노출 페널티 대상이 될 수 있습니다.
                      </p>
                    </div>

                    {/* 개인 경험 강조도 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        개인 경험 강조도 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {EXPERIENCE_LEVELS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setExperience(opt.value as typeof experience)}
                            className={`p-2.5 rounded-lg border text-left transition-colors min-h-[56px] ${
                              experience === opt.value
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className={`text-xs font-semibold ${experience === opt.value ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {opt.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.help}</div>
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        💡 네이버는 직접 경험·체험이 담긴 글의 노출을 우대합니다 (E-E-A-T 가이드).
                      </p>
                    </div>
                  </div>
                )}

                {/* 맞춤 정보 — 네이버 SEO 정밀화: 지역/핵심정보/차별화/구조/시기/CTA */}
                {mode === 'advanced' && (
                  <div className="border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">맞춤 정보</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">입력할수록 글이 구체적이고 차별화됩니다</span>
                    </div>

                    {/* 지역 정보 */}
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        지역 정보 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="예: 수원시 영통구 / 서울 강남역 / 부산 해운대"
                        className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        지역 키워드를 본문·해시태그에 자연스럽게 분산 → 네이버 하이퍼로컬 노출 ↑
                      </p>
                    </div>

                    {/* 본문에 꼭 포함할 핵심 정보 */}
                    <div>
                      <label htmlFor="keyfacts" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        본문에 꼭 포함할 핵심 정보 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <textarea
                        id="keyfacts"
                        value={keyFacts}
                        onChange={(e) => setKeyFacts(e.target.value)}
                        rows={4}
                        placeholder={'예시 (한 줄에 하나씩):\n- 영업시간: 11:00~22:00 (월요일 휴무)\n- 가격대: 2인 6만원\n- 주차 가능 (3시간 무료)\n- 예약: 네이버 예약 또는 전화'}
                        className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        가격·시간·장소·연락처 등 정확히 적어야 할 수치를 한 줄에 하나씩 — AI가 누락 없이 본문에 반영
                      </p>
                    </div>

                    {/* 차별화 포인트 */}
                    <div>
                      <label htmlFor="diff" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        이 글만의 차별화 포인트 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <textarea
                        id="diff"
                        value={differentiator}
                        onChange={(e) => setDifferentiator(e.target.value)}
                        rows={2}
                        placeholder="예: 5년차 워킹맘 시각으로 본 / 직접 3개월 써본 비교 / 현지에서 10년 산 사람의 추천"
                        className="w-full px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        다른 일반 글과 구별되는 작가의 관점·이력·경험 → E-E-A-T 강화
                      </p>
                    </div>

                    {/* 본문 구조 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        본문 구조 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STRUCTURES.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStructure(opt.value as typeof structure)}
                            className={`p-2.5 rounded-lg border text-left transition-colors min-h-[56px] ${
                              structure === opt.value
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className={`text-xs font-semibold ${structure === opt.value ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {opt.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">{opt.help}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 시기·시즌 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        시기·시즌 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SEASONALITY_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSeasonality(s)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                              seasonality === s
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        시즌 키워드는 그 시기에 검색량이 폭증 → 노출 기회 ↑
                      </p>
                    </div>

                    {/* 결말 CTA */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        결말 CTA <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CTA_TYPES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCtaType(ctaType === c ? '' : c)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-xs font-medium min-h-[36px] touch-manipulation ${
                              ctaType === c
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-500'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Options — 고급 모드만 */}
                {mode === 'advanced' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        추가 구성 옵션 <span className="text-zinc-400 font-normal text-xs">(선택 · 다중 선택 가능)</span>
                      </label>
                      <button
                        type="button"
                        onClick={toggleAllAdditionalOptions}
                        className="text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 font-medium px-2 py-1 rounded border border-orange-400 dark:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                      >
                        {additionalOptions.length === ADDITIONAL_OPTIONS.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-700/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {ADDITIONAL_OPTIONS.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-600/40 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={additionalOptions.includes(option)}
                              onChange={() => toggleAdditionalOption(option)}
                              className="w-4 h-4 text-orange-500 border-zinc-300 dark:border-zinc-500 rounded focus:ring-orange-500 accent-orange-500"
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={generatePrompt}
                    disabled={isGenerating || !keyword.trim() || !selectedCategory || !tone}
                    className="flex-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:border-orange-400 dark:hover:border-orange-500 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] text-sm"
                    title="프롬프트만 만들어서 직접 확인·복사하기"
                  >
                    {isGenerating && !autoGoToWriter ? '생성 중...' : '프롬프트만 생성'}
                  </button>
                  <button
                    onClick={() => {
                      setAutoGoToWriter(true);
                      generatePrompt();
                    }}
                    disabled={isGenerating || !keyword.trim() || !selectedCategory || !tone}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm min-h-[44px] text-sm inline-flex items-center justify-center gap-2"
                    title="프롬프트를 만들고 AI 글쓰기로 바로 이동"
                  >
                    {autoGoToWriter ? '준비 중...' : 'AI 글쓰기로 바로 →'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-h-[44px] text-sm sm:w-auto"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Prompt */}
            {generatedPrompt && (
              <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">생성된 프롬프트</h2>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded-lg transition-colors"
                  >
                    복사하기
                  </button>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 max-h-80 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 font-sans">
                    {generatedPrompt}
                  </pre>
                </div>

                {/* AI 글쓰기로 이동 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-700 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        이 프롬프트로 AI 글 받기
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        AI 글쓰기 페이지로 이동해 Claude가 완성된 글을 작성합니다. HTML·마크다운·일반 텍스트 3가지 포맷으로 즉시 복사할 수 있어요. (비로그인 1회/일, 로그인 5회/일 무료)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={sendToAiWriter}
                    className="btn-base btn-primary btn-lg w-full"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 글쓰기로 이동
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* How to use */}
            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">사용 방법</h2>
              <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {[
                  '블로그 글의 주제가 될 키워드를 입력하세요 (필수)',
                  '분야와 어투/톤앤매너를 선택하세요 (필수)',
                  '제목 스타일, 글 스타일, 타겟 독자 등을 선택하세요 (선택)',
                  '이모지 활용도, 글 길이, 추가 구성 옵션을 선택하세요 (선택)',
                  '"프롬프트 생성" 버튼을 클릭하세요',
                  '생성된 프롬프트를 복사하여 AI 도구에 사용하세요',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 dark:text-orange-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">팁</h2>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {[
                  '키워드는 구체적이고 명확하게 입력하세요',
                  '제목 스타일을 선택하면 상위 노출 확률을 높일 수 있습니다',
                  '타겟 독자를 선택하면 해당 독자층에 맞는 내용으로 작성됩니다',
                  '추가 구성 옵션을 선택하면 더욱 완성도 높은 프롬프트가 생성됩니다',
                  '생성된 프롬프트는 필요에 따라 수정하여 사용할 수 있습니다',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 dark:text-orange-400">•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 다음 단계 — 글쓰기 마법사 2/4 */}
        {generatedPrompt && (
          <FlowNav
            mode="writing"
            currentStep={2}
            totalSteps={4}
            stepLabel="프롬프트 생성"
            note="이 프롬프트로 AI에게 글을 받거나, 직접 ChatGPT 등에 붙여넣어 사용하세요."
            actions={[
              {
                href: '/ai-writer',
                label: 'AI 글쓰기로 이동',
                description: '다음 단계 — Claude AI가 자동으로 글 작성',
              },
              {
                href: '/editor',
                label: '에디터로 직접 이동',
                description: '이미 글이 있는 경우 (건너뛰기)',
                variant: 'secondary',
              },
            ]}
          />
        )}

                {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <Link
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            더 자세한 사용법은 연구실에서 확인하세요
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PromptGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">프롬프트 생성</h1>
          </div>
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    }>
      <PromptGeneratorContent />
    </Suspense>
  );
}

