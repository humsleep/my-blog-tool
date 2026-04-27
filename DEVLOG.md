# DEVLOG — Boheme BlogLab

> 시간순 작업 일지. 새 세션은 `/resume` 슬래시 커맨드로 최근 항목 + git log를 한 번에 로드합니다.
> CLAUDE.md는 본질만 (자동 로드, 슬림 유지). 진행 상황은 여기에 누적.

---

## 2026-04-27 — Phase 5: 세션 메모리 자동화 + UI/UX 1차 정리

**커밋**: `4d72885` → `25cefa2` → `e3b7194` → `ec791a8` (모두 main 반영, Vercel 자동 배포)

### 5-1. 세션 메모리 자동화 (`4d72885`)
- `CLAUDE.md` 222→146줄 (-34%) 슬림화: 진행/완료/아이디어를 DEVLOG로 분리
- `DEVLOG.md` 신설 — 시간순 작업 일지
- `.claude/commands/resume.md` — `/resume` 슬래시 커맨드 (DEVLOG 최근 + git log/status 한 번에 로드)
- `.claude/session-start.sh` + `.claude/settings.json` — SessionStart 훅, 매 세션 시작 시 5줄 이내로 브랜치/마지막 커밋/dirty state 출력
- 토큰 비용: 매 세션 ~1.5K (CLAUDE.md만), `/resume` 호출 시만 +1K

### 5-2. Navbar 중복 버그 fix (`25cefa2`)
- 증상: 스크롤 내렸다 올리면 Navbar 2개 노출
- 원인: `app/ai-writer/page.tsx:6,124`에서 `<Navbar />`를 또 import/render. root layout(`layout.tsx:69`)이 이미 모든 페이지에 Navbar 제공. 둘 다 `sticky top-0`라 두 번째 sticky가 첫 번째 아래로 다시 등장
- 수정: ai-writer/page.tsx의 import + render 제거 (2줄)
- 다른 페이지 grep 확인 결과 동일 패턴 없음

### 5-3. UI/UX HIGH 일괄 (`e3b7194`)
시니어 디자이너 검수 → "복잡함의 근원은 정보 구조와 시각 위계". 4가지 즉효 수정:
- **globals.css 타이포 베이스라인**: body `line-height: 1.6`, headings `1.3`, antialiased 렌더링
- **h1 사이즈 통일** → PageHeader 표준 `text-2xl sm:text-3xl tracking-tight`
  - trending/page.tsx:136, competitor-analysis/page.tsx:94, prompt-generator(Suspense fallback) 정렬. 홈 hero만 예외
- **FlowNav 모바일 숨김** (`hidden md:block`) — 모바일에서 Navbar와 신호 중복 제거
- **prompt-generator 카테고리 아코디언화** — 4×N grid(≈70 버튼) → 세로 4행 접고 펼치기, 초기 모두 접힘, 선택 시 자동 펼침 + 부모 행 하이라이트, "선택됨: XXX" 라벨

### 5-4. UI/UX MID + LOW 일괄 (`ec791a8`) — globals.css 단일 파일
- **status 토큰 풀 세트**: `--success-bg/-text/-border`, `--warning-bg/-text/-border`, `--danger-bg/-text/-border` (light + dark). 향후 emerald/amber/red 하드코딩 대신 토큰으로 점진 마이그레이션
- **본문 가독성**: `p, li { line-height: 1.65 }` — 페이지마다 `leading-relaxed` 반복 제거
- **버튼/카드 hover 마이크로 인터랙션**:
  - `.btn-primary/.btn-secondary/.btn-danger` → `translateY(-1px)` + `shadow-lg` (자연스러운 lift)
  - `.card` hover → `border-color: var(--accent)` + `shadow-md`
- **모서리 미세조정**: `.card` 0.75rem → 0.625rem
- **그림자 재조정**: sm/md는 더 은은하게, lg는 0.12로 깊이감 → hover lift 가시성 확보
- **iOS 터치 타겟**: `.input-base { min-height: 44px }`
- **0개 페이지 파일 수정** — 모든 .card/.input-base/.btn-* 소비처가 자동 상속

### 사용자 후속 작업
- [x] Vercel 배포 자동 반영 확인
- [ ] (선택) emerald/amber 하드코딩 페이지 → status 토큰 점진 마이그레이션
- [ ] (선택) `app/components/ui/Card.tsx`가 `.card` 클래스 쓰는지 확인하고 새 hover 동작 활용

---

## 2026-04-27 — Phase 4: AI 글쓰기 분리 + 디자인 시스템

**커밋**: `ababcc2`
**작업**:
- `/ai-writer` 신규 페이지 — Claude API로 완성된 글 생성, HTML/마크다운/일반 3가지 포맷 탭 + 복사 버튼 + 글자 수
- AI 한도 정책 변경: 로그인 2회 → **로그인 5회 / 비로그인 1회**
- 비로그인 추적: SHA-256(IP + salt) 해시, `anon_draft_usage` 테이블 (service_role로 직접 쓰기, RLS는 anon/auth 차단)
- `prompt-generator` AI 버튼 → "AI 글쓰기로 이동" 보조 버튼으로 교체 (sessionStorage `aiWriterPrompt`로 전달)
- FlowNav 7→8단계, Step 5 = AI 글쓰기
- Navbar 글쓰기 그룹 재구성: 프롬프트 생성 → AI 글쓰기 → 금칙어·맞춤법
- 디자인 시스템 토큰화: `app/components/ui/{Button,PageHeader,Card,CopyButton}.tsx` 신설
- globals.css: `.btn-secondary/.ghost/.danger` 추가, 다크모드 대비 WCAG AA 강화 (#94a3b8 → #a3afc4)
- 홈 features 그리드 인라인 색상(rose/blue/amber/emerald) 제거 → 토큰 기반 통일
- 약관·개인정보처리방침: IP 해시 조항 + 새 한도 반영
- 마크다운→HTML 변환을 `app/lib/format/article-formats.ts`로 추출 (네이버 호환 화이트리스트)

**신규 환경변수**: `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`
**신규 마이그레이션**: `supabase/migrations/0002_anon_draft_usage.sql`

**사용자 직접 후속 작업** (배포 후 1회):
- [ ] Supabase SQL Editor에 `0002` 마이그레이션 실행
- [ ] Vercel에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [x] `IP_HASH_SALT` 추가
- [x] main 병합 + 푸시

---

## 2026-04-26 — Phase 3: 약관 정비

**커밋**: `ec4a65e`
- `/privacy` 14개 섹션 전면 재작성 (Google OAuth, Supabase, Claude API, 처리위탁표, 국외이전 고지)
- `/terms` 14개 조항 + 부칙 (AI 생성 콘텐츠 특별 고지, 일일 한도, 면책)
- 두 페이지 다크모드 스타일 통일

---

## 2026-04-25 — Phase 2: 인증 + AI 초안

**커밋**: `f195517`
- Supabase SSR 통합 (browser + server clients, middleware)
- `/login` Google OAuth, `/auth/callback`
- Navbar 사용자 아바타 + 로그아웃
- `/api/ai-draft` POST/GET (당시 로그인 전용 2회/일)
- prompt-generator → AI 초안 → editor 흐름 (당시)
- 홈 features 그리드 업데이트

---

## 2026-04-24 — Phase 1: 메뉴 재구성

**커밋**: `df5fd6d`, `c7028f1`
- 8개 플랫 메뉴 → 3개 그룹 드롭다운 (B안)
- "경쟁분석" → "상위노출 분석" 리네이밍
- `FlowNav` 컴포넌트 신설
- 키워드분석 키워드 클릭 시 선택 모달
- 상위노출 분석 페이지: `?keyword=` 자동 분석

---

## 진행 중 / 미해결

- ⏳ Google OAuth 동의화면 정식 게시 검토 (현재 테스트 중, 100명 한도)
- ⏳ Supabase Custom Domain (Pro $25/월 + $10 애드온) — 사용자 늘면 검토
- ⏳ 디자인 시스템 점진 마이그레이션: trending/keyword-analysis/competitor-analysis/lab/login 등 나머지 페이지 (Phase 5에서 globals.css 베이스라인 정돈 완료, 페이지별 PageHeader 적용은 진행 중)
- ⏳ status 토큰 도입한 기존 emerald/amber 하드코딩 페이지 마이그레이션

---

## 향후 아이디어 (사용자가 관심 표명)

**Top 3 (사용자 선택)**:
1. 오늘의 추천 키워드 이메일 — 재방문율 최강
2. 내 초안함 — AI/직접 작성 글 저장
3. 발행 캘린더

**Long list**:
- 내 키워드 저장소 (즐겨찾기 + 검색량 추이)
- 내 블로그 진단 (URL → SEO 리포트)
- 발행 전 체크리스트 (제목 길이, 키워드 포함, 이미지 수)
- 주제 클러스터 (연관 키워드 트리 시각화)
- 프롬프트 라이브러리 (사용자 간 공유)

**유료화 로드맵**: 초기 무료 → 사용량 늘면 멤버십 도입. Claude API 비용 ≈ $0.03/사용자/일.
