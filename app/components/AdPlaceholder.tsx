interface AdPlaceholderProps {
  className?: string;
  size?: 'banner' | 'sidebar' | 'square';
}

export default function AdPlaceholder({ className = '', size = 'banner' }: AdPlaceholderProps) {
  const sizeClasses = {
    banner: 'w-full h-24',
    sidebar: 'w-full h-96',
    square: 'w-full aspect-square',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center`}
    >
      <div className="text-center text-gray-400">
        <svg
          className="mx-auto h-8 w-8 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-xs font-medium">광고 영역</p>
      </div>
    </div>
  );
}

