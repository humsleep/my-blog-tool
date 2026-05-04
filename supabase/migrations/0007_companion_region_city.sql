-- 체험단 동행: 시·군 단위 지역 세분화 (region 컬럼 옆에 region_city 추가)
-- 기존 region(시·도)은 그대로 유지. region_city는 선택 컬럼.

alter table public.companion_posts
  add column if not exists region_city text;

-- 시·도 + 시·군 복합 인덱스 (필터 빠르게)
create index if not exists companion_posts_region_city_idx
  on public.companion_posts (region, region_city, visit_date);
