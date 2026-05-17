import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '황금 키워드 찾기 — 무료 키워드 분석',
  description:
    '네이버 검색광고 API 로 검색량·문서수·경쟁률을 한 표에. 위키 페이지뷰까지 결합해 진짜 황금 키워드를 골라드립니다. 무료 사용.',
  keywords: ['키워드 분석', '황금 키워드', '네이버 키워드 도구', '검색량 조회', '키워드 경쟁률'],
  alternates: { canonical: '/lp/keyword' },
  openGraph: {
    title: '황금 키워드 찾기 — 검색량·경쟁률 한 표에',
    description: '네이버 검색광고 + 위키 페이지뷰로 만든 데이터 기반 키워드 리서치.',
    url: '/lp/keyword',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
