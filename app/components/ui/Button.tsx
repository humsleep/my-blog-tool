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

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

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
  { variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, className, children, ...rest },
  ref
) {
  return (
    <button ref={ref} className={getClasses(variant, size, fullWidth, className)} {...rest}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
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
