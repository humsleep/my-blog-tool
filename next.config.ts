import type { NextConfig } from "next";

/**
 * 보안 헤더 — 모든 라우트에 공통 적용.
 *  - HSTS: HTTPS 강제 (Vercel은 기본 HTTPS이지만 헤더로 한 번 더 명시)
 *  - X-Content-Type-Options: MIME sniffing 차단
 *  - X-Frame-Options: clickjacking 차단
 *  - Referrer-Policy: 외부 사이트로 path/query 누설 최소화
 *  - Permissions-Policy: 사용 안 하는 디바이스 API 차단
 *
 * CSP는 Quill / Wanted Sans CDN / AdSense / Vercel Analytics / Supabase 등
 * 다양한 외부 자산을 쓰기 때문에 strict-dynamic 없이는 운영하기 어렵다.
 * 운영 안정화 후 별도 phase에서 CSP 도입 검토.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig: NextConfig = {
  images: {
    /* AVIF 우선, 미지원 시 WebP. 두 포맷 모두 PNG/JPG 대비 큰 폭 절감.
     * Next/Image는 Accept 헤더에 맞춰 자동 선택. */
    formats: ['image/avif', 'image/webp'],
    /* 외부 이미지 변환 결과를 31일 동안 CDN 캐시. */
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
