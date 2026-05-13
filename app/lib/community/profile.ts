import { createClient } from '@/app/lib/supabase/client';

export interface Profile {
  user_id: string;
  nickname: string;
  blog_url: string | null;
  category: string | null;
  bio: string | null;
  nickname_changed_at: string;
  created_at: string;
  updated_at: string;
  // 0010 마이그레이션에서 추가된 컬럼들 — select('*') 시 함께 들어옴.
  saved_keywords?: string[] | null;
  prompt_preset?: Record<string, unknown> | null;
}

export const NICKNAME_RE = /^[A-Za-z0-9가-힣_-]{2,16}$/;

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (!trimmed) return '닉네임을 입력해주세요.';
  if (trimmed.length < 2) return '닉네임은 2자 이상이어야 합니다.';
  if (trimmed.length > 16) return '닉네임은 16자 이하로 입력해주세요.';
  if (!NICKNAME_RE.test(trimmed)) {
    return '닉네임은 한글·영문·숫자·_·- 만 사용할 수 있습니다.';
  }
  return null;
}

export function validateBlogUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return 'URL은 http(s)://로 시작해야 합니다.';
    }
    if (trimmed.length > 300) return 'URL이 너무 깁니다.';
    return null;
  } catch {
    return '올바른 URL 형식이 아닙니다.';
  }
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}
