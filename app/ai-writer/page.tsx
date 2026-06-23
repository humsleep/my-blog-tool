'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlowNav from '../components/FlowNav';
import PageHeader from '../components/ui/PageHeader';
import WizardStepBar from '../components/WizardStepBar';
import Card from '../components/ui/Card';
import { Button, LinkButton } from '../components/ui/Button';
import CopyButton from '../components/ui/CopyButton';
import RichCopyButton from '../components/ui/RichCopyButton';
import { useUser } from '../lib/supabase/useUser';
import { markdownToHtml, markdownToPlain } from '../lib/format/article-formats';
import { safeJson } from '../lib/clientFetch';

type FormatTab = 'preview' | 'html' | 'markdown' | 'plain';

interface UsageState {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
  authedLimit?: number;
}

interface DraftOptions {
  style: 'haeyo' | 'pyeongseo';
  length: 'compact' | 'standard';
  titleMode: 'single' | 'multi';
  sectionCount: 5 | 6 | 7;
  accuracyTargets: string;
  imagePrompts: boolean;
  sources: boolean;
  selfReview: boolean;
}

// Phase 36.3: 비용 + timeout 안전 기본값.
//   - length='compact' (1,300~1,700자): standard(1,700~2,200자)는 출력 시간이 Vercel 60s
//     한도에 너무 빡빡해서 timeout 빈발 → 안정성 우선.
//   - titleMode='single' / imagePrompts=false: 출력 토큰 절감.
//   모든 옵션은 패널에서 토글로 다시 켤 수 있음.
const DEFAULT_OPTIONS: DraftOptions = {
  style: 'haeyo',
  length: 'compact',
  titleMode: 'single',
  sectionCount: 5,
  accuracyTargets: '',
  imagePrompts: false,
  sources: false,
  selfReview: true,
};

interface ParsedSections {
  sources: string | null;
  titles: string | null;
  body: string | null;
  hashtags: string | null;
  imagePrompts: string | null;
  selfReview: string | null;
}

/** "## 1. 참고 출처", "## 2. 제목 후보" ... 헤더 단위로 본문을 6개 섹션으로 분할
 *  String.split 캡처 그룹 활용 — JavaScript에는 \Z lookahead 가 없으므로 안전한 방식.
 */
function parseSections(markdown: string): ParsedSections {
  const result: ParsedSections = {
    sources: null,
    titles: null,
    body: null,
    hashtags: null,
    imagePrompts: null,
    selfReview: null,
  };
  const parts = markdown.split(/^##\s*(\d)\.\s*[^\n]*\n?/m);
  // parts[0]: 헤더 전 prefix, parts[1]: 첫 번째 섹션 번호, parts[2]: 첫 번째 섹션 본문, ...
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const num = parts[i];
    const content = (parts[i + 1] ?? '').trim();
    if (num === '1') result.sources = content;
    else if (num === '2') result.titles = content;
    else if (num === '3') result.body = content;
    else if (num === '4') result.hashtags = content;
    else if (num === '5') result.imagePrompts = content;
    else if (num === '6') result.selfReview = content;
  }
  return result;
}

/** 제목 후보 텍스트에서 "1. xxx" 형태로 번호 매겨진 후보 추출 (카테고리는 무시) */
function extractTitleCandidates(titlesMarkdown: string | null): { num: string; text: string }[] {
  if (!titlesMarkdown) return [];
  const lines = titlesMarkdown.split('\n');
  const out: { num: string; text: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.+?)\s*$/);
    if (m) {
      out.push({ num: m[1], text: m[2].replace(/\*\*/g, '').trim() });
    }
  }
  return out;
}

export default function AiWriterPage() {
  const router = useRouter();
  const { user, configured } = useUser();
  const [prompt, setPrompt] = useState('');
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState<DraftOptions>(DEFAULT_OPTIONS);
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<FormatTab>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  // 모바일에선 옵션 패널을 기본 접힘으로 — 스크롤을 줄이고 생성 버튼을 가깝게 (Phase 60.2)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches) {
      setOptionsOpen(false);
    }
  }, []);

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
    // 옵션 자동 복원 (로컬 스토리지)
    try {
      const savedOpts = localStorage.getItem('aiWriterOptions');
      if (savedOpts) {
        const parsed = JSON.parse(savedOpts) as Partial<DraftOptions>;
        setOptions((o) => ({ ...o, ...parsed }));
      }
    } catch {}
  }, []);

  // 옵션 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('aiWriterOptions', JSON.stringify(options));
    } catch {}
  }, [options]);

  useEffect(() => {
    fetch('/api/ai-draft')
      .then((r) => safeJson<UsageState>(r))
      .then((d) => {
        if (typeof d.limit === 'number') setUsage(d as UsageState);
        else setUsage(null);
      })
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
    setSelectedTitle('');
    try {
      // SSE 스트리밍 요청 — Anthropic 출력 토큰이 많아 Vercel 60s 한도를 넘기는 케이스
      // 방지. byte 가 흐르는 한 Vercel 은 함수를 끊지 않음.
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, keyword: keyword || null, options, stream: true }),
      });

      if (!res.ok || !res.body) {
        // 에러 응답은 JSON
        const data = await safeJson<{ error?: string }>(res);
        const msg = data.error
          ?? (res.status === 504 || res.status === 408
            ? 'AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요.'
            : res.status >= 500
              ? 'AI 서버가 일시적으로 응답하지 않아요. 잠시 후 다시 시도해주세요.'
              : `요청 실패 (HTTP ${res.status})`);
        setError(msg);
        return;
      }

      // SSE 파서 — `data: {...}\n\n` 단위로 끊어 처리
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      let streamError: string | null = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE 는 \n\n 으로 이벤트 구분
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!raw.startsWith('data:')) continue;
          const payload = raw.slice(5).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload) as
              | { type: 'chunk'; text: string }
              | { type: 'done'; usage: { used: number; limit: number; remaining: number }; authenticated: boolean }
              | { type: 'error'; error: string };
            if (evt.type === 'chunk') {
              acc += evt.text;
              setDraft(acc);
            } else if (evt.type === 'done') {
              setUsage({
                authenticated: evt.authenticated,
                used: evt.usage.used,
                limit: evt.usage.limit,
                remaining: evt.usage.remaining,
              });
            } else if (evt.type === 'error') {
              streamError = evt.error;
            }
          } catch {
            // malformed event, skip
          }
        }
      }

      if (streamError) {
        // 부분 출력은 그대로 두고 에러만 표시 — 사용자가 부분 결과도 확인 가능
        setError(streamError);
      } else if (!acc) {
        setError('AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 호출 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToEditor = () => {
    if (!draft) return;
    // 본문 + (선택 제목이 있으면 위에 첨가)
    const sections = parseSections(draft);
    let outgoing = sections.body || draft;
    if (selectedTitle) outgoing = `# ${selectedTitle}\n\n${outgoing}`;
    sessionStorage.setItem(
      'aiDraft',
      JSON.stringify({ content: outgoing, keyword: keyword || undefined, createdAt: Date.now() })
    );
    router.push('/editor');
  };

  const sections = useMemo(() => (draft ? parseSections(draft) : null), [draft]);
  const titleCandidates = useMemo(() => extractTitleCandidates(sections?.titles ?? null), [sections]);

  const bodyForTab = useMemo(() => {
    const body = sections?.body || '';
    if (!body) return { preview: '', html: '', markdown: '', plain: '' };
    // 선택된 제목이 있으면 본문 위에 H1으로 추가
    const withTitle = selectedTitle ? `# ${selectedTitle}\n\n${body}` : body;
    const html = markdownToHtml(withTitle);
    return {
      preview: html, // 미리보기 = 렌더된 HTML
      html,
      markdown: withTitle,
      plain: markdownToPlain(withTitle),
    };
  }, [sections, selectedTitle]);

  const tabContent = bodyForTab[tab];
  const charCount = (sections?.body ?? '').replace(/\s/g, '').length;

  return (
    <>
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-5 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WizardStepBar current={3} />
          <div className="mt-4" />
          <PageHeader
            title="AI 글쓰기"
            subtitle="네이버 블로그 홈판 노출에 최적화된 6단계 통합 워크플로우 — 제목 후보 20개·본문·해시태그·이미지 프롬프트까지 한 번에."
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
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {usage.remaining <= 0
                      ? (usage.authenticated
                          ? '오늘 한도를 모두 사용했어요'
                          : '비로그인 일일 한도(1회)를 사용했어요')
                      : (usage.authenticated
                          ? `오늘 ${usage.used} / ${usage.limit}회 사용`
                          : `비로그인 사용량: ${usage.used} / ${usage.limit}회`)}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {usage.remaining <= 0
                      ? (usage.authenticated
                          ? `한도는 자정(KST)에 초기화돼요. 키워드 분석·프롬프트 생성·금칙어 검사는 횟수 제한 없이 사용할 수 있어요.`
                          : `로그인하면 하루 ${usage.authedLimit ?? 5}회까지 사용할 수 있고, 자정(KST)에 한도가 초기화돼요.`)
                      : (usage.authenticated
                          ? `로그인 사용자는 하루 ${usage.limit}회까지 무료입니다.`
                          : `로그인하면 하루 ${usage.authedLimit ?? 5}회까지 사용할 수 있어요.`)}
                  </div>
                </div>
                {!usage.authenticated && configured && (
                  <LinkButton href="/login" variant="primary" size="sm">
                    Google 로그인
                  </LinkButton>
                )}
              </div>
            ) : (
              <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 입력 + 결과 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">프롬프트</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  프롬프트 생성 페이지에서 만든 텍스트를 붙여넣거나, 직접 작성해도 됩니다.
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예) 다음 조건에 맞는 네이버 블로그 글을 작성해주세요. 키워드: 캠핑 초보 / 분야: 여행 > 캠핑 / 어투: 친근한 이웃..."
                  rows={10}
                  className="input-base font-mono text-sm leading-relaxed resize-y min-h-[200px]"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{prompt.length.toLocaleString()} / 8,000자</span>
                  <Link
                    href="/prompt-generator"
                    className="text-orange-500 dark:text-orange-400 hover:underline"
                  >
                    프롬프트 생성기로 만들기 →
                  </Link>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    메인 키워드 <span className="text-zinc-400">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예) 캠핑 초보"
                    className="input-base"
                  />
                </div>
              </Card>

              {/* 최적화 옵션 패널 */}
              <Card>
                <button
                  type="button"
                  onClick={() => setOptionsOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={optionsOpen}
                >
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">최적화 옵션</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      네이버 블로그 홈판 노출 6단계 — 문체·분량·제목·이미지 프롬프트까지 세밀 조정
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-zinc-400 transition-transform ${optionsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {optionsOpen && (
                  <div className="mt-5 space-y-5">
                    {/* 문체 */}
                    <OptionGroup
                      label="문체"
                      help="해요체는 친근한 1인 블로거 톤, 평서체는 단정한 정보 전달 톤"
                    >
                      <RadioCards
                        value={options.style}
                        onChange={(v) => setOptions((o) => ({ ...o, style: v }))}
                        items={[
                          { value: 'haeyo', label: '친근한 해요체', desc: '"~더라고요" / 일화 도입' },
                          { value: 'pyeongseo', label: '평서체 ~이다', desc: '"~한다" / 객관 단정' },
                        ]}
                      />
                    </OptionGroup>

                    {/* 분량 */}
                    <OptionGroup label="글 분량" help="네이버 알고리즘 안정 노출 범위">
                      <RadioCards
                        value={options.length}
                        onChange={(v) => setOptions((o) => ({ ...o, length: v }))}
                        items={[
                          { value: 'compact', label: '짧고 정밀', desc: '공백 제외 1,300~1,700자' },
                          { value: 'standard', label: '표준', desc: '공백 제외 1,700~2,200자' },
                        ]}
                      />
                    </OptionGroup>

                    {/* 제목 후보 */}
                    <OptionGroup label="제목 후보" help="여러 후보 중 골라 본문에 적용 가능">
                      <RadioCards
                        value={options.titleMode}
                        onChange={(v) => setOptions((o) => ({ ...o, titleMode: v }))}
                        items={[
                          { value: 'single', label: '베스트 1개', desc: 'AI가 고른 최고의 제목 1개' },
                          { value: 'multi', label: '20개 후보', desc: 'SEO 5 + 후킹 5 + 손해회피 5 + 숫자형 5' },
                        ]}
                      />
                    </OptionGroup>

                    {/* 소제목 개수 */}
                    <OptionGroup label="소제목 개수" help="본문 구조 깊이">
                      <div className="flex gap-2">
                        {[5, 6, 7].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setOptions((o) => ({ ...o, sectionCount: n as 5 | 6 | 7 }))}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              options.sectionCount === n
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                            }`}
                          >
                            {n}개
                          </button>
                        ))}
                      </div>
                    </OptionGroup>

                    {/* 인물·제품 정확도 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        인물·제품 정확 묘사 대상 <span className="text-zinc-400 font-normal text-xs">(선택)</span>
                      </label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        실제 모델·제품·인물을 이미지 프롬프트에 정확히 반영 — 상상 합성 방지
                      </p>
                      <input
                        type="text"
                        value={options.accuracyTargets}
                        onChange={(e) => setOptions((o) => ({ ...o, accuracyTargets: e.target.value }))}
                        placeholder="예: 테슬라 모델 Y 2024 / 아이폰 16 Pro / 손흥민"
                        className="input-base"
                      />
                    </div>

                    {/* 토글들 */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <ToggleRow
                        label="이미지 프롬프트 생성"
                        help="소제목별 영문 프롬프트 — Photorealistic / 8k / cinematic lighting"
                        checked={options.imagePrompts}
                        onChange={(c) => setOptions((o) => ({ ...o, imagePrompts: c }))}
                      />
                      <ToggleRow
                        label="참고 출처 리스트"
                        help="본문에 활용한 정보 출처 deep link 10개 이상"
                        checked={options.sources}
                        onChange={(c) => setOptions((o) => ({ ...o, sources: c }))}
                      />
                      <ToggleRow
                        label="자체 검토 결과 표시"
                        help="금지 표현·YMYL·키워드 반복·분량 체크리스트"
                        checked={options.selfReview}
                        onChange={(c) => setOptions((o) => ({ ...o, selfReview: c }))}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* 생성 버튼 */}
              <Card>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                {!configured && !user && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ AI 기능이 아직 설정 중입니다. 운영자에게 문의해주세요.
                  </div>
                )}
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
                    ? 'AI가 6단계로 글을 작성 중... (30~60초)'
                    : usage && usage.remaining <= 0
                    ? '오늘 사용량 소진'
                    : 'AI 글 생성 (6단계 통합)'}
                </Button>
              </Card>

              {/* 결과 — 섹션별 카드 */}
              {draft && sections && (
                <>
                  {/* ⚠️ AI 생성물 안내 — 발행 전 반드시 검수 */}
                  <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="hidden sm:flex w-10 h-10 rounded-full bg-amber-500 items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wider uppercase">
                            AI 생성물
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100">
                            반드시 검수 후 발행해주세요
                          </h3>
                        </div>
                        <ul className="mt-2 text-xs sm:text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed space-y-1 list-disc pl-4">
                          <li><strong>사실 확인 필수</strong> — 숫자·인용·고유명사·통계는 직접 검증해주세요. AI는 그럴듯한 거짓을 만들 수 있어요.</li>
                          <li><strong>본인 경험·관점 추가</strong> — &quot;[나의 경험 삽입]&quot; 자리표시자를 그대로 두지 말고 채워주세요.</li>
                          <li><strong>의료·금융·법률 주제 주의</strong> — 전문 분야는 자격 있는 전문가의 검토를 거치세요.</li>
                          <li><strong>AdSense·검색엔진 정책</strong> — AI 글을 그대로 대량 발행하면 광고 게재가 제한될 수 있어요.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 1. 참고 출처 */}
                  {sections.sources && (
                    <ResultSection
                      icon="🔗"
                      title="참고 출처"
                      subtitle="본문 정보의 출처 — 직접 클릭해 검증해 보세요"
                      content={sections.sources}
                    />
                  )}

                  {/* 2. 제목 후보 */}
                  {sections.titles && (
                    <Card>
                      <SectionHeader icon="📝" title="제목 후보" subtitle="라디오를 선택하면 본문 위에 적용됩니다" copyText={sections.titles} />
                      {titleCandidates.length > 1 ? (
                        <div className="space-y-1.5">
                          {titleCandidates.map((c) => (
                            <label
                              key={c.num}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedTitle === c.text
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40'
                                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name="title-pick"
                                checked={selectedTitle === c.text}
                                onChange={() => setSelectedTitle(c.text)}
                                className="mt-1 accent-orange-500"
                              />
                              <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                                <span className="text-orange-500 dark:text-orange-400 font-semibold mr-2">{c.num}.</span>
                                {c.text}
                              </span>
                            </label>
                          ))}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <CopyButton text={selectedTitle || titleCandidates[0]?.text || ''} label="선택 제목 복사" size="sm" />
                            {selectedTitle && (
                              <button
                                onClick={() => setSelectedTitle('')}
                                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
                              >
                                선택 해제
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <pre className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                          {sections.titles}
                        </pre>
                      )}
                    </Card>
                  )}

                  {/* 3. 본문 */}
                  {sections.body && (
                    <Card>
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">📄 본문</h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            공백 제외 {charCount.toLocaleString()}자
                            {selectedTitle && <span className="ml-1.5 text-orange-500 dark:text-orange-400">· 선택 제목 적용됨</span>}
                          </p>
                        </div>
                        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                          {[
                            { key: 'preview' as const, label: '미리보기' },
                            { key: 'html' as const, label: 'HTML' },
                            { key: 'markdown' as const, label: 'MD' },
                            { key: 'plain' as const, label: '일반' },
                          ].map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setTab(t.key)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                tab === t.key
                                  ? 'bg-white dark:bg-zinc-700 text-orange-500 dark:text-orange-400 shadow-sm'
                                  : 'text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 본문 본체 — 미리보기는 렌더, 나머지는 코드 */}
                      {tab === 'preview' ? (
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 rounded-t-lg">
                            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <span className="ml-2 text-[11px] text-zinc-500 dark:text-zinc-400">네이버 블로그 미리보기</span>
                          </div>
                          <div
                            className="preview-naver px-5 sm:px-7 py-6 max-h-[560px] overflow-auto"
                            dangerouslySetInnerHTML={{ __html: bodyForTab.preview }}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <pre className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                            {tabContent}
                          </pre>
                          <div className="absolute top-3 right-3">
                            <CopyButton text={tabContent} size="sm" />
                          </div>
                        </div>
                      )}

                      {/* 액션 영역 — 미리보기 탭은 "서식 포함 복사"를 메인 CTA로 */}
                      {tab === 'preview' ? (
                        <>
                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <RichCopyButton
                              html={bodyForTab.html}
                              plain={bodyForTab.plain}
                              size="lg"
                              fullWidth
                            />
                          </div>
                          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSendToEditor} variant="secondary" size="md" fullWidth>
                              에디터로 보내서 다듬기 →
                            </Button>
                            <CopyButton text={bodyForTab.plain} label="일반 텍스트 복사" />
                          </div>
                          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-lg text-xs text-orange-700 dark:text-orange-200 leading-relaxed">
                            💡 위 <strong>&quot;네이버에 붙여넣기&quot;</strong> 버튼을 누른 뒤 네이버 블로그 에디터에서 <strong>Ctrl+V</strong> 만 하면 제목·소제목·강조까지 그대로 들어갑니다. HTML 토글을 켜지 않아도 됩니다.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSendToEditor} variant="secondary" size="md" fullWidth>
                              에디터로 보내서 다듬기 →
                            </Button>
                            <CopyButton text={tabContent} label={`${tab === 'html' ? 'HTML' : tab === 'markdown' ? '마크다운' : '일반 텍스트'} 복사`} />
                          </div>
                          <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {tab === 'html' && <>HTML 탭 — 티스토리·워드프레스 등에서 HTML 편집 모드로 붙여넣을 때 사용하세요. 네이버는 <strong>&quot;미리보기&quot;</strong> 탭의 서식 복사가 더 편합니다.</>}
                            {tab === 'markdown' && <>마크다운 탭 — Notion·Obsidian·VS Code 등 외부 마크다운 에디터로 옮길 때 사용하세요.</>}
                            {tab === 'plain' && <>일반 텍스트 — 모든 서식이 제거된 평문입니다. 메모장·메신저 등에 붙여넣기 좋습니다.</>}
                          </div>
                        </>
                      )}
                    </Card>
                  )}

                  {/* 4. 해시태그 */}
                  {sections.hashtags && (
                    <ResultSection
                      icon="🏷️"
                      title="해시태그"
                      subtitle="전체 30개"
                      content={sections.hashtags}
                    />
                  )}

                  {/* 5. 이미지 프롬프트 */}
                  {sections.imagePrompts && (
                    <ResultSection
                      icon="🎨"
                      title="이미지 프롬프트 (영문)"
                      subtitle="Midjourney, DALL·E, Stable Diffusion 등에 한 번에 복붙 가능 — 줄바꿈으로 구분"
                      content={sections.imagePrompts}
                      mono
                    />
                  )}

                  {/* 6. 자체 검토 */}
                  {sections.selfReview && (
                    <ResultSection
                      icon="✅"
                      title="자체 검토"
                      subtitle="금지 표현·YMYL·키워드 반복·분량 점검"
                      content={sections.selfReview}
                    />
                  )}

                  {/* 결과 없을 때 폴백 — 파싱 실패 대비 */}
                  {!sections.body && !sections.titles && (
                    <Card>
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">생성 결과 (원본)</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                        섹션 구조 파싱에 실패했습니다. 원본 마크다운을 직접 활용해 주세요.
                      </p>
                      <pre className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                        {draft}
                      </pre>
                      <div className="mt-3"><CopyButton text={draft} label="원본 복사" /></div>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* 사이드바 */}
            <aside className="lg:col-span-1 space-y-4">
              <Card>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">6단계 워크플로우</h3>
                <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <li><strong className="text-zinc-900 dark:text-zinc-100">1.</strong> 사실 검증 (내부)</li>
                  <li><strong className="text-zinc-900 dark:text-zinc-100">2.</strong> 제목 후보 1·20개</li>
                  <li><strong className="text-zinc-900 dark:text-zinc-100">3.</strong> 소제목 ▣ 5~7개</li>
                  <li><strong className="text-zinc-900 dark:text-zinc-100">4.</strong> 본문 (해요체/평서체)</li>
                  <li><strong className="text-zinc-900 dark:text-zinc-100">5.</strong> 해시태그 30개</li>
                  <li><strong className="text-zinc-900 dark:text-zinc-100">6.</strong> 이미지 프롬프트 (영문)</li>
                </ol>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Boheme BlogLab 가이드 + 네이버 홈판 노출 에이전트 가이드를 합친 통합 6단계입니다.
                </p>
              </Card>

              <Card>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">사용 한도</h3>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
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
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">팁</h3>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <li>• 프롬프트 생성기에서 만든 텍스트를 그대로 붙여넣으면 결과가 가장 정확해요.</li>
                  <li>• 제목 20개 모드는 응답이 길어 한도 5회를 신중하게 쓰세요.</li>
                  <li>• 인물·제품 정확 묘사 대상을 입력하면 이미지 프롬프트가 실제 모델을 그대로 그립니다.</li>
                  <li>• 본문에 "[나의 경험 삽입]" placeholder가 들어 있으면 직접 채워 독창성을 높이세요.</li>
                </ul>
              </Card>
            </aside>
          </div>

          {/* 다음 단계 — 글쓰기 마법사 3/4 */}
          {draft && (
            <FlowNav
              mode="writing"
              currentStep={3}
              totalSteps={4}
              stepLabel="AI 글쓰기"
              note="생성한 글은 에디터에서 금칙어·맞춤법을 점검한 뒤, 이미지 프롬프트로 만든 이미지를 추가해 마무리하세요."
              actions={[
                { href: '/editor', label: '에디터로 다듬기', description: '다음 단계 — 금칙어·맞춤법 검사' },
                { href: '/image-search', label: '이미지 찾기', description: '무료 저작권 이미지 (선택)', variant: 'secondary' },
              ]}
            />
          )}

          <div className="mt-10 text-center">
            <Link
              href="/lab"
              className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              더 자세한 사용법은 연구실에서 확인하세요
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── 작은 프레젠테이션 컴포넌트 ─── */

function OptionGroup({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
      {help && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{help}</p>}
      {children}
    </div>
  );
}

function RadioCards<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; desc?: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`p-3 rounded-lg border text-left transition-colors ${
            value === it.value
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'
              : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-zinc-300'
          }`}
        >
          <div className={`text-sm font-semibold ${value === it.value ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
            {it.label}
          </div>
          {it.desc && <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{it.desc}</div>}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</div>
        {help && <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{help}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  copyText,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  copyText?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="mr-1.5">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {copyText && <CopyButton text={copyText} size="sm" />}
    </div>
  );
}

function ResultSection({
  icon,
  title,
  subtitle,
  content,
  mono = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  content: string;
  mono?: boolean;
}) {
  return (
    <Card>
      <SectionHeader icon={icon} title={title} subtitle={subtitle} copyText={content} />
      <pre
        className={`bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 max-h-[400px] overflow-auto whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed ${
          mono ? 'font-mono text-xs' : 'font-sans'
        }`}
      >
        {content}
      </pre>
    </Card>
  );
}
