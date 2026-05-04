'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import { escapeLikePattern } from '@/app/lib/security/safe-redirect';
import CategoryChips from '@/app/components/community/CategoryChips';
import EmptyState from '@/app/components/community/EmptyState';
import ConfirmModal from '@/app/components/community/ConfirmModal';
import Pagination from '@/app/components/community/Pagination';
import BoardSkeleton from '@/app/components/community/BoardSkeleton';
import ReportButton from '@/app/components/community/ReportButton';
import { useToast } from '@/app/components/ui/Toast';
import { formatRelativeKr } from '@/app/lib/format/relative-time';
import SwapModal, { type SwapDraft } from './SwapModal';

interface SwapPost {
  id: number;
  user_id: string;
  nickname: string;
  blog_url: string;
  category: string;
  message: string;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 20;

export default function SwapPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<SwapPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<SwapDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SwapPost | null>(null);

  const isDebouncing = query.trim() !== debouncedQuery;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [category]);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setAuthLoading(false); return; }
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setAuthed(true);
        setProfile(await fetchMyProfile());
      }
      setAuthLoading(false);
    })();
  }, []);

  const fetchPosts = async (silent: boolean) => {
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('swap_posts')
      .select('*', { count: 'exact' })
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (category) q = q.eq('category', category);
    if (debouncedQuery) q = q.ilike('nickname', `%${escapeLikePattern(debouncedQuery)}%`);
    const { data, error: fetchError, count } = await q;
    if (fetchError) {
      console.error('swap fetch failed:', fetchError);
      if (!silent) { setError(fetchError.message); setPosts([]); setTotal(0); }
      return;
    }
    setPosts((data as SwapPost[]) ?? []);
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
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedQuery, page]);

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
  }, [category, debouncedQuery, page]);

  const reload = () => { void fetchPosts(true); };

  const onClickWrite = () => {
    if (!authed) {
      window.location.href = '/login?next=' + encodeURIComponent('/community/swap');
      return;
    }
    if (!profile) {
      window.location.href = '/profile/setup?next=' + encodeURIComponent('/community/swap');
      return;
    }
    setModalInitial(null);
    setModalOpen(true);
  };

  const onEdit = (post: SwapPost) => {
    setModalInitial({
      id: post.id,
      blog_url: post.blog_url,
      category: post.category,
      message: post.message,
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !profile) return;
    const supabase = createClient();
    const { error: delError } = await supabase
      .from('swap_posts').delete()
      .eq('id', deleteTarget.id).eq('user_id', profile.user_id);
    setDeleteTarget(null);
    if (delError) {
      toast('삭제에 실패했습니다: ' + delError.message, 'error');
      return;
    }
    toast('글이 삭제되었습니다.', 'success');
    await fetchPosts(true);
  };

  const myUserId = profile?.user_id;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-6 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/community" className="hover:text-orange-500 dark:hover:text-orange-400">커뮤니티</Link>
            <span>›</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">서이추 해요</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">🤝 서이추 해요</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                같은 분야 블로거를 만나 서로이웃 추가하세요 · 하루 1회 작성
              </p>
            </div>
            <button
              type="button"
              onClick={onClickWrite}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all"
            >
              + 내 글 작성
            </button>
          </div>
        </div>

        {/* Sticky 필터 — Navbar(56px) 아래 */}
        <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md mb-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm space-y-2">
            <CategoryChips selected={category} onSelect={setCategory} />
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="닉네임으로 검색"
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isDebouncing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
              )}
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
            variant="swap"
            title={category ? `'${category}' 분야에 글이 없어요` : '아직 작성된 글이 없습니다'}
            description="첫 글의 주인공이 되어보세요!"
            hints={[
              '하루 1회 작성 가능 (24시간 후 새 글 작성)',
              '본인 글은 언제든 수정·삭제할 수 있어요',
              '같은 분야 블로거가 닉네임으로 검색해서 찾아옵니다',
            ]}
            action={
              <button
                type="button"
                onClick={onClickWrite}
                className="inline-flex px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full shadow-sm"
              >
                내 글 작성하기
              </button>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">총 {total}건</p>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="hidden md:grid grid-cols-[88px_140px_1fr_120px_100px_80px] gap-3 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>분야</span>
                <span>닉네임</span>
                <span>한마디</span>
                <span>작성일</span>
                <span>블로그</span>
                <span className="text-right">관리</span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {posts.map((post) => (
                  <SwapRow
                    key={post.id}
                    post={post}
                    isMine={!!myUserId && post.user_id === myUserId}
                    onEdit={() => onEdit(post)}
                    onDelete={() => setDeleteTarget(post)}
                  />
                ))}
              </ul>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}

        {!authLoading && (
          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium">이용 안내</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>읽기는 누구나, 글쓰기는 로그인 후 닉네임 등록이 필요해요.</li>
              <li>도배 방지를 위해 한 사람이 24시간 동안 1번만 작성할 수 있습니다.</li>
              <li>광고성·부적절한 내용은 관리자가 임의로 삭제할 수 있습니다.</li>
            </ul>
          </div>
        )}
      </div>

      {profile && (
        <SwapModal
          open={modalOpen}
          profile={profile}
          initial={modalInitial}
          onClose={() => setModalOpen(false)}
          onSaved={() => { reload(); toast(modalInitial ? '수정되었습니다.' : '작성되었습니다.', 'success'); }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="이 글을 삭제할까요?"
        description="삭제한 글은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SwapRow({
  post, isMine, onEdit, onDelete,
}: { post: SwapPost; isMine: boolean; onEdit: () => void; onDelete: () => void }) {
  const formatted = useMemo(() => formatRelativeKr(post.created_at), [post.created_at]);
  return (
    <li className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
      <div className="hidden md:grid grid-cols-[88px_140px_1fr_120px_100px_80px] gap-3 items-center px-5 py-3">
        <span className="justify-self-start px-2 py-0.5 text-[11px] font-semibold rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
          {post.category}
        </span>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{post.nickname}</span>
        <span className="text-sm text-slate-600 dark:text-slate-300 truncate" title={post.message}>{post.message}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatted}</span>
        <a
          href={post.blog_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline truncate"
        >
          방문하기
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        <div className="flex justify-end gap-1 items-center">
          {isMine ? (
            <>
              <button type="button" onClick={onEdit} className="text-[11px] text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 px-1.5">수정</button>
              <button type="button" onClick={onDelete} className="text-[11px] text-slate-500 hover:text-red-600 dark:hover:text-red-400 px-1.5">삭제</button>
            </>
          ) : (
            <ReportButton targetType="swap_post" targetId={post.id} variant="icon" />
          )}
        </div>
      </div>

      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
              {post.category}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{post.nickname}</span>
          </div>
          <div className="flex flex-shrink-0 gap-1 items-center">
            {isMine ? (
              <>
                <button type="button" onClick={onEdit} className="text-[11px] text-slate-500 px-1">수정</button>
                <button type="button" onClick={onDelete} className="text-[11px] text-slate-500 px-1">삭제</button>
              </>
            ) : (
              <ReportButton targetType="swap_post" targetId={post.id} variant="icon" />
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">{post.message}</p>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{formatted}</span>
          <a
            href={post.blog_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400"
          >
            블로그 방문
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </li>
  );
}
