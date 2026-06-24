/**
 * 네이버 블로그 데이터 수집 헬퍼 — 진단 전용.
 *
 *   1) extractBlogId       — 사용자 입력(URL/아이디)에서 표준 blogId 추출
 *   2) fetchRss            — `https://rss.blog.naver.com/{id}.xml` 파싱 (최근 글 메타)
 *   3) searchBlogByQuery   — 네이버 블로그 검색 OpenAPI 호출
 *   4) findRankInResults   — 검색 결과 중 특정 blogId 글의 순위(없으면 null)
 *
 * 외부 호출은 `app/lib/fetchRetry.ts`의 `fetchWithRetry`를 사용해 일시 오류·타임아웃에 견딤.
 * 동시성·간격은 호출자(/api/blog-diagnose)에서 제어.
 */

import { fetchWithRetry } from '../fetchRetry';

const NAVER_OPENAPI = 'https://openapi.naver.com/v1/search/blog.json';

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;        // ISO
  category: string | null;
  contentSnippet: string; // RSS 본문 일부 (HTML stripped)
  contentLength: number;  // 글자수 추정 (공백 포함, RSS 잘려있을 수 있음)
  imageCount: number;     // RSS에 포함된 <img> 개수
}

export interface RssSummary {
  blogId: string;
  title: string;
  link: string;
  description: string;
  items: RssItem[];
}

export interface BlogSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string; // YYYYMMDD
}

/** 사용자가 입력한 다양한 형식에서 표준 blogId 추출.
 *  허용:
 *    - "myblog"
 *    - "https://blog.naver.com/myblog"
 *    - "https://blog.naver.com/myblog/12345"
 *    - "https://m.blog.naver.com/myblog"
 *    - "blog.naver.com/PostList.naver?blogId=myblog"
 */
export function extractBlogId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // bare id
  if (/^[a-zA-Z0-9_]{2,40}$/.test(s)) return s;
  // PostList.naver?blogId=foo
  const qm = s.match(/[?&]blogId=([a-zA-Z0-9_]+)/i);
  if (qm) return qm[1];
  // blog.naver.com path
  const pm = s.match(/blog\.naver\.com\/([a-zA-Z0-9_]+)/i);
  if (pm) return pm[1];
  return null;
}

/** XML 한 항목에서 태그 값을 안전하게 추출 — 정규식 기반 미니 파서.
 *  CDATA 와 일반 텍스트 모두 처리.
 */
function pickTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** stripHtml 과 같지만 블록 경계(p·div·h·li·br 등)를 줄바꿈으로 보존.
 *  메이트/코치의 소제목·도입부·문단 단위 분석에 필요 (한 줄로 뭉개면 구조 신호 소실). */
function stripHtmlPreserveLines(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|blockquote|figcaption)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function countTags(html: string, tag: string): number {
  const re = new RegExp(`<${tag}\\b`, 'gi');
  const m = html.match(re);
  return m ? m.length : 0;
}

/** 블로그 RSS 가져와서 최근 글 메타·본문 일부 파싱. */
export async function fetchRss(blogId: string): Promise<RssSummary | null> {
  const url = `https://rss.blog.naver.com/${encodeURIComponent(blogId)}.xml`;
  let xml: string;
  try {
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BohemeBlogLab/1.0; +https://bohemebloglab.com)',
        Accept: 'application/rss+xml, text/xml, */*;q=0.8',
      },
      cache: 'no-store',
      retries: 2,
      timeoutMs: 10_000,
    });
    if (!res.ok) return null;
    xml = await res.text();
  } catch {
    return null;
  }

  const channelMatch = xml.match(/<channel>([\s\S]*?)<\/channel>/i);
  if (!channelMatch) return null;
  const channel = channelMatch[1];

  const channelTitle = pickTag(channel, 'title');
  const channelLink  = pickTag(channel, 'link');
  const channelDesc  = pickTag(channel, 'description');

  const items: RssItem[] = [];
  const itemMatches = channel.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
  for (const raw of itemMatches) {
    const inner = raw.replace(/^<item>|<\/item>$/gi, '');
    const title = stripHtml(pickTag(inner, 'title'));
    const link = pickTag(inner, 'link');
    const pubRaw = pickTag(inner, 'pubDate');
    const category = stripHtml(pickTag(inner, 'category')) || null;
    const desc = pickTag(inner, 'description');
    const content = pickTag(inner, 'content:encoded') || desc;
    const imageCount = countTags(content, 'img');
    const stripped = stripHtml(content);
    const contentLength = stripped.length;
    const contentSnippet = stripped.slice(0, 280);

    let pubDateIso = pubRaw;
    const d = new Date(pubRaw);
    if (!Number.isNaN(d.getTime())) pubDateIso = d.toISOString();

    items.push({ title, link, pubDate: pubDateIso, category, contentSnippet, contentLength, imageCount });
  }

  return {
    blogId,
    title: stripHtml(channelTitle),
    link: channelLink,
    description: stripHtml(channelDesc),
    items,
  };
}

/** 네이버 블로그 검색 결과 + 메타(총 문서수). */
export interface BlogSearchResult {
  items: BlogSearchItem[];
  total: number;        // 해당 쿼리의 총 블로그 문서 수 (경쟁도 프록시)
}

/** 네이버 블로그 검색 API 호출 — 결과 + total(경쟁도) 동반.
 *  실패 시 null. total 은 진단 노출 점수의 경쟁도 가중에 사용.
 */
export async function searchBlogWithMeta(
  query: string,
  display: number = 30,
): Promise<BlogSearchResult | null> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const url = `${NAVER_OPENAPI}?query=${encodeURIComponent(query)}&display=${display}&sort=sim`;
    const res = await fetchWithRetry(url, {
      headers: {
        'X-Naver-Client-Id': id,
        'X-Naver-Client-Secret': secret,
      },
      cache: 'no-store',
      retries: 2,
      timeoutMs: 10_000,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = Array.isArray(data.items) ? (data.items as BlogSearchItem[]) : [];
    const total = typeof data.total === 'number' ? data.total : items.length;
    return { items, total };
  } catch {
    return null;
  }
}

/** 네이버 블로그 검색 API 호출. display 30이면 1페이지 노출 후보.
 *  실패 시 null 반환 (호출자가 graceful degradation).
 */
export async function searchBlogByQuery(
  query: string,
  display: number = 30,
): Promise<BlogSearchItem[] | null> {
  const r = await searchBlogWithMeta(query, display);
  return r ? r.items : null;
}

/** 검색 결과 안에서 특정 blogId 글의 1순위 위치(1-based)를 찾음. 없으면 null. */
export function findRankInResults(
  items: BlogSearchItem[],
  blogId: string,
): number | null {
  const needle = blogId.toLowerCase();
  for (let i = 0; i < items.length; i++) {
    const link = (items[i].bloggerlink || items[i].link || '').toLowerCase();
    if (link.includes(`blog.naver.com/${needle}`) || link.includes(`/${needle}/`) || link.endsWith(`/${needle}`)) {
      return i + 1;
    }
  }
  return null;
}

/** RSS link → PostView.naver URL 로 변환.
 *  네이버 블로그 글 페이지는 iframe 으로 본문을 감싸기 때문에 그대로 fetch하면 본문이 안 보임.
 *  PostView.naver를 직접 호출하면 iframe 내부 본문 HTML을 직접 받아 정확한 글자수·이미지 수 측정 가능.
 *
 *  보안: 항상 `blog.naver.com` 도메인으로 고정해 SSRF 방지.
 *  RSS link가 외부 도메인을 가리키더라도 blogId/logNo만 추출해 우리가 안전한 URL을 다시 조립한다.
 */
function toPostViewUrl(postUrl: string): string | null {
  // 1) 표준 형태: blog.naver.com/{id}/{logNo}
  let blogId: string | null = null;
  let logNo: string | null = null;
  const pathMatch = postUrl.match(/blog\.naver\.com\/([a-zA-Z0-9_]+)\/(\d+)/i);
  if (pathMatch) {
    blogId = pathMatch[1];
    logNo = pathMatch[2];
  } else {
    // 2) 쿼리 파라미터 형태: ?blogId=foo&logNo=12345 — 호스트는 무시하고 파라미터만 신뢰
    const idMatch = postUrl.match(/[?&]blogId=([a-zA-Z0-9_]+)/i);
    const noMatch = postUrl.match(/[?&]logNo=(\d+)/i);
    if (idMatch && noMatch) {
      blogId = idMatch[1];
      logNo = noMatch[1];
    }
  }
  if (!blogId || !logNo) return null;
  // ID/logNo 형식 재검증 (정규식만으론 부족할 수 있어 한번 더 화이트리스트 검사)
  if (!/^[a-zA-Z0-9_]{2,40}$/.test(blogId)) return null;
  if (!/^\d{1,20}$/.test(logNo)) return null;
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
}

export interface PostBodyMetrics {
  contentLength: number;
  imageCount: number;
  /** 본문 평문(줄바꿈 보존). 메이트/코치 휴리스틱 분석용. 페이로드 안전 위해 상한 캡. */
  text: string;
}

/** 본문 컨테이너 시작점부터 문서 끝까지 슬라이스하면 댓글·관련글·태그·플로팅 위젯의
 *  이미지/글자까지 포함되어 글자수·이미지 수가 과대 측정됨. 본문 뒤에 흔히 등장하는
 *  경계 마커 중 가장 먼저 나오는 지점에서 잘라 본문 영역만 남긴다. (최소 본문은 보존) */
const REGION_END_MARKERS = [
  'id="comment', 'area_comment', 'wrap_postcomment', 'u_cbox', 'naverComment',
  'BlogTopReadFloating', 'post_footer', 'id="recommend', 'related_post',
  'wrap_tag', 'post_tag', 'btn_recommend', 'area_sympathy',
];
function boundPostRegion(region: string): string {
  let cut = region.length;
  for (const m of REGION_END_MARKERS) {
    const idx = region.indexOf(m);
    if (idx > 300 && idx < cut) cut = idx;
  }
  return region.slice(0, cut);
}

/** 네이버 블로그 글 본문(HTML) 가져와 글자수·이미지 수 추출.
 *
 *  RSS의 description은 잘려있어 부정확하므로, 정확한 quality 측정에는 실제 본문 페이지가 필요.
 *  본문 컨테이너 우선순위:
 *    1) `.se-main-container`  — 스마트에디터 ONE (현행)
 *    2) `#postViewArea`        — 구 에디터
 *    3) `<body>` 전체          — fallback
 *
 *  실패 시(타임아웃·네트워크 오류·매칭 실패) null. 호출자는 RSS 값 유지.
 */
export async function fetchPostBody(postUrl: string): Promise<PostBodyMetrics | null> {
  const viewUrl = toPostViewUrl(postUrl);
  if (!viewUrl) return null;
  try {
    const res = await fetchWithRetry(viewUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BohemeBlogLab/1.0; +https://bohemebloglab.com)',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      cache: 'no-store',
      retries: 1,
      timeoutMs: 8_000,
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length < 500) return null;

    let region = '';
    const seIdx = html.search(/<div[^>]*class=["'][^"']*se-main-container[^"']*["'][^>]*>/i);
    if (seIdx >= 0) {
      region = html.slice(seIdx);
    } else {
      const oldIdx = html.search(/<div[^>]*id=["']postViewArea["'][^>]*>/i);
      if (oldIdx >= 0) {
        region = html.slice(oldIdx);
      } else {
        const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
        region = bodyMatch ? bodyMatch[0] : html;
      }
    }

    // 본문 뒤 댓글·관련글·태그 위젯 컷 → 글자수·이미지 과대측정 방지.
    region = boundPostRegion(region);

    const imageCount = countTags(region, 'img');
    const plain = stripHtml(region);            // 단일 공백 — 글자수 측정용 (기존 기준 유지)
    const contentLength = plain.length;
    if (contentLength < 50) return null;
    // 줄바꿈 보존 텍스트 — 메이트/코치 분석용. 8,000자 캡(분석엔 충분, 페이로드 안전).
    const text = stripHtmlPreserveLines(region).slice(0, 8000);
    return { contentLength, imageCount, text };
  } catch {
    return null;
  }
}
