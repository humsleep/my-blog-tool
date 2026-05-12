/**
 * AI 초안 출력 포맷 변환 유틸
 *
 * - markdownToHtml: 네이버 스마트에디터 호환 안전 HTML
 *   허용 태그: h2 / h3 / p / strong / ul / ol / li / blockquote / br /
 *             table / thead / tbody / tr / th / td
 *   (em·code 는 네이버 paste 시 서식이 손실되는 케이스가 있어 strong 으로 통일)
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
  // 이미 escapeHtml 처리된 문자열에 대해 인라인 마크다운만 변환.
  // 네이버 호환을 위해 em/code 도 모두 strong 으로 통일 — em 은 네이버에서
  // 서식이 자주 사라지고, code 는 monospace 가 제거돼 의미 손실이 생긴다.
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<strong>$2</strong>')
    .replace(/`([^`\n]+?)`/g, '<strong>$1</strong>');
}

/**
 * markdown table 의 셀 행을 파싱.
 *   `| 헤더1 | 헤더2 |` → ['헤더1', '헤더2']
 *   앞뒤 파이프 제거 후 \| 로 분할. 이스케이프된 \\| 는 그대로 둠.
 */
function parseTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/**
 * separator 행 판정.
 *   `|---|---|`, `| :--- | :---: | ---: |` 등.
 *   대시 한 개 이상이 반드시 포함되어야 일반 표 행과 구분된다.
 */
function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith('|') || !t.endsWith('|')) return false;
  if (!/-/.test(t)) return false;
  // 셀 내용이 모두 [-:\s] 로만 이뤄져야 함
  return parseTableRow(t).every((c) => /^:?-+:?$/.test(c));
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

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const escaped = escapeHtml(line);

    // 표 감지: 현재 라인이 |..| 이고 다음 라인이 separator 면 markdown table.
    // 네이버 에디터·티스토리 모두 <table><thead><tbody> 구조를 받으면
    // 실제 표로 렌더링하므로, clipboard 의 text/html 에 이 구조를 넣는다.
    const next = (lines[i + 1] || '').trimEnd();
    const trimmed = line.trim();
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      trimmed.length > 2 &&
      isTableSeparator(next)
    ) {
      closeLists();
      closeQuote();
      const headerCells = parseTableRow(line);
      i += 2; // 헤더 + separator 건너뜀
      const bodyRows: string[][] = [];
      while (i < lines.length) {
        const r = lines[i].trimEnd();
        const rt = r.trim();
        if (!rt.startsWith('|') || !rt.endsWith('|')) break;
        bodyRows.push(parseTableRow(r));
        i++;
      }
      i--; // for 증가분 보정

      const thead =
        '<thead><tr>' +
        headerCells.map((c) => `<th>${inlineMd(escapeHtml(c))}</th>`).join('') +
        '</tr></thead>';
      const tbody = bodyRows.length
        ? '<tbody>' +
          bodyRows
            .map(
              (row) =>
                '<tr>' +
                row.map((c) => `<td>${inlineMd(escapeHtml(c))}</td>`).join('') +
                '</tr>',
            )
            .join('') +
          '</tbody>'
        : '';
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

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
    // markdown table separator 라인 삭제 (`|---|---|`)
    .replace(/^\s*\|?[\s\-:|]+\|[\s\-:|]+$\n?/gm, '')
    // table row 의 양끝 파이프 제거 + 셀 구분 파이프를 탭 형태 공백으로
    .replace(/^\s*\|(.*)\|\s*$/gm, (_, inner) =>
      inner.split('|').map((c: string) => c.trim()).join('    '),
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
