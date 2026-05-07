'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PostImageProps {
  src: string;
  alt: string;
}

export default function PostImage({ src, alt }: PostImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-paper-deep">
        {/* Editorial placeholder — large numeral as masthead glyph */}
        <span className="font-display italic text-6xl text-ink-faint">№</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={() => setImageError(true)}
    />
  );
}

