'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps & {
  /** 작업 진행 중: 스피너 표시 + 클릭 비활성화 + aria-busy. */
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function Spinner() {
  return (
    <svg
      className="btn-spinner"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

interface LinkButtonProps extends CommonProps {
  href: string;
  external?: boolean;
  onClick?: () => void;
}

function getClasses(variant: Variant = 'primary', size: Size = 'md', fullWidth?: boolean, extra?: string) {
  return [
    'btn-base',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'w-full' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, className, children, loading, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={getClasses(variant, size, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});

export function LinkButton({
  href,
  external,
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  onClick,
}: LinkButtonProps) {
  const cls = getClasses(variant, size, fullWidth, className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  );
}
