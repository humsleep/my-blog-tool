export interface ClientFetchOptions extends RequestInit {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function clientFetchJson<T>(
  url: string,
  options: ClientFetchOptions = {}
): Promise<T> {
  const { retries = 2, timeoutMs = 15000, baseDelayMs = 600, ...init } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (response.status === 429 || response.status === 503) {
        if (attempt < retries) {
          const retryAfter = Number(response.headers.get('retry-after'));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : baseDelayMs * 2 ** attempt;
          await sleep(delay);
          continue;
        }
        throw new ApiError(response.status, '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
      }

      if (!response.ok) {
        let message = `요청 실패 (HTTP ${response.status})`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new ApiError(response.status, message);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      if (error instanceof ApiError && error.status !== 429 && error.status !== 503) {
        throw error;
      }

      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  if (lastError instanceof Error) {
    if (lastError.name === 'AbortError') {
      throw new ApiError(0, '응답 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
    }
    throw new ApiError(0, lastError.message || '네트워크 오류가 발생했습니다.');
  }
  throw new ApiError(0, '알 수 없는 오류가 발생했습니다.');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 응답을 JSON으로 안전하게 파싱한다.
 *  - response.json() 은 본문이 비-JSON 이면 SyntaxError 로 throw → 사용자 화면이 깨짐
 *  - 본 함수는 항상 객체를 반환하고, 파싱 실패 / 비어있는 본문 시 _parseError 사유를 담음
 *
 *  운영에서 흔한 비-JSON 응답:
 *    - Vercel maxDuration 초과 → "An error occurred ..." (plain text)
 *    - Anthropic 529 (overload) → 짧은 텍스트 + HTML
 *    - 게이트웨이 5xx → HTML 에러 페이지
 */
export type SafeJsonResult<T> = Partial<T> & { _parseError?: string; _raw?: string };

export async function safeJson<T = Record<string, unknown>>(
  response: Response,
): Promise<SafeJsonResult<T>> {
  let text = '';
  try {
    text = await response.text();
  } catch (err) {
    return {
      _parseError: err instanceof Error ? err.message : 'response read failed',
      _raw: '',
    } as SafeJsonResult<T>;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { _parseError: 'empty body', _raw: '' } as SafeJsonResult<T>;
  }
  try {
    return JSON.parse(trimmed) as SafeJsonResult<T>;
  } catch {
    return {
      _parseError: 'non-JSON response',
      _raw: trimmed.slice(0, 200),
    } as SafeJsonResult<T>;
  }
}
