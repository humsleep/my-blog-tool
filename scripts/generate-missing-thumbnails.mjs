import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'posts', 'images');

const thumbnails = [
  {
    name: 'post_11',
    line1: 'BlogLab',
    line2: '시작 가이드',
    subtitle: '8단계로 완성하는 첫 포스팅',
    bgColor: '#0f2027',
    bgColor2: '#203a43',
    accentColor: '#f97316',
    shapes: [
      { type: 'steps' },
    ],
  },
  {
    name: 'post_12',
    line1: 'C-Rank vs',
    line2: 'D.I.A.',
    subtitle: '2026년 상위 노출 작동 원리',
    bgColor: '#1a1a2e',
    bgColor2: '#16213e',
    accentColor: '#6366f1',
    shapes: [
      { type: 'versus' },
    ],
  },
  {
    name: 'post_13',
    line1: '모바일',
    line2: '가독성',
    subtitle: '이탈률 30% 줄이는 포맷팅 규칙',
    bgColor: '#0d1117',
    bgColor2: '#161b22',
    accentColor: '#3b82f6',
    shapes: [
      { type: 'phone' },
    ],
  },
  {
    name: 'post_14',
    line1: '협찬·체험단',
    line2: '안전 표시법',
    subtitle: '페널티 안 받는 5가지 규칙',
    bgColor: '#1c1917',
    bgColor2: '#292524',
    accentColor: '#22c55e',
    shapes: [
      { type: 'shield' },
    ],
  },
  {
    name: 'post_15',
    line1: 'AI 시대',
    line2: '블로그 차별화',
    subtitle: '경험·관점·로컬 데이터로 살아남기',
    bgColor: '#1e1b4b',
    bgColor2: '#312e81',
    accentColor: '#a78bfa',
    shapes: [
      { type: 'brain' },
    ],
  },
  {
    name: 'post_16',
    line1: '인터랙션',
    line2: '설계',
    subtitle: '댓글·공감 1.5배 늘리는 5가지 장치',
    bgColor: '#14120f',
    bgColor2: '#1c1917',
    accentColor: '#fb923c',
    shapes: [
      { type: 'chat' },
    ],
  },
];

function createSVG({ line1, line2, subtitle, bgColor, bgColor2, accentColor, shapes }) {
  const shapesSvg = getShapes(shapes[0].type, accentColor);

  return `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor2};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.05" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Subtle noise texture -->
  <g opacity="0.03">
    ${Array.from({length: 25}, (_, i) => `<line x1="0" y1="${i * 42}" x2="1024" y2="${i * 42}" stroke="white" stroke-width="0.5"/>`).join('\n    ')}
    ${Array.from({length: 25}, (_, i) => `<line x1="${i * 42}" y1="0" x2="${i * 42}" y2="1024" stroke="white" stroke-width="0.5"/>`).join('\n    ')}
  </g>

  <!-- Decorative shapes -->
  ${shapesSvg}

  <!-- Top accent line -->
  <rect x="80" y="70" width="100" height="4" fill="${accentColor}" rx="2" opacity="0.8"/>

  <!-- Main title -->
  <text x="512" y="480" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="80" fill="white" text-anchor="middle" font-weight="bold" letter-spacing="-1">${line1}</text>
  <text x="512" y="575" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="80" fill="white" text-anchor="middle" font-weight="bold" letter-spacing="-1">${line2}</text>

  <!-- Subtitle -->
  <text x="512" y="650" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="30" fill="white" text-anchor="middle" opacity="0.6">${subtitle}</text>

  <!-- Bottom accent bar -->
  <rect x="437" y="700" width="150" height="3" fill="${accentColor}" rx="1.5" opacity="0.7"/>

  <!-- Brand -->
  <text x="512" y="920" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.25" letter-spacing="6">BOHEME BLOGLAB</text>

  <!-- Bottom border -->
  <rect x="0" y="1016" width="1024" height="8" fill="${accentColor}" opacity="0.5"/>
</svg>`;
}

function getShapes(type, color) {
  switch(type) {
    case 'steps':
      return `
        <!-- 8 ascending steps -->
        ${Array.from({length: 8}, (_, i) => `
          <rect x="${120 + i * 100}" y="${680 - i * 45}" width="70" height="${20 + i * 45}" fill="${color}" opacity="${0.04 + i * 0.015}" rx="4"/>
        `).join('')}
        <circle cx="820" cy="200" r="150" fill="${color}" opacity="0.06"/>
        <circle cx="180" cy="830" r="100" fill="${color}" opacity="0.04"/>
      `;
    case 'versus':
      return `
        <!-- Two overlapping circles for vs concept -->
        <circle cx="380" cy="350" r="200" fill="none" stroke="${color}" stroke-width="2" opacity="0.15"/>
        <circle cx="644" cy="350" r="200" fill="none" stroke="${color}" stroke-width="2" opacity="0.15"/>
        <ellipse cx="512" cy="350" rx="80" ry="160" fill="${color}" opacity="0.06"/>
        <circle cx="850" cy="750" r="120" fill="${color}" opacity="0.04"/>
        <circle cx="150" cy="800" r="80" fill="${color}" opacity="0.03"/>
      `;
    case 'phone':
      return `
        <!-- Phone outline -->
        <rect x="412" y="130" width="200" height="360" rx="20" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.2"/>
        <rect x="482" y="145" width="60" height="6" rx="3" fill="${color}" opacity="0.15"/>
        <circle cx="512" cy="460" r="10" fill="${color}" opacity="0.15"/>
        <!-- Text lines inside phone -->
        ${Array.from({length: 6}, (_, i) => `
          <rect x="${440}" y="${180 + i * 35}" width="${120 - (i % 3) * 20}" height="8" rx="4" fill="${color}" opacity="${0.08 + (i % 2) * 0.04}"/>
        `).join('')}
        <circle cx="800" cy="220" r="140" fill="${color}" opacity="0.04"/>
        <circle cx="200" cy="780" r="100" fill="${color}" opacity="0.04"/>
      `;
    case 'shield':
      return `
        <!-- Shield shape -->
        <path d="M512 150 L650 220 L650 400 Q650 520 512 580 Q374 520 374 400 L374 220 Z"
              fill="none" stroke="${color}" stroke-width="2.5" opacity="0.18"/>
        <path d="M480 340 L505 370 L560 300" fill="none" stroke="${color}" stroke-width="4" opacity="0.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="820" cy="250" r="130" fill="${color}" opacity="0.04"/>
        <circle cx="180" cy="780" r="110" fill="${color}" opacity="0.04"/>
      `;
    case 'brain':
      return `
        <!-- Abstract brain/neural network -->
        ${[
          [300,250], [500,180], [700,260], [250,400], [512,340], [750,380],
          [350,520], [600,480], [800,520], [200,280], [650,200]
        ].map(([cx,cy], i) => `
          <circle cx="${cx}" cy="${cy}" r="${6 + (i % 3) * 3}" fill="${color}" opacity="${0.1 + (i % 4) * 0.03}"/>
        `).join('')}
        ${[
          [300,250,500,180], [500,180,700,260], [250,400,512,340], [512,340,750,380],
          [350,520,600,480], [700,260,750,380], [300,250,250,400], [600,480,800,520],
          [200,280,300,250], [500,180,512,340], [650,200,700,260]
        ].map(([x1,y1,x2,y2]) => `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.08"/>
        `).join('')}
        <circle cx="830" cy="750" r="140" fill="${color}" opacity="0.04"/>
      `;
    case 'chat':
      return `
        <!-- Chat bubbles -->
        <rect x="280" y="180" width="280" height="80" rx="16" fill="${color}" opacity="0.1"/>
        <polygon points="340,260 360,260 330,290" fill="${color}" opacity="0.1"/>
        <rect x="464" y="300" width="260" height="80" rx="16" fill="${color}" opacity="0.07"/>
        <polygon points="680,380 660,380 690,410" fill="${color}" opacity="0.07"/>
        <rect x="300" y="420" width="220" height="60" rx="14" fill="${color}" opacity="0.05"/>
        <!-- Reaction icons -->
        <circle cx="780" cy="220" r="25" fill="${color}" opacity="0.08"/>
        <circle cx="240" cy="500" r="20" fill="${color}" opacity="0.06"/>
        <circle cx="820" cy="750" r="130" fill="${color}" opacity="0.04"/>
        <circle cx="180" cy="800" r="90" fill="${color}" opacity="0.03"/>
      `;
    default:
      return `<circle cx="800" cy="200" r="150" fill="${color}" opacity="0.06"/>`;
  }
}

async function generate() {
  for (const thumb of thumbnails) {
    const svg = createSVG(thumb);
    const outPath = path.join(outDir, `${thumb.name}.webp`);
    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .webp({ quality: 85 })
      .toFile(outPath);
    console.log(`Generated ${thumb.name}.webp`);
  }
}

generate().catch(console.error);
