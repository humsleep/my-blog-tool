'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { safeJson } from '../lib/clientFetch';

/**
 * /start — "3분 만에 첫 글 1편" 미니 온보딩 플로우.
 *
 * 8단계 정밀 워크플로우와 평행으로 동작하는 빠른 시작 경로.
 * 단일 페이지 안에서 3단계 상태 머신으로 진행:
 *   keyword → category+tone → AI generate → result
 *
 * /api/ai-draft 의 options 단축 모드를 사용 (single title, compact length,
 * 이미지 프롬프트/출처/검토 OFF) → 응답이 짧아 첫 경험이 빠릅니다.
 */

type Step = 'keyword' | 'choose' | 'generating' | 'result' | 'error';

interface SimpleCategory {
  value: string;        // 매핑된 분야 키 (프롬프트 라벨로 그대로 들어감)
  label: string;
  hint: string;
}

const CATEGORIES: SimpleCategory[] = [
  { value: '맛집·여행',     label: '맛집 · 여행', hint: '리뷰 / 후기 / 여행기' },
  { value: '일상·라이프',   label: '일상 · 라이프', hint: '에세이 / 일기' },
  { value: '정보·노하우',   label: '정보 · 노하우', hint: '가이드 / 튜토리얼' },
  { value: '제품 리뷰',     label: '제품 리뷰', hint: '구매 후기 / 비교' },
  { value: '책 · 문화',     label: '책 · 문화', hint: '책·영화·전시 감상' },
  { value: '건강 · 운동',   label: '건강 · 운동', hint: '식단 / 운동 / 웰빙' },
];

const SAMPLE_KEYWORDS = [
  '수원 맛집 추천',
  '재택근무 노하우',
  '강아지 산책 가이드',
  '캠핑 초보',
  '다이어트 식단',
  '책 추천 2026',
];

const TONES = [
  { value: 'haeyo' as const, label: '친근한 해요체', desc: '"~더라고요", "~죠?" — 동네 친구 같은 톤' },
  { value: 'pyeongseo' as const, label: '정중한 합니다체', desc: '"~입니다", "~됩니다" — 단정한 정보 톤' },
];

interface UsageInfo {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/** 진행 단계 메시지 — 생성 중 5단계 progress 시뮬레이션 (체감 속도 ↑) */
const PROGRESS_BEATS = [
  '주제 정리 중',
  '제목 후보 잡는 중',
  '본문 도입부 작성 중',
  '본문 전개 중',
  '해시태그 마무리 중',
];

export default function StartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('keyword');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>('');
  const [tone, setTone] = useState<'haeyo' | 'pyeongseo'>('haeyo');
  const [draft, setDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [progressBeat, setProgressBeat] = useState(0);

  // 사용량 미리 가져오기
  useEffect(() => {
    fetch('/api/ai-draft')
      .then((r) => safeJson<typeof usage>(r))
      .then((d) => { if (d && typeof d?.limit === 'number') setUsage(d as typeof usage); })
      .catch(() => null);
  }, []);

  // 생성 중일 때 progress 메시지 회전
  useEffect(() => {
    if (step !== 'generating') return;
    const t = setInterval(() => setProgressBeat((p) => (p + 1) % PROGRESS_BEATS.length), 6000);
    return () => clearInterval(t);
  }, [step]);

  const goGenerate = async () => {
    if (!keyword.trim() || !category) return;
    setStep('generating');
    setErrorMsg('');

    // 간소화 프롬프트 — prompt-generator의 큰 폼 대신 미니 시작용 짧은 버전
    const toneLabel = tone === 'haeyo' ? '친근한 해요체' : '정중한 합니다체';
    const prompt =
      `다음 조건에 맞는 네이버 블로그 글을 작성해주세요.\n\n` +
      `**주제/키워드**: ${keyword.trim()}\n` +
      `**분야**: ${category}\n` +
      `**어투**: ${toneLabel}\n` +
      `**구조**: 도입부 + ▣ 소제목 5개 + 마무리, 공백 제외 1,300~1,700자.\n` +
      `**개인 경험**: 가벼운 언급 (\"제 경험상\" 정도) — 작성자가 채울 부분은 \"[나의 경험 삽입]\"으로 표시.\n` +
      `**금지 표현**: 무조건/최고/100%/보장/완벽 등 절대 표현 금지.`;

    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          keyword: keyword.trim(),
          options: {
            style: tone,
            length: 'compact',
            titleMode: 'single',
            sectionCount: 5,
            imagePrompts: false,
            sources: false,
            selfReview: false,
          },
        }),
      });
      const data = await safeJson<{
        draft?: string;
        error?: string;
        authenticated?: boolean;
        usage?: { used: number; limit: number; remaining: number };
      }>(res);
      if (!res.ok) {
        const msg = data.error
          ? data.error
          : (res.status === 504 || res.status === 408)
            ? 'AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요.'
            : res.status >= 500
              ? 'AI 서버가 일시적으로 응답하지 않아요. 잠시 후 다시 시도해주세요.'
              : `요청 실패 (HTTP ${res.status})`;
        setErrorMsg(msg);
        setStep('error');
        return;
      }
      if (data._parseError) {
        setErrorMsg('서버 응답 형식이 올바르지 않아요. 네트워크 상태를 확인하고 다시 시도해주세요.');
        setStep('error');
        return;
      }
      if (!data.draft) {
        setErrorMsg('AI가 빈 응답을 반환했어요. 잠시 후 다시 시도해주세요.');
        setStep('error');
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
      setStep('result');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '네트워크 오류');
      setStep('error');
    }
  };

  const sendToEditor = () => {
    if (!draft) return;
    sessionStorage.setItem(
      'aiDraft',
      JSON.stringify({ content: draft, keyword: keyword.trim() || undefined, createdAt: Date.now() })
    );
    router.push('/editor');
  };

  const reset = () => {
    setStep('keyword');
    setKeyword('');
    setCategory('');
    setTone('haeyo');
    setDraft('');
    setErrorMsg('');
  };

  const stepNum = step === 'keyword' ? 1 : step === 'choose' ? 2 : 3;

  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <Link href="/" className="hover:text-ink transition-colors">← 홈</Link>
          <span>오늘의 첫 글 — Quick Start</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Step indicator */}
        <div className="ed-eyebrow mb-6">Step {stepNum} · 3</div>

        {/* ─── Step 1: 키워드 ─────────────────────────────────────── */}
        {step === 'keyword' && (
          <div>
            <h1 className="text-[2rem] sm:text-2xl sm:text-3xl leading-[1.05] tracking-tight text-ink mb-4">
              오늘은 어떤 주제로<br />글을 써볼까요?
            </h1>
            <p className="text-base sm:text-lg text-ink-muted mb-10 leading-[1.6]">
              한 단어라도 괜찮아요. 떠오르는 게 없다면 아래 추천 중에서 골라도 좋습니다.
            </p>

            <div className="mb-6">
              <input
                type="search"
                inputMode="search"
                enterKeyHint="next"
                autoComplete="off"
                autoCapitalize="none"
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && keyword.trim()) setStep('choose'); }}
                placeholder="예: 수원 맛집 추천"
                aria-label="주제 또는 키워드"
                className="w-full px-0 py-4 bg-transparent border-0 border-b-2 border-rule text-ink text-2xl sm:text-3xl placeholder-ink-faint focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
              />
            </div>

            <div className="mb-10">
              <div className="ed-byline mb-3">추천 키워드</div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setKeyword(kw)}
                    className="px-3 py-1.5 text-sm border border-rule-soft hover:border-ink text-ink-muted hover:text-ink transition-colors rounded-sm"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-rule-soft pt-6">
              <Link href="/" className="text-sm text-ink-faint hover:text-ink transition-colors">취소</Link>
              <button
                type="button"
                onClick={() => setStep('choose')}
                disabled={!keyword.trim()}
                className="btn-base btn-primary btn-md"
              >
                다음 단계
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: 분야 + 어투 ────────────────────────────────── */}
        {step === 'choose' && (
          <div>
            <h1 className="text-[2rem] sm:text-2xl sm:text-3xl leading-[1.05] tracking-tight text-ink mb-4">
              <span className="text-zinc-500 dark:text-zinc-400">&ldquo;{keyword}&rdquo;</span><br />
              어떤 분야의 글인가요?
            </h1>
            <p className="text-base sm:text-lg text-ink-muted mb-8 leading-[1.6]">
              두 가지만 골라주세요. 30초면 끝나요.
            </p>

            <div className="mb-8">
              <div className="ed-byline mb-3">분야 — 1개 선택</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-rule-soft border border-rule-soft">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`text-left p-4 transition-colors ${
                      category === c.value
                        ? 'bg-ink text-paper'
                        : 'bg-paper hover:bg-paper-deep'
                    }`}
                  >
                    <div className={`text-base font-semibold mb-1 ${category === c.value ? 'text-paper' : 'text-ink'}`}>
                      {c.label}
                    </div>
                    <div className={`text-xs ${category === c.value ? 'text-paper/70' : 'text-ink-faint'}`}>
                      {c.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <div className="ed-byline mb-3">어투 — 1개 선택</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className={`text-left p-4 border transition-colors ${
                      tone === t.value
                        ? 'border-ink bg-paper-deep'
                        : 'border-rule-soft hover:border-ink-muted bg-paper'
                    }`}
                  >
                    <div className="text-base font-semibold text-ink mb-1">{t.label}</div>
                    <div className="text-xs text-ink-muted">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 사용량 안내 */}
            {usage && (
              <div className="mb-6 px-4 py-3 border border-rule-soft text-xs text-ink-muted">
                {usage.authenticated
                  ? `오늘 AI 글쓰기 ${usage.used} / ${usage.limit}회 사용. 이 글이 ${usage.used + 1}회째예요.`
                  : `비로그인 무료 1회를 사용합니다. Google 로그인하면 하루 5회까지 가능해요.`}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-rule-soft pt-6">
              <button type="button" onClick={() => setStep('keyword')} className="text-sm text-ink-faint hover:text-ink transition-colors">
                ← 이전
              </button>
              <button
                type="button"
                onClick={goGenerate}
                disabled={!category || (usage !== null && usage.remaining <= 0)}
                className="btn-base btn-primary btn-md"
              >
                {usage && usage.remaining <= 0 ? '오늘 한도 소진' : 'AI 글쓰기 시작'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: 생성 중 ────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="py-10 text-center">
            <div className="inline-block mb-8">
              <svg className="animate-spin h-12 w-12 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-[1.75rem] sm:text-2xl sm:text-3xl leading-tight text-ink mb-4">
              AI가 글을 쓰고 있어요
            </h1>
            <p className="text-lg text-ink-muted mb-8">{PROGRESS_BEATS[progressBeat]}…</p>

            <div className="max-w-md mx-auto space-y-2">
              {PROGRESS_BEATS.map((beat, i) => (
                <div
                  key={beat}
                  className={`flex items-center gap-3 text-sm transition-colors ${
                    i <= progressBeat ? 'text-ink' : 'text-ink-faint'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 border ${
                    i < progressBeat ? 'bg-ink border-ink' : i === progressBeat ? 'border-orange-500 dark:border-orange-400' : 'border-rule-soft'
                  }`}>
                    {i < progressBeat && <svg className="w-full h-full text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  {beat}
                </div>
              ))}
            </div>

            <p className="mt-10 text-xs text-ink-faint">평균 30~60초 걸려요. 페이지를 떠나면 결과가 사라지니 잠시만 기다려주세요.</p>
          </div>
        )}

        {/* ─── Step 4: 결과 ───────────────────────────────────────── */}
        {step === 'result' && (
          <div>
            <div className="text-center mb-10">
              <div className="ed-eyebrow justify-center inline-flex mb-4">완성</div>
              <h1 className="text-[2rem] sm:text-2xl sm:text-3xl leading-tight text-ink mb-3">
                3분 만에 1편 완성
              </h1>
              <p className="text-base text-ink-muted">
                — 발행 전 에디터에서 한 번 다듬으면 더 좋아져요.
              </p>
            </div>

            {/* 본문 미리보기 — 박스가 아닌 매거진 본문 */}
            <article className="border-y border-rule py-8 mb-10">
              <pre className="font-sans whitespace-pre-wrap text-base text-ink-muted leading-[1.85]">
                {draft.length > 800 ? draft.slice(0, 800) + '\n\n…' : draft}
              </pre>
            </article>

            <div className="space-y-3 mb-10">
              <button onClick={sendToEditor} className="btn-base btn-primary btn-lg w-full">
                에디터에서 전체 보기 · 다듬기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={reset} className="btn-base btn-secondary btn-md">
                  다른 키워드로 다시
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 8단계 모드로 이동하기 전에 draft를 sessionStorage에 보관 → editor 페이지에서 복원
                    if (draft) {
                      try {
                        sessionStorage.setItem(
                          'aiDraft',
                          JSON.stringify({ content: draft, keyword: keyword.trim() || undefined, createdAt: Date.now() }),
                        );
                      } catch { /* ignore quota */ }
                    }
                    router.push(`/keyword-analysis?keyword=${encodeURIComponent(keyword)}`);
                  }}
                  className="btn-base btn-secondary btn-md"
                >
                  8단계 정밀 모드로 →
                </button>
              </div>
            </div>

            {usage && (
              <p className="text-center text-xs text-ink-faint">
                오늘 AI 글쓰기 {usage.used} / {usage.limit}회 사용 — 남은 횟수 {usage.remaining}회
              </p>
            )}
          </div>
        )}

        {/* ─── Error ──────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="py-10 text-center">
            <div className="ed-eyebrow justify-center inline-flex mb-4" style={{ color: 'var(--danger)' }}>
              오류 발생
            </div>
            <h1 className="text-[1.75rem] sm:text-2xl sm:text-3xl leading-tight text-ink mb-3">
              잠시 글쓰기에 실패했어요
            </h1>
            <p className="text-ink-muted mb-8 max-w-md mx-auto">{errorMsg}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setStep('choose')} className="btn-base btn-primary btn-md">다시 시도</button>
              <Link href="/" className="btn-base btn-secondary btn-md">홈으로 돌아가기</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
