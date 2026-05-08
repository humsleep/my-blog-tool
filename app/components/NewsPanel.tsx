'use client';

import { useEffect, useMemo, useState } from 'react';
import { clientFetchJson, ApiError } from '../lib/clientFetch';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  originalLink: string;
}

interface NewsResponse {
  keyword: string;
  total: number;
  items: NewsItem[];
}

interface NewsPanelProps {
  keyword: string;
  display?: number;
  /** 'sim' = 정확도순(기본), 'date' = 최신순 — 사용자 토글로 변경 가능 */
  sort?: 'sim' | 'date';
  variant?: 'modal' | 'inline';
  /** 체크박스 + 하단 CTA 활성화 (모달에서 사용) */
  selectable?: boolean;
  /** "선택한 뉴스로 프롬프트 만들기" 클릭 시 호출. 부모가 router push 처리 */
  onCreatePrompt?: (selected: NewsItem[]) => void;
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function formatPubDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * 키워드 매칭 점수.
 * - 제목 정확 일치 +10, 부분 매칭 횟수 ×3
 * - 설명에서 매칭 횟수 ×1
 * - 7일 이내 발행 +2 보너스
 * 키워드를 공백으로 토큰화해 모든 토큰이 등장하는 항목을 선호.
 */
function scoreItem(item: NewsItem, keyword: string): number {
  const title = stripHtml(item.title).toLowerCase();
  const desc = stripHtml(item.description).toLowerCase();
  const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const t of tokens) {
    const tInTitle = (title.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const tInDesc = (desc.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (tInTitle > 0) score += 10 + (tInTitle - 1) * 3;
    score += tInDesc;
  }
  // 모든 토큰이 제목에 있으면 strong 보너스
  const allTokensInTitle = tokens.every((t) => title.includes(t));
  if (allTokensInTitle) score += 5;

  // 최근성 보너스
  const d = new Date(item.pubDate);
  if (!Number.isNaN(d.getTime())) {
    const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 7) score += 2;
  }
  return score;
}

const MAX_SELECT = 3;
const RELEVANCE_THRESHOLD = 5; // 제목 매칭 1개 미만이면 숨김 옵션

export default function NewsPanel({
  keyword,
  display = 15,
  sort: initialSort = 'sim',
  variant = 'inline',
  selectable = false,
  onCreatePrompt,
}: NewsPanelProps) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'sim' | 'date'>(initialSort);
  const [strict, setStrict] = useState(true); // 관련도 낮은 항목 숨김 — 기본 ON
  const [selected, setSelected] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!keyword) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ keyword, display: String(display), sort });
        const result = await clientFetchJson<NewsResponse>(`/api/news?${params.toString()}`);
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : '뉴스를 불러오지 못했습니다.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [keyword, display, sort]);

  // 키워드 변경 시 선택 초기화
  useEffect(() => {
    setSelected([]);
  }, [keyword]);

  const scoredItems = useMemo(() => {
    if (!data) return [] as Array<NewsItem & { _score: number }>;
    const withScore = data.items.map((it) => ({ ...it, _score: scoreItem(it, keyword) }));
    if (sort === 'sim') {
      withScore.sort((a, b) => b._score - a._score);
    }
    // date 정렬은 API가 이미 처리, 점수만 부착
    return withScore;
  }, [data, keyword, sort]);

  const visibleItems = useMemo(() => {
    if (!strict) return scoredItems;
    // strict ON: 점수 임계값 이상만 (제목 토큰 매칭 최소 1개 보장)
    const filtered = scoredItems.filter((it) => it._score >= RELEVANCE_THRESHOLD);
    // 모두 필터링되면 strict 무시 (안전망)
    return filtered.length > 0 ? filtered : scoredItems;
  }, [scoredItems, strict]);

  const compact = variant === 'modal';
  const isSelected = (item: NewsItem) => selected.some((s) => s.link === item.link);

  const toggleSelect = (item: NewsItem) => {
    setSelected((prev) => {
      if (prev.some((s) => s.link === item.link)) {
        return prev.filter((s) => s.link !== item.link);
      }
      if (prev.length >= MAX_SELECT) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleCreatePrompt = () => {
    if (!onCreatePrompt || selected.length === 0) return;
    onCreatePrompt(selected);
  };

  return (
    <div className={compact ? '' : 'bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm'}>
      {!compact && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            &ldquo;{keyword}&rdquo; 관련 최신 뉴스
          </h3>
          {data && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              총 {data.total.toLocaleString()}건
            </span>
          )}
        </div>
      )}

      {/* 정렬 / 필터 컨트롤 */}
      {!loading && !error && (
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSort('sim')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sort === 'sim'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              정확도순
            </button>
            <button
              type="button"
              onClick={() => setSort('date')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sort === 'date'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              최신순
            </button>
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={strict}
              onChange={(e) => setStrict(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500"
            />
            관련도 낮은 항목 숨김
          </label>
        </div>
      )}

      {loading && (
        <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <svg className="animate-spin h-4 w-4 inline-block mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          뉴스 불러오는 중...
        </div>
      )}

      {error && !loading && (
        <div className="py-4 px-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && data && visibleItems.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          관련 뉴스를 찾지 못했습니다.
        </p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {visibleItems.map((item, i) => {
            const checked = isSelected(item);
            const disabled = !checked && selected.length >= MAX_SELECT;
            const cleanTitle = stripHtml(item.title);
            const cleanDesc = stripHtml(item.description);
            return (
              <li key={`${item.link}-${i}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleSelect(item)}
                      className="mt-1 w-4 h-4 rounded text-blue-500 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label={`${cleanTitle} 선택`}
                    />
                  )}
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block flex-1 min-w-0 group"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 line-clamp-2">
                      {cleanTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cleanDesc}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {formatPubDate(item.pubDate)}
                    </p>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 하단 CTA — selectable일 때만 */}
      {selectable && !loading && !error && (
        <div className="sticky bottom-0 -mx-5 -mb-4 mt-4 px-5 py-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selected.length === 0
                ? `최대 ${MAX_SELECT}건까지 선택 가능`
                : `${selected.length}건 선택됨${selected.length >= MAX_SELECT ? ' (최대)' : ''}`}
            </span>
            <button
              type="button"
              onClick={handleCreatePrompt}
              disabled={selected.length === 0 || !onCreatePrompt}
              className="btn-base btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              선택한 뉴스로 프롬프트 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
