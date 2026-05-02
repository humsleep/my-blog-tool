-- 정보 공유 게시판 (tips_posts, tips_comments, tips_likes)

do $$ begin
  create type public.tips_category as enum ('질문', '정보공유', '노하우', '트러블슈팅', '수익후기', '잡담');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tips_posts (
  id            bigserial primary key,
  user_id       uuid not null references auth.users on delete cascade,
  nickname      text not null,
  category      public.tips_category not null,
  title         text not null check (char_length(title) between 2 and 80),
  body          text not null check (char_length(body) <= 10000),
  view_count    int  default 0,
  like_count    int  default 0,
  comment_count int  default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists tips_posts_cat_created_idx on public.tips_posts (category, created_at desc);
create index if not exists tips_posts_created_idx     on public.tips_posts (created_at desc);
create index if not exists tips_posts_likes_idx       on public.tips_posts (like_count desc, created_at desc);
create index if not exists tips_posts_title_trgm_idx  on public.tips_posts using gin (title gin_trgm_ops);

alter table public.tips_posts enable row level security;

drop policy if exists "Tips viewable by everyone" on public.tips_posts;
create policy "Tips viewable by everyone"
  on public.tips_posts for select using (true);

drop policy if exists "Users insert own tips" on public.tips_posts;
create policy "Users insert own tips"
  on public.tips_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own tips" on public.tips_posts;
create policy "Users update own tips"
  on public.tips_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own tips" on public.tips_posts;
create policy "Users delete own tips"
  on public.tips_posts for delete
  using (auth.uid() = user_id);

drop trigger if exists set_tips_updated_at on public.tips_posts;
create trigger set_tips_updated_at
  before update on public.tips_posts
  for each row execute procedure public.handle_updated_at();

-- 댓글
create table if not exists public.tips_comments (
  id        bigserial primary key,
  post_id   bigint not null references public.tips_posts on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  nickname  text not null,
  body      text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);
create index if not exists tips_comments_post_idx on public.tips_comments (post_id, created_at);

alter table public.tips_comments enable row level security;

drop policy if exists "Comments viewable by everyone" on public.tips_comments;
create policy "Comments viewable by everyone"
  on public.tips_comments for select using (true);

drop policy if exists "Users insert own comment" on public.tips_comments;
create policy "Users insert own comment"
  on public.tips_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own comment" on public.tips_comments;
create policy "Users delete own comment"
  on public.tips_comments for delete
  using (auth.uid() = user_id);

-- 댓글수 카운터 동기화
create or replace function public.sync_tips_comment_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.tips_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.tips_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists tips_comments_count_trg on public.tips_comments;
create trigger tips_comments_count_trg
  after insert or delete on public.tips_comments
  for each row execute procedure public.sync_tips_comment_count();

-- 좋아요
create table if not exists public.tips_likes (
  post_id    bigint references public.tips_posts on delete cascade,
  user_id    uuid   references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.tips_likes enable row level security;

drop policy if exists "Likes viewable by everyone" on public.tips_likes;
create policy "Likes viewable by everyone"
  on public.tips_likes for select using (true);

drop policy if exists "Users insert own like" on public.tips_likes;
create policy "Users insert own like"
  on public.tips_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own like" on public.tips_likes;
create policy "Users delete own like"
  on public.tips_likes for delete
  using (auth.uid() = user_id);

create or replace function public.sync_tips_like_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.tips_posts set like_count = like_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.tips_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists tips_likes_count_trg on public.tips_likes;
create trigger tips_likes_count_trg
  after insert or delete on public.tips_likes
  for each row execute procedure public.sync_tips_like_count();

-- 조회수 증가 RPC (RLS 우회 위해 SECURITY DEFINER)
create or replace function public.tips_increment_view(post_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tips_posts set view_count = view_count + 1 where id = post_id;
$$;
revoke all on function public.tips_increment_view(bigint) from public;
grant execute on function public.tips_increment_view(bigint) to anon, authenticated;
