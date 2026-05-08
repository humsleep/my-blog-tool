'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
  /** 큰 제목. 예: "로그인하면 즐겨찾기 5개를 저장할 수 있어요" */
  title: string;
  /** 부가 설명 (선택) */
  description?: ReactNode;
  /** 자물쇠 대신 다른 아이콘이 어울리면 교체 */
  icon?: ReactNode;
  className?: string;
}

/**
 * 로그인이 필요한 빈 상태 카드.
 * 즐겨찾기 카드, 진단 이력 카드, 작성 페이지 등에서
 * "로그인하면 ___ 할 수 있어요" 후크 + 큰 [구글 로그인] 버튼.
 */
export default function EmptyStateLogin({ title, description, icon, className = '' }: Props) {
  const pathname = usePathname();
  const href = `/login?next=${encodeURIComponent(pathname || '/')}`;

  return (
    <div className={`rounded-md border border-dashed border-zinc-300 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#161618]/50 p-6 sm:p-8 text-center ${className}`}>
      <div className="mx-auto w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/40 ring-1 ring-orange-100 dark:ring-orange-900/40 flex items-center justify-center mb-4 text-orange-700 dark:text-orange-300">
        {icon ?? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      <Link href={href} className="btn-base btn-primary btn-sm inline-flex">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".9" />
        </svg>
        구글 계정으로 1초 로그인
      </Link>
    </div>
  );
}
