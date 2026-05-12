'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import { safeNextPath } from '../lib/security/safe-redirect';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const next = safeNextPath(searchParams.get('next'));
  const hasError = searchParams.get('error');
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (hasError === 'auth_failed') {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }, [hasError]);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(next);
      }
    });
  }, [configured, next, router]);

  const signInWithGoogle = async () => {
    if (!configured) return;
    if (!agreed) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 동의 시점 기록 — 로컬에 남겨 추후 분쟁 시 입증 자료로 활용
      try {
        localStorage.setItem(
          'bbl_consent',
          JSON.stringify({ termsV: 1, privacyV: 1, at: new Date().toISOString() }),
        );
      } catch {}

      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Boheme BlogLab 로그인
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              로그인하면 AI 글쓰기를 하루 5회 사용할 수 있고,<br />
              진단 점수·즐겨찾기 키워드가 자동 저장돼요
            </p>
          </div>

          <div className="px-8 pb-8">
            {!configured && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-400">
                <strong>환경변수 설정 필요:</strong> <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* 약관·개인정보 동의 체크박스 (PIPA 명시적 동의) */}
            <label className="flex items-start gap-2.5 mb-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-orange-500 w-4 h-4 flex-shrink-0"
                aria-label="약관 동의"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                만 14세 이상이며,{' '}
                <Link href="/terms" target="_blank" className="text-orange-600 dark:text-orange-400 underline hover:no-underline font-medium">
                  이용약관
                </Link>
                과{' '}
                <Link href="/privacy" target="_blank" className="text-orange-600 dark:text-orange-400 underline hover:no-underline font-medium">
                  개인정보처리방침
                </Link>
                에 동의합니다 (필수)
              </span>
            </label>

            <button
              onClick={signInWithGoogle}
              disabled={loading || !configured || !agreed}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-zinc-50 dark:bg-zinc-700 dark:hover:bg-zinc-600 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 font-medium text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? '이동 중...' : 'Google 계정으로 로그인'}
            </button>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                ← 메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
          로그인 시 이메일과 프로필 이름만 저장됩니다.<br />
          자세한 내용은{' '}
          <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">개인정보처리방침</Link>
          을 확인하세요.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400">로딩 중...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
