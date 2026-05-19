'use client';

import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import {
  type CompetitorPatterns,
  type PatternComparison,
  formatDow,
  formatHourRange,
} from '@/app/lib/diagnose/competitor-patterns';
import type { DiagnoseCategory } from '@/app/lib/diagnose/category-seeds';

interface Props {
  category: DiagnoseCategory;
  /** 사용자 blogId — 있으면 비교, 없으면 카테고리 평균만 표시 */
  blogId?: string;
}

interface ApiResponse {
  patterns: CompetitorPatterns;
  comparison: PatternComparison | null;
  warning?: string;
}

/**
 * 진단 결과 페이지 — 상위 블로거 vs 나 비교 카드 (Phase 53 진단 v2.0).
 *
 *  진단 결과가 표시된 후 lazy fetch (별도 API). 분석 중에는 skeleton.
 *  AI API 사용 0 — 휴리스틱 + 통계만.
 */
export default function CompetitorPatternsCard({ category, blogId }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ category });
    if (blogId) params.set('blogId', blogId);
    clientFetchJson<ApiResponse>(`/api/competitor-patterns?${params.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, blogId]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="ed-eyebrow mb-4">상위 블로거 패턴 분석 (분석 중...)</div>
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
        <div className="ed-eyebrow mb-4">상위 블로거 패턴 분석</div>
        <p className="text-sm text-ink-muted">
          분석을 가져오지 못했어요. {error ?? '잠시 후 다시 시도해주세요.'}
        </p>
      </section>
    );
  }

  const { patterns, comparison, warning } = data;

  return (
    <section className="mb-12">
      <div className="ed-eyebrow mb-3">상위 블로거 vs 나 — 패턴 비교</div>
      <p className="text-sm text-ink-muted mb-4 leading-relaxed">
        같은 <strong className="text-ink">{patterns.categoryLabel}</strong> 분야 상위 블로거{' '}
        <strong className="text-ink">{patterns.bloggerCount}명</strong>의 최근 글{' '}
        <strong className="text-ink">{patterns.sampleSize}편</strong>에서 추출한 패턴입니다.
        AI 추측이 아닌, 실제 데이터의 평균·중앙값·비율로 계산했어요.
      </p>

      {/* 비교 표 — 사용자 데이터 있을 때만 */}
      {comparison ? (
        <div className="border-y border-rule">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule-soft text-xs text-ink-faint uppercase tracking-wider">
                <th className="text-left py-2.5 font-semibold">지표</th>
                <th className="text-right py-2.5 font-semibold">상위 블로거 평균</th>
                <th className="text-right py-2.5 font-semibold">나 (최근 {comparison.user.sampleSize}편)</th>
                <th className="text-right py-2.5 font-semibold">진단</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              <Row
                label="본문 글자수 (평균)"
                top={fmtInt(comparison.patterns.charCount.avg) + '자'}
                me={fmtInt(comparison.user.charCount.avg) + '자'}
                diff={comparison.diffs.charCount.hint}
                diffLabel={fmtPct(comparison.diffs.charCount.percent)}
              />
              <Row
                label="이미지 / 글 (평균)"
                top={comparison.patterns.imageCount.avg.toFixed(1) + '장'}
                me={comparison.user.imageCount.avg.toFixed(1) + '장'}
                diff={comparison.diffs.imageCount.hint}
                diffLabel={fmtPct(comparison.diffs.imageCount.percent)}
              />
              <Row
                label="제목 글자수 (평균)"
                top={comparison.patterns.titleLength.avg.toFixed(1) + '자'}
                me={comparison.user.titleLength.avg.toFixed(1) + '자'}
                diff={comparison.diffs.titleLength.hint}
                diffLabel={fmtPct(comparison.diffs.titleLength.percent)}
              />
              <Row
                label="제목에 숫자 포함 비율"
                top={fmtPctAbs(comparison.patterns.titleHasNumberRatio)}
                me={fmtPctAbs(comparison.user.titleHasNumberRatio)}
                diff={ratioHint(comparison.diffs.titleHasNumberRatio.hint)}
                diffLabel={fmtPctDiff(comparison.diffs.titleHasNumberRatio.diff)}
              />
              <Row
                label="제목 첫 12자에 키워드"
                top={fmtPctAbs(comparison.patterns.titleStartsWithKeywordRatio)}
                me={fmtPctAbs(comparison.user.titleStartsWithKeywordRatio)}
                diff={ratioHint(comparison.diffs.titleStartsWithKeywordRatio.hint)}
                diffLabel={fmtPctDiff(comparison.diffs.titleStartsWithKeywordRatio.diff)}
              />
              <Row
                label="발행 시간대 (가장 많음)"
                top={`${formatDow(patterns.publishDowMode)} ${formatHourRange(patterns.publishHourMode)}`}
                me={`${formatDow(comparison.user.publishDowMode)} ${formatHourRange(comparison.user.publishHourMode)}`}
                diff="info"
                diffLabel={
                  patterns.publishHourMode === comparison.user.publishHourMode
                    ? '동일'
                    : '다름'
                }
              />
            </tbody>
          </table>
        </div>
      ) : (
        <PatternsOnlyView patterns={patterns} />
      )}

      {warning && (
        <p className="mt-3 text-xs text-ink-faint">
          ⚠ {warning} (카테고리 평균만 표시 중)
        </p>
      )}

      {/* 인사이트 요약 */}
      {comparison && (
        <div className="mt-5 space-y-2">
          <div className="ed-eyebrow mb-2">개선 우선순위</div>
          <ul className="space-y-2 text-sm text-ink-muted leading-relaxed">
            {insightsFor(comparison).map((line, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5">▸</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 메타 — 투명성 */}
      <details className="mt-5 text-xs text-ink-faint">
        <summary className="cursor-pointer hover:text-ink-muted">분석 대상 보기 ({patterns.bloggerCount}명)</summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {patterns.sampledBloggers.map((b) => (
            <a
              key={b.blogId}
              href={`https://blog.naver.com/${b.blogId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono"
            >
              {b.blogId}
            </a>
          ))}
        </div>
        <p className="mt-2 leading-relaxed">
          카테고리 시드 키워드 5개 검색 결과에서 자주 등장한 블로거를 자동 선정. 각 블로거 RSS 최근 5편 분석. 24시간 캐시.
        </p>
      </details>
    </section>
  );
}

/* ── Row + helpers ────────────────────────────────────────── */
type DiffHint = 'short' | 'long' | 'ok' | 'under' | 'over' | 'info';

function Row({ label, top, me, diff, diffLabel }: {
  label: string;
  top: string;
  me: string;
  diff: DiffHint;
  diffLabel: string;
}) {
  const tone: Record<DiffHint, string> = {
    short: 'text-red-600 dark:text-red-400',
    under: 'text-red-600 dark:text-red-400',
    long: 'text-orange-600 dark:text-orange-400',
    over: 'text-orange-600 dark:text-orange-400',
    ok: 'text-emerald-600 dark:text-emerald-400',
    info: 'text-ink-faint',
  };
  const label2: Record<DiffHint, string> = {
    short: '부족 ⚠',
    under: '낮음 ⚠',
    long: '많음',
    over: '높음',
    ok: '적정 ✓',
    info: '',
  };
  return (
    <tr>
      <td className="py-2.5 text-ink-muted">{label}</td>
      <td className="py-2.5 text-right tabular-nums text-ink">{top}</td>
      <td className="py-2.5 text-right tabular-nums text-ink font-semibold">{me}</td>
      <td className={`py-2.5 text-right tabular-nums text-xs ${tone[diff]}`}>
        <span className="font-medium">{label2[diff]}</span>
        {diffLabel && <span className="ml-1 opacity-80">({diffLabel})</span>}
      </td>
    </tr>
  );
}

function PatternsOnlyView({ patterns }: { patterns: CompetitorPatterns }) {
  return (
    <div className="border border-rule rounded-lg p-5">
      <p className="text-sm text-ink-muted mb-3">
        사용자 RSS 가 없어 직접 비교는 못 했어요. 카테고리 평균만 표시합니다.
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Stat label="본문 글자수 (평균)" value={fmtInt(patterns.charCount.avg) + '자'} />
        <Stat label="이미지 / 글" value={patterns.imageCount.avg.toFixed(1) + '장'} />
        <Stat label="제목 글자수 (평균)" value={patterns.titleLength.avg.toFixed(1) + '자'} />
        <Stat label="제목 숫자 포함" value={fmtPctAbs(patterns.titleHasNumberRatio)} />
        <Stat label="제목 첫 12자 키워드" value={fmtPctAbs(patterns.titleStartsWithKeywordRatio)} />
        <Stat label="발행 시간대" value={`${formatDow(patterns.publishDowMode)} ${formatHourRange(patterns.publishHourMode)}`} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-rule-soft py-1.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}
function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return '—';
  const sign = p > 0 ? '+' : '';
  return `${sign}${(p * 100).toFixed(0)}%`;
}
function fmtPctAbs(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}
function fmtPctDiff(diff: number): string {
  const sign = diff > 0 ? '+' : '';
  return `${sign}${(diff * 100).toFixed(0)}%p`;
}
function ratioHint(hint: 'under' | 'over' | 'ok'): DiffHint {
  return hint;
}

/* ── 인사이트 생성 (휴리스틱) ─────────────────────────────── */
function insightsFor(c: PatternComparison): string[] {
  const lines: string[] = [];

  if (c.diffs.charCount.hint === 'short') {
    const target = Math.round(c.patterns.charCount.avg);
    lines.push(`본문이 평균 대비 ${fmtPct(c.diffs.charCount.percent)} 짧아요. 다음 글부터 ${target.toLocaleString()}자 이상을 목표로.`);
  }
  if (c.diffs.imageCount.hint === 'short') {
    const target = Math.ceil(c.patterns.imageCount.avg);
    lines.push(`이미지가 평균보다 적습니다. 글당 ${target}장 이상으로 시각 자료를 보강해보세요.`);
  }
  if (c.diffs.titleStartsWithKeywordRatio.hint === 'under') {
    lines.push(`제목 첫 12자 안에 카테고리 키워드를 넣은 비율이 낮아요 (상위 ${fmtPctAbs(c.patterns.titleStartsWithKeywordRatio)} vs 나 ${fmtPctAbs(c.user.titleStartsWithKeywordRatio)}). 네이버 검색 상위 노출의 핵심 신호입니다.`);
  }
  if (c.diffs.titleHasNumberRatio.hint === 'under') {
    lines.push(`상위 블로거의 ${fmtPctAbs(c.patterns.titleHasNumberRatio)}가 제목에 숫자를 씁니다 ("베스트 10", "5가지 팁" 등). 클릭률 ↑.`);
  }
  if (c.user.publishHourMode !== c.patterns.publishHourMode) {
    lines.push(`상위 블로거의 주 발행 시간대는 ${formatDow(c.patterns.publishDowMode)} ${formatHourRange(c.patterns.publishHourMode)}. 시간대 이동이 노출 경쟁에 유리할 수 있어요.`);
  }
  if (lines.length === 0) {
    lines.push('모든 지표가 상위 블로거 평균에 근접합니다. 현재 방향을 유지하세요.');
  }
  return lines;
}
