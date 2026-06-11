# CLAUDE.md — Boheme BlogLab

> 본질적이고 변하지 않는 정보만. 매 세션 자동 로드되므로 슬림 유지.
> 진행 상황·완료 작업·아이디어는 `DEVLOG.md` 참조 (`/resume` 슬래시 커맨드).

---

## 1. 프로젝트

- **이름**: Boheme BlogLab — 네이버/티스토리 블로거용 올인원 포스팅 도우미 + 블로거 커뮤니티
- **운영자**: humsleep (boheme88@naver.com) — 개인 운영, 법인 X
- **저장소**: https://github.com/humsleep/my-blog-tool
- **배포**: Vercel 자동 배포 (Pro 플랜 추정)
- **운영 도메인**: bohemebloglab.com

### 사용자 워크플로우

**홈 — 데일리 대시보드 (Phase 28)**
- 비로그인: 검색 + 진단 CTA + 인기 검색어 **TOP 10 포디움**(1·2·3위 메달 카드 + 4~10위 리스트)
- 로그인: 인사 + 마지막 진단 점수 카드(±delta + sparkline) + 즐겨찾기 키워드 칩 + 내 분야 인기 키워드
- 진단 결과는 `diagnose_results` 테이블에 누적 저장되어 변동 추적

**도구 흐름 (8단계)**
```
1.인기검색어 → 2.키워드분석 → 3.상위노출 분석
→ 4.프롬프트 생성(무료 무제한, AI API 미사용)
→ 5.AI 글쓰기(비로그인 1회/일, 로그인 5회/일, SSE 스트리밍)
→ 6.금칙어·맞춤법 → 7.이미지 검색 → 8.이미지 편집
```

**블로그 진단 (별도 진입점)**
- 카테고리 핵심 키워드 30개로 1페이지 진입율 측정 + **최근 12편 본문 PostView.naver 측정**(글자수·이미지 정확도)
- 활동성 25% / 노출 50% / 품질 25% → 0~100점 + band(top5/top15/top35/mid/growing)
- 결과 페이지 5개 섹션: **총점 게이지 + 레이더 + 노출 분포 스택바 + 건강 체크 8항목 + 30일 액션 플랜 + MethodologyPanel(측정 기준 공개)**
- 로그인 시 자동 저장 → 대시보드 점수 카드에 변동 표시
- **12시간 1회 rate limit** (RLS + API 사전 체크 이중 방어, Phase 36)

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
| DB | Supabase Postgres + RLS — 10개 테이블 (사용량 2 + 커뮤니티 6 + 신고 1 + 진단 1) |
| AI | Anthropic `claude-sonnet-4-6`, max_tokens single 3500 / multi 5000, prompt caching ON, **SSE 스트리밍**(`stream:true`) |
| Vercel | `maxDuration: 300s` (`/api/ai-draft`), `maxDuration: 60s` (`/api/blog-diagnose`), 보안 헤더 5종(HSTS/X-Frame/CT-Options/Referrer/Permissions) |
| 외부 API | 네이버 검색광고/오픈API/PostView.naver(본문 측정), Pexels, Unsplash, Wikipedia, LanguageTool |
| 호스팅 | Vercel + Vercel Analytics |
| 모바일 | PWA (manifest "B" 아이콘 svg/png 192/512/180, theme-color, safe-area, 하단 탭바) |

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
│   ├── dashboard/ — TrendingTicker, LatestDiagnoseCard, SavedKeywordsCard (Phase 28)
│   ├── Navbar.tsx (메가패널 + 커뮤니티 드롭다운)
│   ├── MobileBottomNav.tsx (md:hidden, 4탭 + 활성 인디케이터)
│   ├── FlowNav, GuideSection, ThemeProvider, FontLoader, NewsPanel, SpellCheckPanel
│   └── AdSense, Footer
├── lib/
│   ├── supabase/ — client, server, admin(service_role), middleware, useUser
│   ├── community/ — categories.ts, regions.ts(REGION_CITIES), profile.ts, tips.ts
│   ├── dashboard/ — types.ts (TrendingItem, DiagnoseLatest, BAND_LABEL, COMMUNITY_TO_TRENDING_CATEGORY)
│   ├── diagnose/ — category-seeds.ts, naver-blog.ts, scoring.ts
│   ├── format/ — article-formats.ts, relative-time.ts (formatRelativeKr/Absolute)
│   └── security/ip-hash.ts — SHA-256(salt+IP), salt 강제
├── api/ai-draft/route.ts — POST(생성+한도) / GET(현재 사용량)
├── api/blog-diagnose/route.ts — POST(진단+자동 저장) / GET(최근 2건+delta)
├── trending/ keyword-analysis/ competitor-analysis/ — 1~3단계
├── prompt-generator/ ai-writer/ editor/ — 4~6단계
├── image-search/ image-tools/ lab/ — 7~8단계 + 연구실
├── blog-diagnose/ — 진단 페이지
├── community/
│   ├── page.tsx (허브)
│   ├── swap/ (서이추 + SwapModal)
│   ├── tips/ (목록/new/[id])
│   └── companions/ (목록/new/[id])
├── profile/setup/page.tsx (닉네임 등록·수정 + 즐겨찾기 키워드 관리)
├── page.tsx — 데일리 대시보드 홈 (useUser 분기, AnonHero/LoggedInHero)
├── manifest.ts (PWA)
└── layout.tsx (ThemeProvider > ToastProvider)

middleware.ts — Supabase 세션 갱신
next.config.ts — 보안 헤더 + 이미지 remotePatterns (Pexels/Unsplash/Google)
supabase/migrations/
  0001 ai_draft_usage        — 로그인 AI 한도
  0002 anon_draft_usage      — 비로그인 AI 한도 (IP 해시)
  0003 profiles              — 닉네임/blog_url/category, 24h cooldown 트리거
  0004 swap_posts            — RLS INSERT에 1일 1글 sub-select
  0005 tips                  — posts/comments/likes + count trigger + 조회수 RPC
  0006 companions            — region + visit_date 검증 RLS
  0007 companion_region_city — 시·군·구 컬럼 추가
  0008 rate_limits           — 커뮤니티 작성 RLS sub-select rate-limit
  0009 reports_and_moderation — 신고 5건 누적 → 자동 숨김
  0010 user_presets          — profiles.prompt_preset(jsonb) + saved_keywords(text[])
  0011 diagnose_results      — 진단 결과 누적 저장 (RLS)
  0012 diagnose_rate_limit_12h — 진단 12h 1회 RLS 강화 (Phase 36)
supabase/diagnose_community.sql — 정책·테이블 점검 헬퍼
scripts/                    — QA 테스트 (Phase 35.1)
  qa-unit-tests.ts          — pure function 단위 테스트 79건
  qa-ssrf-tests.ts          — fetchPostBody SSRF 방어 14건
  qa-smoke.sh               — production server curl 스모크 47건
  qa-regression.sh          — Phase 34~35 회귀 41건
  qa-claude-cost-estimate.ts — Claude API 1회 호출 비용 산출
```

---

## 4. 사용자 선호사항 (절대 어기지 말 것)

### 응답 스타일
- **한국어로** 응답
- 짧고 명확하게, 필요 시에만 길게
- 코드 변경 후 항상 `npm run build` 검증
- 큰 변화는 제안 → 승인 받고 진행

### Git 워크플로우 (Phase 35 이후)
- **직접 main push는 원격에서 403** → 반드시 **PR + GitHub MCP merge** 흐름
- 작업 흐름: 새 branch `claude/<topic>` → push → `mcp__github__create_pull_request` → `mcp__github__merge_pull_request` → 로컬 main fast-forward
- 커밋 메시지는 영어로, 본문에 한국어 가능
- 매 머지마다 Vercel 자동 배포
- **🔴 main에 push한 직후에는 반드시 `DEVLOG.md` 업데이트** — 같은 응답 안에서 묶어서 추가 commit + push까지 완료. 예외 없음.
- 단, push가 DEVLOG.md 자체의 갱신이라면 무한 재귀 방지로 추가 commit 불필요.

### 메뉴 구조 (확정 — Phase 53)
```
[Desktop Navbar]  키워드 리서치 ▼  글쓰기 ▼  진단  커뮤니티 ▼  더보기 ▼

키워드 리서치 ▼   글쓰기 ▼          커뮤니티 ▼          더보기 ▼
├ 인기검색어     ├ 빠른 시작       ├ 서이추 해요       ├ 이미지 검색
├ 키워드 분석    ├ 프롬프트 생성   ├ 정보 공유         ├ 이미지 편집
└ 상위노출 분석  ├ AI 글쓰기       └ 체험단 동행해요   └ 연구실
                 └ 에디터(발행)
※ 진단(/blog-diagnose)은 평면 단일 링크 (전환 동력)

[Mobile Bottom Nav, md:hidden]
홈  도구  진단  커뮤니티      ※ 연구실은 햄버거 메뉴로 강등
```

### AI 한도 정책
- 비로그인 **1회/일** (IP 해시), 로그인 **5회/일** (`LIMITS = { authed: 5, anon: 1 }`)
- IP는 평문 저장 금지 → SHA-256(IP_HASH_SALT + IP). salt 미설정 시 503 반환.
- 흐름: prompt-generator(무료) → "AI 글쓰기로 이동" → sessionStorage `aiWriterPrompt` → /ai-writer
- 기본 옵션 (Phase 36.3, 비용·timeout 안전): `length=compact / titleMode=single / imagePrompts=false / sources=false / selfReview=true`. 사용자가 옵션 패널에서 토글 가능.
- 1회 호출 평균 비용 ≈ $0.05~0.07 (₩70~98), Sonnet 4.6, compact + single (Phase 36 비용 분석)

### AI 글쓰기 — SSE 스트리밍 (Phase 36.4~36.5)
- `/api/ai-draft` POST 가 `stream: true` 요청 시 `text/event-stream` 응답
- 이벤트: `{type:'chunk',text}` / `{type:'done',usage}` / `{type:'error',error}`
- 클라이언트 `/ai-writer` 는 stream 사용 (실시간 토큰 표시), `/start` 는 기존 JSON 사용
- per-request timeout: 스트리밍 290s / 비-스트리밍 58s
- 진단 12시간 1회 정책은 RLS 0012 + API 사전 체크 이중 방어

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
- QA: `npx tsx scripts/qa-unit-tests.ts` (79 asserts) + `bash scripts/qa-smoke.sh` (production server 47 asserts)
- `react-hooks/set-state-in-effect` 경고 몇 군데는 의도된 패턴, 빌드 통과

### Anthropic SDK / Vercel
- production 빌드는 `constructor.name`을 minify(예: `'eB'`) → 에러 분류는 **`err.name` + `err.status` + message regex** 로만 (class 비교 X)
- 스트리밍 응답 = byte 흐르는 한 Vercel 연결 안 끊김 + **함수 자체 maxDuration 은 별개 cap** → `export const maxDuration = 300` 필요
- Anthropic 인스턴스 default timeout 두지 말고 **per-request 로 명시** (`anthropic.messages.create({...}, { timeout: ... })`)

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
- 대시보드 진단 카드가 빈 상태로만 보임 → `0011_diagnose_results.sql` 미실행 (저장이 swallow되어 GET이 `latest:null` 반환). Supabase SQL Editor에서 실행하면 즉시 정상화.
- 진단 12h rate limit 안 걸림 → `0012_diagnose_rate_limit_12h.sql` 미실행. SQL Editor에서 실행.
- AI 글쓰기 timeout 메시지 지속 → Vercel Function 로그에서 `[ai-draft stream] failed — elapsedMs=...` 라인 확인. `elapsedMs >= 290000` 이면 SDK timeout 도달.
- `Unexpected token 'A', "An error o"...` SyntaxError → 클라이언트가 `res.json()` 직접 호출. `safeJson()` 헬퍼(`app/lib/clientFetch.ts`)로 교체.

---

## 7. 새 세션 시작 시

1. `/resume` 슬래시 커맨드 실행 (DEVLOG.md 최근 + git log 자동 로드)
2. 본 CLAUDE.md는 이미 자동 로드된 상태
3. 새 기능 개발 요청 시:
   - **기존 컴포넌트 재사용**: Button, PageHeader, Card, CopyButton, FlowNav, GuideSection, Toast(useToast), Pagination, BoardSkeleton, EmptyState, CategoryChips, ConfirmModal
   - **대시보드 위젯 재사용**: `TrendingTicker`, `LatestDiagnoseCard`, `SavedKeywordsCard` (`app/components/dashboard/`)
   - **유틸 재사용**: `formatRelativeKr / formatAbsoluteKr` (`lib/format/relative-time.ts`), `markdownToHtml` (`lib/format/article-formats.ts`), `fetchMyProfile / fetchProfileByUserId` (`lib/community/profile.ts`), `clientFetchJson` (`lib/clientFetch.ts`)
   - **`useUser()` 훅**으로 사용자 정보
   - **목록 페이지 패턴**: sticky top-14 필터 + BoardSkeleton + Pagination + visibility refetch
   - **상세 페이지 패턴**: `max-w-3xl` + 작성자 메타 (아바타 + 분야 칩 + 블로그 링크)
   - **커뮤니티 작성 후**: 목록으로 redirect + `toast(message, 'success')`
   - **컬러**: 주황(`bg-orange-500`/`text-orange-600`/`hover:bg-orange-600`) — 절대 indigo/violet 추가 금지
   - **빌드 검증 (IP_HASH_SALT env 필수) → main에 commit & push** (사용자 승인 가정)

---

_본 파일은 CLAUDE 자동 로드용. 이력은 `DEVLOG.md`._
