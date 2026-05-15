import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '정보 공유 — 블로거 커뮤니티',
  description: '블로그 운영 노하우, SEO 팁, 글쓰기 비법을 공유하는 게시판. 카테고리 6종 + 댓글 + 좋아요.',
  alternates: { canonical: '/community/tips' },
  /* 사이트 활성화 후 오픈 예정 — robots.ts 의 disallow 와 정합. */
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
