-- 비로그인 사용자 일일 AI 초안 사용량 추적 (IP 해시 기반)
-- Supabase 대시보드 > SQL Editor 에 전체 내용을 붙여넣고 실행하세요.
--
-- 주의: 평문 IP는 저장하지 않으며, 서버에서 SHA-256 해시(salt 적용)된 값만 저장합니다.
-- RLS 활성화 + 정책 없음 → anon/authenticated 클라이언트는 직접 접근 불가.
-- 서버 라우트에서 SUPABASE_SERVICE_ROLE_KEY 로만 INSERT/UPDATE 가능합니다.

create table if not exists public.anon_draft_usage (
  ip_hash text not null,
  date date not null,
  count int not null default 0 check (count >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (ip_hash, date)
);

alter table public.anon_draft_usage enable row level security;

-- 명시적으로 anon/authenticated 차단 (정책 없음 = 모두 차단)
-- service_role 은 RLS 우회하므로 별도 정책 불필요

-- updated_at 자동 갱신 트리거 (handle_updated_at은 0001 마이그레이션에서 이미 정의됨)
drop trigger if exists set_anon_updated_at on public.anon_draft_usage;
create trigger set_anon_updated_at
  before update on public.anon_draft_usage
  for each row
  execute procedure public.handle_updated_at();

-- 30일 이상 된 row 정리용 함수 (필요 시 cron으로 호출)
create or replace function public.cleanup_old_anon_draft_usage()
returns void
language sql
as $$
  delete from public.anon_draft_usage
  where date < (current_date - interval '30 days');
$$;
