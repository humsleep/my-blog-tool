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

const DEFAULT_OPTIONS: DraftOptions = {
  style: 'haeyo',
  length: 'standard',
  titleMode: 'multi',
  sectionCount: 5,
  accuracyTargets: '',
  imagePrompts: true,
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
  const [tab, setTab] = useState<FormatTab>('html');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

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
    setSelectedTitle('');
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, keyword: keyword || null, options }),
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
    if (!body) return { html: '', markdown: '', plain: '' };
    // 선택된 제목이 있으면 본문 위에 H1으로 추가
    const withTitle = selectedTitle ? `# ${selectedTitle}\n\n${body}` : body;
    return {
      html: markdownToHtml(withTitle),
      markdown: withTitle,
      plain: markdownToPlain(withTitle),
    };
  }, [sections, selectedTitle]);

  const tabContent = bodyForTab[tab];
  const charCount = (sections?.body ?? '').replace(/\s/g, '').length;

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            step={5}
            totalSteps={8}
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
            {/* 왼쪽: 입력 + 결과 */}
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
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">최적화 옵션</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      네이버 블로그 홈판 노출 6단계 — 문체·분량·제목·이미지 프롬프트까지 세밀 조정
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${optionsOpen ? 'rotate-180' : ''}`}
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
                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {n}개
                          </button>
                        ))}
                      </div>
                    </OptionGroup>

                    {/* 인물·제품 정확도 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        인물·제품 정확 묘사 대상 <span className="text-slate-400 font-normal text-xs">(선택)</span>
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
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
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name="title-pick"
                                checked={selectedTitle === c.text}
                                onChange={() => setSelectedTitle(c.text)}
                                className="mt-1 accent-orange-500"
                              />
                              <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
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
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              >
                                선택 해제
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <pre className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
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
                          <h2 className="font-semibold text-slate-900 dark:text-slate-100">📄 본문</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            공백 제외 {charCount.toLocaleString()}자 · {tab.toUpperCase()} 포맷
                            {selectedTitle && <span className="ml-1.5 text-orange-500 dark:text-orange-400">· 선택 제목 적용됨</span>}
                          </p>
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {[
                            { key: 'html' as const, label: 'HTML' },
                            { key: 'markdown' as const, label: '마크다운' },
                            { key: 'plain' as const, label: '일반' },
                          ].map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setTab(t.key)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                tab === t.key
                                  ? 'bg-white dark:bg-slate-700 text-orange-500 dark:text-orange-400 shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <pre className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          {tabContent}
                        </pre>
                        <div className="absolute top-3 right-3">
                          <CopyButton text={tabContent} size="sm" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleSendToEditor} variant="secondary" size="md" fullWidth>
                          에디터로 보내서 다듬기 →
                        </Button>
                        <CopyButton text={tabContent} label={`${tab.toUpperCase()} 복사`} />
                      </div>
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-lg text-xs text-orange-700 dark:text-orange-200 leading-relaxed">
                        💡 네이버 에디터 우상단 <strong>"HTML" 토글</strong>을 켜고 <strong>HTML 탭</strong>을 붙여넣으면 제목·소제목·강조가 그대로 적용됩니다.
                      </div>
                    </Card>
                  )}

                  {/* 4. 해시태그 */}
                  {sections.hashtags && (
                    <ResultSection
                      icon="🏷️"
                      title="해시태그"
                      subtitle="전체 30개 + 핵심 추천 10개"
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
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">생성 결과 (원본)</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        섹션 구조 파싱에 실패했습니다. 원본 마크다운을 직접 활용해 주세요.
                      </p>
                      <pre className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
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
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">6단계 워크플로우</h3>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li><strong className="text-slate-900 dark:text-slate-100">1.</strong> 사실 검증 (내부)</li>
                  <li><strong className="text-slate-900 dark:text-slate-100">2.</strong> 제목 후보 1·20개</li>
                  <li><strong className="text-slate-900 dark:text-slate-100">3.</strong> 소제목 ▣ 5~7개</li>
                  <li><strong className="text-slate-900 dark:text-slate-100">4.</strong> 본문 (해요체/평서체)</li>
                  <li><strong className="text-slate-900 dark:text-slate-100">5.</strong> 해시태그 30+10</li>
                  <li><strong className="text-slate-900 dark:text-slate-100">6.</strong> 이미지 프롬프트 (영문)</li>
                </ol>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Boheme BlogLab 가이드 + 네이버 홈판 노출 에이전트 가이드를 합친 통합 6단계입니다.
                </p>
              </Card>

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
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">팁</h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>• 프롬프트 생성기에서 만든 텍스트를 그대로 붙여넣으면 결과가 가장 정확해요.</li>
                  <li>• 제목 20개 모드는 응답이 길어 한도 5회를 신중하게 쓰세요.</li>
                  <li>• 인물·제품 정확 묘사 대상을 입력하면 이미지 프롬프트가 실제 모델을 그대로 그립니다.</li>
                  <li>• 본문에 "[나의 경험 삽입]" placeholder가 들어 있으면 직접 채워 독창성을 높이세요.</li>
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
              note="생성한 글은 에디터에서 금칙어·맞춤법을 점검한 뒤, 이미지 프롬프트로 만든 이미지를 추가해 마무리하세요."
              actions={[
                { href: '/editor', label: '에디터로 다듬기', description: '금칙어·맞춤법 검사' },
                { href: '/image-search', label: '이미지 찾기', description: '무료 저작권 이미지', variant: 'secondary' },
              ]}
            />
          )}

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

/* ─── 작은 프레젠테이션 컴포넌트 ─── */

function OptionGroup({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {help && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{help}</p>}
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
              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300'
          }`}
        >
          <div className={`text-sm font-semibold ${value === it.value ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {it.label}
          </div>
          {it.desc && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{it.desc}</div>}
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
    <label className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
        {help && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{help}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
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
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">
          <span className="mr-1.5">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
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
        className={`bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-[400px] overflow-auto whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed ${
          mono ? 'font-mono text-xs' : 'font-sans'
        }`}
      >
        {content}
      </pre>
    </Card>
  );
}
