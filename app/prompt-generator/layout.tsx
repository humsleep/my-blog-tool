import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프롬프트 생성기',
  description:
    '내 글의 어투·구조·금지 표현을 선택하면 Claude 에 그대로 전달할 블로그 글쓰기 프롬프트가 완성됩니다. 무료·무제한, AI API 사용하지 않음.',
  keywords: ['AI 프롬프트', 'Claude 프롬프트', '블로그 프롬프트', '글쓰기 프롬프트', '프롬프트 생성기'],
  alternates: { canonical: '/prompt-generator' },
  openGraph: {
    title: '프롬프트 생성기 — 어투·구조·금지표현을 조립',
    description: '내 블로그 톤에 맞는 Claude 프롬프트를 무료·무제한으로 조립.',
    url: '/prompt-generator',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
