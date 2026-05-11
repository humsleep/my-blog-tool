# Boheme BlogLab

**네이버·티스토리 블로거를 위한 올인원 포스팅 도구 + 블로거 커뮤니티**

[bohemebloglab.com](https://bohemebloglab.com)

---

## ✨ 주요 기능

### 🏠 데일리 대시보드 홈

들어오자마자 **오늘의 작업이 보이는 화면**.

- **로그인 사용자**: "{닉네임}님, 오늘도 데이터로 시작해볼까요?" 인사 + 마지막 진단 점수 카드(직전 진단 대비 ±delta + sparkline) + 즐겨찾기 키워드 칩 + 내 분야 인기 키워드 TOP 10
- **비로그인 사용자**: 검색창 + 진단 CTA + 전체 인기 검색어 **TOP 10 포디움**(1·2·3위 메달 카드 + 4~10위 리스트)
- 진단 점수는 누적 저장(`diagnose_results` 테이블)되어 다시 진단할 때마다 변동을 보여줍니다.

### 🩺 블로그 진단

네이버 블로그 RSS + 카테고리 핵심 키워드 30개로 1페이지 진입율을 측정하고, **최근 12편 본문은 PostView.naver를 직접 호출해 글자수·이미지 수를 정확 측정**합니다. **활동성 25% / 노출 50% / 품질 25%** 가중평균으로 0~100점 산출. band: top5 / top15 / top35 / mid / growing.

결과 페이지 구성:
1. **총점 게이지 + 3축 레이더** — 한눈에 보는 강약점
2. **노출 분포 스택바** — 30개 키워드를 1~10 / 11~20 / 21~30 / 미진입 4구간으로
3. **블로그 건강 체크 (8개 항목)** — 주 2회 발행, 7일 이내 최신 글, 1페이지 진입 30%+, 글당 800자+, 이미지 2장+ 등 통과/미통과
4. **30일 액션 플랜** — 가장 약한 축에 맞춘 4주 weekly 추천 (미진입 키워드 자동 인용)
5. **MethodologyPanel** — 3축 가중치 · 8개 통과 기준 · 데이터 소스 · 측정 한계 투명 공개

로그인 시 진단 이력 자동 저장 + 점수 변동 sparkline. **12시간에 1회 rate limit** (외부 API 호출 비용 보호).

### 🛠️ 도구 (8단계 워크플로우)

| 단계 | 메뉴 | 설명 |
|---|---|---|
| 1 | 인기검색어 | 네이버 검색광고 API 기반 카테고리별 인기 키워드 |
| 2 | 키워드분석 | 월간 검색량·경쟁률 분석 + CSV 다운로드 |
| 3 | 상위노출 분석 | 네이버 블로그 상위 게시글 패턴 분석 |
| 4 | 프롬프트 생성 | AI 글쓰기용 프롬프트 (무료 무제한, AI 호출 없음) |
| 5 | AI 글쓰기 | Claude Sonnet 4.6 + **SSE 스트리밍**(글이 실시간으로 흘러나옴) |
| 6 | 금칙어·맞춤법 | Quill 에디터 + 31개 금칙어 + LanguageTool |
| 7 | 이미지 검색 | Pexels + Unsplash 무료 저작권 이미지 |
| 8 | 이미지 편집 | 자르기·모자이크·필터 (Canvas) |

**AI 한도**: 비로그인 1회/일 (IP 해시 기반), 로그인 5회/일.
**기본 옵션** (비용·timeout 안전): 본문 1,300~1,700자 / 제목 1개 / 이미지 프롬프트 OFF / 자체 검토 ON. 사용자가 옵션 패널에서 토글로 더 풍부한 설정으로 변경 가능.
**1회 평균 비용**: ~$0.05~0.07 (Sonnet 4.6, compact + single).

### 👥 커뮤니티

| 메뉴 | 설명 |
|---|---|
| 🤝 서이추 해요 | 같은 분야 블로거 매칭 — 분야 필터 + 닉네임 검색 (1일 1글) |
| 💡 정보 공유 | 운영 노하우 게시판 — 6개 카테고리, 댓글, 좋아요, 조회수 |
| 🚶‍♂️ 체험단 동행해요 | 동행자 모집 — 시·도 + 시·군·구 2단계 지역 + 방문일 + 상태 관리 |

**정책**: 읽기는 누구나, 쓰기·댓글·좋아요는 로그인 + 닉네임 등록 필요. 닉네임 24시간 1회 변경.

### 📱 모바일

- PWA 지원 (홈 화면 추가 → standalone)
- 하단 탭 바 (홈 / 도구 / 커뮤니티 / 연구실)
- safe-area-inset 대응 (노치·홈바)
- 다크모드 자동/수동 전환

---

## 🚀 시작하기

### 요구사항

- Node.js 20+
- npm
- Supabase 프로젝트 (인증·DB)
- Anthropic API 키 (AI 글쓰기)
- 네이버 검색광고/오픈 API 키 (키워드·블로그·뉴스)

### 1. 클론 + 설치

```bash
git clone https://github.com/humsleep/my-blog-tool.git
cd my-blog-tool
npm install
```

### 2. 환경변수 설정

`.env.example`을 `.env.local`로 복사한 뒤 키를 입력합니다.

```bash
cp .env.example .env.local
```

필수 키:
- `NAVER_SEARCH_AD_API_KEY` / `NAVER_SEARCH_AD_SECRET_KEY` / `NAVER_SEARCH_AD_CUSTOMER_ID`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` (네이버 OpenAPI)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (비로그인 AI 한도 추적용)
- `IP_HASH_SALT` (32자 이상 랜덤, `openssl rand -hex 16`로 생성 권장)

선택 키 (이미지 검색):
- `PEXELS_API_KEY`
- `UNSPLASH_ACCESS_KEY`

자세한 설정 가이드는 [`SETUP.md`](./SETUP.md) 참조.

### 3. Supabase 마이그레이션

Supabase 대시보드 → SQL Editor 에서 순서대로 실행:

```
supabase/migrations/
├── 0001_ai_draft_usage.sql              # 로그인 AI 한도
├── 0002_anon_draft_usage.sql            # 비로그인 AI 한도 (IP 해시)
├── 0003_profiles.sql                    # 닉네임/블로그URL/분야 + 24h cooldown
├── 0004_swap_posts.sql                  # 서이추 + 1일 1글 RLS
├── 0005_tips.sql                        # 정보 공유 + 댓글 + 좋아요
├── 0006_companions.sql                  # 체험단 동행
├── 0007_companion_region_city.sql       # 시·군·구 컬럼
├── 0008_rate_limits.sql                 # 커뮤니티 작성 rate-limit 강화
├── 0009_reports_and_moderation.sql      # 신고·자동 숨김
├── 0010_user_presets.sql                # prompt_preset + saved_keywords
├── 0011_diagnose_results.sql            # 블로그 진단 결과 누적 저장
└── 0012_diagnose_rate_limit_12h.sql     # 진단 12시간 1회 RLS 강화
```

문제 발생 시 `supabase/diagnose_community.sql`로 정책·테이블 점검.

### 4. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

### 5. 빌드 검증

```bash
IP_HASH_SALT=test-salt-1234567890ab npm run build
npx tsc --noEmit
```

### 6. QA 테스트 (선택)

오픈 전 정밀 점검용 4종 스크립트가 `scripts/` 에 있습니다.

```bash
# 단위 테스트 (pure function, 79건)
npx tsx scripts/qa-unit-tests.ts

# SSRF 방어 테스트 (fetchPostBody, 14건)
npx tsx scripts/qa-ssrf-tests.ts

# 통합 스모크 테스트 (production server, 47건)
npm run start &  # 별도 터미널에서
bash scripts/qa-smoke.sh

# 회귀 테스트 (최근 변경사항, 41건)
bash scripts/qa-regression.sh

# Claude API 1회 호출 비용 추정
npx tsx scripts/qa-claude-cost-estimate.ts
```

---

## 🏗️ 기술 스택

| 영역 | 도구 |
|---|---|
| 프레임워크 | Next.js 16.1.6 (App Router, React 19, Turbopack) |
| 스타일 | Tailwind CSS v4 (CSS 토큰 기반) |
| 에디터 | Quill 2.x |
| 인증 | Supabase Auth (Google OAuth) |
| DB | Supabase Postgres + RLS (사용량 2 + 커뮤니티 6 + 리포트 1 + 진단 1 = 10개 테이블) |
| AI | Anthropic Claude Sonnet 4.6 + **SSE 스트리밍** (`messages.stream()`, `Anthropic({ maxRetries: 0 })`, per-request timeout) |
| 호스팅 | Vercel + Vercel Analytics, `maxDuration: 300s` (`/api/ai-draft`), 보안 헤더 5종(HSTS/X-Frame/CT-Options/Referrer/Permissions) |
| PWA | manifest.ts + 하단 탭바 + safe-area + favicon "B" 통일 (svg/png 192·512, apple-touch-icon 180) |

### 외부 API

- 네이버 검색광고 API (HMAC-SHA256 서명)
- 네이버 OpenAPI (블로그·뉴스 검색)
- LanguageTool.org (한국어 맞춤법)
- Wikipedia Pageviews (키워드 인기도)
- Pexels / Unsplash (이미지)

### 디자인 시스템

- **컨셉컬러**: 주황 `#f97316` (light) / `#fdba74` (dark)
- **공통 컴포넌트**: `Button`, `Card`, `PageHeader`, `Toast`, `Pagination`, `BoardSkeleton`, `EmptyState`, `CategoryChips`, `ConfirmModal`, `MobileBottomNav`
- **대시보드 위젯**: `TrendingTicker` (TOP 10 포디움), `LatestDiagnoseCard` (sparkline), `SavedKeywordsCard` (`app/components/dashboard/`)
- **차트 컴포넌트**: `ScoreGauge` (반원 게이지), `DiagnoseRadar` (Recharts 3축 레이더), `ScoreSparkline`, `MonthlyDistribution`, `HorizontalBarList` (`app/components/charts/`)
- **공통 유틸**: `formatRelativeKr`, `markdownToHtml`, `fetchMyProfile`, `safeJson` (`app/lib/clientFetch.ts` — 비-JSON 응답 안전 파싱)

---

## 📁 디렉토리 구조

```
app/
├── api/                       # API 라우트 (Next.js App Router)
│   ├── ai-draft/              # POST(SSE 스트리밍 지원) + GET(사용량)
│   ├── blog-diagnose/         # POST(진단 + 12h rate limit) + GET(이력 + sparkline)
│   └── (나머지 9개 라우트)
├── components/
│   ├── ui/                    # 디자인 시스템 (Button, Toast, Card, ...)
│   ├── community/             # 커뮤니티 전용 (Pagination, EmptyState, ...)
│   ├── dashboard/             # 홈 대시보드 위젯 (TrendingTicker, LatestDiagnoseCard, ...)
│   └── charts/                # 시각화 (ScoreGauge, DiagnoseRadar, ScoreSparkline, ...)
├── lib/
│   ├── supabase/              # 클라이언트·서버·admin·useUser
│   ├── community/             # categories, regions, profile, tips
│   ├── diagnose/              # category-seeds, naver-blog(SSRF 방어), scoring
│   ├── dashboard/             # 대시보드 타입·매핑
│   ├── format/                # 마크다운, 시간 포맷
│   ├── security/              # IP 해시, safe-redirect
│   └── clientFetch.ts         # safeJson() — 비-JSON 응답 안전 파싱
├── community/                 # 커뮤니티 3개 메뉴
├── profile/setup/             # 닉네임 등록·수정
├── blog-diagnose/             # 진단 페이지 (입력 → running → 결과 5개 섹션)
├── about / contact / privacy / terms   # 법무
└── (도구 8개 페이지)

supabase/migrations/           # SQL 마이그레이션 (0001~0012)
scripts/                       # QA 테스트 + 비용 추정
public/                        # 정적 자산 (icon.svg + 192/512 png, favicon.ico, og-image.png)
next.config.ts                 # 보안 헤더 + 이미지 remotePatterns
```

---

## 🔐 보안

- **IP 평문 저장 금지** — `IP_HASH_SALT`로 SHA-256 해시
- **Service role 키** — 서버 라우트에서만 사용 (`app/lib/supabase/admin.ts`)
- **RLS 활성화** — 모든 사용자 테이블에 row-level-security
- **이미지 프록시 화이트리스트** — Pexels·Unsplash·Google 도메인만 허용 (SSRF 방지)
- **fetchPostBody SSRF 방어** — 입력 URL에서 blogId/logNo만 추출 후 항상 `blog.naver.com` 호스트로 재조립 (`app/lib/diagnose/naver-blog.ts`)
- **safeNextPath** — `?next=` 파라미터 디코딩 + protocol-relative / javascript: / data: 차단
- **닉네임 24h cooldown** — DB 트리거로 강제
- **진단 12h rate limit** — RLS INSERT 정책 + API 사전 체크 이중 방어
- **보안 헤더** (`next.config.ts`) — HSTS / X-Frame-Options=SAMEORIGIN / X-Content-Type-Options=nosniff / Referrer-Policy=strict-origin-when-cross-origin / Permissions-Policy

---

## 📊 운영 현황

- **개발 phase**: 36.5 (2026-05-11 기준)
- **테스트 자동화**: 단위 79 + SSRF 14 + 통합 47 + 회귀 41 = 181 assertion (`scripts/qa-*`)
- **AI 비용 1회**: ~$0.05~0.07 (Sonnet 4.6, 기본 옵션 compact + single)
- **AI 비용 월간 추정** (cache miss 기준):
  - DAU 50 · 1회/일 → ~$87 (~₩126k)
  - DAU 200 · 1회/일 → ~$346 (~₩502k)
  - DAU 500 · 2회/일 → ~$1,732 (~₩2.5M)

상세 진행 일지는 [`DEVLOG.md`](./DEVLOG.md) 참조.

---

## 📄 라이선스

본 저장소는 운영자 개인 프로젝트입니다.

문의: boheme88@naver.com
