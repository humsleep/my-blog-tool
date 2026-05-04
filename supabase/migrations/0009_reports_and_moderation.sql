-- 신고 / 자동 숨김 / 차단 시스템
-- 신고 5건 누적 시 트리거가 대상 글의 is_hidden = true 로 자동 변환.

-- ── 1) 신고 대상 종류 enum ──
do $$ begin
  create type public.report_target as enum ('swap_post', 'tips_post', 'tips_comment', 'companion_post');
exception
  when duplicate_object then null;
end $$;

-- ── 2) reports 테이블 ──
create table if not exists public.reports (
  id           bigserial primary key,
  reporter_id  uuid not null references auth.users on delete cascade,
  target_type  public.report_target not null,
  target_id    bigint not null,
  reason_code  text not null check (reason_code in ('spam','abuse','adult','privacy','illegal','etc')),
  detail       text check (detail is null or char_length(detail) <= 500),
  created_at   timestamptz default now(),
  unique (reporter_id, target_type, target_id)        -- 같은 글에 1인 1신고
);

create index if not exists reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- 신고는 본인 신고만 조회/생성 가능
drop policy if exists "Users view own reports" on public.reports;
create policy "Users view own reports"
  on public.reports for select using (auth.uid() = reporter_id);

drop policy if exists "Users insert own report" on public.reports;
create policy "Users insert own report"
  on public.reports for insert
  with check (
    auth.uid() = reporter_id
    -- 분당 신고 5건 제한 (악용 방지)
    and (
      select count(*) from public.reports
      where reporter_id = auth.uid()
        and created_at > now() - interval '1 minute'
    ) < 5
  );

-- ── 3) blocked_users (운영자가 직접 관리, 클라이언트 접근 불가) ──
create table if not exists public.blocked_users (
  user_id    uuid primary key references auth.users on delete cascade,
  reason     text,
  blocked_at timestamptz default now()
);

alter table public.blocked_users enable row level security;
-- 정책 없음 → service_role만 INSERT/DELETE. 운영자는 Supabase Dashboard에서.

-- ── 4) is_hidden 컬럼 추가 (기존 테이블 변경) ──
alter table public.swap_posts      add column if not exists is_hidden boolean default false;
alter table public.tips_posts      add column if not exists is_hidden boolean default false;
alter table public.tips_comments   add column if not exists is_hidden boolean default false;
alter table public.companion_posts add column if not exists is_hidden boolean default false;

create index if not exists swap_posts_visible_idx
  on public.swap_posts (is_hidden, created_at desc) where is_hidden = false;
create index if not exists tips_posts_visible_idx
  on public.tips_posts (is_hidden, created_at desc) where is_hidden = false;
create index if not exists tips_comments_visible_idx
  on public.tips_comments (is_hidden, post_id) where is_hidden = false;
create index if not exists companion_posts_visible_idx
  on public.companion_posts (is_hidden, visit_date) where is_hidden = false;

-- ── 5) 자동 숨김 트리거: 신고 5건 누적 시 대상 is_hidden = true ──
create or replace function public.auto_hide_on_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.reports
  where target_type = new.target_type
    and target_id   = new.target_id;

  if cnt >= 5 then
    if new.target_type = 'swap_post' then
      update public.swap_posts set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'tips_post' then
      update public.tips_posts set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'tips_comment' then
      update public.tips_comments set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'companion_post' then
      update public.companion_posts set is_hidden = true where id = new.target_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists auto_hide_trg on public.reports;
create trigger auto_hide_trg
  after insert on public.reports
  for each row execute procedure public.auto_hide_on_reports();

-- ── 6) 본인 차단 사용자도 작성 차단 ──
-- swap/tips/companion INSERT에 blocked_users 검사 추가
drop policy if exists "Users insert swap once per day" on public.swap_posts;
create policy "Users insert swap once per day"
  on public.swap_posts for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.blocked_users where user_id = auth.uid())
    and not exists (
      select 1 from public.swap_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    )
  );

drop policy if exists "Users insert own tips with rate limit" on public.tips_posts;
create policy "Users insert own tips with rate limit"
  on public.tips_posts for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.blocked_users where user_id = auth.uid())
    and (
      select count(*) from public.tips_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 5
  );

drop policy if exists "Users insert comment with rate limit" on public.tips_comments;
create policy "Users insert comment with rate limit"
  on public.tips_comments for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.blocked_users where user_id = auth.uid())
    and (
      select count(*) from public.tips_comments
      where user_id = auth.uid()
        and created_at > now() - interval '1 minute'
    ) < 5
    and (
      select count(*) from public.tips_comments
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 100
  );

drop policy if exists "Users insert companion with rate limit" on public.companion_posts;
create policy "Users insert companion with rate limit"
  on public.companion_posts for insert
  with check (
    auth.uid() = user_id
    and visit_date >= current_date
    and not exists (select 1 from public.blocked_users where user_id = auth.uid())
    and (
      select count(*) from public.companion_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 3
  );
