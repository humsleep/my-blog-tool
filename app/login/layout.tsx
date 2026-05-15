import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: 'Google 계정으로 1초 로그인. 진단 저장, AI 글쓰기 5회/일, 커뮤니티 작성 기능을 이용할 수 있어요.',
  alternates: { canonical: '/login' },
  /* 로그인 페이지는 색인 안 함 (사용자 가치 낮음, 신호 분산 방지). */
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
