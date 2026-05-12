import { renderOgImage, alt, size, contentType } from '@/lib/og/render';

// Twitter 카드도 동일 이미지. summary_large_image 카드에서 1200x630 표시.
export const runtime = 'edge';
export { alt, size, contentType };

export default async function Image() {
  return renderOgImage();
}
