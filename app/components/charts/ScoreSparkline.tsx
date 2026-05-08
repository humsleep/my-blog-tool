'use client';

import { useEffect, useState } from 'react';

interface Point {
  /** ISO 일시 — 툴팁 라벨용 */
  date: string;
  /** 0~100 점수 */
  score: number;
}

interface Props {
  /** 시간순 정렬(오래된 → 최신) 점수 배열 */
  points: Point[];
  /** 너비 (기본 240) */
  width?: number;
  /** 높이 (기본 56) */
  height?: number;
  /** 라벨 (기본 "점수 추이") */
  label?: string;
}

/**
 * 진단 점수 시간순 sparkline — SVG 기반.
 * Recharts 안 쓰는 경량 컴포넌트. 카드 안에 작게 끼워넣기 좋음.
 */
export default function ScoreSparkline({ points, width = 240, height = 56, label }: Props) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (points.length < 2) return null;

  const accent = isDark ? '#fb923c' : '#ea580c';
  const fill   = isDark ? 'rgba(251,146,60,0.18)' : 'rgba(234,88,12,0.12)';

  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Y 도메인은 항상 0~100 (점수 척도) — 작은 변동도 명확히 보이게 min/max로 줄이는 대신
  // 데이터 범위에 padding을 둠
  const values = points.map((p) => p.score);
  const min = Math.max(0, Math.min(...values) - 5);
  const max = Math.min(100, Math.max(...values) + 5);
  const range = max - min || 1;

  const stepX = points.length === 1 ? 0 : w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + h - ((p.score - min) / range) * h;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(pad + h).toFixed(1)} L ${pad} ${(pad + h).toFixed(1)} Z`;

  const last = coords[coords.length - 1];

  return (
    <div className="inline-flex items-center gap-2">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
          {label}
        </span>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <path d={areaPath} fill={fill} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 3 : 1.6}
            fill={accent}
          />
        ))}
        {/* 최신 포인트 강조 — 점수 텍스트 */}
        <text
          x={last.x}
          y={last.y - 6}
          textAnchor={last.x > width / 2 ? 'end' : 'start'}
          fill={accent}
          style={{ fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
        >
          {last.score}
        </text>
      </svg>
    </div>
  );
}
