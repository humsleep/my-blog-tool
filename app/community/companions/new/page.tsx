'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/app/lib/supabase/client';
import { fetchMyProfile, type Profile } from '@/app/lib/community/profile';
import { REGIONS, getCities, TIME_SLOTS, type TimeSlot } from '@/app/lib/community/regions';

export default function CompanionNewPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>}>
      <CompanionNewPage />
    </Suspense>
  );
}

function CompanionNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [region, setRegion] = useState<string>('서울');
  const [regionCity, setRegionCity] = useState<string>('');
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>('');
  const [participants, setParticipants] = useState(1);
  const [contactMethod, setContactMethod] = useState('');
  const [message, setMessage] = useState('');

  // 시·도가 바뀌면 시·군 초기화 (해당 시·도에 없는 값일 수 있음)
  useEffect(() => {
    const cities = getCities(region);
    if (cities.length === 0) {
      setRegionCity('');
    } else if (regionCity && !cities.includes(regionCity)) {
      setRegionCity('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

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
        router.replace('/profile/setup?next=' + encodeURIComponent('/community/companions/new'));
        return;
      }
      setProfile(me);

      if (editId) {
        const { data } = await supabase
          .from('companion_posts')
          .select('*')
          .eq('id', editId)
          .maybeSingle();
        if (data && data.user_id === auth.user.id) {
          setTitle(data.title);
          setBrandName(data.brand_name ?? '');
          setRegion(data.region);
          setRegionCity(data.region_city ?? '');
          setVisitDate(data.visit_date);
          setTimeSlot((data.visit_time_slot ?? '') as TimeSlot | '');
          setParticipants(data.participants);
          setContactMethod(data.contact_method);
          setMessage(data.message);
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
    if (!profile) return;

    const t = title.trim();
    if (t.length < 2 || t.length > 60) { setError('제목은 2~60자로 입력해주세요.'); return; }
    if (!visitDate) { setError('방문 날짜를 선택해주세요.'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(visitDate) < today) { setError('방문 날짜는 오늘 이후여야 합니다.'); return; }
    const c = contactMethod.trim();
    if (!c) { setError('연락 방법을 입력해주세요.'); return; }
    if (c.length > 200) { setError('연락 방법은 200자 이하로 입력해주세요.'); return; }
    const m = message.trim();
    if (!m) { setError('상세 내용을 입력해주세요.'); return; }
    if (m.length > 2000) { setError('상세 내용은 2,000자 이하로 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const payload = {
        nickname: profile.nickname,
        title: t,
        brand_name: brandName.trim() || null,
        region,
        region_city: regionCity.trim() || null,
        visit_date: visitDate,
        visit_time_slot: timeSlot || null,
        participants,
        contact_method: c,
        message: m,
      };

      if (editId) {
        const { error: updErr } = await supabase
          .from('companion_posts')
          .update(payload)
          .eq('id', editId)
          .eq('user_id', profile.user_id);
        if (updErr) {
          console.error('companion update failed:', updErr);
          setError(updErr.message);
          alert('수정 실패: ' + updErr.message);
          return;
        }
        router.refresh();
        router.push(`/community/companions/${editId}`);
      } else {
        const { data, error: insErr } = await supabase
          .from('companion_posts')
          .insert({ ...payload, user_id: profile.user_id })
          .select('id')
          .single();
        if (insErr) {
          console.error('companion insert failed:', insErr);
          let msg: string;
          if (insErr.code === '42501' || insErr.message?.includes('row-level security')) {
            msg = '하루 모집글 작성 한도(3건)를 초과했거나 방문 날짜가 과거입니다.';
          } else {
            msg = insErr.message || '작성에 실패했습니다.';
          }
          setError(msg);
          alert('작성 실패: ' + msg);
          return;
        }
        if (!data) {
          const msg = '서버에서 글 ID를 반환하지 않았습니다. RLS 정책을 확인해주세요.';
          setError(msg);
          alert(msg);
          return;
        }
        // 새 모집글 — 목록으로 이동 (방금 등록한 글이 임박순으로 노출)
        router.refresh();
        router.push('/community/companions');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">불러오는 중...</div>;

  if (authChecked && !authed) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">로그인이 필요합니다</h1>
            <Link
              href={`/login?next=${encodeURIComponent('/community/companions/new')}`}
              className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/community/companions" className="hover:text-orange-500 dark:hover:text-orange-400">체험단 동행해요</Link>
            <span>/</span>
            <span>{editId ? '글 수정' : '모집글 작성'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{editId ? '모집글 수정' : '동행자 모집'}</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <Field label="제목" required help="예: 강남 OO 카페 체험단 같이 가실 분 구해요">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={fieldCls} required />
          </Field>

          <Field label="브랜드/매장명" help="선택 사항 — 체험단 대상 브랜드/매장 (예: 스타벅스 강남점)">
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} maxLength={80} className={fieldCls} />
          </Field>

          <Field label="지역" required help="시·도 선택 후 시·군·구를 추가로 선택하세요">
            <div className="grid grid-cols-2 gap-2">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={fieldCls} required>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={regionCity}
                onChange={(e) => setRegionCity(e.target.value)}
                className={fieldCls}
                disabled={getCities(region).length === 0}
              >
                <option value="">{getCities(region).length === 0 ? '세부 지역 없음' : '세부 지역 (선택)'}</option>
                {getCities(region).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="모집 인원" required>
            <input
              type="number"
              value={participants}
              onChange={(e) => setParticipants(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              min={1} max={10}
              className={fieldCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="방문 날짜" required>
              <input type="date" value={visitDate} min={today} onChange={(e) => setVisitDate(e.target.value)} className={fieldCls} required />
            </Field>
            <Field label="시간대">
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot | '')} className={fieldCls}>
                <option value="">선택 안 함</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field
            label="연락 방법"
            required
            help="오픈채팅 URL 권장 · 전화번호/카카오톡 ID 직접 노출은 권장하지 않습니다"
          >
            <input
              type="text"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              maxLength={200}
              placeholder="예: 오픈카톡 https://open.kakao.com/o/..."
              className={fieldCls}
              required
            />
          </Field>

          <Field
            label="상세 내용"
            required
            help={`${message.length}/2000자 — 어떤 분과 함께 가고 싶으신지 자유롭게 적어주세요.`}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="체험단 정보, 원하는 동행자 스타일, 만남 장소 등을 자유롭게 적어주세요."
              className={fieldCls}
              required
            />
          </Field>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/community/companions" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">취소</Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? '저장 중...' : editId ? '수정 저장' : '모집글 등록'}
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
