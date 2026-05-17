'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useToast } from '@/app/components/ui/Toast';
import { useBodyScrollLock } from '@/app/lib/useBodyScrollLock';
import {
  REPORT_REASONS,
  type ReportTarget,
  type ReportReasonCode,
} from '@/app/lib/community/reports';

interface ReportModalProps {
  open: boolean;
  targetType: ReportTarget;
  targetId: number;
  onClose: () => void;
}

export default function ReportModal({ open, targetType, targetId, onClose }: ReportModalProps) {
  const { toast } = useToast();
  const [reasonCode, setReasonCode] = useState<ReportReasonCode>('spam');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReasonCode('spam');
      setDetail('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useBodyScrollLock(open);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = detail.trim();
    if (trimmed.length > 500) { setError('상세 사유는 500자 이하로 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError('로그인이 필요합니다.');
        return;
      }
      const { error: insErr } = await supabase.from('reports').insert({
        reporter_id: auth.user.id,
        target_type: targetType,
        target_id: targetId,
        reason_code: reasonCode,
        detail: trimmed || null,
      });
      if (insErr) {
        let msg: string;
        if (insErr.code === '23505') {
          msg = '이미 이 글을 신고하셨습니다.';
        } else if (insErr.code === '42501' || insErr.message?.includes('row-level security')) {
          msg = '신고 한도를 초과했습니다 (분당 5건). 잠시 후 다시 시도해주세요.';
        } else {
          msg = insErr.message || '신고에 실패했습니다.';
        }
        setError(msg);
        return;
      }
      toast('신고가 접수되었습니다. 검토 후 조치됩니다.', 'success');
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
        aria-labelledby="report-modal-title"
        onSubmit={onSubmit}
        className="bg-white dark:bg-zinc-800 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="report-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">게시글 신고</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            신고 5건 누적 시 자동 숨김 처리되며, 운영자가 검토 후 추가 조치합니다.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            사유 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.code}
                className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                  reasonCode === r.code
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="reasonCode"
                  value={r.code}
                  checked={reasonCode === r.code}
                  onChange={() => setReasonCode(r.code)}
                  className="mt-0.5 accent-orange-500"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.label}</div>
                  {r.help && <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{r.help}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            상세 설명 <span className="text-[11px] font-normal text-zinc-500">{detail.length}/500 (선택)</span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="구체적인 상황을 설명해주시면 처리에 도움이 됩니다."
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
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
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {submitting ? '신고 중...' : '신고하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
