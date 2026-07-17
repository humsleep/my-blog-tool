import type { MetadataRoute } from 'next';

const BASE_URL = 'https://bohemebloglab.com';

export default function robots(): MetadataRoute.Robots {
  // 인증/작성 페이지 (모든 크롤러 공통 차단)
  const disallow = [
    '/api/',
    '/auth/',
    '/login',
    '/profile/setup',
    // 정보 공유 메뉴 — 사이트 활성화 후 오픈 예정. 그 전까지 색인 차단.
    '/community/tips',
    '/community/tips/*',
    '/community/companions/new',
    '/community/companions/*?id=',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // AI 검색/브리핑 크롤러 명시 허용 — 네이버 메이트·AI 브리핑, Perplexity, ChatGPT,
      // Claude, Google AI 등에 내 콘텐츠가 인용될 수 있도록 접근을 열어둔다 (GEO/AEO).
      // llms.txt(사이트 요약 + 핵심 가이드 목록)와 함께 AI 검색 인용 접근성을 높인다.
      {
        userAgent: [
          'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
          'PerplexityBot', 'Perplexity-User',
          'ClaudeBot', 'Claude-Web', 'anthropic-ai',
          'Google-Extended', 'Applebot-Extended',
        ],
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
