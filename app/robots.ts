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
          '/community/tips/new',
          '/community/companions/new',
          '/community/tips/*?id=',
          '/community/companions/*?id=',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
