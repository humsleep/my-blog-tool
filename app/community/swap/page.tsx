'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import CategoryChips from '@/app/components/community/CategoryChips';
import EmptyState from '@/app/components/community/EmptyState';
import ConfirmModal from '@/app/components/community/ConfirmModal';
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

export default function SwapPage() {
  const [posts, setPosts] = useState<SwapPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<SwapDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SwapPost | null>(null);

  // debounce 닉네임 검색
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // auth + profile
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

  const fetchPosts = async () => {
    const supabase = createClient();
    let q = supabase
      .from('swap_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);
    if (category) q = q.eq('category', category);
    if (debouncedQuery) q = q.ilike('nickname', `%${debouncedQuery}%`);
    const { data, error: fetchError } = await q;
    if (fetchError) {
      console.error('swap fetch failed:', fetchError);
      return { data: null as SwapPost[] | null, error: fetchError.message };
    }
    return { data: (data as SwapPost[]) ?? [], error: null };
  };

  // 게시글 로드 (필터 변경 시)
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
      const result = await fetchPosts();
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setPosts([]);
      } else if (result.data) {
        setPosts(result.data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedQuery]);

  // 탭/창이 다시 활성화되면 silent 재fetch
  useEffect(() => {
    const onFocus = async () => {
      if (document.visibilityState !== 'visible') return;
      const result = await fetchPosts();
      if (result.data) setPosts(result.data);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedQuery]);

  const reload = async () => {
    const result = await fetchPosts();
    if (result.data) setPosts(result.data);
  };

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
    await supabase.from('swap_posts').delete().eq('id', deleteTarget.id).eq('user_id', profile.user_id);
    setDeleteTarget(null);
    await reload();
  };

  const myUserId = profile?.user_id;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm mb-4 space-y-2">
          <CategoryChips selected={category} onSelect={setCategory} />
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="닉네임으로 검색"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
            title="아직 작성된 글이 없습니다."
            description={category ? `'${category}' 분야에 작성된 글이 없어요. 첫 글을 작성해보세요!` : '첫 서이추 글의 주인공이 되어보세요!'}
            action={
              <button
                type="button"
                onClick={onClickWrite}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg"
              >
                내 글 작성하기
              </button>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">총 {posts.length}건</p>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* 컬럼 헤더 — 데스크톱만 */}
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
          </>
        )}

        {!authLoading && (
          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium">이용 안내</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>읽기는 누구나 가능합니다. 글쓰기는 로그인 후 닉네임 등록이 필요해요.</li>
              <li>도배 방지를 위해 한 사람이 24시간 동안 1번만 글을 작성할 수 있습니다. 본인 글은 언제든 수정/삭제 가능합니다.</li>
              <li>광고성 글이나 부적절한 내용은 관리자가 임의로 삭제할 수 있습니다.</li>
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
          onSaved={reload}
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
      {/* 데스크톱 — 그리드 행 */}
      <div className="hidden md:grid grid-cols-[88px_140px_1fr_120px_100px_80px] gap-3 items-center px-5 py-3">
        <span className="justify-self-start px-2 py-0.5 text-[11px] font-semibold rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
          {post.category}
        </span>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {post.nickname}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-300 truncate" title={post.message}>
          {post.message}
        </span>
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
        <div className="flex justify-end gap-1">
          {isMine ? (
            <>
              <button type="button" onClick={onEdit} className="text-[11px] text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 px-1.5">수정</button>
              <button type="button" onClick={onDelete} className="text-[11px] text-slate-500 hover:text-red-600 dark:hover:text-red-400 px-1.5">삭제</button>
            </>
          ) : (
            <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>
      </div>

      {/* 모바일 — 컴팩트 카드 행 */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
              {post.category}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{post.nickname}</span>
          </div>
          {isMine && (
            <div className="flex flex-shrink-0 gap-1">
              <button type="button" onClick={onEdit} className="text-[11px] text-slate-500 px-1">수정</button>
              <button type="button" onClick={onDelete} className="text-[11px] text-slate-500 px-1">삭제</button>
            </div>
          )}
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
