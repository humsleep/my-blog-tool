import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '블로거 커뮤니티',
  description:
    '같은 분야 블로거와 서이추하고, 운영 노하우를 공유하고, 체험단 동행자를 찾아보세요. 한국 블로거를 위한 작은 커뮤니티.',
  keywords: ['블로거 커뮤니티', '서이추', '블로그 정보 공유', '체험단 동행', '블로그 운영 팁'],
  alternates: { canonical: '/community' },
  openGraph: {
    title: '블로거 커뮤니티 — 서이추·정보공유·체험단 동행',
    description: '같은 분야 블로거 매칭, 노하우 공유, 체험단 동행자 찾기.',
    url: '/community',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
