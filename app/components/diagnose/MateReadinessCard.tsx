'use client';

import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import {
  type MateReadinessReport,
  GRADE_LABEL,
  GRADE_COLOR,
  MATE_WEIGHTS,
} from '@/app/lib/diagnose/mate-readiness';
import type { DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';

interface Props {
  blogId: string;
  category: DiagnoseCategory;
  /** 메인 진단이 실측 본문으로 이미 계산한 리포트. 있으면 재호출 없이 그대로 사용(정확·즉시). */
  initial?: MateReadinessReport | null;
}

interface ApiResponse {
  report: MateReadinessReport;
}

export default function MateReadinessCard({ blogId, category, initial }: Props) {
  const [data, setData] = useState<MateReadinessReport | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return; // 메인 진단이 전달 — lazy fetch 불필요
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ blogId, category });
    clientFetchJson<ApiResponse>(`/api/diagnose-mate?${params.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d.report);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [blogId, category, initial]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="ed-eyebrow mb-4">메이트 인용 준비도 (분석 중...)</div>
        <div className="border border-rule rounded-lg p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${100 - i * 8}%` }} />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mb-10">
        <div className="ed-eyebrow mb-4">메이트 인용 준비도</div>
        <p className="text-sm text-ink-muted">
          분석을 가져오지 못했어요. {error ?? '잠시 후 다시 시도해주세요.'}
        </p>
      </section>
    );
  }

  if (data.sampleSize === 0) return null;

  const { score, grade, checks, topTip, sampleSize } = data;

  const weights = MATE_WEIGHTS;
  const mateThreshold = 75;
  const gap = Math.max(0, mateThreshold - score);

  const improvableChecks = checks
    .map((c, i) => ({
      ...c,
      index: i,
      potential: Math.round((1 - c.passRate) * (weights[i] ?? 0) * 100),
    }))
    .filter(c => c.status !== 'good')
    .sort((a, b) => b.potential - a.potential);

  const potentialTotal = improvableChecks.reduce((s, c) => s + c.potential, 0);

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">네이버 메이트 인용 준비도</div>
      <p className="text-sm text-ink-muted mb-5 leading-relaxed">
        최근 글 <strong className="text-ink">{sampleSize}편</strong>이 AI 검색(네이버 메이트, GEO)에서 인용되기 좋은 구조인지 분석한 결과입니다.
      </p>

      {/* Score header with gap indicator */}
      <div className="flex items-center gap-4 mb-4 p-4 border border-rule rounded-lg bg-paper-deep">
        <div className="flex-shrink-0">
          <ScoreRing score={score} grade={grade} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-lg font-bold ${GRADE_COLOR[grade]}`}>
            {GRADE_LABEL[grade]}
          </div>
          {gap > 0 ? (
            <p className="text-xs text-ink-muted mt-0.5">
              메이트 기준(75점)까지 <strong className="text-orange-600 dark:text-orange-400">{gap}점 부족</strong>
              {potentialTotal > 0 && (
                <span> · 개선 여지 <strong className="text-green-600 dark:text-green-400">+{potentialTotal}점</strong></span>
              )}
            </p>
          ) : (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
              메이트 인용 기준 달성!
            </p>
          )}
        </div>
      </div>

      {/* Priority improvement summary */}
      {improvableChecks.length > 0 && gap > 0 && (
        <div className="mb-5 p-3.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
          <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2">
            우선 개선 항목 (효과 큰 순서)
          </p>
          <div className="space-y-1.5">
            {improvableChecks.slice(0, 3).map((c) => (
              <div key={c.index} className="flex items-center gap-2 text-xs">
                <span className="flex-shrink-0 w-5 text-center font-bold text-orange-600 dark:text-orange-400">
                  +{c.potential}
                </span>
                <span className="text-ink-muted">{c.label}</span>
                <span className="text-ink-faint tabular-nums">({c.passCount}/{c.totalCount}편)</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-orange-700/70 dark:text-orange-400/60 mt-2">
            위 항목을 모두 100%로 올리면 최대 <strong>+{potentialTotal}점</strong> → 예상 <strong>{Math.min(score + potentialTotal, 100)}점</strong>
          </p>
        </div>
      )}

      {/* Check items */}
      <div className="space-y-3">
        {checks.map((check, i) => {
          const potential = Math.round((1 - check.passRate) * (weights[i] ?? 0) * 100);
          return (
            <div key={i} className="border border-rule rounded-lg p-3.5 hover:border-rule-soft transition-colors">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusIcon status={check.status} />
                  <span className="text-sm font-semibold text-ink truncate">{check.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {check.status !== 'good' && potential > 0 && (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">
                      +{potential}점 가능
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-ink-faint">
                    {check.passCount}/{check.totalCount}편 통과
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${barColor(check.status)}`}
                  style={{ width: `${Math.round(check.passRate * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {check.status === 'good' ? check.description : `▸ ${check.tip}`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: MateReadinessReport['grade'] }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const strokeColor = {
    excellent: 'stroke-green-500 dark:stroke-green-400',
    good: 'stroke-orange-500 dark:stroke-orange-400',
    'needs-work': 'stroke-amber-500 dark:stroke-amber-400',
    low: 'stroke-red-500 dark:stroke-red-400',
  }[grade];

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          className={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink tabular-nums">
        {score}
      </span>
    </div>
  );
}

function StatusIcon({ status }: { status: 'good' | 'warn' | 'bad' }) {
  if (status === 'good') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">!</span>
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
      <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}

function barColor(status: 'good' | 'warn' | 'bad'): string {
  return {
    good: 'bg-green-500 dark:bg-green-400',
    warn: 'bg-amber-500 dark:bg-amber-400',
    bad: 'bg-red-400 dark:bg-red-500',
  }[status];
}
