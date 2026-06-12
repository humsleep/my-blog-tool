-- 진단 결과에 GEO(메이트 인용 적합도) 점수 추가 (Phase 56)
-- 목적: 총점과 분리된 별도 헤드라인 지표를 누적 저장해 추후 추적.
-- 비파괴: nullable 컬럼. 기존 insert 는 geo_score 없이도 정상 동작하며,
--         API 는 best-effort update 로 이 컬럼이 있을 때만 채운다.

alter table public.diagnose_results
  add column if not exists geo_score smallint
  check (geo_score is null or geo_score between 0 and 100);
