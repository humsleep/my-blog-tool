'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { TIPS_CATEGORIES, categoryBadgeClass } from '@/app/lib/community/tips';
import { escapeLikePattern } from '@/app/lib/security/safe-redirect';
import EmptyState from '@/app/components/community/EmptyState';
import BoardSkeleton from '@/app/components/community/BoardSkeleton';
import InfiniteScrollSentinel from '@/app/components/community/InfiniteScrollSentinel';
import { formatRelativeKr } from '@/app/lib/format/relative-time';

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  const isDebouncing = query.trim() !== debouncedQuery;
  const hasMore = posts.length < total;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query.trim()); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // 필터 변경 시 처음부터 다시
  useEffect(() => { setPage(1); setPosts([]); }, [category, sort, debouncedQuery]);

  const fetchPage = async (targetPage: number, append: boolean) => {
    const supabase = createClient();
    const from = (targetPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('tips_posts')
      .select('id,user_id,nickname,category,title,view_count,like_count,comment_count,created_at',
              { count: 'exact' })
      .eq('is_hidden', false)
      .range(from, to);
    if (sort === 'popular') {
      q = q.order('like_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      q = q.order('created_at', { ascending: false });
    }
    if (category) q = q.eq('category', category);
    if (debouncedQuery) q = q.ilike('title', `%${escapeLikePattern(debouncedQuery)}%`);

    const { data, error: fetchError, count } = await q;
    if (fetchError) {
      console.error('tips fetch failed:', fetchError);
      if (!append) { setError(fetchError.message); setPosts([]); setTotal(0); }
      return;
    }
    const newRows = (data as TipsPost[]) ?? [];
    setPosts((prev) => append ? [...prev, ...newRows] : newRows);
    setTotal(count ?? 0);
    if (!append) setError(null);
  };

  // 1페이지 로드 (필터 변경 시)
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
      await fetchPage(1, false);
      if (cancelled) return;
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, debouncedQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      await fetchPage(next, true);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      // 1페이지만 silent 갱신 (현재 누적 결과는 유지)
      void fetchPage(1, false);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, debouncedQuery]);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pt-6 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <Link href="/community" className="hover:text-orange-500 dark:hover:text-orange-400">커뮤니티</Link>
            <span>›</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">정보 공유</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">💡 정보 공유</h1>
              <p className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                운영 노하우·질문·트러블슈팅을 자유롭게 나눠요
              </p>
            </div>
            <Link
              href="/community/tips/new"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all"
            >
              + 글쓰기
            </Link>
          </div>
        </div>

        <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md mb-4">
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-3 shadow-sm space-y-2">
            <div className="-mx-1 px-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5 whitespace-nowrap pb-0.5">
                <CategoryTab active={category === null} onClick={() => setCategory(null)} label="전체" />
                {TIPS_CATEGORIES.map((c) => (
                  <CategoryTab key={c} active={category === c} onClick={() => setCategory(c)} label={c} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제목으로 검색"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-zinc-700 transition-colors"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isDebouncing && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-300 border-t-orange-500 rounded-full animate-spin" />
                )}
              </div>
              <div className="inline-flex flex-shrink-0 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5">
                <SortButton active={sort === 'recent'} onClick={() => setSort('recent')}>최신순</SortButton>
                <SortButton active={sort === 'popular'} onClick={() => setSort('popular')}>인기순</SortButton>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {loading && <BoardSkeleton rows={6} />}

        {!loading && posts.length === 0 && !error && (
          <EmptyState
            variant="tips"
            title="아직 게시글이 없습니다"
            description="첫 글을 작성해 다른 블로거들과 정보를 나눠보세요."
            hints={[
              '카테고리: 질문 / 정보공유 / 노하우 / 트러블슈팅 / 수익후기 / 잡담',
              '본문은 마크다운으로 작성할 수 있어요',
              '댓글과 좋아요로 활발한 소통이 가능합니다',
            ]}
            action={
              <Link href="/community/tips/new" className="inline-flex px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full shadow-sm">
                글쓰기
              </Link>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {/* 컬럼 헤더 — 데스크톱만 */}
              <div className="hidden md:grid grid-cols-[88px_1fr_120px_100px_72px_64px] gap-3 px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <span>분류</span>
                <span>제목</span>
                <span>작성자</span>
                <span>작성일</span>
                <span className="text-right">조회</span>
                <span className="text-right">추천</span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {posts.map((p) => <TipsRow key={p.id} post={p} />)}
              </ul>
            </div>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={loadMore}
            />
            {!hasMore && posts.length > 0 && (
              <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                마지막 글까지 모두 봤어요 (총 {total}건)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TipsRow({ post }: { post: TipsPost }) {
  return (
    <li>
      <Link
        href={`/community/tips/${post.id}`}
        className="block hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors"
      >
        {/* 데스크톱 — 그리드 컬럼 */}
        <div className="hidden md:grid grid-cols-[88px_1fr_120px_100px_72px_64px] gap-3 items-center px-5 py-3">
          <span className={`justify-self-start px-2 py-0.5 text-[11px] font-semibold rounded ${categoryBadgeClass(post.category)}`}>
            {post.category}
          </span>
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {post.title}
            </span>
            {post.comment_count > 0 && (
              <span className="flex-shrink-0 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                [{post.comment_count}]
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{post.nickname}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatRelativeKr(post.created_at)}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-right tabular-nums">{post.view_count}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-right tabular-nums">{post.like_count}</span>
        </div>
        {/* 모바일 — 컴팩트 */}
        <div className="md:hidden px-4 py-3 flex items-start gap-2.5">
          <span className={`flex-shrink-0 px-1.5 py-0.5 text-[11px] font-semibold rounded ${categoryBadgeClass(post.category)}`}>
            {post.category}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{post.title}</h3>
              {post.comment_count > 0 && (
                <span className="flex-shrink-0 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                  [{post.comment_count}]
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="truncate">{post.nickname}</span>
              <span>·</span>
              <span>{formatRelativeKr(post.created_at)}</span>
              <span>·</span>
              <span>조회 {post.view_count}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function CategoryTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
        active
          ? 'bg-orange-500 text-white border-orange-500'
          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
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
          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

