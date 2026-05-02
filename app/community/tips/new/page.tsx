'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import { TIPS_CATEGORIES, type TipsCategory } from '@/app/lib/community/tips';
import { markdownToHtml } from '@/app/lib/format/article-formats';

export default function TipsNewPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>}>
      <TipsNewPage />
    </Suspense>
  );
}

function TipsNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [category, setCategory] = useState<TipsCategory>('정보공유');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      setAuthed(true);
      const me = await fetchMyProfile();
      if (!me) {
        router.replace('/profile/setup?next=' + encodeURIComponent('/community/tips/new'));
        return;
      }
      setProfile(me);

      if (editId) {
        const { data } = await supabase
          .from('tips_posts')
          .select('*')
          .eq('id', editId)
          .maybeSingle();
        if (data && data.user_id === auth.user.id) {
          setCategory(data.category as TipsCategory);
          setTitle(data.title);
          setBody(data.body);
        } else if (data) {
          setError('본인 글만 수정할 수 있습니다.');
        }
      }

      setAuthChecked(true);
      setLoading(false);
    })();
  }, [editId, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const b = body.trim();
    if (t.length < 2 || t.length > 80) { setError('제목은 2~80자로 입력해주세요.'); return; }
    if (b.length === 0) { setError('본문을 입력해주세요.'); return; }
    if (b.length > 10000) { setError('본문은 10,000자를 초과할 수 없습니다.'); return; }
    if (!profile) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      if (editId) {
        const { error: updErr } = await supabase
          .from('tips_posts')
          .update({ category, title: t, body: b, nickname: profile.nickname })
          .eq('id', editId)
          .eq('user_id', profile.user_id);
        if (updErr) {
          console.error('tips update failed:', updErr);
          setError(updErr.message);
          alert('수정 실패: ' + updErr.message);
          return;
        }
        router.refresh();
        router.push(`/community/tips/${editId}`);
      } else {
        const { data, error: insErr } = await supabase
          .from('tips_posts')
          .insert({
            user_id: profile.user_id,
            nickname: profile.nickname,
            category,
            title: t,
            body: b,
          })
          .select('id')
          .single();
        if (insErr) {
          console.error('tips insert failed:', insErr);
          setError(insErr.message);
          alert('작성 실패: ' + insErr.message);
          return;
        }
        if (!data) {
          const msg = '서버에서 글 ID를 반환하지 않았습니다. RLS 정책을 확인해주세요.';
          setError(msg);
          alert(msg);
          return;
        }
        router.refresh();
        router.push(`/community/tips/${data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>;
  }

  if (authChecked && !authed) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">로그인이 필요합니다</h1>
            <Link
              href={`/login?next=${encodeURIComponent('/community/tips/new')}`}
              className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/community/tips" className="hover:text-orange-500 dark:hover:text-orange-400">정보 공유</Link>
            <span>/</span>
            <span>{editId ? '글 수정' : '글쓰기'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{editId ? '글 수정' : '새 글 작성'}</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TipsCategory)}
              className={fieldCls}
              required
            >
              {TIPS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              제목 <span className="ml-2 text-[11px] font-normal text-slate-500">{title.length}/80</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="제목을 입력하세요"
              className={fieldCls}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                본문 <span className="ml-2 text-[11px] font-normal text-slate-500">{body.length}/10000 · 마크다운 지원</span>
              </label>
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="text-xs font-medium text-orange-500 dark:text-orange-400 hover:underline"
              >
                {preview ? '편집 보기' : '미리보기'}
              </button>
            </div>
            {preview ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[280px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(body || '_미리볼 내용이 없습니다._') }}
              />
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={10000}
                rows={14}
                placeholder={'## 소제목\n\n본문에 ##(소제목), **굵게**, *기울임*, `코드`, 목록(- ) 등 마크다운을 사용할 수 있습니다.'}
                className={fieldCls + ' font-mono text-[13px]'}
                required
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/community/tips"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? '저장 중...' : editId ? '수정 저장' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldCls =
  'w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500';
