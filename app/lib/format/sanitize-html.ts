/**
 * 브라우저 DOMParser 기반 화이트리스트 sanitizer.
 * Quill 에디터 출력 + 외부 마크다운 변환 결과를 안전하게 정화한다.
 *
 * 차단:
 *  - <script> / <iframe> / <object> / <embed> / <form> / <input> / <link> / <meta>
 *  - on* 이벤트 핸들러 속성 모두 (onclick, onerror, onload, ...)
 *  - javascript:, data:, vbscript: 스킴의 href/src
 *  - <style> 태그
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a',
  'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

/** 태그별 허용 속성. 명시 안 된 태그는 속성 모두 제거. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a:    new Set(['href', 'title', 'target', 'rel']),
  img:  new Set(['src', 'alt', 'title', 'width', 'height']),
  span: new Set(['class']),
  p:    new Set(['class']),
  div:  new Set(['class']),
};

const SAFE_URL_RE = /^(?:https?:|mailto:|tel:|\/|#)/i;

function isSafeUrl(url: string): boolean {
  return SAFE_URL_RE.test(url.trim());
}

function cleanElement(el: Element): void {
  const tag = el.tagName.toLowerCase();

  // 허용 안 된 태그 → 자식만 보존하고 자신 제거
  if (!ALLOWED_TAGS.has(tag)) {
    while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
    el.remove();
    return;
  }

  // 모든 속성 검사
  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();

    // on* 이벤트 핸들러 모두 제거
    if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
    // style 속성 차단 (CSS injection 방지)
    if (name === 'style') { el.removeAttribute(attr.name); continue; }
    // 허용 목록 외 속성 제거
    if (!allowed.has(name)) { el.removeAttribute(attr.name); continue; }
    // href / src 스킴 검사
    if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
      el.removeAttribute(attr.name);
      continue;
    }
  }

  // a 태그가 외부 링크면 rel/target 안전하게 강제
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    if (/^https?:/i.test(href)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }

  // 자식 재귀 처리
  const children = Array.from(el.children);
  for (const child of children) cleanElement(child);
}

/**
 * 브라우저 환경에서만 동작. SSR에선 입력값 그대로 반환.
 */
export function sanitizeQuillHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  const children = Array.from(root.children);
  for (const child of children) cleanElement(child);
  return root.innerHTML;
}
