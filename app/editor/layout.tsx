import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '에디터 — 금칙어·맞춤법 검사',
  description:
    '네이버 블로그 발행 전 마지막 점검. 금칙어 위치 자동 표시 + 맞춤법(LanguageTool) 검사 + 본문 통계. 발행 사고 0건을 목표로.',
  keywords: ['블로그 금칙어', '네이버 금칙어', '맞춤법 검사', '블로그 에디터', '포스팅 점검'],
  alternates: { canonical: '/editor' },
  openGraph: {
    title: '에디터 — 발행 전 금칙어·맞춤법 마지막 점검',
    description: '금칙어 자동 표시 + 맞춤법 + 본문 통계 한 화면. 네이버 발행 사고 0건.',
    url: '/editor',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
