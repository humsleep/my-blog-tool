#!/usr/bin/env bash
# 통합 스모크 테스트 — production server에 curl 호출
# 각 항목: 상태코드 + 컨텐츠 검증 + 보안 헤더 확인

BASE="${BASE:-http://localhost:3000}"
PASS=0
FAIL=0
FAILS=()

check() {
  local name="$1"
  local url="$2"
  local want_status="$3"
  local want_substr="$4"

  local status
  local body
  body=$(curl -s -o /tmp/qa_body -w '%{http_code}' "$BASE$url")
  status="$body"
  if [ "$status" != "$want_status" ]; then
    FAIL=$((FAIL+1))
    FAILS+=("$name — status=$status (want $want_status) — $url")
    return
  fi
  if [ -n "$want_substr" ]; then
    if ! grep -q "$want_substr" /tmp/qa_body; then
      FAIL=$((FAIL+1))
      FAILS+=("$name — body missing '$want_substr'")
      return
    fi
  fi
  PASS=$((PASS+1))
  echo "  ✓ $name ($status)"
}

check_headers() {
  local url="$1"
  shift
  local headers
  headers=$(curl -sI "$BASE$url")
  for want in "$@"; do
    if echo "$headers" | grep -qiE "^$want:"; then
      PASS=$((PASS+1))
      echo "  ✓ header $want present at $url"
    else
      FAIL=$((FAIL+1))
      FAILS+=("$url — missing header $want")
    fi
  done
}

check_json_field() {
  local name="$1"
  local url="$2"
  local want_field="$3"
  local resp
  resp=$(curl -s "$BASE$url")
  if echo "$resp" | grep -q "\"$want_field\""; then
    PASS=$((PASS+1))
    echo "  ✓ $name (field $want_field)"
  else
    FAIL=$((FAIL+1))
    FAILS+=("$name — field $want_field missing in $url")
    echo "      response: $(echo "$resp" | head -c 200)"
  fi
}

echo "── Static + critical pages ──"
check 'home (GET /)'                          /                          200 'BlogLab'
check 'home contains TrendingTicker label'    /                          200 'TOP 10'
check 'home contains AI 글쓰기 CTA'            /                          200 'AI 글쓰기'
check '/start'                                /start                     200 ''
check '/blog-diagnose'                        /blog-diagnose             200 '블로그 진단'
check '/blog-diagnose has MethodologyPanel'   /blog-diagnose             200 '진단 방법'
check '/keyword-analysis'                     /keyword-analysis          200 ''
check '/trending'                             /trending                  200 ''
check '/competitor-analysis'                  /competitor-analysis       200 ''
check '/prompt-generator'                     /prompt-generator          200 ''
check '/ai-writer'                            /ai-writer                 200 ''
check '/editor'                               /editor                    200 ''
check '/image-search'                         /image-search              200 ''
check '/image-tools'                          /image-tools               200 ''
check '/lab'                                  /lab                       200 ''
check '/community'                            /community                 200 '서이추'
check '/community/swap'                       /community/swap            200 ''
check '/community/tips'                       /community/tips            200 ''
check '/community/companions'                 /community/companions      200 ''
check '/login'                                /login                     200 ''
check '/profile/setup'                        /profile/setup             200 ''
check '/about'                                /about                     200 'BlogLab'
check '/about has 5 tools'                    /about                     200 'AI 글쓰기'
check '/contact'                              /contact                   200 ''
check '/privacy'                              /privacy                   200 '개인정보처리방침'
check '/terms'                                /terms                     200 ''

echo ""
echo "── Static assets ──"
check 'robots.txt'                            /robots.txt                200 'Sitemap'
check 'sitemap.xml'                           /sitemap.xml               200 '<urlset'
check 'manifest.webmanifest'                  /manifest.webmanifest      200 'BlogLab'
check 'icon.svg'                              /icon.svg                  200 '<svg'
check 'icon-192.png'                          /icon-192.png              200 ''
check 'icon-512.png'                          /icon-512.png              200 ''
check 'apple-touch-icon.png'                  /apple-touch-icon.png      200 ''
check 'og-image.png'                          /og-image.png              200 ''

echo ""
echo "── API endpoints (no auth required) ──"
check_json_field 'GET /api/blog-diagnose (anon)'  /api/blog-diagnose                          'latest'
check_json_field 'GET /api/ai-draft (usage)'      /api/ai-draft                               'limit'
# 비로그인 + Naver API 없을 가능성도 있어 200/503 모두 허용 → status는 별도 확인
echo "  - /api/trending-keywords (외부 API 호출):"
curl -s -o /dev/null -w '    HTTP %{http_code}\n' "$BASE/api/trending-keywords?category=전체&period=daily&limit=10"

echo ""
echo "── 입력 검증 (400 응답) ──"
# 잘못된 입력 → 400
resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -q "블로그"; then
  PASS=$((PASS+1)); echo "  ✓ /api/blog-diagnose rejects empty body"
else
  FAIL=$((FAIL+1)); FAILS+=("/api/blog-diagnose did not reject empty body: $resp")
fi
resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"blogInput":"한글ID","category":"food-travel"}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -qE "인식할 수 없|블로그"; then
  PASS=$((PASS+1)); echo "  ✓ /api/blog-diagnose rejects Korean blog ID"
else
  FAIL=$((FAIL+1)); FAILS+=("/api/blog-diagnose did not reject Korean ID: $resp")
fi
# 진단 v3 — 카테고리는 자동 감지하므로 더 이상 필수가 아님 (선택 누락이 입력 에러가 되면 안 됨)
resp=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"blogInput":"myblog"}' "$BASE/api/blog-diagnose")
if echo "$resp" | grep -qE "카테고리를 선택|메인 카테고리"; then
  FAIL=$((FAIL+1)); FAILS+=("/api/blog-diagnose still requires category (should auto-detect): $resp")
else
  PASS=$((PASS+1)); echo "  ✓ /api/blog-diagnose auto-detects category (no category required)"
fi

echo ""
echo "── 보안 헤더 (next.config.ts) ──"
check_headers /                          'strict-transport-security' 'x-content-type-options' 'x-frame-options' 'referrer-policy' 'permissions-policy'
check_headers /api/ai-draft              'strict-transport-security' 'x-content-type-options'

echo ""
echo "── 404 page ──"
check '/nonexistent → 404'                /this-page-does-not-exist  404 ''

echo ""
echo "════════════════════════════════════════"
echo "Total: $((PASS+FAIL))    Passed: $PASS    Failed: $FAIL"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failures:"
  for f in "${FAILS[@]}"; do echo "  ✗ $f"; done
  exit 1
fi
