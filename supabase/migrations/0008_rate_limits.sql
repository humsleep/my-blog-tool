-- 커뮤니티 작성/댓글 Rate Limit 강화
-- RLS INSERT 정책에 시간 윈도우 카운트 sub-select 추가.
-- 0004 swap_posts (1일 1글)는 그대로 유지. 추가 정책만 보강.

-- ── tips_posts: 24h 5건/사용자 ──
drop policy if exists "Users insert own tips" on public.tips_posts;
create policy "Users insert own tips with rate limit"
  on public.tips_posts for insert
  with check (
    auth.uid() = user_id
    and (
      select count(*) from public.tips_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 5
  );

-- ── tips_comments: 분당 5건 / 24h 100건 ──
drop policy if exists "Users insert own comment" on public.tips_comments;
create policy "Users insert comment with rate limit"
  on public.tips_comments for insert
  with check (
    auth.uid() = user_id
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

-- ── companion_posts: 24h 3건/사용자 (기존 visit_date 검증 유지) ──
drop policy if exists "Users insert own companion" on public.companion_posts;
create policy "Users insert companion with rate limit"
  on public.companion_posts for insert
  with check (
    auth.uid() = user_id
    and visit_date >= current_date
    and (
      select count(*) from public.companion_posts
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 3
  );

-- ── 인덱스 추가 (Rate Limit 카운트 쿼리 빠르게) ──
create index if not exists tips_posts_user_created_idx
  on public.tips_posts (user_id, created_at desc);

create index if not exists tips_comments_user_created_idx
  on public.tips_comments (user_id, created_at desc);

create index if not exists companion_posts_user_created_idx
  on public.companion_posts (user_id, created_at desc);
