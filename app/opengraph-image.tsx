import { renderOgImage, alt, size, contentType } from '@/lib/og/render';

// Edge runtime — fetch Google Fonts CSS + 폰트 바이너리 prerender 시 1회.
export const runtime = 'edge';
export { alt, size, contentType };

export default async function Image() {
  return renderOgImage();
}
