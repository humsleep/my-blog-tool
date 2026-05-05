-- 로그인 사용자 프리셋 저장 (profiles 확장)
--   prompt_preset:   프롬프트 생성 페이지의 마지막 선택값 (분야/어투/스타일 등)
--   saved_keywords:  키워드 분석 즐겨찾기 (최대 10개)

alter table public.profiles
  add column if not exists prompt_preset jsonb,
  add column if not exists saved_keywords text[] default '{}'::text[];

-- saved_keywords 길이 제한 (최대 10개) — CHECK 제약
alter table public.profiles
  drop constraint if exists profiles_saved_keywords_max;
alter table public.profiles
  add constraint profiles_saved_keywords_max
  check (cardinality(coalesce(saved_keywords, '{}'::text[])) <= 10);

-- prompt_preset jsonb 크기 제한 (악용 방지) — 약 4KB
alter table public.profiles
  drop constraint if exists profiles_prompt_preset_size;
alter table public.profiles
  add constraint profiles_prompt_preset_size
  check (
    prompt_preset is null
    or octet_length(prompt_preset::text) <= 4096
  );
