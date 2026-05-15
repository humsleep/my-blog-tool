import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이미지 검색 — Pexels·Unsplash 통합',
  description:
    '무료 저작권(CC0) 이미지를 Pexels·Unsplash 한 화면에서 통합 검색. 블로그에 바로 쓸 수 있는 고화질 이미지를 빠르게 골라보세요.',
  keywords: ['무료 이미지', 'CC0 이미지', 'Pexels 검색', 'Unsplash 검색', '블로그 이미지'],
  alternates: { canonical: '/image-search' },
  openGraph: {
    title: '무료 이미지 통합 검색 — Pexels + Unsplash',
    description: 'CC0 저작권 이미지 한 화면에서 검색·다운로드·편집기로 전송.',
    url: '/image-search',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
