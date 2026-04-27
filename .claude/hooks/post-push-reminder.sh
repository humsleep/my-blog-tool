#!/usr/bin/env bash
# PostToolUse hook — Bash 매처. `git push ... main` 감지 시 DEVLOG 갱신을 강제 알림.
# 그 외 명령은 조용히 종료.

set -u

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)

# git push가 포함되고, main 브랜치 대상인 경우만 매치
# 매칭: "git push origin main", "git push -u origin main", "git push" (현재 브랜치 main일 때 — 보수적으로 origin main 명시한 경우만)
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push' \
   && printf '%s' "$cmd" | grep -qE '(^|[[:space:]])main([[:space:]]|$|;|&|\|)'; then
  msg='🔴 main에 push 완료. 이 응답을 마치기 전에 DEVLOG.md를 갱신하고 같은 작업 흐름으로 추가 commit + push까지 마무리하세요. CLAUDE.md 규칙: "main에 push한 직후에는 반드시 DEVLOG.md 업데이트". 예외 없음.'
  printf '%s\n' "$msg" >&2
  jq -nc --arg msg "$msg" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $msg
    }
  }'
fi

exit 0
