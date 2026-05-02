-- 커뮤니티 기능 진단 쿼리
-- Supabase SQL Editor 에서 실행하면 마이그레이션 0003~0006 적용 여부를 한눈에 확인할 수 있습니다.

-- 1. 4개 테이블 존재 여부
select table_name,
       case when exists (select 1 from information_schema.tables
                          where table_schema='public' and table_name = t.name)
            then '✅' else '❌ 누락' end as status
from (values ('profiles'),('swap_posts'),('tips_posts'),('tips_comments'),
             ('tips_likes'),('companion_posts')) as t(name)
join lateral (select t.name as table_name) t2 on true;

-- 2. 각 테이블의 행 개수
select 'profiles'        as t, count(*) as rows from public.profiles        union all
select 'swap_posts'      as t, count(*) as rows from public.swap_posts      union all
select 'tips_posts'      as t, count(*) as rows from public.tips_posts      union all
select 'tips_comments'   as t, count(*) as rows from public.tips_comments   union all
select 'tips_likes'      as t, count(*) as rows from public.tips_likes      union all
select 'companion_posts' as t, count(*) as rows from public.companion_posts;

-- 3. RLS 활성화 여부 확인
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','swap_posts','tips_posts','tips_comments','tips_likes','companion_posts')
order by tablename;

-- 4. 각 테이블의 SELECT 정책 확인 (누구나 읽기 가능해야 함)
select tablename, polname as policy_name, cmd as command,
       case when permissive = 'PERMISSIVE' then '✅' else '❌' end as permissive
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','swap_posts','tips_posts','tips_comments','tips_likes','companion_posts')
  and cmd = 'SELECT'
order by tablename;

-- 5. pg_trgm 확장 설치 확인
select extname, extversion
from pg_extension
where extname = 'pg_trgm';
