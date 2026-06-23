#!/usr/bin/env bash
# Phase 34/34.1/34.2/35 변경사항 회귀 검증

BASE="${BASE:-http://localhost:3000}"
PASS=0; FAIL=0; FAILS=()

assert_grep() {
  local name="$1" url="$2" pattern="$3"
  if curl -s "$BASE$url" | grep -q "$pattern"; then
    PASS=$((PASS+1)); echo "  ✓ $name"
  else
    FAIL=$((FAIL+1)); FAILS+=("$name — pattern '$pattern' not found at $url")
  fi
}

assert_not_grep() {
  local name="$1" url="$2" pattern="$3"
  if ! curl -s "$BASE$url" | grep -q "$pattern"; then
    PASS=$((PASS+1)); echo "  ✓ $name"
  else
    FAIL=$((FAIL+1)); FAILS+=("$name — pattern '$pattern' should not appear at $url")
  fi
}

assert_header() {
  local name="$1" url="$2" header_pattern="$3"
  if curl -sI "$BASE$url" | grep -qiE "$header_pattern"; then
    PASS=$((PASS+1)); echo "  ✓ $name"
  else
    FAIL=$((FAIL+1)); FAILS+=("$name — header pattern '$header_pattern' missing at $url")
  fi
}

echo "── Phase 34: 인기검색어 랭킹 보드 ──"
assert_grep   'home shows TOP 10 podium label'           /              'TOP 10'
# 비로그인 + Naver API 미설정이면 빈 상태가 노출됨 — 그래도 헤더는 보여야 함

echo ""
echo "── Phase 34/59: 블로그 진단 입력 화면 (분야 자동 감지) ──"
assert_grep   'diagnose auto-detect note'                /blog-diagnose '자동으로 감지'
assert_grep   '... 내 글 기준 측정 문구'                   /blog-diagnose '내가 실제로 쓴 글'
assert_grep   '... 진단 시작 CTA'                          /blog-diagnose '진단 시작'

echo ""
echo "── Phase 34.1: 본문 측정 표시 문구 ──"
# input 페이지엔 안 나오고 result 페이지에서만 동적 렌더링
# 단, MethodologyPanel에 "본문 평균 800자" 통과 기준이 명시되어야 함
assert_grep   'methodology lists 본문 평균 800자'         /blog-diagnose '본문 평균 800자'

echo ""
echo "── Phase 34.2: MethodologyPanel ──"
assert_grep   'panel header'                              /blog-diagnose '진단 방법'
assert_grep   '3-axis weighting'                          /blog-diagnose '활동성'
assert_grep   'data sources mentions PostView'            /blog-diagnose 'PostView'

echo ""
echo "── Phase 35: 메뉴 일관성 ──"
assert_grep   'community hub has 3 menus'                /community              '체험단'
assert_grep   '... tips menu visible'                    /community              '정보 공유'
# Footer는 모든 페이지에 들어가므로 / 를 본다
assert_grep   'footer has 커뮤니티 column'                 /                       '커뮤니티'
assert_grep   'footer lists swap'                         /                       '서이추 해요'
assert_grep   'footer lists tips'                         /                       '정보 공유'
assert_grep   'footer lists companions'                   /                       '체험단 동행해요'
# Navbar dropdown items rendered server-side
assert_grep   'navbar dropdown has 3 community items'     /                       '운영 노하우'

echo ""
echo "── Phase 35: /about 다크모드 + 콘텐츠 ──"
assert_grep   '/about dark mode class'                   /about                  'dark:bg-zinc'
assert_grep   '/about BlogLab name'                      /about                  'BlogLab'
assert_not_grep '/about no stale PostLab name'           /about                  'PostLab'
assert_grep   '/about links AI 글쓰기'                    /about                  'AI 글쓰기'

echo ""
echo "── Phase 35: layout.tsx metadata ──"
assert_grep   'title uses BlogLab (not PostLab)'         /                       'Boheme BlogLab'
assert_not_grep 'no PostLab anywhere on home'            /                       'PostLab'
assert_grep   'manifest links icon-192'                  /manifest.webmanifest   'icon-192'
assert_grep   'manifest links icon-512'                  /manifest.webmanifest   'icon-512'
assert_grep   'OG image still referenced'                /                       'og-image'

echo ""
echo "── Phase 35: 보안 헤더 ──"
assert_header 'HSTS'                  /         'strict-transport-security:.*max-age'
assert_header 'X-Frame-Options'       /         'x-frame-options:.*SAMEORIGIN'
assert_header 'X-Content-Type-Options' /        'x-content-type-options:.*nosniff'
assert_header 'Referrer-Policy'       /         'referrer-policy:.*strict-origin'
assert_header 'Permissions-Policy'    /         'permissions-policy:.*camera='
assert_header 'security headers also on API'   /api/ai-draft  'strict-transport-security'

echo ""
echo "── Phase 35: PWA 아이콘 파일 존재 ──"
for f in /icon.svg /icon-192.png /icon-512.png /apple-touch-icon.png; do
  status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$f")
  if [ "$status" = "200" ]; then
    PASS=$((PASS+1)); echo "  ✓ $f present"
  else
    FAIL=$((FAIL+1)); FAILS+=("$f returned $status")
  fi
done

echo ""
echo "── Phase 35: /ai-writer 한도 안내 (HTML 마운트 시 사용량 비동기 호출이라 SSR 단에서는 미반영) ──"
# SSR 마크업에 quota 카드 자체는 placeholder만 있음 — 정상.
assert_grep   '/ai-writer renders'   /ai-writer  'AI 글쓰기'

echo ""
echo "── Phase 35: /api/blog-diagnose 입력 검증 우선순위 (Phase 35 추가 fix) ──"
# 빈 body
resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -q '블로그 ID 또는 주소'; then
  PASS=$((PASS+1)); echo "  ✓ empty body → input validation error (not env error)"
else
  FAIL=$((FAIL+1)); FAILS+=("blog-diagnose empty body returned: $resp")
fi

resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"blogInput":"myblog"}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -q '카테고리'; then
  PASS=$((PASS+1)); echo "  ✓ missing category → input validation error (not env error)"
else
  FAIL=$((FAIL+1)); FAILS+=("blog-diagnose no-category returned: $resp")
fi

resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"blogInput":"한글ID","category":"food-travel"}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -q '인식할 수 없'; then
  PASS=$((PASS+1)); echo "  ✓ invalid ID → format error (not env error)"
else
  FAIL=$((FAIL+1)); FAILS+=("blog-diagnose invalid ID returned: $resp")
fi

# Env 가드 동작 (현재 NAVER 키 없음 → 503)
resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"blogInput":"myblog","category":"food-travel"}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -q '네이버 검색 API가 설정되지 않았'; then
  PASS=$((PASS+1)); echo "  ✓ env guard triggers after input validation"
else
  FAIL=$((FAIL+1)); FAILS+=("env guard not triggered: $resp")
fi

echo ""
echo "── Phase 35: /api/ai-draft GET fail-safe (Supabase 미설정 환경) ──"
resp=$(curl -s "$BASE/api/ai-draft")
if echo "$resp" | grep -q '"limit"'; then
  PASS=$((PASS+1)); echo "  ✓ /api/ai-draft always returns valid JSON with limit"
else
  FAIL=$((FAIL+1)); FAILS+=("/api/ai-draft returned: $resp")
fi
if echo "$resp" | grep -q '"authedLimit"'; then
  PASS=$((PASS+1)); echo "  ✓ /api/ai-draft includes authedLimit (anon path)"
else
  FAIL=$((FAIL+1)); FAILS+=("/api/ai-draft missing authedLimit: $resp")
fi

echo ""
echo "════════════════════════════════════════"
echo "Total: $((PASS+FAIL))    Passed: $PASS    Failed: $FAIL"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failures:"
  for f in "${FAILS[@]}"; do echo "  ✗ $f"; done
  exit 1
fi
