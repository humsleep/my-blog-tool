'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlowNav from '../components/FlowNav';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { Button, LinkButton } from '../components/ui/Button';
import CopyButton from '../components/ui/CopyButton';
import { useUser } from '../lib/supabase/useUser';
import { markdownToHtml, markdownToPlain } from '../lib/format/article-formats';

type FormatTab = 'html' | 'markdown' | 'plain';

interface UsageState {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
  authedLimit?: number;
}

export default function AiWriterPage() {
  const router = useRouter();
  const { user, configured } = useUser();
  const [prompt, setPrompt] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<FormatTab>('html');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('aiWriterPrompt');
    if (saved) {
      setPrompt(saved);
      sessionStorage.removeItem('aiWriterPrompt');
    }
    const savedKeyword = sessionStorage.getItem('aiWriterKeyword');
    if (savedKeyword) {
      setKeyword(savedKeyword);
      sessionStorage.removeItem('aiWriterKeyword');
    }
  }, []);

  useEffect(() => {
    fetch('/api/ai-draft')
      .then((r) => r.json())
      .then((d: UsageState) => setUsage(d))
      .catch(() => setUsage(null));
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDraft('');
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, keyword: keyword || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'AI 생성 실패');
        if (typeof data.used === 'number' && typeof data.limit === 'number') {
          setUsage({
            authenticated: data.authenticated ?? false,
            used: data.used,
            limit: data.limit,
            remaining: Math.max(0, data.limit - data.used),
          });
        }
        return;
      }
      setDraft(data.draft);
      if (data.usage) {
        setUsage({
          authenticated: data.authenticated ?? false,
          used: data.usage.used,
          limit: data.usage.limit,
          remaining: data.usage.remaining,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 호출 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToEditor = () => {
    if (!draft) return;
    sessionStorage.setItem(
      'aiDraft',
      JSON.stringify({ content: draft, keyword: keyword || undefined, createdAt: Date.now() })
    );
    router.push('/editor');
  };

  const formats = useMemo(() => {
    if (!draft) return null;
    return {
      html: markdownToHtml(draft),
      markdown: draft,
      plain: markdownToPlain(draft),
    };
  }, [draft]);

  const tabContent = formats ? formats[tab] : '';
  const charCount = tabContent.length;

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            step={5}
            totalSteps={8}
            title="AI 글쓰기"
            subtitle="Claude AI가 프롬프트를 받아 네이버 블로그용 완성 글을 작성합니다. HTML·마크다운·일반 텍스트 3가지 포맷으로 즉시 복사할 수 있어요."
          />

          {/* 사용량 */}
          <div className="mb-6">
            {usage ? (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  usage.remaining > 0
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-700'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {usage.authenticated
                      ? `오늘 ${usage.used} / ${usage.limit}회 사용`
                      : `비로그인 사용량: ${usage.used} / ${usage.limit}회`}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {usage.authenticated
                      ? `로그인 사용자는 하루 ${usage.limit}회까지 무료입니다.`
                      : `로그인하면 하루 ${usage.authedLimit ?? 5}회까지 사용할 수 있어요.`}
                  </div>
                </div>
                {!usage.authenticated && configured && (
                  <LinkButton href="/login" variant="primary" size="sm">
                    Google 로그인
                  </LinkButton>
                )}
              </div>
            ) : (
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 프롬프트 입력 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">프롬프트</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  프롬프트 생성 페이지에서 만든 텍스트를 붙여넣거나, 직접 작성해도 됩니다.
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예) 다음 조건에 맞는 네이버 블로그 글을 작성해주세요. 키워드: 캠핑 초보 / 분야: 여행 > 캠핑 / 어투: 친근한 이웃..."
                  rows={10}
                  className="input-base font-mono text-sm leading-relaxed resize-y min-h-[200px]"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{prompt.length.toLocaleString()} / 8,000자</span>
                  <Link
                    href="/prompt-generator"
                    className="text-orange-500 dark:text-orange-400 hover:underline"
                  >
                    프롬프트 생성기로 만들기 →
                  </Link>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    메인 키워드 <span className="text-slate-400">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예) 캠핑 초보"
                    className="input-base"
                  />
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {!configured && !user && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ AI 기능이 아직 설정 중입니다. 운영자에게 문의해주세요.
                  </div>
                )}

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim() || (usage !== null && usage.remaining <= 0)}
                    size="lg"
                    fullWidth
                    leftIcon={
                      isLoading ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )
                    }
                  >
                    {isLoading
                      ? 'AI가 글을 작성 중... (15~30초)'
                      : usage && usage.remaining <= 0
                      ? '오늘 사용량 소진'
                      : 'AI 글 생성'}
                  </Button>
                </div>
              </Card>

              {/* 결과창 */}
              {draft && formats && (
                <Card>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      생성 결과
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {charCount.toLocaleString()}자
                    </div>
                  </div>

                  {/* 탭 */}
                  <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 w-fit">
                    {[
                      { key: 'html' as const, label: 'HTML', desc: '네이버 호환 태그' },
                      { key: 'markdown' as const, label: '마크다운', desc: '원본' },
                      { key: 'plain' as const, label: '일반', desc: '기호 없음' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          tab === t.key
                            ? 'bg-white dark:bg-slate-700 text-orange-500 dark:text-orange-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        title={t.desc}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* 결과 박스 */}
                  <div className="relative">
                    <pre className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {tabContent}
                    </pre>
                    <div className="absolute top-3 right-3">
                      <CopyButton text={tabContent} size="sm" />
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleSendToEditor} variant="secondary" size="md" fullWidth>
                      에디터로 보내서 다듬기 →
                    </Button>
                    <CopyButton text={tabContent} label={`${tab === 'html' ? 'HTML' : tab === 'markdown' ? '마크다운' : '일반'} 복사`} />
                  </div>

                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-lg text-xs text-orange-700 dark:text-orange-200 leading-relaxed">
                    💡 <strong>네이버 블로그 붙여넣기 팁</strong>: 에디터 우상단 “HTML” 토글을 켜고 <strong>HTML 탭</strong>을 붙여넣으면 제목·소제목·강조가 그대로 적용됩니다. 일반 입력에는 “일반” 탭이 깔끔합니다.
                  </div>
                </Card>
              )}
            </div>

            {/* 사이드바 */}
            <aside className="lg:col-span-1 space-y-4">
              <Card>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">사용 한도</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>비로그인: 하루 1회 무료</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>로그인: 하루 5회 무료</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>매일 자정(KST) 초기화</span>
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">3가지 포맷</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">HTML</strong>
                    <span className="block text-xs mt-0.5">네이버 에디터 HTML 모드용. h2/h3/strong 등 호환 태그만 포함.</span>
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">마크다운</strong>
                    <span className="block text-xs mt-0.5">Notion, GitHub 등 마크다운 지원 도구로 옮길 때.</span>
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">일반</strong>
                    <span className="block text-xs mt-0.5">기호 없는 평문. 네이버 일반 입력에 깔끔하게.</span>
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">팁</h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>• 프롬프트가 구체적일수록 결과 품질이 올라갑니다.</li>
                  <li>• 생성된 글에는 “[나의 경험 삽입]” 같은 자리표시자가 들어 있어요. 직접 채우면 독창성이 높아집니다.</li>
                  <li>• 에디터로 보내면 금칙어·맞춤법 검사를 거쳐 완성도를 높일 수 있어요.</li>
                </ul>
              </Card>
            </aside>
          </div>

          {/* 다음 단계 */}
          {draft && (
            <FlowNav
              currentStep={5}
              totalSteps={8}
              stepLabel="AI 글쓰기"
              note="생성한 글은 에디터에서 금칙어·맞춤법을 점검한 뒤, 이미지를 추가해 마무리하세요."
              actions={[
                { href: '/editor', label: '에디터로 다듬기', description: '금칙어·맞춤법 검사' },
                { href: '/image-search', label: '이미지 찾기', description: '무료 저작권 이미지', variant: 'secondary' },
              ]}
            />
          )}

                  {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <a
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            더 자세한 사용법은 연구실에서 확인하세요
          </a>
        </div>
        </div>
      </div>
    </>
  );
}
