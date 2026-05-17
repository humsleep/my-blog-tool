import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '상위노출 분석',
  description:
    '네이버 검색 상위 블로그 포스트의 제목·본문 패턴을 분석. 어떤 키워드 조합이 1페이지에 올랐는지, 평균 글자수·이미지 수까지 한눈에.',
  keywords: ['상위노출', '네이버 SEO', '블로그 경쟁 분석', '상위 블로그', '키워드 노출 분석'],
  alternates: { canonical: '/competitor-analysis' },
  openGraph: {
    title: '상위노출 분석 — 1페이지 블로그의 공통점',
    description: '네이버 상위 블로그 제목·본문 패턴, 평균 글자수, 이미지 수를 한 화면에.',
    url: '/competitor-analysis',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
