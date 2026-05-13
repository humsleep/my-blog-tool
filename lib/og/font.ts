/**
 * Google Fonts CSS2 → 실제 TTF/OTF URL 파싱 → 폰트 바이너리 fetch.
 *
 *  - `&text=` 파라미터로 사용하는 글리프만 받아오면 폰트 페이로드 폭증 방지.
 *  - Vercel 의 satori 가 OTF/TTF 만 지원하므로 woff2 가 아닌 url 을 골라야 한다.
 *  - User-Agent 가 모던 브라우저여야 Google 이 ttf/otf 를 응답.
 *
 *  사용처: app/opengraph-image.tsx, app/twitter-image.tsx,
 *          app/api/share-card/diagnose/route.ts 등 ImageResponse 를 쓰는 모든 곳.
 */
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const url =
    `https://fonts.googleapis.com/css2` +
    `?family=${family}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;

  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  }).then((r) => r.text());

  const match = css.match(/src:\s*url\((https:[^)]+?)\)\s*format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Google Font fetch failed: ${family} ${weight}`);

  const fontData = await fetch(match[1]).then((r) => r.arrayBuffer());
  return fontData;
}
