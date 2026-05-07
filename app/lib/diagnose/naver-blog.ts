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

/** 네이버 블로그 검색 API 호출. display 30이면 1페이지 노출 후보.
 *  실패 시 null 반환 (호출자가 graceful degradation).
 */
export async function searchBlogByQuery(
  query: string,
  display: number = 30,
): Promise<BlogSearchItem[] | null> {
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
    return Array.isArray(data.items) ? (data.items as BlogSearchItem[]) : [];
  } catch {
    return null;
  }
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
