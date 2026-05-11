-- Phase 36: 블로그 진단 12시간 1회 rate limit 강화 (Phase 28의 24h/20건에서 강화)
--
--   목적: 진단은 외부 API 호출(네이버 검색 OpenAPI 30회 + PostView.naver 12회 + RSS 1회)이
--   비용이 큰 작업이라 사용자당 12시간에 1회만 허용.
--
--   본 정책은 INSERT 시점에 sub-select 로 강제 — 클라이언트 우회 불가.

drop policy if exists "Users insert own diagnose results" on public.diagnose_results;
create policy "Users insert own diagnose results"
  on public.diagnose_results for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.diagnose_results
      where user_id = auth.uid()
        and created_at > now() - interval '12 hours'
    )
  );
