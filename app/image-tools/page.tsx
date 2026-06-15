'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FlowNav from '../components/FlowNav';
import { useToast } from '../components/ui/Toast';

const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor').then((mod) => mod.default),
  { ssr: false },
);

export default function ImageToolsPage() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorTabs, setEditorTabs] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState('edited-image');

  useEffect(() => {
    import('react-filerobot-image-editor').then((mod) => {
      const T = mod.TABS as Record<string, string>;
      setEditorTabs([T.ADJUST, T.FINETUNE, T.FILTERS, T.ANNOTATE, T.WATERMARK, T.RESIZE]);
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('pendingImage');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { dataUrl?: string };
      if (parsed?.dataUrl) {
        setImageUrl(parsed.dataUrl);
      }
    } catch {
      // ignore
    } finally {
      sessionStorage.removeItem('pendingImage');
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('이미지 파일만 업로드 가능합니다.', 'error');
      return;
    }
    setFileName(file.name.replace(/\.[^/.]+$/, '') || 'edited-image');
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileSelect(file);
          }
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  const handleSave = useCallback((editedImageObject: { imageBase64?: string; fullName?: string }) => {
    if (!editedImageObject.imageBase64) return;
    const link = document.createElement('a');
    link.download = editedImageObject.fullName || `${fileName}.png`;
    link.href = editedImageObject.imageBase64;
    link.click();
    toast('이미지가 다운로드되었습니다.', 'success');
  }, [fileName, toast]);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">이미지 편집</h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1.5">
              크롭·필터·텍스트·드로잉·워터마크 — 블로그 이미지를 한 곳에서 편집하세요
            </p>
          </div>
          <Link
            href="/image-search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            무료 이미지 검색
          </Link>
        </div>

        {!imageUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-16 text-center hover:border-orange-500 dark:hover:border-orange-400 transition-colors cursor-pointer"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              };
              input.click();
            }}
          >
            <svg className="mx-auto h-14 w-14 text-zinc-400 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2 font-medium">이미지를 드래그하거나 클릭해서 업로드</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">PNG, JPG, GIF, WebP 지원 · Ctrl+V로 붙여넣기 가능</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" style={{ height: '80vh', minHeight: 500 }}>
            {editorTabs && (
              <FilerobotImageEditor
                source={imageUrl}
                tabsIds={editorTabs as never}
                defaultTabId={editorTabs[0] as never}
                defaultToolId="Crop"
                savingPixelRatio={2}
                previewPixelRatio={2}
                onSave={handleSave}
                onClose={() => setImageUrl('')}
                closeAfterSave={false}
                Crop={{ presetsItems: [
                  { titleKey: '1:1', ratio: 1 },
                  { titleKey: '16:9', ratio: 16 / 9 },
                  { titleKey: '9:16', ratio: 9 / 16 },
                  { titleKey: '4:3', ratio: 4 / 3 },
                  { titleKey: '3:4', ratio: 3 / 4 },
                ] }}
                Text={{ text: '텍스트 입력' }}
                Pen={{ tension: 0.3 }}
                Watermark={{ hideTextWatermark: false }}
              />
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          {imageUrl && (
            <button
              onClick={() => setImageUrl('')}
              className="btn-base btn-secondary btn-md"
            >
              새 이미지 업로드
            </button>
          )}
        </div>

        <FlowNav
          currentStep={8}
          totalSteps={8}
          stepLabel="이미지 편집"
          note="포스팅 준비가 거의 완료되었습니다. 다음 포스팅을 위해 새로운 키워드를 찾아보세요."
          actions={[
            {
              href: '/trending',
              label: '새로운 키워드 찾기',
              description: '인기 검색어로 다시 시작',
            },
            {
              href: '/keyword-analysis',
              label: '키워드 추가 분석',
              description: '직접 키워드 입력하기',
              variant: 'secondary',
            },
          ]}
        />
      </div>
    </div>
  );
}
