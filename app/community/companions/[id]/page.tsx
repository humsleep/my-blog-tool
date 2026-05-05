'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, fetchProfileByUserId, type Profile } from '@/app/lib/community/profile';
import { COMPANION_STATUS, formatFullRegion, type CompanionStatus } from '@/app/lib/community/regions';
import { formatAbsoluteKr } from '@/app/lib/format/relative-time';
import { useToast } from '@/app/components/ui/Toast';
import ConfirmModal from '@/app/components/community/ConfirmModal';
import ReportButton from '@/app/components/community/ReportButton';

interface CompanionPost {
  id: number;
  user_id: string;
  nickname: string;
  title: string;
  brand_name: string | null;
  region: string;
  region_city: string | null;
  visit_date: string;
  visit_time_slot: string | null;
  participants: number;
  contact_method: string;
  message: string;
  status: CompanionStatus;
  created_at: string;
  updated_at: string;
}

export default function CompanionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const postId = Number(id);
  const router = useRouter();
  const { toast } = useToast();

  const [post, setPost] = useState<CompanionPost | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || Number.isNaN(postId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data, error: fetchErr }, { data: auth }] = await Promise.all([
        supabase.from('companion_posts').select('*').eq('id', postId).eq('is_hidden', false).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (fetchErr || !data) {
        setError('모집글을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setPost(data as CompanionPost);
      void fetchProfileByUserId((data as CompanionPost).user_id).then((p) => {
        if (!cancelled) setAuthor(p);
      });
      if (auth.user) {
        const me = await fetchMyProfile();
        if (!cancelled) setProfile(me);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const onChangeStatus = async (newStatus: CompanionStatus) => {
    if (!post || !profile) return;
    setUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from('companion_posts')
        .update({ status: newStatus })
        .eq('id', post.id)
        .eq('user_id', profile.user_id);
      if (updErr) {
        toast('상태 변경 실패: ' + updErr.message, 'error');
        return;
      }
      setPost({ ...post, status: newStatus });
      toast(`상태가 '${newStatus}'(으)로 변경되었습니다.`, 'success');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onDelete = async () => {
    if (!post || !profile) return;
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from('companion_posts').delete()
      .eq('id', post.id).eq('user_id', profile.user_id);
    if (delErr) { toast('삭제 실패: ' + delErr.message, 'error'); return; }
    toast('모집글이 삭제되었습니다.', 'success');
    router.push('/community/companions');
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>;

  if (error || !post) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-slate-700 dark:text-slate-200 font-medium">{error || '모집글을 찾을 수 없습니다.'}</p>
          <Link href="/community/companions" className="inline-block mt-4 text-sm text-orange-500 dark:text-orange-400 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isMine = profile?.user_id === post.user_id;
  const dow = new Date(post.visit_date).toLocaleDateString('ko-KR', { weekday: 'short' });
  const isUrl = (() => {
    try { new URL(post.contact_method); return true; } catch { return false; }
  })();

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-6 pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/community/companions" className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400">
            ← 목록으로
          </Link>
        </div>

        <article className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
              post.status === '모집중'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : post.status === '마감'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            }`}>
              {post.status}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 break-words">{post.title}</h1>

          {/* 작성자 메타 */}
          <div className="flex items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {post.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.nickname}</span>
                  {author?.category && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {author.category}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatAbsoluteKr(post.created_at)}
                </div>
              </div>
            </div>
            {author?.blog_url && (
              <a
                href={author.blog_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
              >
                블로그
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
            {post.brand_name && (
              <>
                <dt className="text-slate-500 dark:text-slate-400">브랜드/매장</dt>
                <dd className="text-slate-700 dark:text-slate-200">{post.brand_name}</dd>
              </>
            )}
            <dt className="text-slate-500 dark:text-slate-400">지역</dt>
            <dd className="text-slate-700 dark:text-slate-200">{formatFullRegion(post.region, post.region_city)}</dd>
            <dt className="text-slate-500 dark:text-slate-400">방문 날짜</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {post.visit_date} ({dow}){post.visit_time_slot ? ` · ${post.visit_time_slot}` : ''}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">모집 인원</dt>
            <dd className="text-slate-700 dark:text-slate-200">{post.participants}명</dd>
          </dl>

          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">상세 내용</h2>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
              {post.message}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 rounded-lg">
            <h2 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">📞 연락 방법</h2>
            {isUrl ? (
              <a
                href={post.contact_method}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-600 dark:text-orange-300 hover:underline break-all"
              >
                {post.contact_method}
              </a>
            ) : (
              <p className="text-sm text-orange-700 dark:text-orange-300 break-words">{post.contact_method}</p>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {isMine ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">상태:</span>
                  <select
                    value={post.status}
                    onChange={(e) => onChangeStatus(e.target.value as CompanionStatus)}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {COMPANION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/community/companions/new?id=${post.id}`}
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
              </>
            ) : (
              <div className="ml-auto">
                <ReportButton targetType="companion_post" targetId={post.id} />
              </div>
            )}
          </div>
        </article>

        <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-400 space-y-1">
          <p className="font-medium">⚠️ 안전 안내</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>처음 보는 분과의 동행은 공공장소에서 시작하는 것을 권장합니다.</li>
            <li>이상한 결제 유도나 개인정보 요구가 있다면 즉시 차단해주세요.</li>
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="이 모집글을 삭제할까요?"
        description="삭제한 글은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

