import { getClientIp, hashIp } from './ip-hash';

/**
 * 외부 비용 발생 API(네이버 검색광고/OpenAPI 등)를 봇·스크래퍼로부터 보호하는
 * 가벼운 in-memory sliding-window rate limit.
 *
 *  - 서버리스(Vercel) 환경에서는 인스턴스가 분산·콜드 스타트로 리셋될 수 있다.
 *    단일 인스턴스에서 한 IP가 짧게 폭주하는 케이스는 잘 차단되지만,
 *    분산 봇 공격 방어는 별도(예: Vercel Edge Middleware + Upstash)가 필요.
 *  - IP 평문을 저장하지 않고 SHA-256(salt + IP) 해시만 사용 (개인정보 영향 최소화).
 *  - 윈도우 안에서 호출 시각 배열을 유지하고, 호출 시점에 만료된 항목만 제거.
 *
 *  사용 예:
 *    const rl = checkRateLimit(request, { limit: 20, windowMs: 60_000, bucket: 'keywords' });
 *    if (!rl.allowed) return tooManyRequests(rl);
 */

type Bucket = string;

interface Entry {
  timestamps: number[];
}

interface BucketStore {
  store: Map<string, Entry>;
  /** sweep 주기에 한 번씩 만료 항목 일괄 정리 — 메모리 누수 방어 */
  lastSweepAt: number;
}

const BUCKETS: Map<Bucket, BucketStore> = new Map();
const SWEEP_INTERVAL_MS = 5 * 60_000; // 5분마다 한 번
const MAX_ENTRIES_PER_BUCKET = 5_000; // 한 인스턴스당 메모리 상한

interface CheckOptions {
  /** 윈도우 안에서 허용되는 호출 횟수 */
  limit: number;
  /** 윈도우 길이(ms). 기본 60_000 = 1분 */
  windowMs?: number;
  /** 라우트별로 분리하고 싶을 때의 키. 미지정 시 'default' */
  bucket?: Bucket;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** 다음 호출 가능 시각(ms epoch). allowed=true 라도 윈도우 종료 시각으로 채워짐 */
  resetAt: number;
  /** allowed=false 일 때, 다음 호출까지 대기해야 하는 초 단위 (Retry-After 헤더용) */
  retryAfterSec: number;
}

export function checkRateLimit(req: Request, opts: CheckOptions): RateLimitResult {
  const limit = opts.limit;
  const windowMs = opts.windowMs ?? 60_000;
  const bucketName = opts.bucket ?? 'default';

  // IP 해시 — IP_HASH_SALT 미설정이면 throw 되므로 그대로 호출자에게 위임
  const ip = getClientIp(req);
  const key = hashIp(ip);

  const now = Date.now();

  let bucket = BUCKETS.get(bucketName);
  if (!bucket) {
    bucket = { store: new Map(), lastSweepAt: now };
    BUCKETS.set(bucketName, bucket);
  }

  // 주기적 sweep — 만료된 키 일괄 제거
  if (now - bucket.lastSweepAt > SWEEP_INTERVAL_MS) {
    for (const [k, e] of bucket.store) {
      const fresh = e.timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) bucket.store.delete(k);
      else e.timestamps = fresh;
    }
    bucket.lastSweepAt = now;
  }

  // 인스턴스 메모리 상한 초과 시 가장 오래된 항목 가지치기
  if (bucket.store.size > MAX_ENTRIES_PER_BUCKET) {
    const oldestKey = bucket.store.keys().next().value;
    if (oldestKey) bucket.store.delete(oldestKey);
  }

  const entry = bucket.store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const resetAt = oldest + windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    bucket.store.set(key, entry);
    return { allowed: false, remaining: 0, resetAt, retryAfterSec };
  }

  entry.timestamps.push(now);
  bucket.store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
    retryAfterSec: 0,
  };
}

/** 429 응답을 한 줄로 만들어주는 헬퍼 */
export function tooManyRequestsResponse(rl: RateLimitResult, message?: string): Response {
  return new Response(
    JSON.stringify({
      error:
        message ??
        '요청이 너무 잦아요. 잠시 후 다시 시도해주세요.',
      retryAfter: rl.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rl.retryAfterSec),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
      },
    },
  );
}
