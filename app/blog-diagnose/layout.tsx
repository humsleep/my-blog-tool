import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '블로그 진단',
  description:
    '내가 실제로 쓴 글이 검색 상위에 뜨는지로 1페이지 진입율을 측정. 분야는 자동 감지하고 활동성·노출·품질 3축 점수와 30일 액션 플랜을 30초 안에 받아보세요.',
  keywords: ['블로그 진단', '네이버 블로그 점수', '블로그 SEO 진단', '키워드 노출 측정', '블로그 분석'],
  alternates: { canonical: '/blog-diagnose' },
  openGraph: {
    title: '블로그 진단 — 0~100점 + 30일 액션 플랜',
    description: '내가 쓴 글이 검색 상위에 뜨는지로 측정하는 데이터 기반 블로그 점수. 약점 키워드와 다음 행동을 함께.',
    url: '/blog-diagnose',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
