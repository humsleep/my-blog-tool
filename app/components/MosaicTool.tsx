'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

type ToolMode = 'mosaic' | 'blur';

interface Region {
  x: number; y: number; w: number; h: number;
  tool: ToolMode;
  size: number;
}

interface Props {
  imageUrl: string;
  onOpenEditor: (dataUrl: string) => void;
  onSave: (dataUrl: string) => void;
  onBack: () => void;
}

function pixelate(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, bs: number) {
  const x = Math.max(0, Math.round(rx));
  const y = Math.max(0, Math.round(ry));
  const w = Math.min(Math.round(rw), ctx.canvas.width - x);
  const h = Math.min(Math.round(rh), ctx.canvas.height - y);
  if (w <= 0 || h <= 0) return;
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  for (let by = 0; by < h; by += bs) {
    for (let bx = 0; bx < w; bx += bs) {
      const sx = Math.min(bx + (bs >> 1), w - 1);
      const sy = Math.min(by + (bs >> 1), h - 1);
      const i = (sy * w + sx) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      const bxEnd = Math.min(bx + bs, w);
      const byEnd = Math.min(by + bs, h);
      for (let py = by; py < byEnd; py++) {
        for (let px = bx; px < bxEnd; px++) {
          const j = (py * w + px) * 4;
          d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(img, x, y);
}

function blur(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, radius: number) {
  const x = Math.max(0, Math.round(rx));
  const y = Math.max(0, Math.round(ry));
  const w = Math.min(Math.round(rw), ctx.canvas.width - x);
  const h = Math.min(Math.round(rh), ctx.canvas.height - y);
  if (w <= 0 || h <= 0) return;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tc = tmp.getContext('2d')!;
  tc.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);
  const blurred = document.createElement('canvas');
  blurred.width = w; blurred.height = h;
  const bc = blurred.getContext('2d')!;
  bc.filter = `blur(${radius}px)`;
  bc.drawImage(tmp, 0, 0);
  ctx.drawImage(blurred, x, y);
}

export default function MosaicTool({ imageUrl, onOpenEditor, onSave, onBack }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const fullRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<ImageData | null>(null);
  const scaleRef = useRef(1);

  const [tool, setTool] = useState<ToolMode>('mosaic');
  const [blockSize, setBlockSize] = useState(20);
  const [regions, setRegions] = useState<Region[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const syncDisplay = useCallback(() => {
    const full = fullRef.current;
    const disp = displayRef.current;
    if (!full || !disp) return;
    const dc = disp.getContext('2d')!;
    dc.clearRect(0, 0, disp.width, disp.height);
    dc.drawImage(full, 0, 0, disp.width, disp.height);
  }, []);

  const applyAllRegions = useCallback((regs: Region[]) => {
    const full = fullRef.current;
    if (!full || !originalRef.current) return;
    const fc = full.getContext('2d')!;
    fc.putImageData(originalRef.current, 0, 0);
    for (const r of regs) {
      if (r.tool === 'mosaic') pixelate(fc, r.x, r.y, r.w, r.h, r.size);
      else blur(fc, r.x, r.y, r.w, r.h, r.size);
    }
    syncDisplay();
  }, [syncDisplay]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const full = fullRef.current;
      const disp = displayRef.current;
      const wrap = wrapperRef.current;
      if (!full || !disp || !wrap) return;
      full.width = img.naturalWidth;
      full.height = img.naturalHeight;
      const fc = full.getContext('2d')!;
      fc.drawImage(img, 0, 0);
      originalRef.current = fc.getImageData(0, 0, full.width, full.height);
      const maxW = wrap.clientWidth;
      const maxH = window.innerHeight * 0.55;
      const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      scaleRef.current = s;
      disp.width = Math.round(img.naturalWidth * s);
      disp.height = Math.round(img.naturalHeight * s);
      disp.getContext('2d')!.drawImage(img, 0, 0, disp.width, disp.height);
      setReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const c = displayRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    let cx: number, cy: number;
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      cx = t?.clientX ?? 0; cy = t?.clientY ?? 0;
    } else {
      cx = e.clientX; cy = e.clientY;
    }
    return { x: cx - rect.left, y: cy - rect.top };
  }, []);

  const onStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPos(e);
    setDrawing(true);
    setDragStart(p);
    setDragCurrent(p);
  }, [getPos]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    setDragCurrent(p);
    syncDisplay();
    const dc = displayRef.current?.getContext('2d');
    if (!dc) return;
    dc.save();
    dc.strokeStyle = tool === 'mosaic' ? '#f97316' : '#3b82f6';
    dc.lineWidth = 2;
    dc.setLineDash([6, 4]);
    dc.strokeRect(
      Math.min(dragStart.x, p.x), Math.min(dragStart.y, p.y),
      Math.abs(p.x - dragStart.x), Math.abs(p.y - dragStart.y),
    );
    dc.restore();
  }, [drawing, getPos, dragStart, syncDisplay, tool]);

  const onEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    setDrawing(false);
    const p = getPos(e);
    const s = scaleRef.current;
    const fx = Math.min(dragStart.x, p.x) / s;
    const fy = Math.min(dragStart.y, p.y) / s;
    const fw = Math.abs(p.x - dragStart.x) / s;
    const fh = Math.abs(p.y - dragStart.y) / s;
    if (fw < 5 || fh < 5) { syncDisplay(); return; }
    const fullSize = tool === 'mosaic'
      ? Math.max(Math.round(blockSize / s), 3)
      : Math.max(Math.round(blockSize * 0.8 / s), 2);
    const newRegion: Region = { x: fx, y: fy, w: fw, h: fh, tool, size: fullSize };
    const next = [...regions, newRegion];
    setRegions(next);
    applyAllRegions(next);
  }, [drawing, getPos, dragStart, regions, tool, blockSize, applyAllRegions, syncDisplay]);

  const undo = useCallback(() => {
    const next = regions.slice(0, -1);
    setRegions(next);
    applyAllRegions(next);
  }, [regions, applyAllRegions]);

  const reset = useCallback(() => {
    setRegions([]);
    applyAllRegions([]);
  }, [applyAllRegions]);

  const exportDataUrl = useCallback(() => {
    return fullRef.current?.toDataURL('image/png') ?? '';
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Tool toggle */}
          <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setTool('mosaic')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                tool === 'mosaic'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              ▦ 모자이크
            </button>
            <button
              onClick={() => setTool('blur')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                tool === 'blur'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              ◉ 블러
            </button>
          </div>

          {/* Block size */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">강도</label>
            <input
              type="range"
              min={8}
              max={50}
              value={blockSize}
              onChange={(e) => setBlockSize(Number(e.target.value))}
              className="w-24 accent-orange-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-6 text-right">{blockSize}</span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

          {/* Undo / Reset */}
          <button
            onClick={undo}
            disabled={regions.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↩ 되돌리기
          </button>
          <button
            onClick={reset}
            disabled={regions.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            초기화
          </button>

          {regions.length > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {regions.length}개 영역 적용됨
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapperRef}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2 overflow-hidden"
        style={{ minHeight: 300 }}
      >
        <canvas
          ref={displayRef}
          className={`rounded ${ready ? 'cursor-crosshair' : ''}`}
          style={{ touchAction: 'none', maxWidth: '100%' }}
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={(e) => { if (drawing) onEnd(e); }}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
        <canvas ref={fullRef} className="hidden" />
      </div>

      {/* Hint */}
      {ready && regions.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          이미지 위에서 드래그하여 {tool === 'mosaic' ? '모자이크' : '블러'} 영역을 지정하세요
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={onBack} className="btn-base btn-secondary btn-md">
          ◀ 새 이미지
        </button>
        <button
          onClick={() => onOpenEditor(exportDataUrl())}
          className="btn-base btn-primary btn-md"
        >
          편집기로 이동 ▶
        </button>
        {regions.length > 0 && (
          <button
            onClick={() => onSave(exportDataUrl())}
            className="btn-base btn-secondary btn-md"
          >
            바로 저장
          </button>
        )}
      </div>
    </div>
  );
}
