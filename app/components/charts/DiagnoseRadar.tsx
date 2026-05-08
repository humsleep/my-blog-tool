'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface Props {
  activity: number;
  visibility: number;
  quality: number;
  /** 컨테이너 높이 (기본 240) */
  height?: number;
}

/**
 * 블로그 진단 3축(활동성·노출·품질) 레이더 차트.
 * 다크모드 자동 감지 (.dark 클래스로 토큰 색상 스왑).
 */
export default function DiagnoseRadar({ activity, visibility, quality, height = 240 }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const accent = isDark ? '#6ee7b7' : '#047857';
  const grid = isDark ? '#2a322d' : '#e7e5e4';
  const axisText = isDark ? '#a8a29e' : '#57534e';
  const fillOpacity = isDark ? 0.20 : 0.16;

  const data = [
    { axis: '활동성', value: activity, fullMark: 100 },
    { axis: '노출',   value: visibility, fullMark: 100 },
    { axis: '품질',   value: quality, fullMark: 100 },
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={grid} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: axisText, fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: axisText, fontSize: 10 }}
            tickCount={5}
            stroke={grid}
          />
          <Radar
            name="점수"
            dataKey="value"
            stroke={accent}
            fill={accent}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            dot={{ fill: accent, stroke: accent, r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
