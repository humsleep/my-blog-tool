'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { CATEGORIES } from '@/app/lib/community/categories';
import { validateBlogUrl, type Profile } from '@/app/lib/community/profile';

export interface SwapDraft {
  id?: number;
  blog_url: string;
  category: string;
  message: string;
}

interface SwapModalProps {
  open: boolean;
  profile: Profile;
  initial: SwapDraft | null;     // null이면 신규 작성
  onClose: () => void;
  onSaved: () => void;
}

export default function SwapModal({ open, profile, initial, onClose, onSaved }: SwapModalProps) {
  const isEdit = Boolean(initial?.id);
  const [blogUrl, setBlogUrl] = useState(initial?.blog_url ?? profile.blog_url ?? '');
  const [category, setCategory] = useState(initial?.category ?? profile.category ?? '일상');
  const [message, setMessage] = useState(initial?.message ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBlogUrl(initial?.blog_url ?? profile.blog_url ?? '');
      setCategory(initial?.category ?? profile.category ?? '일상');
      setMessage(initial?.message ?? '');
      setError(null);
    }
  }, [open, initial, profile]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = blogUrl.trim();
    if (!trimmedUrl) { setError('블로그 주소를 입력해주세요.'); return; }
    const urlError = validateBlogUrl(trimmedUrl);
    if (urlError) { setError(urlError); return; }

    const trimmedMsg = message.trim();
    if (!trimmedMsg) { setError('한마디를 입력해주세요.'); return; }
    if (trimmedMsg.length > 200) { setError('한마디는 200자 이하로 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      if (isEdit && initial?.id) {
        const { error: updateError } = await supabase
          .from('swap_posts')
          .update({
            blog_url: trimmedUrl,
            category,
            message: trimmedMsg,
            nickname: profile.nickname,
          })
          .eq('id', initial.id)
          .eq('user_id', profile.user_id);
        if (updateError) {
          console.error('swap update failed:', updateError);
          const msg = updateError.message || '수정에 실패했습니다.';
          setError(msg);
          // inline error UI 가 이미 같은 메시지를 표시하므로 alert 중복 제거
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('swap_posts')
          .insert({
            user_id: profile.user_id,
            nickname: profile.nickname,
            blog_url: trimmedUrl,
            category,
            message: trimmedMsg,
          });
        if (insertError) {
          console.error('swap insert failed:', insertError);
          let msg: string;
          if (insertError.code === '42501' || insertError.message?.includes('row-level security')) {
            msg = '하루에 한 번만 작성할 수 있습니다. 24시간 후 다시 시도해주세요.';
          } else if (insertError.code === '42P01') {
            msg = 'swap_posts 테이블이 없습니다. Supabase에서 마이그레이션 0004를 실행해주세요.';
          } else {
            msg = insertError.message || '작성에 실패했습니다.';
          }
          setError(msg);
          // inline error UI 가 같은 메시지를 표시하므로 alert 중복 제거
          return;
        }
      }
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-modal-title"
        aria-describedby={error ? 'swap-modal-error' : undefined}
        onSubmit={onSubmit}
        className="bg-white dark:bg-zinc-800 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="swap-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {isEdit ? '서이추 글 수정' : '서이추 글 작성'}
        </h3>
        {!isEdit && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            하루 1회만 작성할 수 있어요. 작성 후 본인이 직접 언제든 수정·삭제할 수 있습니다.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            닉네임
          </label>
          <div className="px-3 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300">
            {profile.nickname}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            프로필 닉네임이 자동으로 사용됩니다.{' '}
            <a
              href="/profile/setup"
              className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              프로필에서 변경 →
            </a>{' '}
            (24시간 1회)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            블로그 주소 <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            maxLength={300}
            placeholder="https://blog.naver.com/..."
            className={fieldCls}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            분야 <span className="text-red-500">*</span>
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldCls} required>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            한마디 <span className="text-red-500" aria-hidden>*</span>
            <span aria-live="polite" className="ml-2 text-[11px] font-normal text-zinc-500">
              {message.length}/200
            </span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="어떤 분과 서이추하고 싶으신가요? 자유롭게 적어주세요."
            className={fieldCls}
            aria-required="true"
            required
          />
        </div>

        {error && (
          <div
            id="swap-modal-error"
            role="alert"
            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {submitting ? '저장 중...' : isEdit ? '수정 저장' : '작성 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldCls =
  'w-full px-3 py-2.5 text-base sm:text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500';
