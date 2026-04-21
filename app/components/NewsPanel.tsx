'use client';

import { useEffect, useState } from 'react';
import { clientFetchJson, ApiError } from '../lib/clientFetch';

interface NewsItem {
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
  sort?: 'sim' | 'date';
  variant?: 'modal' | 'inline';
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function formatPubDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NewsPanel({ keyword, display = 10, sort = 'date', variant = 'inline' }: NewsPanelProps) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const compact = variant === 'modal';

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

      {!loading && !error && data && data.items.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          관련 뉴스를 찾지 못했습니다.
        </p>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {data.items.map((item, i) => (
            <li key={`${item.link}-${i}`} className="py-3 first:pt-0 last:pb-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                  {stripHtml(item.title)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {stripHtml(item.description)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {formatPubDate(item.pubDate)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
