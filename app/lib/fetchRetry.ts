export interface FetchRetryOptions extends RequestInit {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
}

export async function fetchWithRetry(
  input: string,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const { retries = 2, timeoutMs = 12000, baseDelayMs = 500, ...init } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
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
      }

      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: unknown failure');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry<T>(
  input: string,
  options: FetchRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(input, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new FetchError(response.status, text || response.statusText);
  }
  return response.json() as Promise<T>;
}

export class FetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'FetchError';
  }
}
