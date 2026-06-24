'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/app/lib/clientFetch';
import { formatRelativeKr } from '@/app/lib/format/relative-time';
import { BAND_LABEL, type DiagnoseLatestResponse } from '@/app/lib/dashboard/types';
import ScoreGauge, { ScoreMiniBar } from '@/app/components/charts/ScoreGauge';
import ScoreSparkline from '@/app/components/charts/ScoreSparkline';

/**
 * 데일리 대시보드 — 마지막 진단 점수 카드.
 * 진단 이력이 없으면 "내 블로그 진단해보기" 빈 상태 카드.
 * 진단 이력 2건 이상이면 점수 변동 (delta) 함께 표시.
 */
export default function LatestDiagnoseCard() {
  const [data, setData] = useState<DiagnoseLatestResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    clientFetchJson<DiagnoseLatestResponse>('/api/blog-diagnose')
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {
        if (!cancelled) setData({ latest: null, previous: null, delta: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
        <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-3" />
        <div className="h-12 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-3" />
        <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      </section>
    );
  }

  if (!data?.latest) {
    return (
      <section className="h-full flex flex-col rounded-xl border border-orange-200 dark:border-orange-900/50 ring-1 ring-orange-500/20 bg-white dark:bg-zinc-900 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 dark:text-orange-400">
            Diagnose
          </span>
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">New</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          내 블로그는 카테고리 안에서 어디쯤일까요?
        </h3>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
          내가 쓴 글이 검색 상위에 뜨는지로 활동성 · 노출 · 품질을 한 번에 진단합니다. 1분 안에 점수가 나와요.
        </p>
        <Link href="/blog-diagnose" className="btn-base btn-primary btn-lg text-base">
          내 블로그 진단하기
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    );
  }

  const { latest, delta, history } = data;
  const sparkPoints = (history ?? []).filter((p) => typeof p.score === 'number');
  const deltaColor =
    delta === null
      ? 'text-zinc-500 dark:text-zinc-400'
      : delta > 0
        ? 'text-orange-600 dark:text-orange-400'
        : delta < 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-zinc-500 dark:text-zinc-400';
  const deltaPrefix = delta === null ? '' : delta > 0 ? '+' : '';
  const deltaLabel = delta === null ? '첫 진단' : delta === 0 ? '변동 없음' : `${deltaPrefix}${delta} vs 직전`;

  return (
    <section className="h-full rounded-xl border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#161618] p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase text-zinc-500">
            마지막 진단
          </span>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 truncate">
            {latest.blog_title ?? latest.blog_id}
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            {latest.category_label ?? latest.category}
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            {formatRelativeKr(latest.created_at)}
          </div>
        </div>
        <Link href="/blog-diagnose" className="text-sm font-medium text-orange-700 dark:text-orange-300 hover:underline whitespace-nowrap flex-shrink-0">
          다시 진단 →
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex-shrink-0">
          <ScoreGauge value={latest.total_score} size={120} caption="/ 100" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {BAND_LABEL[latest.band]}
            </span>
            <span className={`text-sm font-semibold ${deltaColor}`}>{deltaLabel}</span>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            키워드 <span className="tabular font-semibold text-zinc-900 dark:text-zinc-100">{latest.hit_count ?? 0}</span>개 1페이지 노출
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
            TOP10 <span className="tabular font-semibold text-zinc-900 dark:text-zinc-100">{latest.top_ten_count ?? 0}</span>
          </div>
          <div className="space-y-2">
            <ScoreMiniBar label="활동성" value={latest.activity_score} />
            <ScoreMiniBar label="노출"   value={latest.visibility_score} />
            <ScoreMiniBar label="품질"   value={latest.quality_score} />
          </div>
        </div>
      </div>

      {/* 점수 추이 sparkline — 진단 2건 이상 누적 시 노출 */}
      {sparkPoints.length >= 2 && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#2e2723] flex items-center justify-between gap-3">
          <ScoreSparkline points={sparkPoints} label="점수 추이" width={220} height={48} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            최근 {sparkPoints.length}회 진단
          </span>
        </div>
      )}
    </section>
  );
}
