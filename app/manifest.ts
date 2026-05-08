import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boheme BlogLab',
    short_name: 'BlogLab',
    description: '네이버·티스토리 블로거를 위한 올인원 포스팅 도구',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#047857',
    orientation: 'portrait',
    lang: 'ko',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
