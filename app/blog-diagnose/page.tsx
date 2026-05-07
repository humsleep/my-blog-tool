'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORY_SEEDS } from '@/app/lib/diagnose/category-seeds';

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
  keywordCount: number;
  rssItemCount: number;
  diagnosedAt: string;
  score: {
    total: number;
    band: 'top5' | 'top15' | 'top35' | 'mid' | 'growing';
    activity: { score: number; postsLast30d: number; postsLast90d: number; daysSinceLastPost: number; avgIntervalDays: number; cadenceStdDays: number };
    visibility: { score: number; totalKeywords: number; hitCount: number; topTenCount: number; avgRankWhenHit: number; hits: { keyword: string; rank: number | null }[] };
    quality: { score: number; avgCharsPerPost: number; avgImagesPerPost: number; categoryConsistency: number; topCategory: string | null };
    insights: string[];
    warnings: string[];
  };
}

const PROGRESS_BEATS = [
  '블로그 RSS 가져오는 중',
  '카테고리 키워드 30개로 검색 중',
  '상위 노출 진입 분석 중',
  '콘텐츠 품질 평가 중',
  '결과 정리 중',
];

const BAND_LABELS: Record<DiagnoseResponse['score']['band'], { label: string; tone: string; desc: string }> = {
  top5:    { label: '카테고리 상위 5%',  tone: 'text-emerald-700 dark:text-emerald-400', desc: '이미 상위권이에요. 이 패턴을 유지·확장하세요.' },
  top15:   { label: '카테고리 상위 15%', tone: 'text-orange-700 dark:text-orange-400',   desc: '안정적인 운영. 한 단계 더 가는 데 약점 보완이 핵심.' },
  top35:   { label: '카테고리 상위 35%', tone: 'text-orange-700 dark:text-orange-400',   desc: '평균 이상. 키워드 전략을 정밀화하면 상위 진입 가능.' },
  mid:     { label: '평균 — 성장 중',    tone: 'text-ink',                                desc: '발행과 키워드 정밀도 둘 다 끌어올려야 합니다.' },
  growing: { label: '성장 단계',          tone: 'text-ink-faint',                          desc: '신생/저활동 블로그. 우선 발행 빈도부터 안정화.' },
};

export default function BlogDiagnosePage() {
  const [step, setStep] = useState<Step>('input');
  const [blogInput, setBlogInput] = useState('');
  const [category, setCategory] = useState<string>('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [progressBeat, setProgressBeat] = useState(0);

  // running 단계에서 progress beat 회전
  useEffect(() => {
    if (step !== 'running') return;
    const t = setInterval(() => setProgressBeat((p) => Math.min(p + 1, PROGRESS_BEATS.length - 1)), 8000);
    return () => clearInterval(t);
  }, [step]);

  const submit = async () => {
    if (!blogInput.trim() || !category) return;
    setStep('running');
    setProgressBeat(0);
    setError('');
    try {
      const res = await fetch('/api/blog-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogInput: blogInput.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '진단 실패');
        setStep('error');
        return;
      }
      setResult(data as DiagnoseResponse);
      setStep('result');
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
  };

  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <Link href="/" className="hover:text-ink transition-colors">← 홈</Link>
          <span>내 블로그 진단 — Diagnostic</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* ─── INPUT ──────────────────────────────────────────────── */}
        {step === 'input' && (
          <div>
            <div className="ed-eyebrow mb-6">My Blog</div>
            <h1 className="font-display text-[2rem] sm:text-[3rem] leading-[1.05] tracking-tight text-ink mb-4">
              내 블로그는<br />
              <span className="italic text-ink-muted">카테고리 상위 몇 %일까?</span>
            </h1>
            <p className="font-display italic text-base sm:text-lg text-ink-muted mb-10 leading-[1.7]">
              네이버 블로그 RSS와 카테고리 핵심 키워드 30개를 분석해 활동성·노출·품질 3개 축에서 점수를 매기고 약점을 알려드립니다.
            </p>

            <div className="space-y-8 mb-10">
              {/* 블로그 ID 입력 */}
              <div>
                <label htmlFor="blogId" className="ed-byline mb-3 block">블로그 주소 또는 아이디</label>
                <input
                  id="blogId"
                  type="text"
                  value={blogInput}
                  onChange={(e) => setBlogInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && blogInput.trim() && category) submit(); }}
                  placeholder="https://blog.naver.com/myblog  또는  myblog"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-rule text-ink text-xl sm:text-2xl font-display placeholder-ink-faint focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                />
                <p className="mt-2 text-xs text-ink-faint">
                  RSS가 공개된 네이버 블로그만 진단 가능합니다.
                </p>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="ed-byline mb-3">메인 카테고리</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-rule-soft border border-rule-soft">
                  {CATEGORY_SEEDS.map((c) => (
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
                      <div className={`font-display text-sm font-semibold ${category === c.value ? 'text-paper' : 'text-ink'}`}>
                        {c.label}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  대상 블로그가 가장 많이 다루는 분야를 선택해주세요.
                </p>
              </div>
            </div>

            {/* 안내 + CTA */}
            <div className="px-4 py-4 mb-6 border border-rule-soft text-xs text-ink-muted leading-relaxed">
              <strong className="text-ink">⚠️ 측정 한계</strong> — 네이버는 일일 방문자·블로그 지수를 공개하지 않아 공개 데이터로 합리적 추정만 가능합니다.
              결과는 절대 점수가 아닌 카테고리 내 상대적 위치로 해석해주세요.
            </div>

            <div className="flex items-center justify-between border-t border-rule-soft pt-6">
              <Link href="/" className="text-sm text-ink-faint hover:text-ink transition-colors">취소</Link>
              <button
                type="button"
                onClick={submit}
                disabled={!blogInput.trim() || !category}
                className="btn-base btn-primary btn-md"
              >
                진단 시작 (30~50초)
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
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
            <h1 className="font-display text-[1.75rem] sm:text-[2.5rem] leading-tight text-ink mb-4">
              블로그를 분석하고 있어요
            </h1>
            <p className="font-display italic text-lg text-ink-muted mb-8">{PROGRESS_BEATS[progressBeat]}…</p>

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
              <h1 className="font-display text-[1.75rem] sm:text-[2.5rem] tracking-tight text-ink">
                {result.blogTitle || result.blogId}
              </h1>
              <a href={result.blogLink} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-faint hover:text-ink underline-offset-2 hover:underline">
                {result.blogLink} ↗
              </a>
            </div>

            {/* Total + band */}
            <div className="border-y border-rule py-10 mb-12 text-center">
              <div className="ed-byline mb-3">총점</div>
              <div className="font-display text-[5rem] sm:text-[7rem] leading-none text-ink mb-2">{result.score.total}</div>
              <div className="text-ink-faint mb-4">/ 100</div>
              <div className={`font-display text-xl sm:text-2xl ${BAND_LABELS[result.score.band].tone}`}>
                {BAND_LABELS[result.score.band].label}
              </div>
              <p className="mt-2 text-sm text-ink-muted italic">{BAND_LABELS[result.score.band].desc}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {result.categoryLabel} · {result.keywordCount}개 키워드 분석
              </p>
            </div>

            {/* 3축 점수 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule-soft border border-rule-soft mb-12">
              <ScoreCard
                label="활동성"
                weight="25%"
                score={result.score.activity.score}
                rows={[
                  { k: '최근 30일', v: `${result.score.activity.postsLast30d}편` },
                  { k: '최근 90일', v: `${result.score.activity.postsLast90d}편` },
                  { k: '마지막 발행', v: Number.isFinite(result.score.activity.daysSinceLastPost) ? `${result.score.activity.daysSinceLastPost}일 전` : '—' },
                  { k: '평균 간격', v: Number.isFinite(result.score.activity.avgIntervalDays) ? `${result.score.activity.avgIntervalDays}일` : '—' },
                ]}
              />
              <ScoreCard
                label="노출 성과"
                weight="50%"
                score={result.score.visibility.score}
                rows={[
                  { k: '1페이지 진입', v: `${result.score.visibility.hitCount} / ${result.score.visibility.totalKeywords}` },
                  { k: '상위 10위', v: `${result.score.visibility.topTenCount}개` },
                  { k: '평균 순위', v: Number.isFinite(result.score.visibility.avgRankWhenHit) ? `${result.score.visibility.avgRankWhenHit}위` : '—' },
                ]}
              />
              <ScoreCard
                label="콘텐츠 품질"
                weight="25%"
                score={result.score.quality.score}
                rows={[
                  { k: '글당 평균', v: `${result.score.quality.avgCharsPerPost.toLocaleString()}자` },
                  { k: '글당 이미지', v: `${result.score.quality.avgImagesPerPost}장` },
                  { k: '카테고리 집중', v: `${Math.round(result.score.quality.categoryConsistency * 100)}%` },
                  ...(result.score.quality.topCategory ? [{ k: '주력 분야', v: result.score.quality.topCategory }] : []),
                ]}
              />
            </div>

            {/* 인사이트 */}
            {result.score.insights.length > 0 && (
              <section className="mb-12">
                <div className="ed-eyebrow mb-4">개선 포인트</div>
                <ol className="space-y-4 border-y border-rule py-6">
                  {result.score.insights.map((ins, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="font-display italic text-orange-600 dark:text-orange-400 text-xl flex-shrink-0">{`${String(i + 1).padStart(2, '0')}.`}</span>
                      <span className="text-base text-ink-muted leading-[1.7]">{ins}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 노출 키워드 상세 */}
            {result.score.visibility.hits.length > 0 && (
              <section className="mb-12">
                <div className="ed-eyebrow mb-4">키워드별 진입 순위</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border-y border-rule py-4">
                  {result.score.visibility.hits.map((h) => (
                    <div key={h.keyword} className="flex justify-between items-baseline py-1.5 border-b border-rule-soft last:border-b-0">
                      <span className="text-sm text-ink-muted truncate pr-3">{h.keyword}</span>
                      <span className={`text-sm font-display tabular-nums flex-shrink-0 ${
                        h.rank === null ? 'text-ink-faint' : (h.rank as number) <= 10 ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-ink'
                      }`}>
                        {h.rank === null ? '—' : `${h.rank}위`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 경고 */}
            {result.score.warnings.length > 0 && (
              <section className="mb-12 px-4 py-4 border border-rule-soft text-xs text-ink-muted leading-relaxed">
                <div className="ed-byline mb-2 inline-block">측정 한계</div>
                <ul className="list-disc pl-5 space-y-1">
                  {result.score.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </section>
            )}

            {/* Next actions */}
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
                한 달 뒤에 다시 진단하면 변화 추이를 비교할 수 있어요. (이력 저장은 다음 업데이트에서 추가됩니다.)
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
            <h1 className="font-display text-[1.75rem] sm:text-[2.5rem] leading-tight text-ink mb-3">
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

/* ─── 점수 카드 ─── */
function ScoreCard({
  label, weight, score, rows,
}: {
  label: string;
  weight: string;
  score: number;
  rows: { k: string; v: string }[];
}) {
  return (
    <div className="bg-paper p-6">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-display text-base font-semibold text-ink">{label}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">{weight}</span>
      </div>
      <div className="font-display text-4xl text-ink leading-none mb-4 tabular-nums">{score}<span className="text-base text-ink-faint ml-1">/100</span></div>
      <dl className="space-y-1.5 text-xs border-t border-rule-soft pt-3">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between">
            <dt className="text-ink-faint">{r.k}</dt>
            <dd className="text-ink tabular-nums">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
