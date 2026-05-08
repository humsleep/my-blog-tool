'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import EmptyStateLogin from '@/app/components/auth/EmptyStateLogin';

type State =
  | { kind: 'loading' }
  | { kind: 'anon' }
  | { kind: 'empty' }
  | { kind: 'list'; keywords: string[] };

/**
 * 데일리 대시보드 — 즐겨찾기 키워드 칩 카드.
 *
 *   - 비로그인:   "로그인하면 즐겨찾기 5개 저장 가능" EmptyStateLogin 카드
 *   - 로그인 + 비어있음: "키워드 분석에서 ★ 눌러 모으세요" 안내
 *   - 로그인 + 키워드 있음: 칩 그리드
 */
export default function SavedKeywordsCard() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ kind: 'anon' });
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (!cancelled) setState({ kind: 'anon' });
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('saved_keywords')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (!cancelled) {
        const saved = (data as { saved_keywords?: string[] } | null)?.saved_keywords ?? [];
        setState(saved.length === 0 ? { kind: 'empty' } : { kind: 'list', keywords: saved });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <section className="rounded-md border border-stone-200 dark:border-[#2a322d] bg-white dark:bg-[#161b18] p-5">
        <div className="h-4 w-24 bg-stone-100 dark:bg-[#1d2320] rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-stone-100 dark:bg-[#1d2320] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (state.kind === 'anon') {
    return (
      <EmptyStateLogin
        title="로그인하면 즐겨찾기 키워드를 저장할 수 있어요"
        description="키워드 분석에서 발견한 황금 키워드 10개를 저장하고, 아침마다 검색량 변동을 한눈에 볼 수 있어요."
      />
    );
  }

  if (state.kind === 'empty') {
    return (
      <section className="rounded-md border border-stone-200 dark:border-[#2a322d] bg-white dark:bg-[#161b18] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-stone-500">
            즐겨찾기 키워드
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
          키워드 분석에서 ★를 누르면 여기에 모입니다. 아침마다 검색량 변동을 한눈에.
        </p>
        <Link href="/keyword-analysis" className="btn-base btn-secondary btn-sm">
          키워드 분석으로 가기
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-stone-200 dark:border-[#2a322d] bg-white dark:bg-[#161b18] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-stone-500">
          즐겨찾기 키워드
        </span>
        <Link href="/profile/setup" className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline">
          관리 →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {state.keywords.map((kw) => (
          <Link
            key={kw}
            href={`/keyword-analysis?keyword=${encodeURIComponent(kw)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-[#2a322d] bg-stone-50 dark:bg-[#1d2320] hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-sm font-medium text-stone-900 dark:text-stone-100 transition-colors"
          >
            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {kw}
          </Link>
        ))}
      </div>
    </section>
  );
}
