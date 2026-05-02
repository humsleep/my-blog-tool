-- 체험단 동행 모집 게시글

do $$ begin
  create type public.companion_status as enum ('모집중', '마감', '완료');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.companion_time_slot as enum ('오전', '오후', '저녁', '협의');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.companion_posts (
  id              bigserial primary key,
  user_id         uuid not null references auth.users on delete cascade,
  nickname        text not null,
  title           text not null check (char_length(title) between 2 and 60),
  brand_name      text check (brand_name is null or char_length(brand_name) <= 80),
  region          text not null,
  visit_date      date not null,
  visit_time_slot public.companion_time_slot,
  participants    int default 1 check (participants between 1 and 10),
  contact_method  text not null check (char_length(contact_method) between 1 and 200),
  message         text not null check (char_length(message) between 1 and 2000),
  status          public.companion_status default '모집중',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists companion_posts_status_date_idx on public.companion_posts (status, visit_date);
create index if not exists companion_posts_region_idx     on public.companion_posts (region, visit_date);

alter table public.companion_posts enable row level security;

drop policy if exists "Companions viewable by everyone" on public.companion_posts;
create policy "Companions viewable by everyone"
  on public.companion_posts for select using (true);

drop policy if exists "Users insert own companion" on public.companion_posts;
create policy "Users insert own companion"
  on public.companion_posts for insert
  with check (auth.uid() = user_id and visit_date >= current_date);

drop policy if exists "Users update own companion" on public.companion_posts;
create policy "Users update own companion"
  on public.companion_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own companion" on public.companion_posts;
create policy "Users delete own companion"
  on public.companion_posts for delete
  using (auth.uid() = user_id);

drop trigger if exists set_companion_updated_at on public.companion_posts;
create trigger set_companion_updated_at
  before update on public.companion_posts
  for each row execute procedure public.handle_updated_at();
