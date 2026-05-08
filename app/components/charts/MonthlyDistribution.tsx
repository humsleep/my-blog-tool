'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';

interface Props {
  /** YYYYMM(6자) 또는 YYYY-MM 키 → count 맵 */
  data: Record<string, number>;
  /** 차트 높이 (기본 200) */
  height?: number;
}

/**
 * 월별 분포 막대 차트 — 경쟁 분석 발행일 분포용.
 * 키 형식 자동 감지: YYYYMM / YYYYMMDD / YYYY-MM-DD 모두 처리, YYYYMM(년-월) 단위로 합산.
 */
export default function MonthlyDistribution({ data, height = 200 }: Props) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const accent = isDark ? '#fb923c' : '#ea580c';
  const grid = isDark ? '#2e2723' : '#e4e4e7';
  const axisText = isDark ? '#d4d4d8' : '#3f3f46';

  const monthMap: Record<string, number> = {};
  for (const [rawKey, count] of Object.entries(data)) {
    const digits = rawKey.replace(/\D/g, '');
    if (digits.length < 6) continue;
    const ym = `${digits.slice(0, 4)}.${digits.slice(4, 6)}`;
    monthMap[ym] = (monthMap[ym] || 0) + count;
  }

  const chartData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  if (chartData.length === 0) {
    return (
      <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-3">
        시간 분포 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: axisText, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: grid }}
          />
          <YAxis
            tick={{ fill: axisText, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#221c17' : '#ffffff',
              border: `1px solid ${grid}`,
              borderRadius: 8,
              fontSize: 12,
              color: isDark ? '#fafafa' : '#09090b',
            }}
            cursor={{ fill: isDark ? 'rgba(251,146,60,0.08)' : 'rgba(234,88,12,0.08)' }}
            formatter={(v) => [`${v}편`, '발행']}
          />
          <Bar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
