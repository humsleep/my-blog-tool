-- 비로그인 사용자 일일 블로그 진단 사용량 추적 (IP 해시 기반)
-- Supabase 대시보드 > SQL Editor 에 전체 내용을 붙여넣고 실행하세요.
--
-- 배경: 진단 1회는 네이버 API/스크래핑을 약 30건(본문 12편 + 내 글 키워드 검색 최대 18건)
--       호출한다. 기존에는 로그인 사용자만 12시간 1회 제한이 걸리고 비로그인은 무제한이라,
--       비로그인 남용 시 네이버 OpenAPI 쿼터 소진 + PostView/RSS IP 차단 위험이 있었다.
--       이 테이블로 비로그인도 1회/일 제한(app/api/blog-diagnose/route.ts)을 강제한다.
--
-- 주의: 평문 IP는 저장하지 않으며, 서버에서 SHA-256 해시(salt 적용)된 값만 저장합니다.
-- RLS 활성화 + 정책 없음 → anon/authenticated 클라이언트는 직접 접근 불가.
-- 서버 라우트에서 SUPABASE_SERVICE_ROLE_KEY 로만 SELECT/UPSERT 가능합니다.

create table if not exists public.anon_diagnose_usage (
  ip_hash text not null,
  date date not null,
  count int not null default 0 check (count >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (ip_hash, date)
);

alter table public.anon_diagnose_usage enable row level security;

-- 명시적으로 anon/authenticated 차단 (정책 없음 = 모두 차단)
-- service_role 은 RLS 우회하므로 별도 정책 불필요

-- updated_at 자동 갱신 트리거 (handle_updated_at은 0001 마이그레이션에서 이미 정의됨)
drop trigger if exists set_anon_diagnose_updated_at on public.anon_diagnose_usage;
create trigger set_anon_diagnose_updated_at
  before update on public.anon_diagnose_usage
  for each row
  execute procedure public.handle_updated_at();

-- 30일 이상 된 row 정리용 함수 (필요 시 cron으로 호출)
create or replace function public.cleanup_old_anon_diagnose_usage()
returns void
language sql
as $$
  delete from public.anon_diagnose_usage
  where date < (current_date - interval '30 days');
$$;
