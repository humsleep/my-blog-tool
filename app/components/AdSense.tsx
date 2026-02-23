'use client';

import { useEffect } from 'react';

interface AdSenseProps {
  className?: string;
  size?: 'banner' | 'sidebar' | 'square';
  adSlot?: string;
}

// 구글 애드센스 타입 선언
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSense({ className = '', size = 'banner', adSlot }: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // 구글 애드센스 광고 ID
  const AD_CLIENT = 'ca-pub-4073994600346533';
  
  // 크기별 광고 슬롯 설정 (실제 광고 단위 ID는 구글 애드센스에서 생성 후 사용)
  // 여기서는 기본 형식만 제공하고, 실제 광고 단위 ID는 구글 애드센스에서 생성한 후 교체해야 합니다
  const defaultAdSlot = adSlot || '';

  // 크기별 스타일 클래스
  const sizeClasses = {
    banner: 'w-full min-h-[90px] sm:min-h-[250px]',
    sidebar: 'w-full min-h-[250px] sm:min-h-[600px]',
    square: 'w-full aspect-square min-h-[250px]',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={defaultAdSlot}
        data-ad-format={size === 'banner' ? 'auto' : size === 'sidebar' ? 'vertical' : 'rectangle'}
        data-full-width-responsive={size === 'banner' ? 'true' : 'false'}
      />
    </div>
  );
}

