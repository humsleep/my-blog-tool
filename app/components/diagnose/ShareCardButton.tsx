'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/ui/Toast';

interface ShareCardButtonProps {
  total: number;
  band: 'top5' | 'top15' | 'top35' | 'mid' | 'growing';
  activity: number;
  visibility: number;
  quality: number;
  category?: string | null;
}

/**
 * 진단 결과를 1080×1920 PNG으로 다운로드/공유 — 인스타 스토리 공유용.
 *
 *  모바일 (Web Share API Level 2 + files 지원):
 *    → 시스템 공유 시트로 인스타·트위터·카톡 등 즉시 공유 가능
 *  데스크탑 또는 미지원 환경:
 *    → PNG 파일 다운로드 → 사용자가 직접 SNS 업로드
 *
 *  사용자의 자랑 욕구 + 친구·팔로워의 호기심 = 유기적 트래픽 확산.
 */
export default function ShareCardButton({
  total,
  band,
  activity,
  visibility,
  quality,
  category,
}: ShareCardButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const buildUrl = () => {
    const params = new URLSearchParams({
      total: String(total),
      band,
      activity: String(activity),
      visibility: String(visibility),
      quality: String(quality),
    });
    if (category) params.set('category', category);
    return `/api/share-card/diagnose?${params.toString()}`;
  };

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `bohemebloglab-${total}점.png`, { type: 'image/png' });

      // 모바일: 공유 시트로 → 인스타 스토리·트위터·카톡 바로 가능
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `내 블로그 진단 ${total}점`,
            text: `Boheme BlogLab — 30초 무료 진단`,
          });
          toast('공유 완료', 'success');
          return;
        } catch (e) {
          // 사용자가 공유 시트 취소한 경우는 에러 토스트 X
          if ((e as Error).name === 'AbortError') return;
          // 그 외는 다운로드로 fallback
        }
      }

      // Fallback: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('이미지 저장됨 — 인스타 스토리에 업로드 해보세요', 'success');
    } catch {
      toast('공유 카드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="btn-base btn-primary btn-md gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="진단 결과를 이미지로 공유"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>이미지 만드는 중…</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>📤 인스타에 공유하기</span>
        </>
      )}
    </button>
  );
}
