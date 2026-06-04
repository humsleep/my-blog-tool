import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'posts', 'images');

const thumbnails = [
  {
    name: 'post_17',
    title: '네이버 메이트란?',
    subtitle: '블로거가 알아야 할 핵심 변화 5가지',
    bgColor: '#1a2332',
    accentColor: '#00c73c',
    icon: 'N',
  },
  {
    name: 'post_18',
    title: '메이트 시대',
    subtitle: '검색 노출 전략이 달라진다',
    bgColor: '#0d1b2a',
    accentColor: '#48bb78',
    icon: '🔍',
  },
  {
    name: 'post_19',
    title: 'AI 인용되는 글',
    subtitle: '콘텐츠 구조 설계법',
    bgColor: '#1a1a2e',
    accentColor: '#63b3ed',
    icon: '📐',
  },
  {
    name: 'post_20',
    title: 'GEO 완벽 가이드',
    subtitle: 'AI가 내 글을 추천하게 만드는 법',
    bgColor: '#2d1b36',
    accentColor: '#f6ad55',
    icon: '⚡',
  },
];

function createSVG({ title, subtitle, bgColor, accentColor, icon }) {
  return `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(bgColor, 30)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.6" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Grid pattern -->
  <g opacity="0.05" stroke="white" stroke-width="1">
    ${Array.from({length: 20}, (_, i) => `<line x1="0" y1="${i * 52}" x2="1024" y2="${i * 52}"/>`).join('\n    ')}
    ${Array.from({length: 20}, (_, i) => `<line x1="${i * 52}" y1="0" x2="${i * 52}" y2="1024"/>`).join('\n    ')}
  </g>

  <!-- Decorative circles -->
  <circle cx="800" cy="200" r="180" fill="${accentColor}" opacity="0.08"/>
  <circle cx="200" cy="800" r="120" fill="${accentColor}" opacity="0.06"/>
  <circle cx="900" cy="700" r="80" fill="${accentColor}" opacity="0.05"/>

  <!-- Accent line top -->
  <rect x="80" y="80" width="120" height="4" fill="${accentColor}" rx="2"/>

  <!-- Icon area -->
  <text x="512" y="380" font-family="Arial, sans-serif" font-size="140" fill="${accentColor}" text-anchor="middle" filter="url(#glow)" opacity="0.9">${icon}</text>

  <!-- Title -->
  <text x="512" y="560" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="72" fill="white" text-anchor="middle" font-weight="bold">${title}</text>

  <!-- Subtitle -->
  <text x="512" y="640" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="36" fill="white" text-anchor="middle" opacity="0.75">${subtitle}</text>

  <!-- Bottom accent bar -->
  <rect x="412" y="700" width="200" height="3" fill="url(#accent)" rx="1.5"/>

  <!-- Brand -->
  <text x="512" y="920" font-family="Arial, sans-serif" font-size="22" fill="white" text-anchor="middle" opacity="0.35" letter-spacing="6">BOHEME BLOGLAB</text>

  <!-- Bottom border accent -->
  <rect x="0" y="1016" width="1024" height="8" fill="${accentColor}" opacity="0.6"/>
</svg>`;
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

async function generate() {
  for (const thumb of thumbnails) {
    const svg = createSVG(thumb);
    const outPath = path.join(outDir, `${thumb.name}.webp`);
    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .webp({ quality: 85 })
      .toFile(outPath);
    console.log(`✅ ${thumb.name}.webp generated`);
  }
}

generate().catch(console.error);
