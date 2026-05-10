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
import { safeNextPath } from '@/app/lib/security/safe-redirect';

export default function ProfileSetupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-zinc-500">불러오는 중...</div>}>
      <ProfileSetupPage />
    </Suspense>
  );
}

function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'), '/community');

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

  // 즐겨찾기 키워드 (Phase 26: Navbar 드롭다운에서 이리로 이동)
  const [savedKeywords, setSavedKeywords] = useState<string[]>([]);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

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
      setSavedUserId(auth.user.id);
      const profile = await fetchMyProfile();
      if (profile) {
        setExisting(profile);
        setNickname(profile.nickname);
        setBlogUrl(profile.blog_url ?? '');
        setCategory(profile.category ?? '');
        setBio(profile.bio ?? '');
      }
      // 즐겨찾기 키워드 로드 — profile 테이블의 saved_keywords 컬럼
      const { data: kwData } = await supabase
        .from('profiles')
        .select('saved_keywords')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (kwData?.saved_keywords && Array.isArray(kwData.saved_keywords)) {
        setSavedKeywords(kwData.saved_keywords as string[]);
      }
      setAuthChecked(true);
      setLoading(false);
    })();
  }, []);

  const removeSavedKeyword = async (kw: string) => {
    if (!savedUserId) return;
    const next = savedKeywords.filter((k) => k !== kw);
    const prev = savedKeywords;
    setSavedKeywords(next);
    const supabase = createClient();
    const { error: e } = await supabase
      .from('profiles')
      .update({ saved_keywords: next })
      .eq('user_id', savedUserId);
    if (e) setSavedKeywords(prev);
  };

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
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        불러오는 중...
      </div>
    );
  }

  if (authChecked && !authed) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 text-center">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">로그인이 필요합니다</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              프로필을 등록하려면 먼저 로그인해주세요.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/profile/setup?next=${encodeURIComponent(next)}`)}`}
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
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {existing ? '프로필 수정' : '커뮤니티 프로필 등록'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            커뮤니티 게시글에 표시될 닉네임과 블로그 정보를 입력하세요.
            {!existing && ' 한 번만 등록하면 모든 커뮤니티에서 사용됩니다.'}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 sm:p-6 shadow-sm space-y-5"
        >
          <Field
            label="닉네임"
            required
            help={(() => {
              if (!existing?.nickname_changed_at) return '2~16자 · 한글/영문/숫자/_/- · 등록 후 24시간에 1회 변경 가능';
              const last = new Date(existing.nickname_changed_at);
              const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
              if (next <= new Date()) return '2~16자 · 한글/영문/숫자/_/- · 지금 변경 가능';
              const remainHours = Math.max(1, Math.ceil((next.getTime() - Date.now()) / 3_600_000));
              return `2~16자 · 한글/영문/숫자/_/- · 다음 변경 가능: 약 ${remainHours}시간 후`;
            })()}
          >
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
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-400">
              {info}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href={next}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
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

        {/* ── 즐겨찾기 키워드 (키워드분석 페이지에서 저장한 항목 노출) ── */}
        <section className="mt-6 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 sm:p-6 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">즐겨찾기 키워드</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{savedKeywords.length} / 10</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            <Link href="/keyword-analysis" className="text-orange-500 dark:text-orange-400 hover:underline font-medium">키워드 분석</Link>
            {' '}페이지에서 자주 검색하는 키워드를 저장해두면 여기서 한눈에 확인하고 다시 분석할 수 있습니다.
          </p>

          {savedKeywords.length === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
              아직 저장된 키워드가 없습니다.
              <div className="mt-2">
                <Link href="/keyword-analysis" className="text-orange-500 dark:text-orange-400 hover:underline text-xs font-medium">
                  키워드 분석으로 가기 →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {savedKeywords.map((kw) => (
                <div
                  key={kw}
                  className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 group"
                >
                  <Link
                    href={`/keyword-analysis?keyword=${encodeURIComponent(kw)}`}
                    className="text-xs font-medium text-orange-700 dark:text-orange-300 hover:underline"
                    title="이 키워드로 분석하기"
                  >
                    {kw}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSavedKeyword(kw)}
                    className="w-4 h-4 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900 text-orange-500 dark:text-orange-400 text-xs leading-none"
                    title="삭제"
                    aria-label={`${kw} 삭제`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const fieldCls =
  'w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500';

function Field({
  label, required, help, children,
}: {
  label: string; required?: boolean; help?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{help}</p>}
    </div>
  );
}
