import crypto from 'node:crypto';

/**
 * Vercel/Edge 환경에서 클라이언트 IP를 추출하고 SHA-256 해시한다.
 * 평문 IP는 절대 저장하지 않으며, 해시는 일일 한도 적용 목적으로만 사용.
 */

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'boheme-bloglab-default-salt';
  return crypto.createHash('sha256').update(`${salt}|${ip}`).digest('hex');
}
