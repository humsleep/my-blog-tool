'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { TIPS_CATEGORIES, categoryBadgeClass } from '@/app/lib/community/tips';
import EmptyState from '@/app/components/community/EmptyState';

interface TipsPost {
  id: number;
  user_id: string;
  nickname: string;
  category: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
}

const PAGE_SIZE = 20;
type SortKey = 'recent' | 'popular';

export default function TipsListPage() {
  const [posts, setPosts] = useState<TipsPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [category, sort]);

  const fetchPosts = async (silent: boolean) => {
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('tips_posts')
      .select('id,user_id,nickname,category,title,view_count,like_count,comment_count,created_at',
              { count: 'exact' })
      .range(from, to);
    if (sort === 'popular') {
      q = q.order('like_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      q = q.order('created_at', { ascending: false });
    }
    if (category) q = q.eq('category', category);
    if (debouncedQuery) q = q.ilike('title', `%${debouncedQuery}%`);

    const { data, error: fetchError, count } = await q;
    if (fetchError) {
      console.error('tips fetch failed:', fetchError);
      if (!silent) { setError(fetchError.message); setPosts([]); setTotal(0); }
      return;
    }
    setPosts((data as TipsPost[]) ?? []);
    setTotal(count ?? 0);
    if (!silent) setError(null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError('Supabase가 설정되지 않았습니다.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await fetchPosts(false);
      if (cancelled) return;
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, debouncedQuery, page]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchPosts(true);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, debouncedQuery, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/community" className="hover:text-indigo-600 dark:hover:text-indigo-400">커뮤니티</Link>
              <span>/</span>
              <span>정보 공유</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">정보 공유</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              운영 노하우·질문·트러블슈팅을 자유롭게 나눠요.
            </p>
          </div>
          <Link
            href="/community/tips/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
          >
            + 글쓰기
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm mb-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <CategoryTab active={category === null} onClick={() => setCategory(null)} label="전체" />
            {TIPS_CATEGORIES.map((c) => (
              <CategoryTab key={c} active={category === c} onClick={() => setCategory(c)} label={c} />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목으로 검색"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="inline-flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <SortButton active={sort === 'recent'} onClick={() => setSort('recent')}>최신순</SortButton>
              <SortButton active={sort === 'popular'} onClick={() => setSort('popular')}>인기순</SortButton>
            </div>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">불러오는 중...</p>}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <EmptyState
            title="아직 게시글이 없습니다."
            description="첫 글을 작성해 다른 블로거들과 정보를 나눠보세요."
            action={
              <Link href="/community/tips/new" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg">
                글쓰기
              </Link>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {posts.map((p) => <TipsRow key={p.id} post={p} />)}
            </div>
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TipsRow({ post }: { post: TipsPost }) {
  return (
    <Link
      href={`/community/tips/${post.id}`}
      className="block px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded ${categoryBadgeClass(post.category)}`}>
          {post.category}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 truncate">
              {post.title}
            </h3>
            {post.comment_count > 0 && (
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                💬 {post.comment_count}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{post.nickname}</span>
            <span>·</span>
            <span>{formatRelativeKr(post.created_at)}</span>
            <span>·</span>
            <span>조회 {post.view_count}</span>
            <span>·</span>
            <span>♡ {post.like_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-5 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`w-9 h-9 text-sm rounded-lg transition-colors ${
            p === page
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        다음
      </button>
    </div>
  );
}

function formatRelativeKr(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
