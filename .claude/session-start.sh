#!/bin/bash
# SessionStart hook — 토큰 효율 우선. 5줄 이내 출력.
# 더 자세한 정보는 사용자가 /resume 슬래시 커맨드 명시적 호출.

cd "$(dirname "$0")/.." 2>/dev/null || exit 0

BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null | head -c 80)
DIRTY=$(git status --porcelain 2>/dev/null | head -1)

echo "📂 Boheme BlogLab | branch: $BRANCH"
echo "↳ last: $LAST_COMMIT"
if [ -n "$DIRTY" ]; then
  COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  echo "⚠️ uncommitted changes: $COUNT files"
fi
echo "💡 /resume — 최근 작업 + DEVLOG 한 번에 보기"
