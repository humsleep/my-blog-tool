'use client';

import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import {
  type MateReadinessReport,
  GRADE_LABEL,
  GRADE_COLOR,
} from '@/app/lib/diagnose/mate-readiness';
import type { DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';

interface Props {
  blogId: string;
  category: DiagnoseCategory;
}

interface ApiResponse {
  report: MateReadinessReport;
}

export default function MateReadinessCard({ blogId, category }: Props) {
  const [data, setData] = useState<MateReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [blogId, category]);

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

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">네이버 메이트 인용 준비도</div>
      <p className="text-sm text-ink-muted mb-5 leading-relaxed">
        최근 글 <strong className="text-ink">{sampleSize}편</strong>이 AI 검색(네이버 메이트, GEO)에서 인용되기 좋은 구조인지 분석한 결과입니다.
      </p>

      {/* Score header */}
      <div className="flex items-center gap-4 mb-6 p-4 border border-rule rounded-lg bg-paper-deep">
        <div className="flex-shrink-0">
          <ScoreRing score={score} grade={grade} />
        </div>
        <div className="min-w-0">
          <div className={`text-lg font-bold ${GRADE_COLOR[grade]}`}>
            {GRADE_LABEL[grade]}
          </div>
          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
            {topTip}
          </p>
        </div>
      </div>

      {/* Check items */}
      <div className="space-y-3">
        {checks.map((check, i) => (
          <div key={i} className="border border-rule rounded-lg p-3.5 hover:border-rule-soft transition-colors">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon status={check.status} />
                <span className="text-sm font-semibold text-ink truncate">{check.label}</span>
              </div>
              <span className="flex-shrink-0 text-xs tabular-nums text-ink-faint">
                {check.passCount}/{check.totalCount}편 통과
              </span>
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
        ))}
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
