-- ============================================================
-- 커뮤니티 + 한도 + 신고 시스템 진단 SQL
-- 모든 마이그레이션(0001~0009) 적용 여부를 한 번에 확인.
-- Supabase SQL Editor 에 전체 복사 → Run 으로 실행.
-- 8개 섹션 결과를 위에서 아래로 차례로 확인하세요.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- [1] 마이그레이션 9개의 핵심 테이블 존재 여부
-- ────────────────────────────────────────────────────────────
select t.name as 테이블,
       case when exists (
         select 1 from information_schema.tables
          where table_schema='public' and table_name = t.name
       ) then '✅' else '❌ 누락' end as 상태,
       t.migration as 마이그레이션
from (values
  ('ai_draft_usage',  '0001'),
  ('anon_draft_usage','0002'),
  ('profiles',        '0003'),
  ('swap_posts',      '0004'),
  ('tips_posts',      '0005'),
  ('tips_comments',   '0005'),
  ('tips_likes',      '0005'),
  ('companion_posts', '0006'),
  ('reports',         '0009'),
  ('blocked_users',   '0009')
) as t(name, migration);

-- ────────────────────────────────────────────────────────────
-- [2] 각 테이블 행 개수 (운영 데이터 점검)
-- ────────────────────────────────────────────────────────────
select 'ai_draft_usage'  as t, count(*) as rows from public.ai_draft_usage  union all
select 'anon_draft_usage'as t, count(*) as rows from public.anon_draft_usage union all
select 'profiles'        as t, count(*) as rows from public.profiles        union all
select 'swap_posts'      as t, count(*) as rows from public.swap_posts      union all
select 'tips_posts'      as t, count(*) as rows from public.tips_posts      union all
select 'tips_comments'   as t, count(*) as rows from public.tips_comments   union all
select 'tips_likes'      as t, count(*) as rows from public.tips_likes      union all
select 'companion_posts' as t, count(*) as rows from public.companion_posts union all
select 'reports'         as t, count(*) as rows from public.reports         union all
select 'blocked_users'   as t, count(*) as rows from public.blocked_users;

-- ────────────────────────────────────────────────────────────
-- [3] RLS 활성화 상태 (모든 테이블 🔒 ON 이어야 정상)
-- ────────────────────────────────────────────────────────────
select tablename,
       case when rowsecurity then '🔒 ON' else '🔓 OFF (위험)' end as RLS
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','swap_posts','tips_posts','tips_comments','tips_likes',
                    'companion_posts','reports','blocked_users','ai_draft_usage','anon_draft_usage')
order by tablename;

-- ────────────────────────────────────────────────────────────
-- [4] SELECT 정책 — 누구나 읽기 가능해야 하는 테이블
-- (profiles/swap_posts/tips_posts/tips_comments/tips_likes/companion_posts)
-- ────────────────────────────────────────────────────────────
select t.name as 테이블,
       case when exists (
         select 1 from pg_policies
          where schemaname='public' and tablename = t.name and cmd = 'SELECT'
       ) then '✅ 있음' else '❌ 누락 → 글이 안 보임' end as SELECT_정책
from (values
  ('profiles'), ('swap_posts'), ('tips_posts'),
  ('tips_comments'), ('tips_likes'), ('companion_posts')
) as t(name);

-- ────────────────────────────────────────────────────────────
-- [5] is_hidden 컬럼 + 자동 숨김 트리거 (마이그레이션 0009)
-- ────────────────────────────────────────────────────────────
select t.name as 테이블,
       case when exists (
         select 1 from information_schema.columns
          where table_schema='public' and table_name = t.name and column_name = 'is_hidden'
       ) then '✅ is_hidden 있음' else '❌ 0009 미실행' end as is_hidden_컬럼
from (values
  ('swap_posts'), ('tips_posts'), ('tips_comments'), ('companion_posts')
) as t(name);

-- 자동 숨김 트리거 존재 여부
select case when exists (
  select 1 from pg_trigger where tgname = 'auto_hide_trg'
) then '✅ 자동 숨김 트리거 활성' else '❌ 트리거 누락 (0009 미실행)' end as 트리거상태;

-- ────────────────────────────────────────────────────────────
-- [6] Rate Limit 정책 (마이그레이션 0008/0009 INSERT 정책)
-- ────────────────────────────────────────────────────────────
select tablename, policyname as 정책명, cmd as 명령
from pg_policies
where schemaname = 'public'
  and tablename in ('swap_posts','tips_posts','tips_comments','companion_posts')
  and cmd = 'INSERT'
order by tablename, policyname;
-- 기대: 각 테이블에 1개씩 INSERT 정책 (이름에 'rate limit' 또는 'once per day' 포함)

-- ────────────────────────────────────────────────────────────
-- [7] 닉네임 24h cooldown 트리거 (마이그레이션 0003)
-- ────────────────────────────────────────────────────────────
select case when exists (
  select 1 from pg_trigger where tgname = 'enforce_nickname_cooldown_trg'
) then '✅ 닉네임 cooldown 트리거 활성' else '❌ 0003 미실행' end as 닉네임_트리거;

-- ────────────────────────────────────────────────────────────
-- [8] 확장 + 컬럼 검증 (region_city, pg_trgm)
-- ────────────────────────────────────────────────────────────
select extname as 확장, extversion as 버전
from pg_extension
where extname = 'pg_trgm';
-- 기대: pg_trgm 1.x

select case when exists (
  select 1 from information_schema.columns
   where table_schema='public' and table_name='companion_posts' and column_name='region_city'
) then '✅ region_city 컬럼 있음' else '❌ 0007 미실행' end as 시군구_컬럼;

-- ────────────────────────────────────────────────────────────
-- [최종 요약]
-- 모든 결과가 ✅이면 9개 마이그레이션 모두 정상 적용됨.
-- ❌가 하나라도 있으면 해당 마이그레이션 SQL을 다시 실행하세요.
-- ────────────────────────────────────────────────────────────
