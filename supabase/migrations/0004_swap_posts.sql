-- 서이추 모집 게시글
-- 정책: 1일 1글 (24시간 동안 같은 사용자는 신규 작성 불가, 본인 글 수정/삭제는 가능)

create table if not exists public.swap_posts (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  nickname    text not null,
  blog_url    text not null check (char_length(blog_url) <= 300),
  category    text not null,
  message     text not null check (char_length(message) between 1 and 200),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists swap_posts_category_created_idx
  on public.swap_posts (category, created_at desc);
create index if not exists swap_posts_created_idx
  on public.swap_posts (created_at desc);
create index if not exists swap_posts_nickname_trgm_idx
  on public.swap_posts using gin (nickname gin_trgm_ops);
create index if not exists swap_posts_user_created_idx
  on public.swap_posts (user_id, created_at desc);

alter table public.swap_posts enable row level security;

-- 모두 SELECT
drop policy if exists "Swap posts viewable by everyone" on public.swap_posts;
create policy "Swap posts viewable by everyone"
  on public.swap_posts for select
  using (true);

-- INSERT — 본인 + 24시간 내 작성 이력 없음
drop policy if exists "Users insert swap once per day" on public.swap_posts;
create policy "Users insert swap once per day"
  on public.swap_posts for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.swap_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    )
  );

-- UPDATE — 본인 글만 (수정은 24시간 cooldown과 무관)
drop policy if exists "Users update own swap" on public.swap_posts;
create policy "Users update own swap"
  on public.swap_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE — 본인 글만
drop policy if exists "Users delete own swap" on public.swap_posts;
create policy "Users delete own swap"
  on public.swap_posts for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신
drop trigger if exists set_swap_updated_at on public.swap_posts;
create trigger set_swap_updated_at
  before update on public.swap_posts
  for each row
  execute procedure public.handle_updated_at();
