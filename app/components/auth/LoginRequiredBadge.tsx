'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  /** 칩에 표시할 라벨 (기본 "로그인") */
  label?: string;
  /** 호버 시 보일 안내 문구 */
  tooltip?: string;
  /** 작은 사이즈 (인라인 칩) vs 보통 */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * 🔒 로그인 필요 인라인 배지.
 *
 * 비로그인 사용자에게 "이 기능은 로그인이 필요해요" 알리는 칩.
 * 호버 시 툴팁 안내 + 클릭하면 /login 으로 이동(현재 경로 redirect 파라미터).
 */
export default function LoginRequiredBadge({
  label = '로그인',
  tooltip = '구글 계정으로 1초 로그인하면 사용할 수 있어요',
  size = 'sm',
  className = '',
}: Props) {
  const pathname = usePathname();
  const href = `/login?next=${encodeURIComponent(pathname || '/')}`;

  const sizeCls =
    size === 'md'
      ? 'px-3 py-1.5 text-sm gap-1.5'
      : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <Link
      href={href}
      title={tooltip}
      aria-label={tooltip}
      className={`group relative inline-flex items-center font-medium rounded-full border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#161618] text-zinc-600 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ${sizeCls} ${className}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      {label}
    </Link>
  );
}
