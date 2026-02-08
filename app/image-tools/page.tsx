'use client';

import { useState, useRef, useEffect } from 'react';
import AdPlaceholder from '../components/AdPlaceholder';

interface MosaicRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

type EditMode = 'mosaic' | 'crop';
type AspectRatio = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface CropRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageToolsPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [editMode, setEditMode] = useState<EditMode>('crop');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const originalAspectRatioRef = useRef<number | null>(null);
  
  // 이미지 편집 효과
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [flipVertical, setFlipVertical] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('none');
  
  // 모자이크 관련
  const [isDragging, setIsDragging] = useState(false);
  const [mosaicStart, setMosaicStart] = useState<{ x: number; y: number } | null>(null);
  const [mosaicEnd, setMosaicEnd] = useState<{ x: number; y: number } | null>(null);
  const [mosaicRegions, setMosaicRegions] = useState<MosaicRegion[]>([]);
  const [mosaicHistory, setMosaicHistory] = useState<MosaicRegion[][]>([]);
  
  // 자르기 관련
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [isCropMoving, setIsCropMoving] = useState(false);
  const [isCropping, setIsCropping] = useState(false); // 자르기 진행 중 플래그
  const [cropMoveStart, setCropMoveStart] = useState<{ x: number; y: number } | null>(null);
  const [cropMoveOffset, setCropMoveOffset] = useState<{ x: number; y: number } | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [cropHistory, setCropHistory] = useState<CropRegion[]>([]); // 자르기 히스토리
  
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const originalImageUrlRef = useRef<string>(''); // 원본 이미지 URL 저장
  const originalWidthRef = useRef<number>(0); // 원본 이미지 크기 저장
  const originalHeightRef = useRef<number>(0);

  useEffect(() => {
    if (image && canvasRef.current) {
      drawImage();
    }
  }, [image, width, height, mosaicRegions, editMode, cropStart, cropEnd, cropRegion, aspectRatio, brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, filter]);

  // 이미지 크기나 효과 조정 시 자르기 영역 초기화
  useEffect(() => {
    if (cropRegion) {
      setCropRegion(null);
      setCropStart(null);
      setCropEnd(null);
    }
  }, [width, height, brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, filter]);

  // 드래그 중 실시간 업데이트
  useEffect(() => {
    if ((isDragging && mosaicStart && mosaicEnd) || (isCropDragging && cropStart && cropEnd) || (isCropMoving && cropRegion)) {
      drawImage();
    }
  }, [isDragging, mosaicStart, mosaicEnd, isCropDragging, cropStart, cropEnd, isCropMoving, cropRegion]);

  // Canvas 밖 클릭 시 자르기 영역 초기화
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editMode === 'crop' && canvasRef.current && !isCropping) {
        const target = e.target as HTMLElement;
        
        // 버튼이나 입력 필드를 클릭한 경우는 무시 (자르기 버튼 예외 처리)
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
          return;
        }
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // Canvas 영역 밖을 클릭한 경우
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          // 드래그 중이거나 영역이 설정된 경우 초기화
          if (cropStart && cropEnd) {
            setCropStart(null);
            setCropEnd(null);
          }
          if (cropRegion) {
            setCropRegion(null);
          }
          setIsCropMoving(false);
          setCropMoveStart(null);
          setCropMoveOffset(null);
          drawImage();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editMode, cropStart, cropEnd, cropRegion, isCropping]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        originalImageRef.current = img;
        const imageUrl = e.target?.result as string;
        setImageUrl(imageUrl);
        originalImageUrlRef.current = imageUrl; // 원본 이미지 URL 저장
        setWidth(img.width);
        setHeight(img.height);
        originalWidthRef.current = img.width; // 원본 크기 저장
        originalHeightRef.current = img.height;
        originalAspectRatioRef.current = img.width / img.height;
        setMaintainAspectRatio(true);
        setCropRegion(null);
        setCropStart(null);
        setCropEnd(null);
        setCropHistory([]);
        resetImageEffects();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const drawImage = () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정 (유효성 검사)
    if (width <= 0 || height <= 0) return;
    
    // 회전 및 뒤집기를 고려한 Canvas 크기 계산
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const canvasWidth = width * cos + height * sin;
    const canvasHeight = width * sin + height * cos;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 변환 적용
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);

    // 이미지 그리기
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();

    // 이미지 효과 적용
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || filter !== 'none') {
      applyImageEffects(ctx, canvas);
    }

    // 원본 이미지 데이터 저장 (첫 번째 그리기 시에만)
    if (!originalImageDataRef.current) {
      originalImageDataRef.current = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    }

    // 모자이크 적용 (모드와 관계없이 항상 적용)
    // 저장된 모자이크 영역들 적용
    if (mosaicRegions.length > 0) {
      requestAnimationFrame(() => {
        mosaicRegions.forEach((region) => {
          applyMosaicToRegion(ctx, region.x, region.y, region.w, region.h);
        });
      });
    }

    // 현재 드래그 중인 모자이크 영역 적용 (모자이크 모드일 때만)
    if (editMode === 'mosaic' && mosaicStart && mosaicEnd) {
      requestAnimationFrame(() => {
        applyMosaic(ctx, canvas, mosaicStart, mosaicEnd);
      });
    }

    // 자르기 모드일 때 자르기 영역 표시 (자르기 진행 중이 아닐 때만)
    if (editMode === 'crop' && !isCropping) {
      drawCropOverlay(ctx, canvas);
    }
  };

  const applyImageEffects = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 밝기 조절
      if (brightness !== 100) {
        const factor = brightness / 100;
        r = Math.min(255, Math.max(0, r * factor));
        g = Math.min(255, Math.max(0, g * factor));
        b = Math.min(255, Math.max(0, b * factor));
      }

      // 대비 조절
      if (contrast !== 100) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      }

      // 채도 조절
      if (saturation !== 100) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const factor = saturation / 100;
        r = Math.min(255, Math.max(0, gray + (r - gray) * factor));
        g = Math.min(255, Math.max(0, gray + (g - gray) * factor));
        b = Math.min(255, Math.max(0, gray + (b - gray) * factor));
      }

      // 필터 적용
      if (filter === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      } else if (filter === 'sepia') {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = Math.min(255, tr);
        g = Math.min(255, tg);
        b = Math.min(255, tb);
      } else if (filter === 'invert') {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const drawCropOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!image || isCropping) return;
    
    let x: number, y: number, w: number, h: number;
    
    // cropRegion이 있으면 그것을 사용, 없으면 cropStart/cropEnd 사용
    if (cropRegion) {
      x = cropRegion.x;
      y = cropRegion.y;
      w = cropRegion.w;
      h = cropRegion.h;
    } else if (cropStart && cropEnd && isCropDragging) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      x = Math.min(cropStart.x * scaleX, cropEnd.x * scaleX);
      y = Math.min(cropStart.y * scaleY, cropEnd.y * scaleY);
      w = Math.abs(cropEnd.x * scaleX - cropStart.x * scaleX);
      h = Math.abs(cropEnd.y * scaleY - cropStart.y * scaleY);
    } else {
      return;
    }

    // 경계 조정
    if (x < 0) {
      w += x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      y = 0;
    }
    if (x + w > canvas.width) {
      w = canvas.width - x;
    }
    if (y + h > canvas.height) {
      h = canvas.height - y;
    }

    if (w <= 0 || h <= 0) return;

    // 어두운 오버레이를 그리기 전에 canvas의 해당 영역을 먼저 저장
    // canvas에 이미 그려진 이미지의 해당 영역을 복사해서 사용
    // 이미지 효과가 적용된 상태의 이미지를 사용하기 위해
    // 임시 canvas를 만들어서 현재 canvas의 해당 영역을 복사
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      // 어두운 오버레이를 그리기 전에 현재 canvas의 해당 영역을 임시 canvas로 복사
      tempCtx.drawImage(
        canvas,
        x, y, w, h,
        0, 0, w, h
      );
    }

    // 어두운 오버레이 그리기
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 저장한 이미지 영역을 다시 그리기 (자르기 영역만 밝게 표시)
    if (tempCtx) {
      ctx.drawImage(tempCanvas, x, y);
    }

    // 테두리 그리기
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // 모서리 핸들 그리기
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    const corners = [
      [x, y], [x + w, y], [x + w, y + h], [x, y + h]
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    });
  };

  const applyMosaic = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    // Canvas 크기 확인
    if (canvas.width <= 0 || canvas.height <= 0) {
      console.error('Canvas 크기가 유효하지 않습니다.');
      return;
    }

    // Canvas의 실제 크기와 표시 크기 비율 계산
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      console.error('Canvas 표시 크기가 유효하지 않습니다.');
      return;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 마우스 좌표를 Canvas 좌표로 변환
    let x = Math.min(start.x * scaleX, end.x * scaleX);
    let y = Math.min(start.y * scaleY, end.y * scaleY);
    let w = Math.abs(end.x * scaleX - start.x * scaleX);
    let h = Math.abs(end.y * scaleY - start.y * scaleY);

    // 최소 크기 확인 (너무 작은 영역은 무시)
    if (w < 1 || h < 1) return;

    // 경계 조정
    if (x < 0) {
      w += x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      y = 0;
    }
    if (x + w > canvas.width) {
      w = canvas.width - x;
    }
    if (y + h > canvas.height) {
      h = canvas.height - y;
    }

    // 최종 유효성 검사
    if (w <= 0 || h <= 0 || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return;
    }

    // 정수로 변환 (픽셀 좌표는 정수여야 함)
    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);

    applyMosaicToRegion(ctx, x, y, w, h);
  };

  const applyMosaicToRegion = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // 최종 유효성 검사
    if (w <= 0 || h <= 0 || x < 0 || y < 0) {
      return;
    }

    try {
      // Canvas 크기 확인
      const canvas = ctx.canvas;
      if (x + w > canvas.width || y + h > canvas.height) {
        // 경계 조정
        w = Math.min(w, canvas.width - x);
        h = Math.min(h, canvas.height - y);
        if (w <= 0 || h <= 0) return;
      }

      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(x, y, w, h);
      
      // 이미지 데이터가 유효한지 확인
      if (!imageData || imageData.data.length === 0 || imageData.width <= 0 || imageData.height <= 0) {
        console.error('이미지 데이터를 가져올 수 없습니다.', { x, y, w, h, canvasWidth: canvas.width, canvasHeight: canvas.height });
        return;
      }

      const data = imageData.data;
      const blockSize = 10;

      // 모자이크 블록 처리
      for (let py = 0; py < h; py += blockSize) {
        for (let px = 0; px < w; px += blockSize) {
          let r = 0,
            g = 0,
            b = 0,
            count = 0;

          const blockH = Math.min(blockSize, h - py);
          const blockW = Math.min(blockSize, w - px);

          // 블록 내 픽셀들의 평균 색상 계산
          for (let by = 0; by < blockH; by++) {
            for (let bx = 0; bx < blockW; bx++) {
              const pixelY = py + by;
              const pixelX = px + bx;
              
              // 배열 인덱스 계산 (imageData의 width 사용)
              const idx = (pixelY * imageData.width + pixelX) * 4;
              
              // 배열 범위 확인
              if (idx + 2 < data.length) {
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
          }

          // 평균 색상으로 블록 그리기
          if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x + px, y + py, blockW, blockH);
          }
        }
      }
    } catch (error) {
      console.error('모자이크 적용 오류:', error, { x, y, w, h });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (editMode === 'mosaic') {
      setMosaicStart({ x, y });
      setMosaicEnd({ x, y });
      setIsDragging(true);
    } else if (editMode === 'crop') {
      // 기존 자르기 영역이 있고, 클릭한 위치가 영역 내부인지 확인
      if (cropRegion) {
        const canvas = canvasRef.current;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;
        
        // 영역 내부를 클릭한 경우 이동 모드
        if (
          canvasX >= cropRegion.x &&
          canvasX <= cropRegion.x + cropRegion.w &&
          canvasY >= cropRegion.y &&
          canvasY <= cropRegion.y + cropRegion.h
        ) {
          setIsCropMoving(true);
          setCropMoveStart({ x, y }); // 화면 좌표 저장
          // 클릭한 위치를 영역 내부의 상대 좌표로 저장 (offset)
          setCropMoveOffset({
            x: canvasX - cropRegion.x,
            y: canvasY - cropRegion.y,
          });
          return;
        } else {
          // 영역 밖을 클릭한 경우 기존 영역 초기화
          setCropRegion(null);
          setCropStart(null);
          setCropEnd(null);
          drawImage();
        }
      }
      
      // 새로운 영역 시작
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setIsCropDragging(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (editMode === 'mosaic' && isDragging && mosaicStart) {
      setMosaicEnd({ x, y });
    } else if (editMode === 'crop') {
      if (isCropMoving && cropMoveStart && cropMoveOffset && cropRegion) {
        // 영역 이동 모드 - 클릭한 위치 기준으로 자연스럽게 이동
        const canvas = canvasRef.current;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // 현재 마우스 위치를 Canvas 좌표로 변환
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;
        
        // 클릭한 위치의 offset을 빼서 영역의 새로운 위치 계산
        let newX = canvasX - cropMoveOffset.x;
        let newY = canvasY - cropMoveOffset.y;
        
        // 이미지 크기 범위 내에서만 이동하도록 경계 제한
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + cropRegion.w > canvas.width) {
          newX = canvas.width - cropRegion.w;
        }
        if (newY + cropRegion.h > canvas.height) {
          newY = canvas.height - cropRegion.h;
        }
        
        setCropRegion({
          x: newX,
          y: newY,
          w: cropRegion.w,
          h: cropRegion.h,
        });
      } else if (isCropDragging && cropStart) {
        let newX = x;
        let newY = y;

        // 비율에 맞게 조정
        if (aspectRatio !== 'free') {
          const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
          const ratio = ratioW / ratioH;

          const startX = cropStart.x;
          const startY = cropStart.y;
          const deltaX = x - startX;
          const deltaY = y - startY;

          if (Math.abs(deltaX) * ratioH > Math.abs(deltaY) * ratioW) {
            newY = startY + (deltaX / ratio) * (deltaX > 0 ? 1 : -1);
          } else {
            newX = startX + deltaY * ratio * (deltaY > 0 ? 1 : -1);
          }
        }

        setCropEnd({ x: newX, y: newY });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (editMode === 'crop' && isCropMoving) {
      // 이동 모드 종료
      setIsCropMoving(false);
      setCropMoveStart(null);
      setCropMoveOffset(null);
      return;
    }
    
    if (editMode === 'mosaic') {
      if (!isDragging || !canvasRef.current || !mosaicStart || !mosaicEnd) {
        setIsDragging(false);
        return;
      }

      // Canvas 좌표로 변환
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let x = Math.min(mosaicStart.x * scaleX, mosaicEnd.x * scaleX);
      let y = Math.min(mosaicStart.y * scaleY, mosaicEnd.y * scaleY);
      let w = Math.abs(mosaicEnd.x * scaleX - mosaicStart.x * scaleX);
      let h = Math.abs(mosaicEnd.y * scaleY - mosaicStart.y * scaleY);

      // 경계 조정
      if (x < 0) {
        w += x;
        x = 0;
      }
      if (y < 0) {
        h += y;
        y = 0;
      }
      if (x + w > canvas.width) {
        w = canvas.width - x;
      }
      if (y + h > canvas.height) {
        h = canvas.height - y;
      }

      // 유효한 영역이면 저장
      if (w > 0 && h > 0 && x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
        const newRegion: MosaicRegion = {
          x: Math.floor(x),
          y: Math.floor(y),
          w: Math.floor(w),
          h: Math.floor(h),
        };
        
        // 히스토리에 현재 상태 저장 (실행 취소용)
        setMosaicHistory([...mosaicHistory, [...mosaicRegions]]);
        
        // 새 모자이크 영역 추가
        const updatedRegions = [...mosaicRegions, newRegion];
        setMosaicRegions(updatedRegions);
      }

      // 드래그 상태 초기화
      setIsDragging(false);
      setMosaicStart(null);
      setMosaicEnd(null);
    } else if (editMode === 'crop') {
      if (!isCropDragging || !canvasRef.current || !cropStart || !cropEnd) {
        setIsCropDragging(false);
        return;
      }

      // Canvas 좌표로 변환
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let x = Math.min(cropStart.x * scaleX, cropEnd.x * scaleX);
      let y = Math.min(cropStart.y * scaleY, cropEnd.y * scaleY);
      let w = Math.abs(cropEnd.x * scaleX - cropStart.x * scaleX);
      let h = Math.abs(cropEnd.y * scaleY - cropStart.y * scaleY);

      // 경계 조정
      if (x < 0) {
        w += x;
        x = 0;
      }
      if (y < 0) {
        h += y;
        y = 0;
      }
      if (x + w > canvas.width) {
        w = canvas.width - x;
      }
      if (y + h > canvas.height) {
        h = canvas.height - y;
      }

      // 유효한 영역이면 저장
      if (w > 0 && h > 0 && x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
        const newRegion: CropRegion = {
          x: Math.floor(x),
          y: Math.floor(y),
          w: Math.floor(w),
          h: Math.floor(h),
        };
        
        // 히스토리에 현재 상태 저장 (실행 취소용)
        if (cropRegion) {
          setCropHistory(prev => [...prev, cropRegion]);
        }
        
        setCropRegion(newRegion);
      }

      setIsCropDragging(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const resetImageEffects = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setFilter('none');
  };

  const handleReset = () => {
    if (editMode === 'mosaic') {
      setMosaicStart(null);
      setMosaicEnd(null);
      setMosaicRegions([]);
      setMosaicHistory([]);
      originalImageDataRef.current = null;
    } else if (editMode === 'crop') {
      setCropStart(null);
      setCropEnd(null);
      setCropRegion(null);
      setCropHistory([]);
    }
    
    // 원본 이미지로 복원
    if (originalImageRef.current && originalImageUrlRef.current) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        originalImageRef.current = img;
        setWidth(originalWidthRef.current);
        setHeight(originalHeightRef.current);
        originalAspectRatioRef.current = originalWidthRef.current / originalHeightRef.current;
        setMosaicRegions([]);
        setMosaicHistory([]);
        setCropHistory([]);
        originalImageDataRef.current = null;
        resetImageEffects();
      };
      img.src = originalImageUrlRef.current;
    } else {
      resetImageEffects();
      if (image) {
        drawImage();
      }
    }
  };

  const handleCrop = () => {
    if (!cropRegion || !canvasRef.current || !image || isCropping) return;

    // 자르기 진행 중 플래그 설정
    setIsCropping(true);

    // cropRegion 값을 먼저 저장 (나중에 사용하기 위해)
    const savedCropRegion = { ...cropRegion };

    // 즉시 점선을 제거하기 위해 모든 자르기 관련 상태를 초기화
    setCropStart(null);
    setCropEnd(null);
    setCropRegion(null);
    setIsCropMoving(false);
    setCropMoveStart(null);
    setCropMoveOffset(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 저장한 cropRegion의 좌표가 현재 canvas 크기 내에 있는지 확인하고 조정
    let cropX = Math.max(0, Math.min(savedCropRegion.x, canvas.width - 1));
    let cropY = Math.max(0, Math.min(savedCropRegion.y, canvas.height - 1));
    let cropW = Math.min(savedCropRegion.w, canvas.width - cropX);
    let cropH = Math.min(savedCropRegion.h, canvas.height - cropY);

    // 유효한 영역인지 확인
    if (cropW <= 0 || cropH <= 0) {
      console.error('Invalid crop region:', { cropX, cropY, cropW, cropH, canvasWidth: canvas.width, canvasHeight: canvas.height });
      setIsCropping(false);
      return;
    }

    // 오버레이 없이 이미지를 그린 임시 canvas 생성
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      setIsCropping(false);
      return;
    }

    // 오버레이 없이 이미지 다시 그리기
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const canvasWidth = width * cos + height * sin;
    const canvasHeight = width * sin + height * cos;

    // 변환 적용
    tempCtx.save();
    tempCtx.translate(canvasWidth / 2, canvasHeight / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);

    // 이미지 그리기
    tempCtx.drawImage(image, -width / 2, -height / 2, width, height);
    tempCtx.restore();

    // 이미지 효과 적용
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || filter !== 'none') {
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 밝기 조절
        if (brightness !== 100) {
          const factor = brightness / 100;
          r = Math.min(255, Math.max(0, r * factor));
          g = Math.min(255, Math.max(0, g * factor));
          b = Math.min(255, Math.max(0, b * factor));
        }

        // 대비 조절
        if (contrast !== 100) {
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
          g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
          b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
        }

        // 채도 조절
        if (saturation !== 100) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const factor = saturation / 100;
          r = Math.min(255, Math.max(0, gray + (r - gray) * factor));
          g = Math.min(255, Math.max(0, gray + (g - gray) * factor));
          b = Math.min(255, Math.max(0, gray + (b - gray) * factor));
        }

        // 필터 적용
        if (filter === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        } else if (filter === 'sepia') {
          const tr = 0.393 * r + 0.769 * g + 0.189 * b;
          const tg = 0.349 * r + 0.686 * g + 0.168 * b;
          const tb = 0.272 * r + 0.534 * g + 0.131 * b;
          r = Math.min(255, tr);
          g = Math.min(255, tg);
          b = Math.min(255, tb);
        } else if (filter === 'invert') {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      tempCtx.putImageData(imageData, 0, 0);
    }

    // 모자이크 적용
    if (mosaicRegions.length > 0) {
      mosaicRegions.forEach((region) => {
        applyMosaicToRegion(tempCtx, region.x, region.y, region.w, region.h);
      });
    }

    // 자르기 영역만 추출 (오버레이 없이)
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) {
      setIsCropping(false);
      return;
    }

    // 오버레이 없는 임시 canvas에서 자르기 영역만 복사
    croppedCtx.drawImage(
      tempCanvas,
      cropX, cropY, cropW, cropH,
      0, 0, cropW, cropH
    );

    // 자르기 전 모자이크 영역 저장 및 변환
    const transformedMosaicRegions: MosaicRegion[] = [];
    if (mosaicRegions.length > 0) {
      mosaicRegions.forEach((region) => {
        // 자르기 영역과 겹치는 모자이크 영역만 유지
        const regionRight = region.x + region.w;
        const regionBottom = region.y + region.h;
        const cropRight = cropX + cropW;
        const cropBottom = cropY + cropH;
        
        // 모자이크 영역이 자르기 영역과 겹치는지 확인
        if (
          region.x < cropRight &&
          regionRight > cropX &&
          region.y < cropBottom &&
          regionBottom > cropY
        ) {
          // 겹치는 부분 계산
          const newX = Math.max(0, region.x - cropX);
          const newY = Math.max(0, region.y - cropY);
          const newRight = Math.min(cropW, regionRight - cropX);
          const newBottom = Math.min(cropH, regionBottom - cropY);
          
          transformedMosaicRegions.push({
            x: newX,
            y: newY,
            w: newRight - newX,
            h: newBottom - newY,
          });
        }
      });
    }

    // 자르기 전 이미지 상태를 히스토리에 저장 (실행 취소용)
    const previousImageUrl = canvas.toDataURL();
    if (!originalImageUrlRef.current) {
      originalImageUrlRef.current = previousImageUrl;
      originalWidthRef.current = width;
      originalHeightRef.current = height;
    }

    // 자르기된 Canvas를 이미지로 변환
    const croppedImageUrl = croppedCanvas.toDataURL();
    
    // 새 이미지 생성
    const newImg = new Image();
    newImg.onload = () => {
      setImage(newImg);
      originalImageRef.current = newImg;
      
      // 자르기된 이미지 크기 계산
      // Canvas 좌표를 실제 이미지 좌표로 변환하여 이미지 크기 업데이트
      // 회전 및 뒤집기를 고려한 실제 Canvas 크기 계산
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const actualCanvasWidth = width * cos + height * sin;
      const actualCanvasHeight = width * sin + height * cos;
      
      // Canvas 좌표를 실제 이미지 좌표로 변환
      const scaleX = width / actualCanvasWidth;
      const scaleY = height / actualCanvasHeight;
      
      const cropWidth = Math.floor(cropW * scaleX);
      const cropHeight = Math.floor(cropH * scaleY);
      
      // 이미지 크기 업데이트
      if (cropWidth > 0 && cropHeight > 0) {
        setWidth(cropWidth);
        setHeight(cropHeight);
        originalAspectRatioRef.current = cropWidth / cropHeight;
      } else {
        // 변환 실패 시 Canvas 좌표 그대로 사용
        setWidth(cropW);
        setHeight(cropH);
        originalAspectRatioRef.current = cropW / cropH;
      }
      
      setCropRegion(null);
      setCropStart(null);
      setCropEnd(null);
      setCropHistory([]); // 자르기 후 히스토리 초기화
      
      // 모자이크 영역을 변환된 좌표로 업데이트 (자르기된 이미지에 맞게)
      setMosaicRegions(transformedMosaicRegions);
      // 모자이크 히스토리도 변환된 좌표로 업데이트
      if (mosaicHistory.length > 0) {
        const transformedHistory = mosaicHistory.map((historyRegions) => {
          return historyRegions
            .map((region) => {
              const regionRight = region.x + region.w;
              const regionBottom = region.y + region.h;
              const cropRight = cropX + cropW;
              const cropBottom = cropY + cropH;
              
              if (
                region.x < cropRight &&
                regionRight > cropX &&
                region.y < cropBottom &&
                regionBottom > cropY
              ) {
                const newX = Math.max(0, region.x - cropX);
                const newY = Math.max(0, region.y - cropY);
                const newRight = Math.min(cropW, regionRight - cropX);
                const newBottom = Math.min(cropH, regionBottom - cropY);
                
                return {
                  x: newX,
                  y: newY,
                  w: newRight - newX,
                  h: newBottom - newY,
                };
              }
              return null;
            })
            .filter((region): region is MosaicRegion => region !== null);
        });
        setMosaicHistory(transformedHistory);
      } else {
        setMosaicHistory([]);
      }
      
      originalImageDataRef.current = null;
      // 효과는 유지하되, 회전/뒤집기는 초기화 (새 이미지이므로)
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
      
      // 자르기 완료 후 플래그 해제
      setIsCropping(false);
    };
    newImg.onerror = () => {
      console.error('Failed to load cropped image');
      setIsCropping(false); // 에러 발생 시에도 플래그 해제
    };
    newImg.src = croppedImageUrl;
  };

  const handleUndo = () => {
    if (editMode === 'mosaic') {
      if (mosaicHistory.length === 0) return;
      
      // 히스토리에서 이전 상태 복원
      const previousRegions = mosaicHistory[mosaicHistory.length - 1];
      setMosaicRegions(previousRegions);
      setMosaicHistory(mosaicHistory.slice(0, -1));
    } else if (editMode === 'crop') {
      if (cropHistory.length === 0) {
        // 히스토리가 없으면 자르기 영역만 초기화
        setCropRegion(null);
        setCropStart(null);
        setCropEnd(null);
        return;
      }
      
      // 히스토리에서 이전 상태 복원
      const previousRegion = cropHistory[cropHistory.length - 1];
      setCropRegion(previousRegion);
      setCropHistory(cropHistory.slice(0, -1));
    }
    
    if (image) {
      drawImage();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">이미지 편집 도구</h1>
          <p className="text-gray-600 mt-2">이미지를 업로드하고 편집하세요</p>
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdPlaceholder size="banner" />
        </div>

        {/* 공통 기능 버튼 - 광고 영역 바로 아래 */}
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-100 p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={handleUndo}
              disabled={!image || (editMode === 'mosaic' && mosaicHistory.length === 0) || (editMode === 'crop' && cropHistory.length === 0 && !cropRegion)}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border border-gray-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
              title="실행 취소"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              실행 취소
            </button>
            <button
              onClick={handleDownload}
              disabled={!image}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
              title="다운로드"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              다운로드
            </button>
            <button
              onClick={() => {
                handleReset();
                resetImageEffects();
              }}
              disabled={!image}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
              title="초기화"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              초기화
            </button>
            <button
              onClick={() => {
                setImage(null);
                setImageUrl('');
                setMosaicStart(null);
                setMosaicEnd(null);
                setMosaicRegions([]);
                setMosaicHistory([]);
                setCropStart(null);
                setCropEnd(null);
                setCropRegion(null);
                originalImageDataRef.current = null;
                originalImageRef.current = null;
                resetImageEffects();
              }}
              disabled={!image}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
              title="새 이미지"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              새 이미지
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              {!image ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                  <p className="text-gray-600 mb-2">이미지를 드래그 앤 드롭하거나 클릭하여 업로드</p>
                  <p className="text-sm text-gray-400">PNG, JPG, GIF 파일 지원</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative flex justify-center bg-gray-100 rounded-lg p-4 overflow-auto">
                    <canvas
                      ref={canvasRef}
                      className={`border border-gray-300 rounded max-w-full ${
                        editMode === 'mosaic' ? 'cursor-crosshair' : 'cursor-crosshair'
                      }`}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">편집 옵션</h2>

                {/* 편집 모드 선택 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    편집 모드
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode('crop');
                        // 모자이크 드래그 상태만 초기화 (이미지는 유지)
                        setMosaicStart(null);
                        setMosaicEnd(null);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        editMode === 'crop'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      자르기
                    </button>
                    <button
                      onClick={() => {
                        setEditMode('mosaic');
                        // 자르기 드래그 상태만 초기화 (이미지는 유지)
                        setCropStart(null);
                        setCropEnd(null);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        editMode === 'mosaic'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      모자이크
                    </button>
                  </div>
                  
                  {/* 모드별 안내 - 편집 모드 선택 바로 밑 */}
                  {editMode === 'mosaic' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-xs font-semibold text-blue-900 mb-1">모자이크 처리</h3>
                      <p className="text-xs text-blue-700">
                        이미지 위에서 드래그하여 모자이크를 적용할 영역을 선택하세요
                      </p>
                    </div>
                  )}
                  
                  {editMode === 'crop' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-xs font-semibold text-green-900 mb-1">이미지 자르기</h3>
                      <p className="text-xs text-green-700">
                        이미지 위에서 드래그하여 자를 영역을 선택하세요. 비율을 선택하면 자동으로 해당 비율로 조정됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 크기 조절 - 자르기 모드일 때만 표시 */}
                {image && editMode === 'crop' && (
                  <div className="mb-6">
                    {/* 자르기 모드일 때 비율 선택 - 이미지 크기 위 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        비율 선택
                      </label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="free">자유 비율</option>
                        <option value="1:1">1:1 (정사각형)</option>
                        <option value="16:9">16:9 (와이드)</option>
                        <option value="9:16">9:16 (세로)</option>
                        <option value="4:3">4:3 (표준)</option>
                        <option value="3:4">3:4 (세로 표준)</option>
                      </select>
                      
                      {/* 자르기 실행/취소 버튼 - 비율 선택 바로 밑 */}
                      {cropRegion && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={handleCrop}
                            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md whitespace-nowrap"
                          >
                            ✓ 자르기 적용
                          </button>
                          <button
                            onClick={() => {
                              setCropRegion(null);
                              setCropStart(null);
                              setCropEnd(null);
                              drawImage();
                            }}
                            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors whitespace-nowrap"
                          >
                            ✕ 취소
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 크기
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">가로 (px)</label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => {
                            const newWidth = Number(e.target.value);
                            setWidth(newWidth);
                            if (maintainAspectRatio && originalAspectRatioRef.current) {
                              setHeight(Math.round(newWidth / originalAspectRatioRef.current));
                            }
                          }}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">세로 (px)</label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => {
                            const newHeight = Number(e.target.value);
                            setHeight(newHeight);
                            if (maintainAspectRatio && originalAspectRatioRef.current) {
                              setWidth(Math.round(newHeight * originalAspectRatioRef.current));
                            }
                          }}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    {/* 비율 유지하기 체크박스 */}
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>비율 유지하기</span>
                    </label>
                  </div>
                )}

                {/* 이미지 편집 효과 - 블로그 운영에 유용한 기능 */}
                {image && (
                  <div className="mb-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      이미지 효과
                    </h3>
                    
                    {/* 색상 조절 블록 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3">색상 조절</h4>
                      <div className="space-y-4">
                        {/* 밝기 조절 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            밝기: {brightness}%
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={brightness}
                              onChange={(e) => setBrightness(Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={brightness}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(200, Number(e.target.value) || 0));
                                setBrightness(val);
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                            />
                          </div>
                        </div>

                        {/* 대비 조절 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            대비: {contrast}%
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={contrast}
                              onChange={(e) => setContrast(Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={contrast}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(200, Number(e.target.value) || 0));
                                setContrast(val);
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                            />
                          </div>
                        </div>

                        {/* 채도 조절 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            채도: {saturation}%
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={saturation}
                              onChange={(e) => setSaturation(Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={saturation}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(200, Number(e.target.value) || 0));
                                setSaturation(val);
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 회전 및 뒤집기 블록 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3">회전 및 뒤집기</h4>
                      <div className="space-y-4">
                        {/* 회전 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            회전: {rotation}°
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={rotation}
                              onChange={(e) => setRotation(Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <button
                              onClick={() => setRotation((prev) => (prev + 90) % 360)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
                              title="90도 회전"
                            >
                              90° 회전
                            </button>
                          </div>
                        </div>

                        {/* 뒤집기 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            뒤집기
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setFlipHorizontal(!flipHorizontal)}
                              className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                flipHorizontal
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              ↔ 좌우
                            </button>
                            <button
                              onClick={() => setFlipVertical(!flipVertical)}
                              className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                flipVertical
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              ↕ 상하
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 필터 블록 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3">필터 효과</h4>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
                      >
                        <option value="none">원본 (필터 없음)</option>
                        <option value="grayscale">흑백</option>
                        <option value="sepia">세피아</option>
                        <option value="invert">반전</option>
                      </select>
                    </div>
                  </div>
                )}



              </div>

            {/* Ad Sidebar */}
            <AdPlaceholder size="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}

