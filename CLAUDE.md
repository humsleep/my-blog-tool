# CLAUDE.md — Boheme BlogLab

> 본질적이고 변하지 않는 정보만. 매 세션 자동 로드되므로 슬림 유지.
> 진행 상황·완료 작업·아이디어는 `DEVLOG.md` 참조 (`/resume` 슬래시 커맨드).

---

## 1. 프로젝트

- **이름**: Boheme BlogLab — 네이버/티스토리 블로거용 올인원 포스팅 도우미
- **운영자**: humsleep (boheme88@naver.com)
- **저장소**: https://github.com/humsleep/my-blog-tool
- **배포**: Vercel 자동 배포, **main 직접 push** (사용자 승인, PR 안 만듦)
- **운영 도메인**: bohemebloglab.com

### 사용자 워크플로우 (8단계)
```
1.인기검색어 → 2.키워드분석 → 3.상위노출 분석
→ 4.프롬프트 생성(무료 무제한, AI API 미사용)
→ 5.AI 글쓰기(비로그인 1회/일, 로그인 5회/일)
→ 6.금칙어·맞춤법 → 7.이미지 검색 → 8.이미지 편집
```

---

## 2. 기술 스택

| 영역 | 도구 |
|---|---|
| 프레임워크 | Next.js 16.1.6 (App Router, React 19, Turbopack) |
| 스타일 | Tailwind CSS v4 (토큰 기반 — `globals.css` `.btn-*`, `.card`, `.input-base`) |
| 에디터 | Quill 2.x (`app/editor/QuillEditor.tsx`, dynamic import) |
| 인증 | Supabase Auth (Google OAuth만) |
| DB | Supabase Postgres — `ai_draft_usage`, `anon_draft_usage` (RLS) |
| AI | Anthropic `claude-sonnet-4-6`, max_tokens 4096, prompt caching ON |
| 외부 API | 네이버 검색광고/오픈API, Pexels, Unsplash, Wikipedia, LanguageTool |
| 호스팅 | Vercel + Vercel Analytics |

### 환경변수 (`.env.example` 참조)
- 필수: `NAVER_*`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- 비로그인 한도용: `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`
- 선택: `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`

---

## 3. 디렉토리 핵심

```
app/
├── components/ — Navbar, FlowNav, GuideSection, ThemeProvider, FontLoader
├── components/ui/ — Button, Card, PageHeader, CopyButton (디자인 시스템)
├── lib/
│   ├── supabase/ — client.ts, server.ts, admin.ts(service_role), middleware.ts, useUser.ts
│   ├── format/article-formats.ts — markdownToHtml/markdownToPlain (네이버 호환)
│   └── security/ip-hash.ts — SHA-256(salt+IP)
├── api/ai-draft/route.ts — POST(생성+한도) / GET(현재 사용량)
├── trending/ keyword-analysis/ competitor-analysis/ — 1~3단계
├── prompt-generator/ ai-writer/ editor/ — 4~6단계
└── image-search/ image-tools/ lab/ — 7~8단계 + 연구실

middleware.ts — Supabase 세션 갱신
supabase/migrations/0001_ai_draft_usage.sql, 0002_anon_draft_usage.sql
```

---

## 4. 사용자 선호사항 (절대 어기지 말 것)

### 응답 스타일
- **한국어로** 응답
- 짧고 명확하게, 필요 시에만 길게
- 코드 변경 후 항상 `npm run build` 검증
- 큰 변화는 제안 → 승인 받고 진행

### Git 워크플로우
- **main 브랜치 직접 commit + push** (PR 안 만듦)
- 커밋 메시지는 영어로, 본문에 한국어 가능
- 매 커밋 Vercel 자동 배포
- **🔴 main에 push한 직후에는 반드시 `DEVLOG.md` 업데이트** — 같은 응답 안에서 묶어서 추가 commit + push까지 완료. 예외 없음. (`.claude/hooks/post-push-reminder.sh`가 알림으로 강제하지만 잊지 말 것)

### 메뉴 구조 (확정)
```
키워드 리서치 ▼  글쓰기 ▼            이미지 ▼      연구실
├ 인기검색어   ├ 프롬프트 생성    ├ 이미지 검색
├ 키워드분석   ├ AI 글쓰기        └ 이미지 편집
└ 상위노출 분석 └ 금칙어·맞춤법
```

### AI 한도 정책
- 비로그인 **1회/일** (IP 해시), 로그인 **5회/일** (`LIMITS = { authed: 5, anon: 1 }`)
- IP는 평문 저장 금지 → SHA-256(IP_HASH_SALT + IP)
- 흐름: prompt-generator(무료) → "AI 글쓰기로 이동" → sessionStorage `aiWriterPrompt` → /ai-writer

---

## 5. 알려진 제약 / 주의사항

### 빌드 / 런타임
- 로컬 개발: `npm install` → `.env.local` → `npm run dev`
- 빌드 검증: `npm run build` (모든 페이지 정적 + middleware)
- 타입체크: `npx tsc --noEmit`
- `react-hooks/set-state-in-effect` 경고 몇 군데는 의도된 패턴, 빌드 통과

### Quill 에디터
- React 19 호환 위해 `dynamic({ssr:false})` 로드
- 초기 `value` prop은 마운트 시 한 번만, 이후 prop 변경 무시
- 외부 콘텐츠 주입: `quillEditorRef.current?.getEditor()` → `setContents(delta, 'silent')`
- 마크다운 주입은 `app/lib/format/article-formats.ts`의 `markdownToHtml` 사용

### Supabase 환경변수 미설정 가드
- `middleware.ts`, `useUser.ts`, login page 모두 `configured` 플래그로 가드
- 환경변수 없어도 기존 기능 정상 동작

### `react/no-unescaped-entities`
- 약관 페이지 큰따옴표 → `&ldquo;` `&rdquo;` `&quot;`
- 점 구분자 → `&middot;`

### Service role 키 노출 금지
- `app/lib/supabase/admin.ts`는 서버 라우트에서만 import
- 클라이언트 컴포넌트에서 절대 import 금지 (RLS 우회 권한)

---

## 6. 디버깅 자주 필요한 곳

- 네이버 API 401/429 → API 키 만료/한도 초과
- Supabase 401 → URL/anon key 확인
- AI 503 → `ANTHROPIC_API_KEY` 미설정
- AI 429 → 일일 한도 소진 (정상)
- 비로그인 AI 503 → `SUPABASE_SERVICE_ROLE_KEY` 또는 `0002` 마이그레이션 누락
- 로그인 후 redirect_uri_mismatch → Google Cloud OAuth Client redirect URI 확인

---

## 7. 새 세션 시작 시

1. `/resume` 슬래시 커맨드 실행 (DEVLOG.md 최근 + git log 자동 로드)
2. 본 CLAUDE.md는 이미 자동 로드된 상태
3. 새 기능 개발 요청 시:
   - 기존 컴포넌트 재사용 (Button, PageHeader, Card, CopyButton, FlowNav, GuideSection)
   - `useUser()` 훅으로 사용자 정보
   - 페이지 헤더 패턴은 `keyword-analysis/page.tsx` 또는 `ai-writer/page.tsx` 참고
   - 빌드 검증 → main에 commit & push (사용자 승인 가정)

---

_본 파일은 CLAUDE 자동 로드용. 이력은 `DEVLOG.md`._
