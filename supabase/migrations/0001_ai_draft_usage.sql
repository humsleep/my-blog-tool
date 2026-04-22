-- AI 초안 생성 일일 사용량 추적 테이블
-- Supabase 대시보드 > SQL Editor 에 전체 내용을 붙여넣고 실행하세요.

create table if not exists public.ai_draft_usage (
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  count int not null default 0 check (count >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id, date)
);

-- RLS 활성화: 자기 데이터만 읽기 가능 (쓰기는 API에서 service role 없이도 가능하도록 별도 정책)
alter table public.ai_draft_usage enable row level security;

-- 사용자 본인 레코드 조회 허용
drop policy if exists "Users can view own usage" on public.ai_draft_usage;
create policy "Users can view own usage"
  on public.ai_draft_usage
  for select
  using (auth.uid() = user_id);

-- 사용자 본인 레코드 삽입 허용 (API가 anon 키로 호출될 때)
drop policy if exists "Users can insert own usage" on public.ai_draft_usage;
create policy "Users can insert own usage"
  on public.ai_draft_usage
  for insert
  with check (auth.uid() = user_id);

-- 사용자 본인 레코드 갱신 허용
drop policy if exists "Users can update own usage" on public.ai_draft_usage;
create policy "Users can update own usage"
  on public.ai_draft_usage
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.ai_draft_usage;
create trigger set_updated_at
  before update on public.ai_draft_usage
  for each row
  execute procedure public.handle_updated_at();
