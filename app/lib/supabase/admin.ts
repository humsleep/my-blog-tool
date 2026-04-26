/**
 * Supabase service_role 클라이언트
 *
 * ⚠️ 절대 클라이언트 컴포넌트에서 import 하지 말 것.
 *    이 파일은 API 라우트(서버 전용)에서만 사용된다.
 *    service_role 키는 RLS를 우회하므로 anon 사용자 트래킹 등 제한적 용도로만 사용.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
