-- 블로그 진단 결과 누적 저장 (Phase 28)
-- 목적: 데일리 대시보드에서 "마지막 진단 점수" 카드 표시 + 추후 추적 그래프 기반 자료.
-- 진단 자체는 비로그인도 가능하지만, 저장은 로그인 사용자에 한해서만 수행.

create table if not exists public.diagnose_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  blog_id           text not null check (char_length(blog_id) between 1 and 80),
  blog_title        text,
  category          text not null check (char_length(category) between 1 and 32),
  category_label    text,
  total_score       int  not null check (total_score between 0 and 100),
  activity_score    int  not null check (activity_score between 0 and 100),
  visibility_score  int  not null check (visibility_score between 0 and 100),
  quality_score     int  not null check (quality_score between 0 and 100),
  band              text not null check (band in ('top5','top15','top35','mid','growing')),
  posts_last_30d    int,
  hit_count         int,
  top_ten_count     int,
  insights          jsonb default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

-- 사용자별 최근 결과 조회 빠르게
create index if not exists diagnose_results_user_created_idx
  on public.diagnose_results (user_id, created_at desc);

-- 같은 블로그 진단 추적 (블로그 ID별 시간순)
create index if not exists diagnose_results_user_blog_idx
  on public.diagnose_results (user_id, blog_id, created_at desc);

alter table public.diagnose_results enable row level security;

-- 본인만 SELECT
drop policy if exists "Users read own diagnose results" on public.diagnose_results;
create policy "Users read own diagnose results"
  on public.diagnose_results for select
  using (auth.uid() = user_id);

-- 본인만 INSERT (24h 20건 rate limit — 악용 방지)
drop policy if exists "Users insert own diagnose results" on public.diagnose_results;
create policy "Users insert own diagnose results"
  on public.diagnose_results for insert
  with check (
    auth.uid() = user_id
    and (
      select count(*) from public.diagnose_results
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours'
    ) < 20
  );

-- 본인만 DELETE (이력 정리 허용)
drop policy if exists "Users delete own diagnose results" on public.diagnose_results;
create policy "Users delete own diagnose results"
  on public.diagnose_results for delete
  using (auth.uid() = user_id);
