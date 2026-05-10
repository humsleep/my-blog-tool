/**
 * Postgres `LIKE` 와일드카드(`%`, `_`, `\`) escape.
 * 사용자 입력을 ilike에 그대로 넣을 때 의도치 않은 매칭(`%` → 모든 결과) 방지.
 *
 * Supabase JS 클라이언트는 SQL injection은 막지만 LIKE 와일드카드는 escape하지 않는다.
 */
export function escapeLikePattern(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&');
}

/**
 * `?next=` 같은 파라미터로 받은 redirect 경로를 안전하게 정규화한다.
 *
 * 허용:
 *   - 동일 도메인의 path-only ("/foo", "/community/swap?x=1")
 *   - 인코딩된 path ("%2Fcommunity%2Fswap" → "/community/swap")
 *
 * 차단:
 *   - 절대 URL ("https://evil.com/foo")
 *   - protocol-relative ("//evil.com/foo")
 *   - data:, javascript:, file: 등 위험 스킴
 *   - 빈 값
 *
 * 안전하지 않으면 `fallback` 반환.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;
  // 인코딩된 형태로 들어왔을 수 있음 — 한 단계 풀어서 검증
  let candidate = next;
  if (candidate.includes('%')) {
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      return fallback;
    }
  }
  // 1) 반드시 "/" 로 시작
  if (!candidate.startsWith('/')) return fallback;
  // 2) "//..." (protocol-relative) 차단
  if (candidate.startsWith('//')) return fallback;
  // 3) "/\\..." 같은 변종 차단 (일부 브라우저가 백슬래시를 슬래시로 해석)
  if (candidate.startsWith('/\\')) return fallback;
  // 4) "javascript:" 등 스킴 차단 (path 안에 들어올 수 없지만 방어적으로)
  if (/^\/?\s*(javascript|data|vbscript|file):/i.test(candidate)) return fallback;
  return candidate;
}
