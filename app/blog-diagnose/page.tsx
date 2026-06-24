'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';
import DiagnoseRadar from '@/app/components/charts/DiagnoseRadar';
import ScoreGauge, { ScoreMiniBar } from '@/app/components/charts/ScoreGauge';
import ShareCardButton from '@/app/components/diagnose/ShareCardButton';
import MateReadinessCard from '@/app/components/diagnose/MateReadinessCard';
import { GRADE_LABEL, GRADE_COLOR, type MateReadinessReport } from '@/app/lib/diagnose/mate-readiness';
import { naverSearchUrl, AI_TIER_LABEL, type AiCitationReport } from '@/app/lib/diagnose/ai-citation';
import { useUser } from '@/app/lib/supabase/useUser';
import { fetchMyProfile } from '@/app/lib/community/profile';
import { safeJson } from '@/app/lib/clientFetch';

/**
 * /blog-diagnose — 블로그 진단 페이지.
 *
 *  단일 페이지 상태 머신 (입력 → progress → 결과).
 *  /api/blog-diagnose 호출은 단일 동기 호출 (~30~50초).
 */

type Step = 'input' | 'running' | 'result' | 'error';

interface DiagnoseResponse {
  blogId: string;
  blogTitle: string | null;
  blogLink: string;
  category: string;
  categoryLabel: string;
  categoryDetected?: boolean;
  keywordCount: number;
  rssItemCount: number;
  diagnosedAt: string;
  score: {
    total: number;
    band: 'top5' | 'top15' | 'top35' | 'mid' | 'growing';
    activity: { score: number; postsLast30d: number; postsLast90d: number; daysSinceLastPost: number; avgIntervalDays: number; cadenceStdDays: number };
    visibility: { score: number; totalKeywords: number; hitCount: number; topTenCount: number; avgRankWhenHit: number; lowCompetitionHits?: number; hits: { keyword: string; rank: number | null; postTitle?: string; competition?: number }[] };
    quality: { score: number; avgCharsPerPost: number; avgImagesPerPost: number; categoryConsistency: number; topCategory: string | null };
    insights: string[];
    warnings: string[];
  };
  /** GEO(메이트 인용 적합도) — 총점과 분리된 별도 헤드라인 지표 (Phase 56). */
  geo?: { score: number; grade: MateReadinessReport['grade'] };
  /** 메인 진단이 실측 본문으로 계산한 상세 리포트 — 카드에 initial 로 전달. */
  mate?: MateReadinessReport;
  /** AI 브리핑 인용 기대치 (적합도 × 준비도). */
  aiCitation?: AiCitationReport;
}

const PROGRESS_BEATS = [
  '블로그 RSS 가져오는 중',
  '내 글 키워드로 검색 노출 확인 중',
  '상위 노출 진입 분석 중',
  '콘텐츠 품질 평가 중',
  '결과 정리 중',
];

/** sessionStorage key — 진단 결과/입력값 캐시 */
const DIAGNOSE_STORAGE_KEY = 'bbl:diagnose:v1';

/** 진단 입력값 + 결과를 sessionStorage에 직렬화. 실패 시 무시 (quotaExceeded 등). */
function persistDiagnose(state: { blogInput: string; result?: DiagnoseResponse }) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DIAGNOSE_STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch { /* swallow */ }
}

const BAND_LABELS: Record<DiagnoseResponse['score']['band'], { label: string; tone: string; desc: string }> = {
  top5:    { label: '카테고리 상위 5%',  tone: 'text-orange-700 dark:text-orange-400', desc: '이미 상위권이에요. 이 패턴을 유지·확장하세요.' },
  top15:   { label: '카테고리 상위 15%', tone: 'text-orange-700 dark:text-orange-400',   desc: '안정적인 운영. 한 단계 더 가는 데 약점 보완이 핵심.' },
  top35:   { label: '카테고리 상위 35%', tone: 'text-orange-700 dark:text-orange-400',   desc: '평균 이상. 키워드 전략을 정밀화하면 상위 진입 가능.' },
  mid:     { label: '평균 — 성장 중',    tone: 'text-ink',                                desc: '발행과 키워드 정밀도 둘 다 끌어올려야 합니다.' },
  growing: { label: '성장 단계',          tone: 'text-ink-faint',                          desc: '신생/저활동 블로그. 우선 발행 빈도부터 안정화.' },
};

export default function BlogDiagnosePage() {
  const [step, setStep] = useState<Step>('input');
  const [blogInput, setBlogInput] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [progressBeat, setProgressBeat] = useState(0);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  const { user } = useUser();

  // /lp/diagnose 등 외부 랜딩에서 ?url=... 로 넘어왔을 때 입력란 자동 채움.
  //   cache 가 있어 result/blogInput 가 이미 세팅된 경우엔 query 를 덮어쓰지 않음.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (blogInput) return; // 이미 채워져 있으면 손대지 않음
    const qUrl = new URLSearchParams(window.location.search).get('url');
    if (qUrl && qUrl.trim()) setBlogInput(qUrl.trim());
    // 의존성 비움: 마운트 시 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 진단 결과를 sessionStorage에 보존 — 30~50초 작업 후 결과를 실수로 놓치지 않도록.
  //   running 중 새 탭/새로고침/뒤로가기 → 같은 입력값으로 자동 재제출
  //   result 단계 → 결과 자체를 캐시했다가 새로고침 시 즉시 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(DIAGNOSE_STORAGE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as {
        blogInput?: string;
        result?: DiagnoseResponse;
        savedAt?: number;
      };
      // 24시간 지나면 캐시 폐기
      if (cached.savedAt && Date.now() - cached.savedAt > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(DIAGNOSE_STORAGE_KEY);
        return;
      }
      if (cached.blogInput) setBlogInput(cached.blogInput);
      if (cached.result) {
        setResult(cached.result);
        setStep('result');
      }
    } catch {
      sessionStorage.removeItem(DIAGNOSE_STORAGE_KEY);
    }
    // 최초 1회만 복원
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 상태면 프로필에서 블로그 URL 자동 채움 (분야는 자동 감지하므로 입력 불필요)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchMyProfile().then((profile) => {
      if (cancelled || !profile) return;
      if (profile.blog_url && !blogInput.trim()) {
        setBlogInput(profile.blog_url);
        setPrefillNotice('프로필에서 블로그 주소를 가져왔어요. 필요하면 수정 가능합니다.');
      }
    });
    return () => { cancelled = true; };
    // 최초 1회만 — blogInput 변경에 다시 트리거 X
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // running 단계에서 progress beat 회전. 마지막 beat 도달 시 interval 정리 (불필요한 re-render 방지).
  useEffect(() => {
    if (step !== 'running') return;
    const t = setInterval(() => {
      setProgressBeat((p) => {
        const next = p + 1;
        if (next >= PROGRESS_BEATS.length - 1) {
          clearInterval(t);
          return PROGRESS_BEATS.length - 1;
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(t);
  }, [step]);

  const submit = async () => {
    if (!blogInput.trim()) return;
    setStep('running');
    setProgressBeat(0);
    setError('');
    // 진행 상태 저장 — running 중 새로고침되어도 입력값 복원
    persistDiagnose({ blogInput: blogInput.trim() });
    try {
      const res = await fetch('/api/blog-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogInput: blogInput.trim() }),
      });
      const data = await safeJson<DiagnoseResponse & { error?: string }>(res);
      if (!res.ok) {
        const fallback = (res.status === 504 || res.status === 408)
          ? '진단이 시간 안에 끝나지 않았어요. 잠시 후 다시 시도해주세요.'
          : res.status >= 500
            ? '서버가 일시적으로 응답하지 않아요. 잠시 후 다시 시도해주세요.'
            : `진단 실패 (HTTP ${res.status})`;
        setError(data.error || fallback);
        setStep('error');
        return;
      }
      if (data._parseError) {
        setError('서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setStep('error');
        return;
      }
      const payload = data as DiagnoseResponse;
      setResult(payload);
      setStep('result');
      // 결과 캐시 — 새로고침해도 결과 유지
      persistDiagnose({ blogInput: blogInput.trim(), result: payload });
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('input');
    setResult(null);
    setError('');
    setProgressBeat(0);
    // prefillNotice 는 첫 마운트에서만 의미가 있는 1회성 안내라
    // 진단 완료 후 다시 입력 폼으로 돌아갈 때 지운다.
    setPrefillNotice(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(DIAGNOSE_STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12">
        {/* ─── INPUT ──────────────────────────────────────────────── */}
        {step === 'input' && (
          <div>
            <span className="pill pill-accent mb-5 hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400" />
              블로그 진단
            </span>
            <h1 className="text-[1.75rem] sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mb-3 sm:mb-4 leading-[1.15] sm:leading-[1.1]">
              내 블로그는 카테고리 안에서<br />
              <span className="text-orange-600 dark:text-orange-400">상위 몇 %</span>일까요?
            </h1>
            <p className="hidden sm:block text-base sm:text-lg text-zinc-700 dark:text-zinc-300 mb-10 leading-relaxed">
              네이버 블로그 RSS와 <strong className="text-zinc-900 dark:text-zinc-100">내가 실제로 쓴 글</strong>이 검색 상위에 뜨는지를 분석해 활동성·노출·품질 3개 축에서 점수를 매기고 약점을 알려드려요. 분야는 자동으로 감지합니다.
            </p>

            {/* 진행 스텝 표시 */}
            <ol className="flex items-center gap-2 mb-8 text-xs">
              <li className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${blogInput.trim() ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white dark:bg-zinc-900">{blogInput.trim() ? '✓' : '1'}</span>
                블로그 입력
              </li>
              <span className="text-zinc-400">→</span>
              <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white dark:bg-zinc-900">2</span>
                진단 시작
              </li>
            </ol>

            {prefillNotice && (
              <div className="mb-6 px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 text-xs text-orange-800 dark:text-orange-200 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{prefillNotice}</span>
              </div>
            )}

            <div className="space-y-8 mb-10">
              {/* 블로그 ID 입력 — 카드형 */}
              <div className="bg-white dark:bg-[#221c17] rounded-xl border border-zinc-200 dark:border-[#2e2723] p-5 sm:p-6 shadow-sm">
                <label htmlFor="blogId" className="block mb-3">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">블로그 주소 또는 아이디</span>
                  <span className="ml-2 text-[11px] text-orange-600 dark:text-orange-400 font-medium">필수</span>
                </label>
                <input
                  id="blogId"
                  type="text"
                  value={blogInput}
                  onChange={(e) => setBlogInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && blogInput.trim()) submit(); }}
                  placeholder="https://blog.naver.com/myblog  또는  myblog"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#1a1410] border-2 border-zinc-200 dark:border-[#2e2723] rounded-lg text-zinc-900 dark:text-zinc-50 text-base sm:text-lg placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  RSS가 공개된 네이버 블로그만 진단 가능합니다.
                </p>
              </div>

              {/* 분야 자동 감지 안내 — 더 이상 사용자가 직접 고르지 않음 */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-zinc-200 dark:border-[#2e2723] bg-zinc-50 dark:bg-[#1a1410] text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>
                  <strong className="text-zinc-800 dark:text-zinc-200">분야는 자동으로 감지합니다.</strong> 최근 글 내용을 분석해 분야를 추정하고, <strong className="text-zinc-800 dark:text-zinc-200">내가 실제로 쓴 글이 노린 키워드</strong>로 검색 노출을 측정해요. 도구가 정한 분야 키워드가 아니라 내 글 기준이라 더 공정합니다.
                </span>
              </div>
            </div>

            {/* 안내 */}
            <div className="px-4 py-3 mb-6 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="text-amber-900 dark:text-amber-100">⚠️ 측정 한계</strong> — 네이버는 일일 방문자·블로그 지수를 공개하지 않아 공개 데이터로 합리적 추정만 가능합니다. 결과는 절대 점수가 아닌 카테고리 내 상대적 위치로 해석해주세요.
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-[#2e2723] pt-6">
              <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">← 취소</Link>
              <button
                type="button"
                onClick={submit}
                disabled={!blogInput.trim()}
                className="btn-base btn-primary btn-lg"
              >
                {!blogInput.trim() ? '블로그 주소를 입력해주세요' : '진단 시작 (30~50초)'}
                {blogInput.trim() && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── RUNNING ────────────────────────────────────────────── */}
        {step === 'running' && (
          <div className="py-10 text-center">
            <div className="inline-block mb-8">
              <svg className="animate-spin h-12 w-12 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-[1.75rem] sm:text-2xl sm:text-3xl leading-tight text-ink mb-4">
              블로그를 분석하고 있어요
            </h1>
            <p className="text-lg text-ink-muted mb-8">{PROGRESS_BEATS[progressBeat]}…</p>

            <div className="max-w-md mx-auto space-y-2 text-left">
              {PROGRESS_BEATS.map((beat, i) => (
                <div key={beat} className={`flex items-center gap-3 text-sm transition-colors ${i <= progressBeat ? 'text-ink' : 'text-ink-faint'}`}>
                  <span className={`inline-block w-4 h-4 border ${
                    i < progressBeat ? 'bg-ink border-ink' : i === progressBeat ? 'border-orange-500 dark:border-orange-400' : 'border-rule-soft'
                  }`}>
                    {i < progressBeat && <svg className="w-full h-full text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  {beat}
                </div>
              ))}
            </div>

            <p className="mt-10 text-xs text-ink-faint">평균 30~50초 걸려요. 페이지를 떠나면 결과가 사라집니다.</p>
          </div>
        )}

        {/* ─── RESULT ─────────────────────────────────────────────── */}
        {step === 'result' && result && (
          <div>
            {/* Header */}
            <div className="ed-eyebrow mb-4">진단 결과</div>
            <div className="flex items-baseline justify-between flex-wrap gap-4 mb-6">
              <h1 className="text-[1.75rem] sm:text-2xl sm:text-3xl tracking-tight text-ink">
                {result.blogTitle || result.blogId}
              </h1>
              <a href={result.blogLink} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-faint hover:text-ink underline-offset-2 hover:underline">
                {result.blogLink} ↗
              </a>
            </div>

            {/* ── 이 진단은 이렇게 작동해요 ── */}
            <HowItWorks category={result.categoryLabel} keywordCount={result.keywordCount} detected={result.categoryDetected} />

            {/* ── 1. 총점 — gauge + radar ── */}
            <section className="relative overflow-hidden rounded-2xl border border-orange-200/70 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/70 via-amber-50/30 to-white dark:from-orange-950/25 dark:via-amber-950/10 dark:to-zinc-900 p-6 sm:p-8 md:p-10 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <span className="ed-byline mb-3">총점</span>
                  <ScoreGauge value={result.score.total} size={200} caption="/ 100" />
                  <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-zinc-900/60 border border-orange-200 dark:border-orange-900/50 text-sm sm:text-base font-semibold ${BAND_LABELS[result.score.band].tone}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                    {BAND_LABELS[result.score.band].label}
                  </div>
                  <p className="mt-2 text-sm text-ink-muted max-w-xs">{BAND_LABELS[result.score.band].desc}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                    {result.categoryLabel}{result.categoryDetected ? ' (자동 감지)' : ''} · 내 글 {result.keywordCount}개 분석
                  </p>
                  <div className="mt-5">
                    <ShareCardButton
                      total={result.score.total}
                      band={result.score.band}
                      activity={result.score.activity.score}
                      visibility={result.score.visibility.score}
                      quality={result.score.quality.score}
                      category={result.categoryLabel}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <DiagnoseRadar
                    activity={result.score.activity.score}
                    visibility={result.score.visibility.score}
                    quality={result.score.quality.score}
                    height={260}
                  />
                  <div className="grid grid-cols-3 gap-3 px-2">
                    <ScoreMiniBar label="활동성" value={result.score.activity.score} />
                    <ScoreMiniBar label="노출"   value={result.score.visibility.score} />
                    <ScoreMiniBar label="품질"   value={result.score.quality.score} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── 2. AI 인용 적합성 (GEO) + 메이트 준비도 통합 ── */}
            {result.geo && <GeoHeadline geo={result.geo} />}
            <MateReadinessCard
              blogId={result.blogId}
              category={result.category as DiagnoseCategory}
              initial={result.mate}
            />

            {/* ── AI 브리핑 인용 기대치 + 직접 확인 ── */}
            {result.aiCitation && <AiCitationPanel report={result.aiCitation} />}

            {/* ── 3. 블로그 건강 체크 — 핵심 8개 ── */}
            <HealthChecklist score={result.score} />

            {/* ── 4. 노출 분포 + 키워드 상세 (접이식) ── */}
            <RankDistribution hits={result.score.visibility.hits} />

            {/* ── 5. Next actions ── */}
            <section className="border-t border-rule pt-10 mb-10">
              <div className="ed-eyebrow mb-4">다음 단계</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/keyword-analysis?keyword=${encodeURIComponent(
                    result.score.visibility.hits.find((h) => h.rank === null)?.keyword || result.categoryLabel,
                  )}`}
                  className="btn-base btn-primary btn-md"
                >
                  약한 키워드로 글쓰기 →
                </Link>
                <button onClick={reset} className="btn-base btn-secondary btn-md">
                  다른 블로그 진단
                </button>
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                진단은 12시간에 한 번씩 할 수 있어요. 한 달 단위로 다시 진단하면 점수 변동 추이를 그래프로 볼 수 있어요.
              </p>
            </section>
          </div>
        )}

        {/* ─── ERROR ──────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="py-10 text-center">
            <div className="ed-eyebrow justify-center inline-flex mb-4" style={{ color: 'var(--danger)' }}>
              오류 발생
            </div>
            <h1 className="text-[1.75rem] sm:text-2xl sm:text-3xl leading-tight text-ink mb-3">
              진단을 완료하지 못했어요
            </h1>
            <p className="text-ink-muted mb-8 max-w-md mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setStep('input')} className="btn-base btn-primary btn-md">다시 시도</button>
              <Link href="/" className="btn-base btn-secondary btn-md">홈으로 돌아가기</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 진단 원리 안내 카드 ─────────────────────────────────────── */
function HowItWorks({ category, keywordCount, detected }: { category: string; keywordCount: number; detected?: boolean }) {
  return (
    <section className="mb-10 rounded-xl border border-orange-200/60 dark:border-orange-900/30 bg-orange-50/40 dark:bg-orange-950/15 p-5 sm:p-6">
      <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs">?</span>
        이 진단은 이렇게 작동해요
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink-muted leading-relaxed">
        <div className="flex gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 dark:bg-orange-400 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
          <div>
            <strong className="text-ink block mb-0.5">RSS + 본문 수집</strong>
            최근 글의 발행 일자·빈도를 RSS에서, 글자수·이미지 수를 실제 본문에서 읽어옵니다.
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 dark:bg-orange-400 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
          <div>
            <strong className="text-ink block mb-0.5">내 글 검색 노출</strong>
            <span className="text-ink font-medium">내가 쓴 최근 글 {keywordCount}개</span>가 노린 키워드로 네이버 검색해서, 그 글이 1페이지에 뜨는지 확인합니다. (분야: <span className="text-ink font-medium">{category}</span>{detected ? ' 자동 감지' : ''})
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 dark:bg-orange-400 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
          <div>
            <strong className="text-ink block mb-0.5">3축 점수 계산</strong>
            활동성(25%) + 노출(50%) + 품질(25%)로 총점을 산출하고, AI 인용 적합성은 별도로 측정합니다.
          </div>
        </div>
      </div>
      <p className="text-[11px] text-ink-faint mt-3">
        네이버는 방문자 수·블로그 지수를 공개하지 않아, 모든 점수는 공개 데이터(RSS·검색 API·본문)로 추정한 결과입니다.
      </p>
    </section>
  );
}

/* ─── GEO(메이트 인용 적합도) 헤드라인 지표 ──────────────────────
 *
 *  총점(활동·노출·품질 3축)과 분리된 별도 지표. 네이버 메이트/AI브리핑 등
 *  생성형 검색이 글을 인용하기 좋은 구조인지 최근 본문 기준으로 측정.
 *  상세 항목별 통과율은 아래 MateReadinessCard 에서 노출.
 */
function GeoHeadline({ geo }: { geo: { score: number; grade: MateReadinessReport['grade'] } }) {
  const zones = [
    { min: 0, max: 35, label: '재설계', color: 'bg-red-400 dark:bg-red-500' },
    { min: 35, max: 55, label: '개선 필요', color: 'bg-amber-400 dark:bg-amber-500' },
    { min: 55, max: 75, label: '양호', color: 'bg-orange-400 dark:bg-orange-500' },
    { min: 75, max: 100, label: '인용 준비 완료', color: 'bg-green-500 dark:bg-green-400' },
  ];
  const mateThreshold = 75;
  const gap = Math.max(0, mateThreshold - geo.score);
  const currentZone = zones.find(z => geo.score >= z.min && geo.score < z.max) ?? zones[zones.length - 1];

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">AI 인용 적합성 (GEO)</div>
      <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
        {/* Score + grade row */}
        <div className="flex items-center gap-5 mb-5">
          <div className="flex-shrink-0 text-center">
            <div className="text-4xl sm:text-5xl font-bold tabular-nums text-ink leading-none">{geo.score}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-faint mt-1">/ 100</div>
          </div>
          <div className="min-w-0">
            <div className={`text-base sm:text-lg font-bold ${GRADE_COLOR[geo.grade]}`}>{GRADE_LABEL[geo.grade]}</div>
            {gap > 0 ? (
              <p className="text-sm text-ink-muted mt-1">
                메이트 인용 기준까지 <strong className="text-orange-600 dark:text-orange-400">{gap}점</strong> 부족
              </p>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                메이트 인용 기준 달성!
              </p>
            )}
          </div>
        </div>

        {/* Gauge bar with zone markers */}
        <div className="relative mb-2">
          <div className="flex h-3 rounded-full overflow-hidden">
            {zones.map((z, i) => (
              <div
                key={i}
                className={`${z.color} ${geo.score >= z.min ? 'opacity-100' : 'opacity-25'}`}
                style={{ width: `${z.max - z.min}%` }}
              />
            ))}
          </div>
          {/* Current position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700"
            style={{ left: `${Math.min(geo.score, 100)}%` }}
          >
            <div className={`w-5 h-5 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-md ${currentZone.color}`} />
          </div>
          {/* Mate threshold marker */}
          <div
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ left: `${mateThreshold}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-full bg-ink/40 dark:bg-white/40" />
          </div>
        </div>

        {/* Zone labels */}
        <div className="flex text-[10px] sm:text-[11px] text-ink-faint">
          {zones.map((z, i) => (
            <div key={i} className="text-center" style={{ width: `${z.max - z.min}%` }}>
              {z.label}
            </div>
          ))}
        </div>

        {/* Mate line label */}
        <div className="flex justify-center mt-1" style={{ marginLeft: `${mateThreshold - 12}%`, width: '24%' }}>
          <span className="text-[10px] text-ink-faint">▲ 메이트 기준 (75)</span>
        </div>

        <p className="text-xs text-ink-muted mt-4 leading-relaxed">
          네이버 메이트·AI브리핑 등 <strong className="text-ink">AI 검색이 내 글을 인용</strong>하기 좋은 구조인지 최근 본문 기준으로 측정한 별도 지표예요.
          <span className="text-ink-faint"> (총점에는 포함되지 않습니다)</span>
        </p>
      </div>
    </section>
  );
}

/* ─── AI 브리핑 인용 기대치 + 직접 확인 ────────────────────────
 *
 *  스크래핑 없이 "인용 가능성"을 정직하게 추정: 키워드 적합도 × 준비도(mate).
 *  + 사용자가 본인 브라우저에서 실제 AI 브리핑을 확인할 수 있는 딥링크 제공.
 */
function AiCitationPanel({ report }: { report: AiCitationReport }) {
  if (report.totalKeywords === 0) return null;

  const grade = report.grade;
  const gradeLabel = grade === 'high' ? '인용 기대 높음' : grade === 'mid' ? '인용 기대 보통' : '인용 기대 낮음';
  const gradeColor =
    grade === 'high' ? 'text-green-600 dark:text-green-400'
    : grade === 'mid' ? 'text-orange-600 dark:text-orange-400'
    : 'text-ink-muted';

  // 직접 확인용 — 적합/부분적합 키워드 우선 (이미 적합도 내림차순 정렬됨), 최대 8개.
  const checkable = report.keywords.filter((k) => k.tier !== 'low').slice(0, 8);

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">AI 브리핑 인용 기대치</div>

      <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
        {/* 헤드라인 — 기대치 점수 + 구성 */}
        <div className="flex items-center gap-5 mb-4">
          <div className="flex-shrink-0 text-center">
            <div className="text-4xl sm:text-5xl font-bold tabular-nums text-ink leading-none">{report.expectationScore}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-faint mt-1">/ 100</div>
          </div>
          <div className="min-w-0">
            <div className={`text-base sm:text-lg font-bold ${gradeColor}`}>{gradeLabel}</div>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              내 키워드의 <strong className="text-ink">AI 브리핑 적합도</strong>(정보성·질문형) ×{' '}
              <strong className="text-ink">글 구조 준비도</strong>(준비도 {report.readinessScore}점)로 추정한 값이에요.
            </p>
          </div>
        </div>

        {/* 구성 요약 */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="px-3 py-2 rounded-md border border-rule-soft bg-paper-deep">
            <div className="text-[11px] text-ink-faint">AI 브리핑 적합 키워드</div>
            <div className="text-sm font-semibold text-ink tabular-nums">
              {report.proneCount} / {report.totalKeywords}개
              <span className="text-ink-faint font-normal"> (강 {report.highCount})</span>
            </div>
          </div>
          <div className="px-3 py-2 rounded-md border border-rule-soft bg-paper-deep">
            <div className="text-[11px] text-ink-faint">글 구조 준비도</div>
            <div className="text-sm font-semibold text-ink tabular-nums">{report.readinessScore}점</div>
          </div>
        </div>

        {/* 직접 확인 — 딥링크 */}
        {checkable.length > 0 ? (
          <>
            <p className="text-xs text-ink-muted mb-2 leading-relaxed">
              아래 키워드로 <strong className="text-ink">실제 AI 브리핑에 내 글이 인용됐는지 직접 확인</strong>해보세요. (내 브라우저에서 네이버 검색이 열립니다)
            </p>
            <div className="flex flex-wrap gap-2">
              {checkable.map((k) => (
                <a
                  key={k.keyword}
                  href={naverSearchUrl(k.keyword)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/25 text-xs text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors"
                  title={AI_TIER_LABEL[k.tier]}
                >
                  {k.keyword}
                  <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-muted leading-relaxed">
            내 글 키워드 대부분이 일상·브랜드형이라 AI 브리핑이 잘 뜨지 않아요. "○○ 방법", "○○ 비교", "○○ 효과"처럼 정보성·질문형 주제를 함께 다뤄보세요.
          </p>
        )}

        <p className="text-[11px] text-ink-faint mt-4 leading-relaxed">
          ※ 네이버는 AI 인용수를 공개 API로 제공하지 않아, 실제 인용 여부는 위 링크로 직접 확인하는 것이 가장 정확해요. 이 점수는 공개 데이터 기반 <strong>기대치</strong>입니다. (총점에는 포함되지 않습니다)
        </p>
      </div>
    </section>
  );
}

/* ─── 노출 분포 차트 — 내 글 노출 구간별 분포 ────────────────
 *
 *  TOP10 / 11~20 / 21~30 / 미진입 4구간으로 막대 + 개수 표시.
 *  내가 쓴 글이 노린 키워드에서 실제로 어디까지 노출되는지 한눈에 파악.
 */
/** 경쟁도(총 문서수) → 짧은 라벨. 노출이 얼마나 의미 있는지 투명하게 표시. */
function competitionLabel(total?: number): { text: string; cls: string } | null {
  if (total === undefined) return null;
  if (total < 300) return { text: '경쟁 약', cls: 'text-zinc-400 dark:text-zinc-500' };
  if (total < 3_000) return { text: '경쟁 보통', cls: 'text-ink-faint' };
  if (total < 30_000) return { text: '경쟁 있음', cls: 'text-orange-600/80 dark:text-orange-400/80' };
  return { text: '경쟁 높음', cls: 'text-orange-700 dark:text-orange-300 font-medium' };
}

function RankDistribution({ hits }: { hits: { keyword: string; rank: number | null; postTitle?: string; competition?: number }[] }) {
  if (hits.length === 0) return null;

  const buckets = {
    top10:  hits.filter((h) => h.rank !== null && h.rank <= 10).length,
    rank20: hits.filter((h) => h.rank !== null && h.rank > 10 && h.rank <= 20).length,
    rank30: hits.filter((h) => h.rank !== null && h.rank > 20 && h.rank <= 30).length,
    miss:   hits.filter((h) => h.rank === null).length,
  };
  const total = hits.length;
  const pct = (n: number) => Math.round((n / total) * 100);

  const segs = [
    { key: 'top10',  label: '1~10위',  count: buckets.top10,  pct: pct(buckets.top10),  cls: 'bg-orange-600 dark:bg-orange-400' },
    { key: 'rank20', label: '11~20위', count: buckets.rank20, pct: pct(buckets.rank20), cls: 'bg-orange-400 dark:bg-orange-500' },
    { key: 'rank30', label: '21~30위', count: buckets.rank30, pct: pct(buckets.rank30), cls: 'bg-amber-300 dark:bg-amber-700' },
    { key: 'miss',   label: '미진입',  count: buckets.miss,   pct: pct(buckets.miss),   cls: 'bg-zinc-200 dark:bg-zinc-700' },
  ];

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <div className="ed-eyebrow">노출 분포</div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">내 글 {total}개 기준</span>
      </div>

      {/* 스택 막대 */}
      <div className="flex h-7 w-full overflow-hidden rounded-md border border-rule-soft mb-3 bg-zinc-50 dark:bg-zinc-900">
        {segs.map((s) => s.count > 0 && (
          <div
            key={s.key}
            className={`${s.cls} flex items-center justify-center text-[10px] font-semibold text-white/95 transition-all`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label} ${s.count}개 (${s.pct}%)`}
          >
            {s.pct >= 8 ? `${s.pct}%` : ''}
          </div>
        ))}
      </div>

      {/* 범례 + 개수 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {segs.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-rule-soft bg-paper"
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${s.cls}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-ink-faint">{s.label}</div>
              <div className="text-sm font-semibold text-ink tabular-nums">{s.count}개</div>
            </div>
          </div>
        ))}
      </div>

      {/* 해석 */}
      <p className="mt-3 text-xs text-ink-muted leading-relaxed">
        {buckets.top10 >= total * 0.2
          ? `내 글 중 TOP10 진입이 ${buckets.top10}개 — 노린 키워드를 잘 잡아 권위가 누적되고 있습니다.`
          : buckets.top10 + buckets.rank20 + buckets.rank30 >= total * 0.3
            ? `1페이지 진입은 있지만 TOP10이 ${buckets.top10}개로 적습니다. 진입한 글의 패턴(제목·구조·길이)을 다른 글에 확장해보세요.`
            : `1페이지 진입이 ${buckets.top10 + buckets.rank20 + buckets.rank30}개로 부족합니다. 제목 앞쪽에 핵심 키워드를 배치하고, 경쟁이 약한 롱테일부터 공략하세요.`}
      </p>

      {/* 내 글별 상세 (접이식) */}
      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs text-orange-600 dark:text-orange-400 hover:underline underline-offset-2 flex items-center gap-1">
          내 글 {total}개 키워드별 순위 보기
          <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="grid grid-cols-1 gap-y-1 border-t border-rule-soft mt-3 pt-3">
          {hits.map((h, i) => {
            const comp = competitionLabel(h.competition);
            return (
              <div key={`${h.keyword}-${i}`} className="flex justify-between items-baseline gap-3 py-1.5 border-b border-rule-soft last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="text-sm text-ink break-words">{h.keyword}</span>
                  {h.postTitle && (
                    <span className="block text-[11px] text-ink-faint truncate">{h.postTitle}</span>
                  )}
                </span>
                <span className="flex items-baseline gap-2 flex-shrink-0 whitespace-nowrap">
                  {comp && <span className={`text-[10px] ${comp.cls}`}>{comp.text}</span>}
                  <span className={`text-sm tabular-nums ${
                    h.rank === null ? 'text-ink-faint' : (h.rank as number) <= 10 ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-ink'
                  }`}>
                    {h.rank === null ? '—' : `${h.rank}위`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}

/* ─── 블로그 건강 체크 — 8개 체크포인트 ✓/✗ ────────────────────────
 *
 *  네이버 블로그 운영 핵심 지표 8개를 체크리스트로 시각화.
 *  사용자가 "내가 뭘 잘하고 뭘 못하고 있는지" 한눈에 알 수 있게.
 */
function HealthChecklist({ score }: { score: DiagnoseResponse['score'] }) {
  type Check = {
    label: string;
    detail: string;
    pass: boolean;
    advice?: string;
  };

  const checks: Check[] = [
    {
      label: '주 2회 이상 발행',
      detail: `최근 30일 ${score.activity.postsLast30d}편 발행`,
      pass:   score.activity.postsLast30d >= 8,
      advice: '최소 주 2회 (월 8편) 발행해야 알고리즘이 활성 블로그로 인식해요.',
    },
    {
      label: '7일 이내 최신 글',
      detail: Number.isFinite(score.activity.daysSinceLastPost)
        ? `${Math.round(score.activity.daysSinceLastPost)}일 전 마지막 글`
        : '발행 데이터 없음',
      pass:   Number.isFinite(score.activity.daysSinceLastPost) && score.activity.daysSinceLastPost <= 7,
      advice: '7일 넘게 글이 없으면 블로그 지수가 빠르게 떨어집니다.',
    },
    {
      label: '꾸준한 발행 간격',
      detail: Number.isFinite(score.activity.avgIntervalDays)
        ? `평균 ${score.activity.avgIntervalDays}일, 표준편차 ${score.activity.cadenceStdDays}일`
        : '데이터 부족',
      pass:   Number.isFinite(score.activity.avgIntervalDays)
              && score.activity.avgIntervalDays > 0
              && score.activity.cadenceStdDays / score.activity.avgIntervalDays <= 0.7,
      advice: '발행 간격이 들쭉날쭉하면 알고리즘이 신뢰도를 낮게 봅니다. 같은 요일에 발행하세요.',
    },
    {
      label: '내 글 1페이지 진입 30%+',
      detail: `${score.visibility.hitCount} / ${score.visibility.totalKeywords}개 진입 (${
        Math.round((score.visibility.hitCount / Math.max(1, score.visibility.totalKeywords)) * 100)
      }%)`,
      pass:   score.visibility.hitCount / Math.max(1, score.visibility.totalKeywords) >= 0.3,
      advice: '내가 쓴 글의 30% 이상이 노린 키워드로 1페이지에 떠야 평균 합격선입니다.',
    },
    {
      label: 'TOP 10 진입 글 보유',
      detail: `상위 10위 ${score.visibility.topTenCount}개`,
      pass:   score.visibility.topTenCount >= 1,
      advice: '단 1개라도 TOP10 글이 있으면 그 패턴을 다른 글에 복제할 수 있어요.',
    },
    {
      label: '글당 평균 800자+',
      detail: `평균 ${score.quality.avgCharsPerPost.toLocaleString()}자 (최근 글 본문 측정)`,
      pass:   score.quality.avgCharsPerPost >= 800,
      advice: 'D.I.A. 점수에 유리하려면 1,500자 안팎이 권장됩니다.',
    },
    {
      label: '글당 이미지 2장+',
      detail: `평균 ${score.quality.avgImagesPerPost}장`,
      pass:   score.quality.avgImagesPerPost >= 2,
      advice: '체류시간을 늘리려면 한 편에 3~5장의 이미지가 적절합니다.',
    },
    {
      label: '카테고리 집중도 50%+',
      detail: score.quality.topCategory
        ? `${score.quality.topCategory} ${Math.round(score.quality.categoryConsistency * 100)}%`
        : '카테고리 정보 없음',
      pass:   score.quality.categoryConsistency >= 0.5,
      advice: '한 분야에 집중해야 C-Rank가 누적됩니다. 분야가 흩어지면 전문성 점수가 낮아집니다.',
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const ratio = passed / checks.length;
  const tone =
    ratio >= 0.75 ? 'text-orange-700 dark:text-orange-300' :
    ratio >= 0.5  ? 'text-orange-600 dark:text-orange-400' :
                    'text-zinc-700 dark:text-zinc-300';

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <div className="ed-eyebrow">블로그 건강 체크</div>
        <span className={`text-sm font-semibold tabular-nums ${tone}`}>
          {passed} / {checks.length} 통과
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className={`flex items-start gap-3 p-3 rounded-md border ${
              c.pass
                ? 'border-orange-200 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/15'
                : 'border-rule-soft bg-paper'
            }`}
          >
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                c.pass
                  ? 'bg-orange-500 dark:bg-orange-400 text-white dark:text-zinc-950'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
              }`}
              aria-label={c.pass ? '통과' : '미통과'}
            >
              {c.pass ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">{c.label}</div>
              <div className="text-xs text-ink-muted mt-0.5 tabular-nums">{c.detail}</div>
              {!c.pass && c.advice && (
                <div className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">{c.advice}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

