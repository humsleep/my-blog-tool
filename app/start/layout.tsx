import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '빠른 시작 — 한 단어부터 블로그 글',
  description:
    '키워드 한 단어만 입력하면 AI 가 분야·어투 추천 후 블로그 초안을 생성합니다. 8단계 도구를 모르더라도 1분이면 첫 글.',
  alternates: { canonical: '/start' },
  openGraph: {
    title: '빠른 시작 — 키워드 한 단어로 블로그 초안',
    description: '8단계 흐름을 모르는 사용자를 위한 가장 단순한 진입로. 1분 안에 첫 글.',
    url: '/start',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
