interface NicknameBadgeProps {
  nickname: string;
  blogUrl?: string | null;
  size?: 'sm' | 'md';
}

export default function NicknameBadge({ nickname, blogUrl, size = 'md' }: NicknameBadgeProps) {
  const textCls = size === 'sm' ? 'text-xs' : 'text-sm';

  if (!blogUrl) {
    return <span className={`${textCls} font-medium text-slate-700 dark:text-slate-300`}>{nickname}</span>;
  }
  return (
    <a
      href={blogUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${textCls} font-medium text-orange-500 dark:text-orange-400 hover:underline inline-flex items-center gap-1`}
    >
      {nickname}
      <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
  );
}
