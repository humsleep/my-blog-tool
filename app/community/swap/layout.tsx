import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서이추 해요 — 블로거 커뮤니티',
  description:
    '같은 분야 블로거와 서로 이웃 추가. 하루 1글, 24시간 닉네임 잠금으로 가벼운 매칭. 카테고리 6개 + 한마디 200자.',
  alternates: { canonical: '/community/swap' },
  openGraph: {
    title: '서이추 해요 — 같은 분야 블로거 매칭',
    description: '하루 1글, 카테고리·한마디로 가볍게. 클릭 한 번에 상대 블로그 방문.',
    url: '/community/swap',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
