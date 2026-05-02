-- 사용자 프로필 (커뮤니티 공통)
-- Supabase 대시보드 > SQL Editor 에 전체 내용을 붙여넣고 실행하세요.

create extension if not exists pg_trgm;

create table if not exists public.profiles (
  user_id          uuid primary key references auth.users on delete cascade,
  nickname         text not null unique check (char_length(nickname) between 2 and 16),
  blog_url         text check (blog_url is null or char_length(blog_url) <= 300),
  category         text,                                    -- 주 활동 분야 (선택)
  bio              text check (bio is null or char_length(bio) <= 200),
  nickname_changed_at timestamptz default now(),            -- 닉네임 24h 1회 정책
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists profiles_nickname_trgm_idx
  on public.profiles using gin (nickname gin_trgm_ops);

alter table public.profiles enable row level security;

-- 모두 조회 가능 (커뮤니티 게시글 작성자 정보 노출용)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 본인만 INSERT
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- 본인만 UPDATE — 닉네임 변경은 24시간 1회 (BEFORE UPDATE 트리거에서 강제)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 닉네임 변경 시 24시간 cooldown 강제
create or replace function public.enforce_nickname_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.nickname is distinct from old.nickname then
    if old.nickname_changed_at is not null
       and old.nickname_changed_at > now() - interval '24 hours' then
      raise exception '닉네임은 24시간에 1회만 변경할 수 있습니다.'
        using errcode = 'P0001';
    end if;
    new.nickname_changed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enforce_nickname_cooldown_trg on public.profiles;
create trigger enforce_nickname_cooldown_trg
  before update on public.profiles
  for each row
  execute procedure public.enforce_nickname_cooldown();
