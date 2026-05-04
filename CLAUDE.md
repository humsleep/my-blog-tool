# CLAUDE.md — Boheme BlogLab

> 본질적이고 변하지 않는 정보만. 매 세션 자동 로드되므로 슬림 유지.
> 진행 상황·완료 작업·아이디어는 `DEVLOG.md` 참조 (`/resume` 슬래시 커맨드).

---

## 1. 프로젝트

- **이름**: Boheme BlogLab — 네이버/티스토리 블로거용 올인원 포스팅 도우미 + 블로거 커뮤니티
- **운영자**: humsleep (boheme88@naver.com)
- **저장소**: https://github.com/humsleep/my-blog-tool
- **배포**: Vercel 자동 배포, **main 직접 push** (사용자 승인, PR 안 만듦)
- **운영 도메인**: bohemebloglab.com

### 사용자 워크플로우

**도구 흐름 (8단계)**
```
1.인기검색어 → 2.키워드분석 → 3.상위노출 분석
→ 4.프롬프트 생성(무료 무제한, AI API 미사용)
→ 5.AI 글쓰기(비로그인 1회/일, 로그인 5회/일)
→ 6.금칙어·맞춤법 → 7.이미지 검색 → 8.이미지 편집
```

**커뮤니티 (3개 메뉴)**
- 서이추 해요 — 같은 분야 블로거 매칭 (1일 1글 RLS 강제)
- 정보 공유 — 운영 노하우 게시판 (카테고리 6종 + 댓글 + 좋아요)
- 체험단 동행해요 — 동행자 모집 (지역 시·도 + 시·군·구 2단계)

---

## 2. 기술 스택

| 영역 | 도구 |
|---|---|
| 프레임워크 | Next.js 16.1.6 (App Router, React 19, Turbopack) |
| 스타일 | Tailwind CSS v4 (토큰 기반 — `globals.css` `--accent`(orange), `.btn-*`, `.card`, `.input-base`) |
| 에디터 | Quill 2.x (`app/editor/QuillEditor.tsx`, dynamic import) |
| 인증 | Supabase Auth (Google OAuth만) |
| DB | Supabase Postgres + RLS — 8개 테이블 (사용량 2 + 커뮤니티 6) |
| AI | Anthropic `claude-sonnet-4-6`, max_tokens 4096, prompt caching ON |
| 외부 API | 네이버 검색광고/오픈API, Pexels, Unsplash, Wikipedia, LanguageTool |
| 호스팅 | Vercel + Vercel Analytics |
| 모바일 | PWA (manifest, theme-color, safe-area, 하단 탭바) |

### 환경변수 (`.env.example` 참조)
- 필수: `NAVER_*`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- 비로그인 한도용: `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT` (32자 이상, 미설정 시 throw)
- 선택: `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`

### 브랜드 컬러 (확정)
- **컨셉컬러: 주황** (`--accent: #f97316` light / `#fdba74` dark)
- 이전 indigo/violet은 모두 orange/amber로 마이그레이션 완료 (Phase 10)
- 다크모드는 한 단계 톤다운 (orange-300) → 본문 가독성 ↑

---

## 3. 디렉토리 핵심

```
app/
├── components/
│   ├── ui/ — Button, Card, PageHeader, CopyButton, Toast(Provider)
│   ├── community/ — CategoryChips, NicknameBadge, EmptyState, ConfirmModal,
│                    Pagination(키보드 ←/→), BoardSkeleton
│   ├── Navbar.tsx (메가패널 + 커뮤니티 드롭다운)
│   ├── MobileBottomNav.tsx (md:hidden, 4탭 + 활성 인디케이터)
│   ├── FlowNav, GuideSection, ThemeProvider, FontLoader, NewsPanel, SpellCheckPanel
│   └── AdSense, Footer
├── lib/
│   ├── supabase/ — client, server, admin(service_role), middleware, useUser
│   ├── community/ — categories.ts, regions.ts(REGION_CITIES), profile.ts, tips.ts
│   ├── format/ — article-formats.ts, relative-time.ts (formatRelativeKr/Absolute)
│   └── security/ip-hash.ts — SHA-256(salt+IP), salt 강제
├── api/ai-draft/route.ts — POST(생성+한도) / GET(현재 사용량)
├── trending/ keyword-analysis/ competitor-analysis/ — 1~3단계
├── prompt-generator/ ai-writer/ editor/ — 4~6단계
├── image-search/ image-tools/ lab/ — 7~8단계 + 연구실
├── community/
│   ├── page.tsx (허브)
│   ├── swap/ (서이추 + SwapModal)
│   ├── tips/ (목록/new/[id])
│   └── companions/ (목록/new/[id])
├── profile/setup/page.tsx (닉네임 등록·수정)
├── manifest.ts (PWA)
└── layout.tsx (ThemeProvider > ToastProvider)

middleware.ts — Supabase 세션 갱신
supabase/migrations/
  0001 ai_draft_usage     — 로그인 AI 한도
  0002 anon_draft_usage   — 비로그인 AI 한도 (IP 해시)
  0003 profiles           — 닉네임/blog_url/category, 24h cooldown 트리거
  0004 swap_posts         — RLS INSERT에 1일 1글 sub-select
  0005 tips               — posts/comments/likes + count trigger + 조회수 RPC
  0006 companions         — region + visit_date 검증 RLS
  0007 companion_region_city — 시·군·구 컬럼 추가
supabase/diagnose_community.sql — 정책·테이블 점검 헬퍼
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
- 단, push가 DEVLOG.md 자체의 갱신이라면 무한 재귀 방지로 추가 commit 불필요.

### 메뉴 구조 (확정)
```
[Desktop Navbar]
키워드분석  AI 글쓰기  에디터  모든 도구 ▼  커뮤니티 ▼  연구실

키워드 리서치 ▼  글쓰기 ▼          이미지 ▼          커뮤니티 ▼
├ 인기검색어   ├ 프롬프트 생성   ├ 이미지 검색      ├ 서이추 해요
├ 키워드분석   ├ AI 글쓰기       └ 이미지 편집      ├ 정보 공유
└ 상위노출 분석 └ 금칙어·맞춤법                     └ 체험단 동행해요

[Mobile Bottom Nav, md:hidden]
홈  도구  커뮤니티  연구실
```

### AI 한도 정책
- 비로그인 **1회/일** (IP 해시), 로그인 **5회/일** (`LIMITS = { authed: 5, anon: 1 }`)
- IP는 평문 저장 금지 → SHA-256(IP_HASH_SALT + IP). salt 미설정 시 503 반환.
- 흐름: prompt-generator(무료) → "AI 글쓰기로 이동" → sessionStorage `aiWriterPrompt` → /ai-writer

### 커뮤니티 정책 (확정)
- **읽기**: 누구나 (RLS `using(true)`)
- **쓰기/댓글/좋아요**: 로그인 + 닉네임 등록 필요
- **닉네임 변경**: 24시간 1회 (DB 트리거 강제)
- **서이추 1일 1글**: RLS INSERT 정책에 `not exists` sub-select로 강제
- **체험단 작성 후**: 목록으로 이동 + toast (작성 즉시 본인 글 노출 확인)
- **체험단 지역**: 시·도 (필수) + 시·군·구 (선택). `region_city` 컬럼 + `formatFullRegion()` 헬퍼.

---

## 5. 알려진 제약 / 주의사항

### 빌드 / 런타임
- 로컬 개발: `npm install` → `.env.local` → `npm run dev`
- 빌드 검증: `IP_HASH_SALT=test-salt-1234567890ab npm run build`
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

### Service role 키 노출 금지
- `app/lib/supabase/admin.ts`는 서버 라우트에서만 import
- 클라이언트 컴포넌트에서 절대 import 금지 (RLS 우회 권한)

### useSearchParams 페이지는 Suspense 필수
- `/profile/setup`, `/community/tips/new`, `/community/companions/new` 셋 다
- `<Suspense fallback={...}>` 으로 wrap (정적 prerender 호환)

### Toast 사용
- `import { useToast } from '@/app/components/ui/Toast'`
- `const { toast } = useToast()` → `toast(message, 'success' | 'error' | 'info')`
- 우상단 자동 표시 + 3초 후 자동 닫힘
- alert() 대신 사용 (사용자 친화적 + safe-top 적용)

---

## 6. 디버깅 자주 필요한 곳

- 네이버 API 401/429 → API 키 만료/한도 초과
- Supabase 401 → URL/anon key 확인
- AI 503 → `ANTHROPIC_API_KEY` 미설정
- AI 429 → 일일 한도 소진 (정상)
- AI 503 + `IP_HASH_NOT_CONFIGURED` → `IP_HASH_SALT` 미설정
- 비로그인 AI 503 → `SUPABASE_SERVICE_ROLE_KEY` 또는 `0002` 마이그레이션 누락
- 커뮤니티 글이 등록은 됐는데 안 보임 → RLS SELECT 정책 누락 (마이그레이션 0003~0007 재실행 또는 `supabase/diagnose_community.sql` 실행)
- 커뮤니티 작성 시 `code: 42501` → RLS 차단 (1일 1글 한도 또는 본인 아님)
- 커뮤니티 작성 시 `code: 42P01` → 테이블 없음 (마이그레이션 미실행)
- 로그인 후 redirect_uri_mismatch → Google Cloud OAuth Client redirect URI 확인

---

## 7. 새 세션 시작 시

1. `/resume` 슬래시 커맨드 실행 (DEVLOG.md 최근 + git log 자동 로드)
2. 본 CLAUDE.md는 이미 자동 로드된 상태
3. 새 기능 개발 요청 시:
   - **기존 컴포넌트 재사용**: Button, PageHeader, Card, CopyButton, FlowNav, GuideSection, Toast(useToast), Pagination, BoardSkeleton, EmptyState, CategoryChips, ConfirmModal
   - **유틸 재사용**: `formatRelativeKr / formatAbsoluteKr` (`lib/format/relative-time.ts`), `markdownToHtml` (`lib/format/article-formats.ts`), `fetchMyProfile / fetchProfileByUserId` (`lib/community/profile.ts`)
   - **`useUser()` 훅**으로 사용자 정보
   - **목록 페이지 패턴**: sticky top-14 필터 + BoardSkeleton + Pagination + visibility refetch
   - **상세 페이지 패턴**: `max-w-3xl` + 작성자 메타 (아바타 + 분야 칩 + 블로그 링크)
   - **커뮤니티 작성 후**: 목록으로 redirect + `toast(message, 'success')`
   - **컬러**: 주황(`bg-orange-500`/`text-orange-600`/`hover:bg-orange-600`) — 절대 indigo/violet 추가 금지
   - **빌드 검증 (IP_HASH_SALT env 필수) → main에 commit & push** (사용자 승인 가정)

---

_본 파일은 CLAUDE 자동 로드용. 이력은 `DEVLOG.md`._
