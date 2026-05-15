'use client';

import { useEffect, useMemo, useState } from 'react';
import { clientFetchJson, ApiError } from '../lib/clientFetch';
import { formatRelativeKr } from '../lib/format/relative-time';

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

/**
 * 뉴스 원문 URL에서 도메인만 추출 — 예: "https://www.chosun.com/foo" → "chosun.com"
 * 모바일 카드에서 출처 배지로 표시.
 */
function extractSourceDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
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

/**
 * 제목/설명의 키워드 토큰을 <mark>로 감싸기.
 * stripHtml 통과한 안전한 plain text 가 입력이므로 XSS 위험 없음.
 */
function highlightTokens(plain: string, keyword: string): string {
  const tokens = keyword
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // 긴 토큰 먼저 매칭
  if (tokens.length === 0) return plain;
  const escaped = plain.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
  let out = escaped;
  for (const t of tokens) {
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    out = out.replace(re, '<mark class="bg-orange-100 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300 rounded px-0.5 font-semibold">$1</mark>');
  }
  return out;
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
    <div className={compact ? '' : 'bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 shadow-sm'}>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base min-w-0 break-words">
            <span className="text-orange-600 dark:text-orange-400">&ldquo;{keyword}&rdquo;</span>
            <span className="ml-1">관련 최신 뉴스</span>
          </h3>
          {data && (
            <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
              총 {data.total.toLocaleString()}건
            </span>
          )}
        </div>
      )}

      {/* 정렬 / 필터 컨트롤 */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-700/60">
          <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-700/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSort('sim')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sort === 'sim'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-300 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              정확도순
            </button>
            <button
              type="button"
              onClick={() => setSort('date')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sort === 'date'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-300 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              최신순
            </button>
          </div>
          <label className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={strict}
              onChange={(e) => setStrict(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-orange-500"
            />
            관련도 낮은 항목 숨김
          </label>
        </div>
      )}

      {loading && (
        <div className="space-y-3 py-2" aria-busy="true" aria-label="뉴스 불러오는 중">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-zinc-100 dark:border-zinc-700/60 p-3 sm:p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="py-4 px-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg break-words">
          {error}
        </div>
      )}

      {!loading && !error && data && visibleItems.length === 0 && (
        <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          관련 뉴스를 찾지 못했습니다.
        </p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <ul className="space-y-2 sm:space-y-2.5">
          {visibleItems.map((item, i) => {
            const checked = isSelected(item);
            const disabled = !checked && selected.length >= MAX_SELECT;
            const cleanTitle = stripHtml(item.title);
            const cleanDesc = stripHtml(item.description);
            const source = extractSourceDomain(item.originalLink || item.link);
            const relative = formatRelativeKr(item.pubDate);
            return (
              <li key={`${item.link}-${i}`}>
                <label
                  className={`group relative block rounded-lg border transition-all ${
                    checked
                      ? 'border-orange-300 dark:border-orange-600/70 bg-orange-50/60 dark:bg-orange-950/20 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900/40 hover:border-orange-200 dark:hover:border-orange-700/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/10'
                  } ${disabled ? 'opacity-50' : ''} ${selectable ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleSelect(item)}
                        className="mt-0.5 w-5 h-5 rounded text-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label={`${cleanTitle} 선택`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* 메타 — 출처 + 시간 */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5 text-[11px] sm:text-xs">
                        {source && (
                          <span className="inline-flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[60%]">
                            <svg className="w-3 h-3 flex-shrink-0 text-zinc-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm-.75-9.25a.75.75 0 011.5 0v3.04l2.13 1.23a.75.75 0 11-.76 1.3l-2.5-1.45a.75.75 0 01-.37-.65v-3.47z" />
                            </svg>
                            <span className="truncate">{source}</span>
                          </span>
                        )}
                        <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>·</span>
                        <span className="text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                          {relative}
                        </span>
                      </div>
                      {/* 제목 — 키워드 하이라이트 */}
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block group/title"
                      >
                        <p
                          className="text-sm sm:text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover/title:text-orange-600 dark:group-hover/title:text-orange-400 transition-colors line-clamp-2 break-words"
                          dangerouslySetInnerHTML={{ __html: highlightTokens(cleanTitle, keyword) }}
                        />
                        <p
                          className="mt-1 text-xs sm:text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 break-words"
                          dangerouslySetInnerHTML={{ __html: highlightTokens(cleanDesc, keyword) }}
                        />
                        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-600/80 dark:text-orange-400/80 group-hover/title:text-orange-600 dark:group-hover/title:text-orange-400 transition-colors">
                          원문 보기
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </span>
                      </a>
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {/* 하단 CTA — selectable일 때만 */}
      {selectable && !loading && !error && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 mt-4 px-4 sm:px-5 py-3 bg-white/95 dark:bg-zinc-800/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              {selected.length === 0
                ? `최대 ${MAX_SELECT}건 선택 가능`
                : `${selected.length}건 선택됨${selected.length >= MAX_SELECT ? ' (최대)' : ''}`}
            </span>
            <button
              type="button"
              onClick={handleCreatePrompt}
              disabled={selected.length === 0 || !onCreatePrompt}
              className="btn-base btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="hidden sm:inline">선택한 뉴스로 </span>프롬프트 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
