# CLAUDE.md — Boheme BlogLab 프로젝트 핸드오프

> 이 파일은 새로운 Claude 세션에서 프로젝트 컨텍스트를 빠르게 파악하기 위한 문서입니다.
> Claude Code는 디렉토리 진입 시 자동으로 이 파일을 읽습니다.
> Claude Desktop에서는 Project Knowledge에 이 파일을 업로드하세요.

---

## 1. 프로젝트 개요

- **이름**: Boheme BlogLab
- **목적**: 네이버/티스토리 블로거를 위한 올인원 포스팅 도우미 SaaS
- **운영자**: humsleep (boheme88@naver.com)
- **저장소**: https://github.com/humsleep/my-blog-tool
- **배포**: Vercel (자동 배포, main 브랜치 → 프로덕션)
- **운영 도메인**: bohemebloglab.com (추정 — Vercel 기본 도메인일 수도 있음, 확인 필요)

### 사용자 워크플로우 (8단계 선형 흐름)
```
1. 인기검색어 → 2. 키워드분석 → 3. 상위노출 분석
→ 4. 프롬프트 생성(무료 무제한, AI API 미사용)
→ 5. AI 글쓰기 (비로그인 1회/일, 로그인 5회/일 - Claude API)
→ 6. 금칙어·맞춤법 → 7. 이미지 검색 → 8. 이미지 편집
```

---

## 2. 기술 스택

| 영역 | 도구 |
|---|---|
| 프레임워크 | Next.js 16.1.6 (App Router, React 19, Turbopack) |
| 스타일 | Tailwind CSS v4 |
| 에디터 | Quill 2.x (dynamic import, `app/editor/QuillEditor.tsx`) |
| 인증 | Supabase Auth (Google OAuth만 사용) |
| DB | Supabase Postgres (`ai_draft_usage`, `anon_draft_usage` 2개 테이블, RLS 적용) |
| AI | Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`), prompt caching 사용 |
| 외부 API | 네이버 검색광고/오픈API, Pexels, Unsplash, Wikipedia, LanguageTool |
| 호스팅 | Vercel + Vercel Analytics |

### 주요 환경변수 (`.env.example` 참조)
```
NAVER_SEARCH_AD_API_KEY / SECRET / CUSTOMER_ID
NAVER_CLIENT_ID / SECRET
PEXELS_API_KEY, UNSPLASH_ACCESS_KEY (선택)
NEXT_PUBLIC_SUPABASE_URL                ← 신규
NEXT_PUBLIC_SUPABASE_ANON_KEY           ← 신규 (publishable key 사용 권장)
ANTHROPIC_API_KEY                       ← 신규
```

---

## 3. 디렉토리 구조 (핵심 파일)

```
app/
├── components/
│   ├── Navbar.tsx           # 그룹 드롭다운 메뉴 + 로그인 상태 표시
│   ├── FlowNav.tsx          # 페이지 하단 "다음 단계" 버튼 (1/7~7/7 진행도)
│   ├── GuideSection.tsx     # 접히는 SEO 가이드 섹션
│   └── ...
├── lib/
│   └── supabase/
│       ├── client.ts        # 브라우저용 Supabase 클라이언트
│       ├── server.ts        # 서버용 (cookies API 사용)
│       ├── middleware.ts    # 세션 자동 갱신
│       └── useUser.ts       # 클라이언트 훅 (user, configured, signOut)
├── api/
│   └── ai-draft/route.ts    # POST: Claude 호출 + 일일 카운트 / GET: 사용량 조회
├── auth/
│   └── callback/route.ts    # OAuth 콜백 처리
├── login/page.tsx           # Google 로그인 화면
├── trending/                # 인기검색어 (1/7)
├── keyword-analysis/        # 키워드분석 (2/7) — 키워드 클릭 시 선택 모달
├── competitor-analysis/     # 상위노출 분석 (3/7) — ?keyword= 자동 분석
├── prompt-generator/        # 프롬프트 생성 (4/7) — AI 초안 CTA 포함
├── editor/                  # 금칙어·맞춤법 (5/7) — sessionStorage에서 AI 초안 자동 로드
├── image-search/            # 이미지 검색 (6/7)
├── image-tools/             # 이미지 편집 (7/7)
├── lab/                     # 연구실 (블로그 운영 팁 모음)
├── privacy/page.tsx         # 개인정보처리방침 (Google OAuth 반영)
├── terms/page.tsx           # 이용약관 (AI 콘텐츠 면책 조항 포함)
└── layout.tsx               # 루트 레이아웃

middleware.ts                # 모든 요청에서 Supabase 세션 갱신
supabase/migrations/
└── 0001_ai_draft_usage.sql  # 일일 사용량 테이블 + RLS 정책
SETUP.md                     # Supabase + Google OAuth + Anthropic 셋업 가이드
```

---

## 4. 사용자 선호사항 (이 프로젝트에서 절대 어기지 말 것)

### 응답 스타일
- **한국어로 응답** (사용자가 한국어로 작업 중)
- 짧고 명확한 설명 우선, 필요 시에만 길게
- 코드 변경 후 항상 빌드 검증 (`npm run build`)
- 기능 구현 전에 큰 변화는 제안 → 승인 받고 진행

### Git 워크플로우
- **main 브랜치에 직접 commit + push** (사용자가 명시적으로 승인함)
- 사용자가 "B. main에 바로 병합" 이라고 결정함 (PR 만들지 않음)
- 커밋 메시지는 영어로, 본문에 한국어 가능
- 매 커밋마다 Vercel 자동 배포됨

### 메뉴 구조 (B안 — 그룹 드롭다운, 확정)
```
키워드 리서치 ▼   글쓰기 ▼          이미지 ▼          연구실
├ 인기검색어     ├ 프롬프트 생성   ├ 이미지 검색
├ 키워드분석     └ 금칙어·맞춤법   └ 이미지 편집
└ 상위노출 분석
```
- "홈" 메뉴는 제거 (로고 클릭 시 `/`로 이동)
- "경쟁분석"은 "**상위노출 분석**"으로 리네이밍 (라우트는 `/competitor-analysis` 유지)

### AI 초안 정책
- **신규 페이지**: `/ai-writer` — Claude API로 완성된 글을 받아 HTML/마크다운/일반 3가지 포맷 탭으로 표시 + 복사 버튼
- 한도: 비로그인 **1회/일** (IP 해시 기반), 로그인 **5회/일** (`LIMITS = { authed: 5, anon: 1 }`)
- 비로그인 IP 해시: SHA-256(salt + IP). 평문 IP 미저장. 30일 후 자동 삭제. 환경변수 `IP_HASH_SALT` + `SUPABASE_SERVICE_ROLE_KEY` 필요.
- 모델: `claude-sonnet-4-6`, max_tokens 4096, prompt caching ON
- 시스템 프롬프트에 "[나의 경험 삽입]" placeholder 지시 포함 → 사용자가 직접 채우도록 유도
- 흐름: `/prompt-generator`에서 프롬프트 만들기(무료 무제한) → "AI 글쓰기로 이동" 버튼 → sessionStorage `aiWriterPrompt` 키로 전달 → `/ai-writer`에서 생성 → 복사 또는 "에디터로 보내기" → `/editor`

---

## 5. 완료된 주요 작업 (시간순)

### Phase 1: 메뉴 재구성 (커밋 `df5fd6d`, `c7028f1`)
- 8개 플랫 메뉴 → 3개 그룹 드롭다운 (B안)
- "경쟁분석" → "상위노출 분석" 리네이밍
- `FlowNav` 컴포넌트로 페이지 간 다음 단계 연결
- 키워드분석 키워드 클릭 시 선택 모달 (상위노출 분석 / 프롬프트 바로 생성)
- 상위노출 분석 페이지: `?keyword=` 쿼리 자동 분석

### Phase 2: 인증 + AI 초안 (커밋 `f195517`)
- Supabase SSR 통합 (browser + server clients, middleware)
- `/login` Google OAuth 페이지
- `/auth/callback` OAuth 콜백
- Navbar에 사용자 아바타 + 로그아웃 메뉴
- `/api/ai-draft` POST/GET 엔드포인트
- 프롬프트 생성 페이지에 AI 초안 CTA 추가
- 에디터에 sessionStorage 기반 AI 초안 자동 로드 + 마크다운→HTML 변환
- 홈 페이지 features 그리드 업데이트 (인기검색어, 이미지검색+편집 추가, 상위노출 분석으로 리네이밍)

### Phase 3: 약관 정비 (커밋 `ec4a65e`)
- `/privacy` 14개 섹션 전면 재작성 (Google OAuth, Supabase, Claude API, 처리위탁표, 국외이전 고지)
- `/terms` 14개 조항 + 부칙 (AI 생성 콘텐츠 특별 고지, 일일 한도, 면책)
- 두 페이지 다크모드 스타일 통일

---

## 6. 진행 중인 작업

### 🚧 Google OAuth 동의화면 설정 (사용자가 직접 해야 함)

**현재 상황**: 사용자가 Google Cloud Console의 새 UI(**Google 인증 플랫폼**)에서 진행 중. 프로젝트 이름은 `my-blog-tool`.

**남은 단계** (좌측 메뉴 순서대로):
1. **브랜딩** — 앱 이름 (`Boheme BlogLab`), 지원 이메일, 홈페이지 URL, 개인정보처리방침/약관 URL 입력
   - 개인정보처리방침: `https://bohemebloglab.com/privacy`
   - 서비스약관: `https://bohemebloglab.com/terms`
   - 승인된 도메인: `bohemebloglab.com`, `supabase.co`
2. **대상** — User Type을 "외부"로 설정, 테스트 사용자에 본인 Gmail 추가
3. **클라이언트** — "+ 클라이언트 만들기" → 웹 애플리케이션
   - 승인된 JavaScript 원본: `https://bohemebloglab.com`, `http://localhost:3000`
   - 승인된 리디렉션 URI: `https://<SUPABASE_REF>.supabase.co/auth/v1/callback` (Supabase Authentication > Providers > Google에 표시된 정확한 URL)
4. 생성된 Client ID + Secret을 Supabase Authentication > Providers > Google에 붙여넣기
5. Supabase Authentication > URL Configuration:
   - Site URL: `https://bohemebloglab.com`
   - Redirect URLs: `https://bohemebloglab.com/auth/callback`, `http://localhost:3000/auth/callback`

### 환경변수 상태
- ✅ `NEXT_PUBLIC_SUPABASE_URL` — 입력 완료
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 입력 완료 (publishable key 사용)
- ❓ `ANTHROPIC_API_KEY` — 아직 미확인
- ❓ Supabase SQL 마이그레이션 (`supabase/migrations/0001_ai_draft_usage.sql`) 실행 여부 — 미확인

---

## 7. 다음에 할 만한 작업 (사용자가 관심 보인 아이디어)

블로그 컨설턴트 관점에서 사용자가 "이런 기능이 추가되면 좋겠다"고 흥미를 보였던 기능들 (우선순위 순):

1. **📚 내 키워드 저장소** — 분석한 키워드 즐겨찾기 + 검색량 추이 그래프
2. **📝 내 초안함** — AI 생성 초안 + 직접 작성한 글 저장 (재방문 트리거)
3. **🎯 오늘의 추천 키워드** — 관심 분야 기반 일일 이메일 (재방문율 최강)
4. **🔍 내 블로그 진단** — 네이버 블로그 URL 입력 → SEO 리포트
5. **✅ 발행 전 체크리스트** — 에디터에 자동 점검 (제목 길이, 키워드 포함, 이미지 수)
6. **📅 발행 캘린더** — 발행 계획 관리
7. **🏷 주제 클러스터** — 연관 키워드 트리 시각화
8. **💡 프롬프트 라이브러리** — 사용자 간 프롬프트 공유

**사용자가 선택한 Top 3**: 오늘의 추천 키워드 이메일, 내 초안함, 발행 캘린더

### 현재 무료 → 향후 유료화
사용자는 "초기엔 무료, 사용량 많아지면 멤버십으로 유료화" 방침. 현재 Claude API 비용은 사용자당 일 약 $0.03 수준 (캐싱 적용 시 더 낮음).

---

## 8. 알려진 제약 / 주의사항

### 빌드 / 런타임
- **로컬 개발**: `npm install` → `.env.local` 작성 → `npm run dev`
- **빌드 검증**: `npm run build` (현재 모든 페이지 정적 생성 + 미들웨어 활성화)
- **타입체크**: `npx tsc --noEmit`
- **린트 경고**: `react-hooks/set-state-in-effect` 경고가 몇 군데 있지만 의도된 패턴, 빌드는 통과

### Quill 에디터 특이사항
- React 19 호환성 위해 `dynamic({ssr: false})` 로 로드
- 초기 `value` prop은 마운트 시 한 번만 적용, 이후 prop 변경은 무시됨
- 외부에서 콘텐츠 주입 시 `quillEditorRef.current?.getEditor()` 사용 후 `setContents(delta, 'silent')` 호출
- `app/editor/page.tsx`의 AI 초안 로드 로직 참고 (마운트 후 ref 사용 가능해질 때까지 retry)

### Supabase 환경변수 미설정 상태
- `middleware.ts`, `useUser.ts`, login page 모두 `configured` 플래그로 가드 처리됨
- 환경변수 없으면 로그인 UI가 자동으로 숨겨지므로 기존 기능은 정상 동작

### `react/no-unescaped-entities` 에러
- 약관 페이지에서 큰따옴표는 반드시 `&ldquo;` `&rdquo;` 또는 `&quot;` 사용
- 점 구분자는 `&middot;` 사용

---

## 9. 빠른 작업 시작 가이드 (새 Claude 세션에서)

### 새로운 기능 개발 요청 시
1. 위 **6번 섹션** 확인 → 진행 중인 셋업이 끝났는지 확인
2. **4번 섹션** 사용자 선호사항 준수
3. 기존 컴포넌트 재사용:
   - 다음 단계 버튼 → `FlowNav`
   - 가이드 섹션 → `GuideSection`
   - 사용자 정보 → `useUser()` 훅
   - 페이지 헤더 패턴은 `keyword-analysis/page.tsx` 참고
4. 빌드 검증 → main에 commit & push (사용자 승인 가정)
5. Vercel 자동 배포 (1~3분)

### 디버깅 자주 필요한 곳
- 네이버 API 401/429 → API 키 만료/한도 초과 (`.env.local` 확인)
- Supabase 401 → URL/anon key 확인 (publishable key 또는 legacy anon 둘 다 OK)
- AI 호출 503 → `ANTHROPIC_API_KEY` 미설정
- AI 호출 429 → 일일 한도 소진 (정상 동작)
- 로그인 후 redirect_uri_mismatch → Google Cloud의 OAuth Client에 등록된 redirect URI 확인

---

_마지막 업데이트: 2026년 4월 26일 (Claude Code 세션 종료 시점)_
