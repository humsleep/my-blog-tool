'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { REGIONS, type CompanionStatus } from '@/app/lib/community/regions';
import EmptyState from '@/app/components/community/EmptyState';

interface CompanionPost {
  id: number;
  user_id: string;
  nickname: string;
  title: string;
  brand_name: string | null;
  region: string;
  visit_date: string;
  visit_time_slot: string | null;
  participants: number;
  status: CompanionStatus;
  message: string;
  created_at: string;
}

export default function CompanionsPage() {
  const [posts, setPosts] = useState<CompanionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [region, setRegion] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(true);

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
      const supabase = createClient();
      let q = supabase
        .from('companion_posts')
        .select('*')
        .order('visit_date', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100);
      if (region) q = q.eq('region', region);
      if (openOnly) q = q.eq('status', '모집중');
      const { data, error: fetchErr } = await q;
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
        setPosts([]);
      } else {
        setPosts((data as CompanionPost[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [region, openOnly]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/community" className="hover:text-indigo-600 dark:hover:text-indigo-400">커뮤니티</Link>
              <span>/</span>
              <span>체험단 동행해요</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">체험단 동행해요</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              체험단 선정 후 함께 갈 동행자를 찾아보세요.
            </p>
          </div>
          <Link
            href="/community/companions/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
          >
            + 모집글 작성
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">지역</label>
            <select
              value={region ?? ''}
              onChange={(e) => setRegion(e.target.value || null)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            모집중만 보기
          </label>
        </div>

        {loading && <p className="text-sm text-slate-500">불러오는 중...</p>}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <EmptyState
            title="아직 모집글이 없습니다."
            description="첫 모집글을 등록해 함께할 동행자를 찾아보세요."
            action={
              <Link href="/community/companions/new" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg">
                모집글 작성
              </Link>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">총 {posts.length}건</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => <CompanionCard key={post.id} post={post} />)}
            </div>
          </>
        )}

        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-400 space-y-1">
          <p className="font-medium">⚠️ 안전한 동행을 위한 안내</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>연락은 가급적 오픈채팅으로 진행해주세요. 전화번호나 카카오톡 ID를 직접 노출하지 마세요.</li>
            <li>처음 만나는 분과의 동행은 공공장소에서 시작하는 것을 권장합니다.</li>
            <li>이상한 요구나 결제 유도가 있다면 즉시 차단하고 신고해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CompanionCard({ post }: { post: CompanionPost }) {
  const dateStr = post.visit_date;
  const dow = new Date(dateStr).toLocaleDateString('ko-KR', { weekday: 'short' });

  return (
    <Link
      href={`/community/companions/${post.id}`}
      className="block bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
          post.status === '모집중'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : post.status === '마감'
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              : 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
        }`}>
          {post.status}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {post.nickname}
        </span>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">
        {post.title}
      </h3>
      {post.brand_name && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">📍 {post.brand_name}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          📍 {post.region}
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          📅 {dateStr} ({dow}){post.visit_time_slot ? ` · ${post.visit_time_slot}` : ''}
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          👥 {post.participants}명
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-wrap break-words">
        {post.message}
      </p>
    </Link>
  );
}

