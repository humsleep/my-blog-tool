'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** 0-100 */
  value: number;
  /** 픽셀 사이즈 (기본 160) */
  size?: number;
  /** 가운데 라벨 (band 등) */
  caption?: string;
  /** 반원 게이지(true) vs 풀 도넛(false). 기본 반원. */
  half?: boolean;
}

/**
 * SVG 점수 게이지 — 반원 또는 도넛.
 * 다크모드 자동 감지. 점수 구간별 색상(35/50/65/80 기준):
 *   <35 muted / 35-49 amber / 50-64 light blue / 65-79 sapphire / 80+ deep sapphire
 */
export default function ScoreGauge({ value, size = 160, caption, half = true }: Props) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const v = Math.max(0, Math.min(100, value));

  const muted     = isDark ? '#27272a' : '#e4e4e7';   /* zinc-800 / zinc-200 */
  const textColor = isDark ? '#fafafa' : '#18181b';   /* zinc-50 / zinc-900 */
  const subText   = isDark ? '#a1a1aa' : '#71717a';   /* zinc-400 / zinc-500 */

  // 점수에 따라 띠 색상 미세 조정 — sapphire 변형 + 저점 amber
  const bandColor =
    v >= 80 ? (isDark ? '#3b82f6' : '#1d4ed8') :  /* blue-500 / blue-700 */
    v >= 65 ? (isDark ? '#60a5fa' : '#2563eb') :  /* blue-400 / blue-600 */
    v >= 50 ? (isDark ? '#93c5fd' : '#3b82f6') :  /* blue-300 / blue-500 */
    v >= 35 ? (isDark ? '#fcd34d' : '#d97706') :  /* amber-300 / amber-600 */
              (isDark ? '#a1a1aa' : '#71717a');   /* zinc-400 / zinc-500 */

  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = half ? size - stroke / 2 : size / 2;

  if (half) {
    const circumference = Math.PI * r;
    const offset = circumference * (1 - v / 100);
    return (
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} className="block">
        <path
          d={`M ${stroke / 2},${cy} a ${r},${r} 0 0,1 ${size - stroke},0`}
          fill="none"
          stroke={muted}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2},${cy} a ${r},${r} 0 0,1 ${size - stroke},0`}
          fill="none"
          stroke={bandColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill={textColor} style={{ fontSize: size * 0.28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
          {v}
        </text>
        {caption && (
          <text x={cx} y={cy + 12} textAnchor="middle" fill={subText} style={{ fontSize: size * 0.10, fontWeight: 500 }}>
            {caption}
          </text>
        )}
      </svg>
    );
  }

  // 풀 도넛
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - v / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={muted} strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={bandColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
      <text x={cx} y={cy + size * 0.04} textAnchor="middle" fill={textColor} style={{ fontSize: size * 0.30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
        {v}
      </text>
      {caption && (
        <text x={cx} y={cy + size * 0.22} textAnchor="middle" fill={subText} style={{ fontSize: size * 0.10, fontWeight: 500 }}>
          {caption}
        </text>
      )}
    </svg>
  );
}

/**
 * 미니 가로 막대 + 점수 — 진단 3축 분해 표시용.
 * 게이지보다 컴팩트.
 */
export function ScoreMiniBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="tabular text-sm font-semibold text-zinc-900 dark:text-zinc-100">{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-1000 ease-out"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
