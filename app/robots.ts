import type { MetadataRoute } from 'next';

const BASE_URL = 'https://bohemebloglab.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 작성/수정/설정 페이지는 색인 제외 (인증 필요 페이지)
        disallow: [
          '/api/',
          '/auth/',
          '/login',
          '/profile/setup',
          // 정보 공유 메뉴 — 사이트 활성화 후 오픈 예정. 그 전까지 색인 차단.
          '/community/tips',
          '/community/tips/*',
          '/community/companions/new',
          '/community/companions/*?id=',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
