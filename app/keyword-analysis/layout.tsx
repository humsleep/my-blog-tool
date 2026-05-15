import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '키워드 분석',
  description:
    '네이버 검색광고 API 로 검색량·문서수·경쟁률을 한 표에 펼치고 황금 키워드를 골라냅니다. 위키 페이지뷰까지 결합한 데이터 기반 키워드 리서치.',
  keywords: ['키워드 분석', '네이버 키워드 도구', '검색량 조회', '경쟁률 분석', '황금 키워드'],
  /* searchParams (?keyword=...) 가 있어도 base 만 canonical 로. 중복 인덱싱 방지. */
  alternates: { canonical: '/keyword-analysis' },
  openGraph: {
    title: '키워드 분석 — 검색량·경쟁률을 한 표에',
    description: '네이버 검색광고 API + 위키 페이지뷰로 만든 데이터 기반 키워드 리서치 도구.',
    url: '/keyword-analysis',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
