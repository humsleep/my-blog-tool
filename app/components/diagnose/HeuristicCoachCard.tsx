'use client';

import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import {
  type CoachReport,
  STYLE_LABEL,
  STYLE_COLOR,
  STYLE_DESC,
} from '@/app/lib/diagnose/heuristic-coach';
import type { DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';

interface Props {
  blogId: string;
  category: DiagnoseCategory;
  /** 메인 진단이 실측 본문으로 이미 계산한 리포트. 있으면 재호출 없이 그대로 사용. */
  initial?: CoachReport | null;
}

interface ApiResponse {
  report: CoachReport;
}

/**
 * 진단 결과 페이지 — 휴리스틱 코치 카드 (Phase 54, 진단 v2.1).
 *
 *  사용자 글 12편 (RSS 메타) 을 키워드 패턴 + 규칙으로 분석해 글 스타일·약점·quick wins
 *  를 한 화면에 보여줌. AI API 호출 0. v2.0 외부 비교(상위 블로거 vs 나)와 짝.
 */
export default function HeuristicCoachCard({ blogId, category, initial }: Props) {
  const [data, setData] = useState<CoachReport | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return; // 메인 진단이 전달 — lazy fetch 불필요
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ blogId, category });
    clientFetchJson<ApiResponse>(`/api/diagnose-coach?${params.toString()}`)
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
        <div className="ed-eyebrow mb-4">코치 리포트 (분석 중...)</div>
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
        <div className="ed-eyebrow mb-4">코치 리포트</div>
        <p className="text-sm text-ink-muted">
          분석을 가져오지 못했어요. {error ?? '잠시 후 다시 시도해주세요.'}
        </p>
      </section>
    );
  }

  if (data.sampleSize === 0) return null;

  const { styleProfile, weakSignals, quickWins, sampleSize, worstPostTitle } = data;

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">코치 리포트 — 내 글의 자가 진단</div>
      <p className="text-sm text-ink-muted mb-5 leading-relaxed">
        최근 글 <strong className="text-ink">{sampleSize}편</strong> 을 휴리스틱·규칙으로 분석한 결과입니다. AI 추측이 아닌, 글 제목·도입부·메타 데이터에서 직접 측정한 약점만 표시해요.
      </p>

      {/* 1. 글 스타일 분포 */}
      <div className="mb-7">
        <h4 className="text-sm font-semibold text-ink mb-3">글 스타일 분포</h4>
        <div className="flex h-8 rounded-md overflow-hidden border border-rule">
          {(['info', 'review', 'daily', 'other'] as const).map((s) => {
            const v = styleProfile[s];
            if (v <= 0) return null;
            return (
              <div
                key={s}
                className={`${STYLE_COLOR[s]} flex items-center justify-center text-[10px] sm:text-xs font-bold text-white transition-all`}
                style={{ width: `${v * 100}%` }}
                title={`${STYLE_LABEL[s]} ${(v * 100).toFixed(0)}%`}
              >
                {v >= 0.12 && <>{STYLE_LABEL[s]} {(v * 100).toFixed(0)}%</>}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted leading-relaxed">
          <strong className="text-ink">{STYLE_LABEL[styleProfile.dominant]}</strong> 이 우세 — {STYLE_DESC[styleProfile.dominant]}
        </p>
      </div>

      {/* 2. 약한 시그널 */}
      {weakSignals.length > 0 && (
        <div className="mb-7">
          <h4 className="text-sm font-semibold text-ink mb-3">약한 시그널 (빈도순)</h4>
          <ul className="space-y-2.5">
            {weakSignals.map((s, i) => (
              <li key={i} className="border border-rule rounded-lg p-3.5 hover:border-rule-soft transition-colors">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <SeverityBadge level={s.severity} />
                    <span className="text-sm font-semibold text-ink truncate">{s.label}</span>
                  </div>
                  <span className="flex-shrink-0 text-xs tabular-nums text-ink-faint">
                    {s.affectedCount}/{sampleSize}편
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed pl-[26px]">▸ {s.fix}</p>
              </li>
            ))}
          </ul>
          {worstPostTitle && (
            <p className="mt-3 text-xs text-ink-faint leading-relaxed">
              가장 많은 약점이 발견된 글: <span className="italic">&ldquo;{worstPostTitle}&rdquo;</span>
            </p>
          )}
        </div>
      )}

      {/* 3. Quick Wins */}
      <div>
        <h4 className="text-sm font-semibold text-ink mb-3">Quick Wins — 다음 글에 바로 적용</h4>
        <ol className="space-y-2.5">
          {quickWins.map((q, i) => (
            <li key={i} className="flex gap-3 border-l-2 border-orange-400 dark:border-orange-500 pl-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">
                  <span className="text-orange-600 dark:text-orange-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ml-2">{q.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{q.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SeverityBadge({ level }: { level: 'high' | 'mid' | 'low' }) {
  const tone = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    mid:  'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    low:  'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  }[level];
  const label = { high: '높음', mid: '중간', low: '낮음' }[level];
  return (
    <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}
