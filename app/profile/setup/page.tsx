'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import {
  fetchMyProfile,
  validateNickname,
  validateBlogUrl,
  type Profile,
} from '@/app/lib/community/profile';
import { CATEGORIES } from '@/app/lib/community/categories';

export default function ProfileSetupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>}>
      <ProfileSetupPage />
    </Suspense>
  );
}

function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/community';

  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [existing, setExisting] = useState<Profile | null>(null);

  const [nickname, setNickname] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [category, setCategory] = useState<string>('');
  const [bio, setBio] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
      const profile = await fetchMyProfile();
      if (profile) {
        setExisting(profile);
        setNickname(profile.nickname);
        setBlogUrl(profile.blog_url ?? '');
        setCategory(profile.category ?? '');
        setBio(profile.bio ?? '');
      }
      setAuthChecked(true);
      setLoading(false);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const nickError = validateNickname(nickname);
    if (nickError) { setError(nickError); return; }
    const urlError = validateBlogUrl(blogUrl);
    if (urlError) { setError(urlError); return; }
    if (bio.length > 200) { setError('소개는 200자 이하로 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError('로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const payload = {
        user_id: auth.user.id,
        nickname: nickname.trim(),
        blog_url: blogUrl.trim() || null,
        category: category || null,
        bio: bio.trim() || null,
      };

      const { error: upsertError } = existing
        ? await supabase.from('profiles').update(payload).eq('user_id', auth.user.id)
        : await supabase.from('profiles').insert(payload);

      if (upsertError) {
        if (upsertError.code === '23505') {
          setError('이미 사용 중인 닉네임입니다.');
        } else if (upsertError.message.includes('24시간')) {
          setError(upsertError.message);
        } else {
          setError(upsertError.message || '프로필 저장에 실패했습니다.');
        }
        return;
      }

      setInfo('프로필이 저장되었습니다.');
      setTimeout(() => router.push(next), 600);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 dark:text-slate-400">
        불러오는 중...
      </div>
    );
  }

  if (authChecked && !authed) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">로그인이 필요합니다</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              프로필을 등록하려면 먼저 로그인해주세요.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent('/profile/setup?next=' + next)}`}
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
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {existing ? '프로필 수정' : '커뮤니티 프로필 등록'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            커뮤니티 게시글에 표시될 닉네임과 블로그 정보를 입력하세요.
            {!existing && ' 한 번만 등록하면 모든 커뮤니티에서 사용됩니다.'}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-5"
        >
          <Field label="닉네임" required help="2~16자 · 한글/영문/숫자/_/- · 24시간 1회 변경">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="블로거A"
              className={fieldCls}
              required
            />
          </Field>

          <Field label="블로그 주소" help="네이버, 티스토리 등 본인 블로그 메인 URL (선택)">
            <input
              type="url"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              maxLength={300}
              placeholder="https://blog.naver.com/..."
              className={fieldCls}
            />
          </Field>

          <Field label="주 활동 분야" help="가장 많이 다루는 분야 (선택)">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldCls}
            >
              <option value="">선택 안 함</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="소개" help={`${bio.length}/200자`}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="자기소개나 운영 중인 블로그를 간단히 소개해주세요."
              className={fieldCls}
            />
          </Field>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-emerald-700 dark:text-emerald-400">
              {info}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href={next}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? '저장 중...' : existing ? '수정 저장' : '프로필 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldCls =
  'w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500';

function Field({
  label, required, help, children,
}: {
  label: string; required?: boolean; help?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{help}</p>}
    </div>
  );
}
