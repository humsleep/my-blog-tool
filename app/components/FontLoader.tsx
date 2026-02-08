'use client';

import { useEffect } from 'react';

export default function FontLoader() {
  useEffect(() => {
    // 이미 로드되어 있는지 확인
    const existingLink = document.querySelector(
      'link[href*="pretendard"]'
    );
    if (existingLink) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, []);

  return null;
}

