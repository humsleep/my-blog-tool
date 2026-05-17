import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이미지 편집 — 크롭·모자이크·필터',
  description:
    '블로그용 이미지를 브라우저에서 바로 편집. 크롭, 모자이크, 워터마크, 색감 필터를 무료로. 서버 업로드 없이 클라이언트에서 처리.',
  keywords: ['이미지 편집', '온라인 크롭', '모자이크', '워터마크', '블로그 이미지 편집'],
  alternates: { canonical: '/image-tools' },
  openGraph: {
    title: '이미지 편집 — 크롭·모자이크·필터·워터마크',
    description: '서버 업로드 없이 브라우저에서 바로 편집. 블로그용 빠른 이미지 가공.',
    url: '/image-tools',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
