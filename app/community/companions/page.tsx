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

  const fetchPosts = async (silent: boolean) => {
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
    if (fetchErr) {
      console.error('companion fetch failed:', fetchErr);
      if (!silent) { setError(fetchErr.message); setPosts([]); }
      return;
    }
    setPosts((data as CompanionPost[]) ?? []);
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
      if (cancelled) return;
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, openOnly]);

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
  }, [region, openOnly]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/community" className="hover:text-orange-500 dark:hover:text-orange-400">커뮤니티</Link>
            <span>›</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">체험단 동행해요</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">🚶‍♂️ 체험단 동행해요</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                체험단 선정 후 함께 갈 동행자를 찾아보세요
              </p>
            </div>
            <Link
              href="/community/companions/new"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all"
            >
              + 모집글 작성
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm mb-4">
          <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto scrollbar-hide">
            <label className="flex-shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">지역</label>
            <select
              value={region ?? ''}
              onChange={(e) => setRegion(e.target.value || null)}
              className="flex-shrink-0 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">전체</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="flex-shrink-0 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer pl-3 ml-auto sm:ml-0 border-l sm:border-l-0 border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 accent-orange-500"
              />
              모집중만
            </label>
          </div>
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
              <Link href="/community/companions/new" className="inline-flex px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg">
                모집글 작성
              </Link>
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">총 {posts.length}건</p>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="hidden md:grid grid-cols-[72px_1fr_80px_140px_120px_100px] gap-3 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>상태</span>
                <span>제목</span>
                <span>지역</span>
                <span>방문일</span>
                <span>작성자</span>
                <span>작성일</span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {posts.map((post) => <CompanionRow key={post.id} post={post} />)}
              </ul>
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

function CompanionRow({ post }: { post: CompanionPost }) {
  const dateStr = post.visit_date;
  const dow = new Date(dateStr).toLocaleDateString('ko-KR', { weekday: 'short' });
  const statusCls =
    post.status === '모집중'
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
      : post.status === '마감'
        ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
  const created = formatRelativeKr(post.created_at);

  return (
    <li className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
      <Link href={`/community/companions/${post.id}`} className="block">
        {/* 데스크톱 — 그리드 행 */}
        <div className="hidden md:grid grid-cols-[72px_1fr_80px_140px_120px_100px] gap-3 items-center px-5 py-3">
          <span className={`justify-self-start px-2 py-0.5 text-[11px] font-semibold rounded-full ${statusCls}`}>
            {post.status}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{post.title}</p>
            {post.brand_name && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">📍 {post.brand_name}</p>
            )}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">{post.region}</span>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {dateStr} ({dow})
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{post.nickname}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{created}</span>
        </div>

        {/* 모바일 — 컴팩트 */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-start gap-2 mb-1.5">
            <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${statusCls}`}>
              {post.status}
            </span>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
              {post.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
            <span>📍 {post.region}</span>
            <span>·</span>
            <span>📅 {dateStr}</span>
            <span>·</span>
            <span>{post.nickname}</span>
            <span>·</span>
            <span>{created}</span>
          </div>
        </div>
      </Link>
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

