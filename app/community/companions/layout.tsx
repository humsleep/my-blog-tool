import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '체험단 동행해요 — 블로거 커뮤니티',
  description:
    '체험단·방문 일정에 함께 갈 블로거를 찾아보세요. 시·도 + 시·군·구 2단계 지역 필터, 카테고리·날짜·인원으로 손쉽게 매칭.',
  alternates: { canonical: '/community/companions' },
  openGraph: {
    title: '체험단 동행해요 — 함께 갈 블로거 찾기',
    description: '지역·날짜·인원으로 매칭. 체험단 방문에 동행할 블로거 모집 게시판.',
    url: '/community/companions',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
