import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 블로그 글쓰기 — Claude 자동 생성 도구',
  description:
    'Claude Sonnet 4.6 으로 네이버·티스토리 블로그 글을 1분 만에 생성. 비로그인 1회/일, 로그인 5회/일 무료. 회원가입 없이 바로 체험.',
  keywords: ['AI 블로그', 'Claude 블로그', '블로그 글쓰기 AI', '네이버 블로그 자동 작성', 'AI 글쓰기 무료'],
  alternates: { canonical: '/lp/ai' },
  openGraph: {
    title: 'AI 블로그 글쓰기 — Claude 가 1분 만에 초안',
    description: '네이버 블로그 톤으로 자동 생성. 비로그인 1회, 로그인 5회 무료. 가입 없이 체험.',
    url: '/lp/ai',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
