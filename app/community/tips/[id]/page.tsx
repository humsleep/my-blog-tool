'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import { categoryBadgeClass } from '@/app/lib/community/tips';
import { markdownToHtml } from '@/app/lib/format/article-formats';
import ConfirmModal from '@/app/components/community/ConfirmModal';

interface TipsPost {
  id: number;
  user_id: string;
  nickname: string;
  category: string;
  title: string;
  body: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

interface TipsComment {
  id: number;
  post_id: number;
  user_id: string;
  nickname: string;
  body: string;
  created_at: string;
}

export default function TipsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const postId = Number(id);
  const router = useRouter();

  const [post, setPost] = useState<TipsPost | null>(null);
  const [comments, setComments] = useState<TipsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed] = useState(false);
  const [liked, setLiked] = useState(false);

  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // 데이터 로드 + 조회수 증가
  useEffect(() => {
    if (!isSupabaseConfigured() || Number.isNaN(postId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data: postData, error: postErr }, { data: commentsData }, { data: auth }] = await Promise.all([
        supabase.from('tips_posts').select('*').eq('id', postId).maybeSingle(),
        supabase.from('tips_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
        supabase.auth.getUser(),
      ]);

      if (cancelled) return;

      if (postErr || !postData) {
        setError('게시글을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setPost(postData as TipsPost);
      setComments((commentsData as TipsComment[]) ?? []);

      if (auth.user) {
        setAuthed(true);
        const me = await fetchMyProfile();
        if (!cancelled) setProfile(me);
        const { data: likeData } = await supabase
          .from('tips_likes')
          .select('post_id')
          .eq('post_id', postId)
          .eq('user_id', auth.user.id)
          .maybeSingle();
        if (!cancelled) setLiked(!!likeData);
      }

      setLoading(false);

      // 조회수 증가 (한 세션에 1회 — sessionStorage)
      const viewKey = `tips:viewed:${postId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        await supabase.rpc('tips_increment_view', { post_id: postId });
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const onToggleLike = async () => {
    if (!authed || !profile || !post) {
      router.push('/login?next=' + encodeURIComponent(`/community/tips/${postId}`));
      return;
    }
    const supabase = createClient();
    if (liked) {
      await supabase.from('tips_likes').delete().eq('post_id', postId).eq('user_id', profile.user_id);
      setLiked(false);
      setPost({ ...post, like_count: Math.max(0, post.like_count - 1) });
    } else {
      const { error: likeErr } = await supabase
        .from('tips_likes')
        .insert({ post_id: postId, user_id: profile.user_id });
      if (!likeErr) {
        setLiked(true);
        setPost({ ...post, like_count: post.like_count + 1 });
      }
    }
  };

  const onSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authed || !profile) {
      router.push('/login?next=' + encodeURIComponent(`/community/tips/${postId}`));
      return;
    }
    const text = commentBody.trim();
    if (!text) return;
    if (text.length > 1000) return;

    setSubmittingComment(true);
    try {
      const supabase = createClient();
      const { data, error: insErr } = await supabase
        .from('tips_comments')
        .insert({
          post_id: postId,
          user_id: profile.user_id,
          nickname: profile.nickname,
          body: text,
        })
        .select('*')
        .single();
      if (insErr) {
        alert(insErr.message);
        return;
      }
      setComments([...comments, data as TipsComment]);
      setCommentBody('');
      if (post) setPost({ ...post, comment_count: post.comment_count + 1 });
    } finally {
      setSubmittingComment(false);
    }
  };

  const onDeleteComment = async () => {
    if (!deletingCommentId || !profile) return;
    const supabase = createClient();
    await supabase.from('tips_comments').delete().eq('id', deletingCommentId).eq('user_id', profile.user_id);
    setComments(comments.filter((c) => c.id !== deletingCommentId));
    if (post) setPost({ ...post, comment_count: Math.max(0, post.comment_count - 1) });
    setDeletingCommentId(null);
  };

  const onDeletePost = async () => {
    if (!post || !profile) return;
    const supabase = createClient();
    await supabase.from('tips_posts').delete().eq('id', post.id).eq('user_id', profile.user_id);
    router.push('/community/tips');
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>;
  }

  if (error || !post) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-slate-700 dark:text-slate-200 font-medium">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Link href="/community/tips" className="inline-block mt-4 text-sm text-orange-500 dark:text-orange-400 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isMine = profile?.user_id === post.user_id;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/community/tips" className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400">
            ← 목록으로
          </Link>
        </div>

        <article className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded ${categoryBadgeClass(post.category)}`}>
              {post.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 break-words">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
            <span className="font-medium text-slate-700 dark:text-slate-300">{post.nickname}</span>
            <span>·</span>
            <span>{formatAbsoluteKr(post.created_at)}</span>
            <span>·</span>
            <span>조회 {post.view_count}</span>
          </div>

          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }}
          />

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleLike}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                liked
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {liked ? '♥' : '♡'} 추천 {post.like_count}
            </button>
            {isMine && (
              <div className="flex gap-1">
                <Link
                  href={`/community/tips/new?id=${post.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </article>

        <section className="mt-6 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            댓글 {post.comment_count}
          </h2>

          {comments.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">아직 댓글이 없습니다.</p>
          )}

          <div className="space-y-3 mb-5">
            {comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{c.nickname}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatRelativeKr(c.created_at)}</span>
                  </div>
                  {profile?.user_id === c.user_id && (
                    <button
                      type="button"
                      onClick={() => setDeletingCommentId(c.id)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            ))}
          </div>

          <form onSubmit={onSubmitComment} className="space-y-2">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={authed ? '댓글을 입력하세요 (최대 1000자)' : '댓글을 작성하려면 로그인이 필요합니다.'}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={!authed}
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">{commentBody.length}/1000</span>
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim() || !authed}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {!authed ? '로그인 후 작성' : submittingComment ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="이 글을 삭제할까요?"
        description="댓글과 좋아요도 모두 삭제되며, 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        onConfirm={onDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmModal
        open={deletingCommentId !== null}
        title="이 댓글을 삭제할까요?"
        confirmLabel="삭제"
        variant="danger"
        onConfirm={onDeleteComment}
        onCancel={() => setDeletingCommentId(null)}
      />
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
  return formatAbsoluteKr(iso);
}

function formatAbsoluteKr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
