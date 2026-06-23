import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 블로그 점수는 몇 점? — 무료 블로그 진단',
  description:
    '네이버 블로그 URL 만 넣으면 30초 안에 0~100점 + 30일 액션 플랜. 내가 쓴 글이 노린 키워드로 1페이지 진입율을 측정합니다.',
  keywords: ['블로그 진단', '블로그 점수', '네이버 블로그 분석', '블로그 SEO 점수', '블로그 노출 측정'],
  alternates: { canonical: '/lp/diagnose' },
  openGraph: {
    title: '내 블로그 점수는? — 무료 진단 30초',
    description: '내가 쓴 글이 노린 키워드로 측정. 활동성·노출·품질 3축 + 30일 액션 플랜.',
    url: '/lp/diagnose',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
