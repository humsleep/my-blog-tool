import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/app/components/ui/PageHeader';

export const metadata: Metadata = {
  title: '전체 도구',
  description:
    '키워드 리서치부터 이미지 편집까지 — Boheme BlogLab의 모든 도구를 한 곳에서. 단계 순서대로 따라가는 블로그 글쓰기 워크플로우.',
  alternates: { canonical: '/tools' },
};

interface Tool {
  href: string;
  label: string;
  desc: string;
}
interface ToolGroup {
  label: string;
  tools: Tool[];
}

/**
 * /tools — 모바일 도구 허브 (Phase 55).
 *
 *   모바일 하단 탭 "도구" 의 목적지. 데스크톱의 그룹형 드롭다운(키워드 리서치·글쓰기·
 *   더보기)을 모바일에서도 한눈에 탐색할 수 있도록 Phase 53 IA 그대로 펼친다.
 */
const GROUPS: ToolGroup[] = [
  {
    label: '키워드 리서치',
    tools: [
      { href: '/trending',            label: '인기검색어',   desc: '네이버 실시간 인기 키워드' },
      { href: '/keyword-analysis',    label: '키워드 분석',  desc: '검색량·경쟁률·황금 키워드' },
      { href: '/competitor-analysis', label: '상위노출 분석', desc: '상위 블로그 패턴 분석' },
    ],
  },
  {
    label: '글쓰기',
    tools: [
      { href: '/start',            label: '빠른 시작',     desc: '키워드 한 단어로 1분 만에' },
      { href: '/prompt-generator', label: '프롬프트 생성', desc: '무료 무제한 (AI 호출 없음)' },
      { href: '/ai-writer',        label: 'AI 글쓰기',     desc: 'AI 가 자동으로 초안 작성' },
      { href: '/editor',           label: '에디터 (발행)', desc: '금칙어·맞춤법 마지막 점검' },
    ],
  },
  {
    label: '진단',
    tools: [
      { href: '/blog-diagnose', label: '블로그 진단', desc: '카테고리 상위 % · 약점 분석' },
    ],
  },
  {
    label: '이미지 · 기타',
    tools: [
      { href: '/image-search', label: '이미지 검색', desc: '무료 저작권 이미지' },
      { href: '/image-tools',  label: '이미지 편집', desc: '크롭·모자이크·필터' },
      { href: '/lab',          label: '연구실',      desc: '에디토리얼 가이드·실험' },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <PageHeader
          title="전체 도구"
          subtitle="블로그 운영에 필요한 모든 도구를 한 곳에. 위에서부터 순서대로 따라가도 좋아요."
        />

        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-zinc-500 dark:text-zinc-400 mb-3 px-1">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="card group flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {tool.label}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{tool.desc}</div>
                    </div>
                    <svg
                      className="w-4 h-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
