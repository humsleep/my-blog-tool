<div align="center">

# 🍊 Boheme BlogLab

**한국 블로거를 위한 데이터 기반 글쓰기 워크플로우**

키워드 분석 · 블로그 진단 · AI 글쓰기 · 커뮤니티를 한 곳에서.<br/>
"감"이 아니라 **점수**로 블로그를 운영하세요.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-d97757?logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://bohemebloglab.com)
[![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8)](https://web.dev/progressive-web-apps/)

### **[🌐 bohemebloglab.com](https://bohemebloglab.com)**

<br/>

<sub><i>※ 스크린샷 자리 — `docs/screenshots/` 추가 예정 (홈 대시보드 · 진단 결과 · AI 글쓰기 SSE)</i></sub>

</div>

---

## 📑 목차

- [이게 뭔가요](#-이게-뭔가요)
- [핵심 기능](#-핵심-기능)
- [시작하기](#-시작하기)
- [기술 스택](#️-기술-스택)
- [아키텍처](#-아키텍처)
- [보안](#-보안)
- [상태](#-상태)

---

## 🎯 이게 뭔가요

운영 중인 네이버·티스토리 블로그를 "막연한 느낌"이 아니라 **측정 가능한 숫자**로 봅니다. 카테고리 키워드 30개로 1페이지 진입율을 재고, 최근 12편 본문을 직접 호출해 글자수·이미지 수까지 계산합니다.

| 블로거의 흔한 고민 | 이 도구의 답 |
|---|---|
| "내 블로그 점수가 막연해요" | 카테고리 키워드 30개 1페이지 진입율 → **0~100점 + 5단계 밴드** |
| "AI 글쓰기 도구는 비싸요" | 무료 프롬프트 생성 + 로그인 시 **Claude Sonnet 4.6 하루 5회 무료** |
| "키워드 도구는 표만 보여줘요" | 네이버 검색광고 API 직접 호출, **CSV 다운로드**, 황금 키워드 자동 추출 |
| "혼자 운영하면 막혀요" | 같은 분야 블로거 매칭 · 정보 공유 · 체험단 동행 **3개 게시판** |

---

## ✨ 핵심 기능

### 🩺 블로그 진단

> 카테고리 키워드 30개 + 최근 본문 12편을 측정해 **0~100점**으로 평가합니다.

- **3축 가중평균**: 활동성 25% · 노출 50% · 품질 25%
- **5단계 밴드**: top5 / top15 / top35 / mid / growing
- **결과 5섹션**: 총점 게이지 + 3축 레이더 · 노출 분포 스택바 · 건강 체크 8항목 · 30일 액션 플랜 · MethodologyPanel(투명 공개)
- **이력 추적**: 로그인 시 자동 저장, 직전 진단 대비 ±delta + sparkline
- **남용 방지**: 12시간 1회 (RLS + API 사전 체크 이중 방어)

### 🛠️ 8단계 글쓰기 워크플로우

```
1.인기검색어 → 2.키워드분석 → 3.상위노출 분석
→ 4.프롬프트 생성(무료) → 5.AI 글쓰기(Claude Sonnet 4.6, SSE 스트리밍)
→ 6.금칙어·맞춤법 → 7.이미지 검색 → 8.이미지 편집
```

| # | 도구 | 특이점 |
|:-:|---|---|
| 1 | 인기검색어 | 네이버 검색광고 API 카테고리별 키워드 |
| 2 | 키워드분석 | 월간 검색량·경쟁률 + CSV 다운로드 |
| 3 | 상위노출 분석 | 네이버 1페이지 게시글 패턴 |
| 4 | 프롬프트 생성 | **무료 무제한** (AI API 미사용) |
| 5 | AI 글쓰기 | **SSE 스트리밍** + 로그인 5회/일 |
| 6 | 금칙어·맞춤법 | Quill 2.x + 31개 금칙어 + LanguageTool |
| 7 | 이미지 검색 | Pexels + Unsplash 통합 |
| 8 | 이미지 편집 | Canvas 기반 자르기·모자이크·필터 |

**AI 한도**: 비로그인 1회/일 (IP 해시) · 로그인 5회/일<br/>
**1회 호출 비용**: ~$0.05~0.07 (Sonnet 4.6, compact + single)

### 👥 커뮤니티

| 메뉴 | 정책 |
|---|---|
| 🤝 **서이추 해요** | 같은 분야 블로거 매칭 · 1일 1글 (RLS 강제) |
| 💡 **정보 공유** | 6개 카테고리 · 댓글 · 좋아요 · 조회수 |
| 🚶 **체험단 동행해요** | 시·도 + 시·군·구 2단계 지역 · 방문일 · 상태 관리 |

**공통 정책**: 읽기는 누구나 · 쓰기/댓글/좋아요는 로그인 + 닉네임 등록 · 닉네임 24h 1회 변경.

### 📱 모바일·PWA

- 홈 화면 추가 시 standalone 앱처럼 동작
- 하단 탭바 (홈 / 도구 / 커뮤니티 / 연구실)
- safe-area-inset 대응 (노치 · 홈바)
- 다크모드 자동/수동 전환

---

## 🚀 시작하기

### 요구사항

- **Node.js 20+** / npm
- **Supabase** 프로젝트 (인증 · DB)
- **Anthropic API 키** (AI 글쓰기)
- **네이버 검색광고 / 오픈 API 키** (키워드 · 블로그 · 뉴스)

### 1️⃣ 클론 · 설치

```bash
git clone https://github.com/humsleep/my-blog-tool.git
cd my-blog-tool
npm install
```

### 2️⃣ 환경변수

```bash
cp .env.example .env.local
```

| 변수 | 용도 |
|---|---|
| `NAVER_SEARCH_AD_API_KEY` / `SECRET_KEY` / `CUSTOMER_ID` | 검색량·경쟁률 |
| `NAVER_CLIENT_ID` / `CLIENT_SECRET` | 블로그·뉴스 검색 |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | 클라이언트용 |
| `SUPABASE_SERVICE_ROLE_KEY` | 비로그인 한도 추적 (서버 전용) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 |
| `IP_HASH_SALT` | 32자 이상 — `openssl rand -hex 16` |
| `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` | (선택) 이미지 검색 |

자세한 가이드는 [`SETUP.md`](./SETUP.md) 참조.

### 3️⃣ Supabase 마이그레이션

대시보드 → SQL Editor 에서 `supabase/migrations/0001 → 0012` 순서대로 실행.<br/>
12개 마이그레이션 = 사용량 2 · 커뮤니티 6 · 신고 1 · 사용자 프리셋 1 · 진단 2 테이블.

문제 발생 시: `supabase/diagnose_community.sql` 헬퍼로 정책·테이블 점검.

### 4️⃣ 개발 / 빌드

```bash
npm run dev                                              # http://localhost:3000
IP_HASH_SALT=test-salt-1234567890ab npm run build        # 프로덕션 빌드 검증
npx tsc --noEmit                                          # 타입체크
```

### 5️⃣ QA (선택)

```bash
npx tsx scripts/qa-unit-tests.ts          # 단위 79건
npx tsx scripts/qa-ssrf-tests.ts          # SSRF 방어 14건
bash scripts/qa-smoke.sh                   # 통합 47건 (production server 필요)
bash scripts/qa-regression.sh              # 회귀 41건
npx tsx scripts/qa-claude-cost-estimate.ts # 1회 호출 비용 추정
```

---

## 🏗️ 기술 스택

| 영역 | 도구 |
|---|---|
| **프레임워크** | Next.js 16.1.6 (App Router · React 19 · Turbopack) |
| **스타일** | Tailwind CSS v4 (CSS 토큰 기반 디자인 시스템) |
| **에디터** | Quill 2.x (dynamic import, SSR 비활성) |
| **인증** | Supabase Auth (Google OAuth) |
| **DB** | Supabase Postgres + RLS (10개 테이블) |
| **AI** | Anthropic Claude Sonnet 4.6 · **SSE 스트리밍** · prompt caching · per-request timeout |
| **호스팅** | Vercel + Analytics · `maxDuration: 300s` · 보안 헤더 5종 |
| **PWA** | manifest.ts + 하단 탭바 + safe-area + "B" 브랜드 아이콘 |

### 외부 API

`네이버 검색광고 (HMAC-SHA256)` · `네이버 OpenAPI` · `Wikipedia Pageviews` · `LanguageTool.org` · `Pexels` · `Unsplash`

### 디자인 시스템

- **컨셉컬러**: 주황 `#ea580c` (Hermès orange) / 다크 `#fb923c` (orange-400)
- **공통 UI**: `Button(loading)` · `Toast` · `Card` · `Pagination` · `BoardSkeleton` · `EmptyState` · `MobileBottomNav`
- **대시보드 위젯**: `TrendingTicker` · `LatestDiagnoseCard` · `SavedKeywordsCard`
- **차트**: `ScoreGauge` · `DiagnoseRadar` · `ScoreSparkline` · `MonthlyDistribution`
- **유틸**: `formatRelativeKr` · `markdownToHtml` · `safeJson` (비-JSON 응답 안전 파싱)

---

## 🗂️ 아키텍처

```
app/
├── api/                     # Next.js Route Handlers
│   ├── ai-draft/            # POST(SSE 스트리밍) + GET(사용량)
│   ├── blog-diagnose/       # POST(진단 + 12h rate limit) + GET(이력 + sparkline)
│   └── …
├── components/
│   ├── ui/                  # 디자인 시스템 (Button, Toast, …)
│   ├── community/           # Pagination, EmptyState, …
│   ├── dashboard/           # TrendingTicker, LatestDiagnoseCard, …
│   └── charts/              # ScoreGauge, DiagnoseRadar, …
├── lib/
│   ├── supabase/            # client · server · admin · useUser
│   ├── diagnose/            # category-seeds · naver-blog(SSRF guard) · scoring
│   ├── security/            # IP 해시 · safe-redirect
│   └── clientFetch.ts       # safeJson()
├── blog-diagnose/           # 진단 (입력 → running → 5섹션 결과)
├── community/               # 서이추 · 정보공유 · 체험단
└── (도구 8개 페이지)

supabase/migrations/         # 0001 ~ 0012 (12개 마이그레이션)
scripts/                     # QA 테스트 4종 + 비용 추정
```

전체 디렉토리·파일 단위 매핑은 [`CLAUDE.md`](./CLAUDE.md) 참조.

---

## 🔐 보안

| 영역 | 정책 |
|---|---|
| **IP 보호** | 평문 저장 금지 · `SHA-256(IP_HASH_SALT + IP)` · salt 미설정 시 503 |
| **Service role 키** | 서버 라우트 전용 (`app/lib/supabase/admin.ts`) · 클라이언트 import 차단 |
| **RLS** | 모든 사용자 테이블 row-level-security 활성 |
| **SSRF 방어** | `fetchPostBody` — 입력 URL에서 blogId/logNo만 추출, 호스트는 항상 `blog.naver.com` |
| **이미지 프록시** | Pexels · Unsplash · Google 도메인만 화이트리스트 |
| **redirect 검증** | `safeNextPath` — protocol-relative · `javascript:` · `data:` 차단 |
| **닉네임 변경** | DB 트리거로 24시간 1회 강제 |
| **진단 rate limit** | RLS INSERT 정책 + API 사전 체크 (12h 1회) |
| **HTTP 헤더** | HSTS · X-Frame-Options · X-Content-Type · Referrer-Policy · Permissions-Policy |

---

## 📊 상태

- **현재 phase**: 36.5+
- **테스트 자동화**: 단위 79 · SSRF 14 · 통합 47 · 회귀 41 = **181 assertion**
- **AI 1회 호출 비용**: ~$0.05~0.07 (Sonnet 4.6, compact + single)
- **월간 비용 모델** (cache miss 기준):

  | 규모 | 일일 호출 | 월 추정 |
  |---|---|---|
  | DAU 50 | 1회/일 | ~$87 (~₩126k) |
  | DAU 200 | 1회/일 | ~$346 (~₩502k) |
  | DAU 500 | 2회/일 | ~$1,732 (~₩2.5M) |

상세 진행 일지: [`DEVLOG.md`](./DEVLOG.md)

---

## 📄 라이선스 · 문의

본 저장소는 **개인 운영 프로젝트**입니다. 코드는 학습 · 참고 목적으로 열어두지만 별도 라이선스를 부여하지는 않습니다.

- 운영자: **humsleep**
- 문의: <boheme88@naver.com>
- 도메인: [bohemebloglab.com](https://bohemebloglab.com)

<div align="center">

<br/>

<sub>Made with 🍊 in Korea · Powered by Next.js · Supabase · Anthropic Claude</sub>

</div>
