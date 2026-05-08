'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/lib/supabase/useUser';
import ReportModal from './ReportModal';
import type { ReportTarget } from '@/app/lib/community/reports';

interface ReportButtonProps {
  targetType: ReportTarget;
  targetId: number;
  /** 본인 글이면 신고 버튼 숨김 */
  hidden?: boolean;
  variant?: 'icon' | 'text';
  className?: string;
}

export default function ReportButton({
  targetType, targetId, hidden, variant = 'text', className,
}: ReportButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (hidden) return null;

  const onClick = () => {
    if (!user) {
      router.push('/login?next=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/'));
      return;
    }
    setOpen(true);
  };

  const baseCls = 'text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors';

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="신고하기"
        title="신고하기"
        className={className ?? (variant === 'icon'
          ? `inline-flex items-center justify-center w-7 h-7 rounded ${baseCls}`
          : `text-[11px] ${baseCls}`)}
      >
        {variant === 'icon' ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5a2 2 0 012-2h7l5 5h2a2 2 0 012 2v6a2 2 0 01-2 2H10l-2-2H5v5" />
          </svg>
        ) : (
          '🚩 신고'
        )}
      </button>
      <ReportModal
        open={open}
        targetType={targetType}
        targetId={targetId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
