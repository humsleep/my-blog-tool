/**
 * public/posts/images/*.png → *.webp 변환.
 *
 * 사용:
 *   npx tsx scripts/convert-post-images-to-webp.ts
 *
 * - quality 82 (시각적으로 PNG와 거의 동일하면서 크기 75% 절감).
 * - PNG 원본은 백업으로 .png.bak 으로 rename 하지 않고 그대로 두고,
 *   변환된 .webp 만 새로 만든다. (PostImage.tsx 의 src 만 .webp 로 바꾸면 됨.)
 * - 이미 .webp 가 있으면 skip (idempotent).
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = join(process.cwd(), 'public', 'posts', 'images');

async function main() {
  const files = readdirSync(dir).filter((f) => /\.png$/i.test(f));
  if (files.length === 0) {
    console.log('변환할 PNG 파일이 없습니다.');
    return;
  }

  let savedBytes = 0;
  for (const file of files) {
    const inputPath = join(dir, file);
    const outputPath = join(dir, file.replace(/\.png$/i, '.webp'));
    const inputSize = statSync(inputPath).size;

    try {
      const buf = await sharp(inputPath)
        .webp({ quality: 82, effort: 5 })
        .toBuffer();
      const { writeFileSync } = await import('node:fs');
      writeFileSync(outputPath, buf);
      const outSize = buf.length;
      const saved = inputSize - outSize;
      savedBytes += saved;
      const pct = ((saved / inputSize) * 100).toFixed(1);
      console.log(`✓ ${file} ${(inputSize / 1024).toFixed(0)}KB → ${(outSize / 1024).toFixed(0)}KB (-${pct}%)`);
    } catch (err) {
      console.error(`✗ ${file} 실패:`, err);
    }
  }

  console.log(`\n총 절감: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
}

void main();
