import { NextRequest, NextResponse } from 'next/server';

function generateBlogTitles(keyword: string, searchVolume: number, competitionRatio: number): string[] {
  const titleTemplates = [
    // 호기심 유발형
    `🔥 ${keyword} 완벽 가이드 - 이거 하나면 끝!`,
    `✨ ${keyword} 비밀 공개 - 99%가 모르는 진실`,
    `💡 ${keyword} 꿀팁 - 전문가도 놀란 노하우`,
    `🎯 ${keyword} 완전정복 - 초보자도 OK!`,
    `🚀 ${keyword} 마스터하기 - 단계별 가이드`,
    
    // 숫자 활용형
    `📊 ${keyword} TOP 10 - 2024년 최신 순위`,
    `🎪 ${keyword} 5가지 방법 - 실패 없는 선택`,
    `📈 ${keyword} 3단계 완성 - 누구나 따라하기`,
    `🎨 ${keyword} 7가지 스타일 - 취향별 추천`,
    `⚡ ${keyword} 1분 완성 - 초간단 방법`,
    
    // 감정 어필형
    `😍 ${keyword} 완전 만족 - 후기 모음집`,
    `🤩 ${keyword} 대박 후기 - 실제 경험담`,
    `😊 ${keyword} 행복한 선택 - 만족도 100%`,
    `🥰 ${keyword} 추천 이유 - 왜 이걸 선택했을까?`,
    `😎 ${keyword} 고수 되기 - 프로의 비밀`,
    
    // 비교/대조형
    `⚖️ ${keyword} vs 대안 - 어떤 게 더 좋을까?`,
    `🔄 ${keyword} 전후 비교 - 놀라운 변화`,
    `📊 ${keyword} 장단점 분석 - 솔직한 리뷰`,
    `🎯 ${keyword} 선택 기준 - 이것만 알면 OK`,
    `💯 ${keyword} 완벽 비교 - 최종 선택 가이드`,
    
    // 시간/시기 활용형
    `⏰ ${keyword} 지금이 기회 - 타이밍 완벽`,
    `📅 ${keyword} 2024년 트렌드 - 올해 핫한 선택`,
    `🌟 ${keyword} 시즌별 가이드 - 언제가 최고?`,
    `🎊 ${keyword} 특별한 순간 - 기억에 남는 선택`,
    `⏳ ${keyword} 마지막 기회 - 놓치면 후회`,
    
    // 문제 해결형
    `❓ ${keyword} 고민 해결 - 이제 끝!`,
    `🔧 ${keyword} 문제 해결 - 100% 해결법`,
    `💊 ${keyword} 고민 완치 - 더 이상 고민 NO`,
    `🎯 ${keyword} 완벽 솔루션 - 원샷 해결`,
    `⚡ ${keyword} 즉시 해결 - 당장 적용 가능`,
    
    // 혜택/이점 강조형
    `🎁 ${keyword} 특별 혜택 - 지금만 기회`,
    `💰 ${keyword} 비용 절약 - 돈 버는 방법`,
    `⏱️ ${keyword} 시간 절약 - 효율성 극대화`,
    `🎯 ${keyword} 성공 보장 - 실패 없는 방법`,
    `🏆 ${keyword} 최고의 선택 - 1등의 비밀`,
    
    // 개인화/경험형
    `👤 ${keyword} 나만의 스타일 - 개성 있는 선택`,
    `🎨 ${keyword} DIY 가이드 - 직접 만들어보기`,
    `📝 ${keyword} 체험 후기 - 솔직한 이야기`,
    `🎪 ${keyword} 나의 경험 - 실제 사용기`,
    `💭 ${keyword} 솔직 후기 - 좋은 점과 아쉬운 점`,
    
    // 긴급성/한정성
    `🚨 ${keyword} 긴급 공지 - 놓치면 안 되는 정보`,
    `⏰ ${keyword} 마감 임박 - 서둘러야 할 이유`,
    `🎯 ${keyword} 한정 기회 - 지금만 특가`,
    `🔥 ${keyword} 핫한 이슈 - 화제의 중심`,
    `⭐ ${keyword} 베스트셀러 - 인기 1위`,
    
    // 전문성 어필형
    `👨‍💼 ${keyword} 전문가 분석 - 깊이 있는 리뷰`,
    `🔬 ${keyword} 과학적 접근 - 데이터로 증명`,
    `📚 ${keyword} 완전 분석 - 모든 것 정리`,
    `🎓 ${keyword} 마스터 클래스 - 전문가의 노하우`,
    `🏅 ${keyword} 인증 완료 - 검증된 방법`
  ];

  const selectedTitles: string[] = [];
  
  // 검색량이 높으면 인기/트렌드 관련 제목 우선
  if (searchVolume > 10000) {
    const popularTemplates = titleTemplates.filter(t => 
      t.includes('🔥') || t.includes('⭐') || t.includes('📈') || t.includes('🎯') || t.includes('🚀')
    );
    const shuffled = popularTemplates.sort(() => Math.random() - 0.5);
    selectedTitles.push(...shuffled.slice(0, 2));
  }
  
  // 경쟁율이 낮으면 호기심/비밀 관련 제목 우선
  if (competitionRatio < 0.5) {
    const curiosityTemplates = titleTemplates.filter(t => 
      t.includes('✨') || t.includes('💡') || t.includes('비밀') || t.includes('완벽') || t.includes('꿀팁')
    );
    const shuffled = curiosityTemplates.sort(() => Math.random() - 0.5);
    selectedTitles.push(...shuffled.slice(0, 2));
  }
  
  // 나머지는 랜덤 선택
  const remainingTemplates = titleTemplates.filter(t => !selectedTitles.includes(t));
  const shuffled = remainingTemplates.sort(() => Math.random() - 0.5);
  selectedTitles.push(...shuffled.slice(0, 5 - selectedTitles.length));
  
  // 중복 제거 및 5개로 제한
  const uniqueTitles = Array.from(new Set(selectedTitles)).slice(0, 5);
  
  // 5개가 안 되면 추가로 랜덤 선택
  while (uniqueTitles.length < 5) {
    const randomTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    if (!uniqueTitles.includes(randomTemplate)) {
      uniqueTitles.push(randomTemplate);
    }
  }
  
  return uniqueTitles.slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, searchVolume, competitionRatio } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const titles = generateBlogTitles(
      keyword,
      searchVolume || 0,
      competitionRatio || 0
    );

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('제목 생성 오류:', error);
    return NextResponse.json(
      { error: '제목 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

