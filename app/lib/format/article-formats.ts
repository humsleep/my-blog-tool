/**
 * AI 초안 출력 포맷 변환 유틸
 *
 * - markdownToHtml: 네이버 블로그 호환 안전 HTML (h2/h3/p/strong/em/ul/ol/li/blockquote/br)
 * - markdownToPlain: 마크다운 기호 제거한 일반 텍스트
 * - escapeHtml: XSS 방어용 HTML 이스케이프
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 네이버 OpenAPI 검색 결과의 강조 표시(`<b>키워드</b>`)만 허용하고
 * 나머지 HTML은 모두 escape하는 sanitizer.
 * dangerouslySetInnerHTML 직전에 반드시 통과시킬 것.
 */
export function sanitizeSearchHighlight(html: string): string {
  return escapeHtml(html ?? '')
    .replace(/&lt;b&gt;/g, '<b>')
    .replace(/&lt;\/b&gt;/g, '</b>');
}

function inlineMd(s: string): string {
  // 이미 escapeHtml 처리된 문자열에 대해 인라인 마크다운만 변환
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>');
}

/** 마크다운 → 네이버 호환 HTML */
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;

  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const escaped = escapeHtml(line);

    if (/^###\s+/.test(line)) {
      closeLists();
      closeQuote();
      out.push(`<h3>${inlineMd(escaped.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeLists();
      closeQuote();
      out.push(`<h2>${inlineMd(escaped.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeLists();
      closeQuote();
      out.push(`<h2>${inlineMd(escaped.replace(/^#\s+/, ''))}</h2>`);
    } else if (/^>\s?/.test(line)) {
      closeLists();
      if (!inQuote) {
        out.push('<blockquote>');
        inQuote = true;
      }
      out.push(`<p>${inlineMd(escaped.replace(/^&gt;\s?/, ''))}</p>`);
    } else if (/^\d+\.\s+/.test(line)) {
      closeQuote();
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inlineMd(escaped.replace(/^\d+\.\s+/, ''))}</li>`);
    } else if (/^[-*]\s+/.test(line)) {
      closeQuote();
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inlineMd(escaped.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeLists();
      closeQuote();
      out.push('');
    } else {
      closeLists();
      closeQuote();
      out.push(`<p>${inlineMd(escaped)}</p>`);
    }
  }

  closeLists();
  closeQuote();
  return out.filter((s) => s.length > 0).join('\n');
}

/** 마크다운 → 일반 텍스트 (기호 제거, 단락만 유지) */
export function markdownToPlain(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1$2')
    .replace(/`([^`\n]+?)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '· ')
    .replace(/^(\d+)\.\s+/gm, '$1. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
