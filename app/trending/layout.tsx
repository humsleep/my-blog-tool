import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '인기 검색어',
  description:
    '네이버 실시간 인기 검색어를 카테고리·기간별로 조회하세요. 지금 뜨는 키워드를 가장 먼저 잡아 블로그 글감으로 활용할 수 있습니다.',
  keywords: ['인기 검색어', '네이버 트렌드', '실시간 검색어', '블로그 글감', '트렌드 키워드'],
  alternates: { canonical: '/trending' },
  openGraph: {
    title: '인기 검색어 — 지금 뜨는 키워드',
    description: '네이버 실시간 인기 키워드 카테고리·기간별 조회. 블로그 글감을 가장 먼저.',
    url: '/trending',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
