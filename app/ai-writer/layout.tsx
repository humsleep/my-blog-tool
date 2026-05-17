import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 글쓰기',
  description:
    'Claude Sonnet 4.6 이 네이버 블로그 톤으로 제목·본문·해시태그를 한 번에 작성합니다. 비로그인 1회/일, 로그인 5회/일 무료. SSE 실시간 스트리밍.',
  keywords: ['AI 글쓰기', '블로그 자동 작성', 'Claude 블로그', '네이버 블로그 AI', '티스토리 AI'],
  alternates: { canonical: '/ai-writer' },
  openGraph: {
    title: 'AI 글쓰기 — Claude 가 1분 만에 블로그 초안을',
    description: '네이버 톤 블로그 글을 Claude Sonnet 4.6 으로 즉석 생성. SSE 스트리밍 + 6단계 옵션.',
    url: '/ai-writer',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
