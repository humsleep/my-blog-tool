import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필 설정',
  description: '닉네임, 블로그 URL, 분야, 즐겨찾기 키워드를 설정하세요. 커뮤니티 작성 + 대시보드 맞춤 정보의 기반.',
  alternates: { canonical: '/profile/setup' },
  /* 개인 설정 페이지 — 색인하지 않음. */
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
