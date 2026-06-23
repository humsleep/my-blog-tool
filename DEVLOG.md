# DEVLOG — Boheme BlogLab

> 시간순 작업 일지. 새 세션은 `/resume` 슬래시 커맨드로 최근 항목 + git log를 한 번에 로드합니다.
> CLAUDE.md는 본질만 (자동 로드, 슬림 유지). 진행 상황은 여기에 누적.

---

## 2026-06-23 — 진단 노출 측정 개편 + AI 인용 준비도 고도화 (Phase 59.2)

### 배경
- 사용자 피드백: "분야 고정 키워드 30개" 노출 측정은 전문 키워드를 안 쓰는
  블로그엔 불공정. 또 2026 네이버는 Cue: 종료·AI 브리핑(통합검색 20%+)으로
  AI 인용이 노출의 본류로 진입 → AI 인용 진단 정확도 요구.

### ① 노출 측정 — 내 글 기준 + 경쟁도 보정 (자기키워드 인플레이션 방지)
- (선행, 직전 커밋) 분야 고정 키워드 → **내 글 제목에서 추출한 키워드**로
  검색해 내 글 랭크 측정 + 분야 자동 감지. (`title-keyword.ts`, `detectCategory`)
- (이번) **경쟁도 가중**: `searchBlogWithMeta`로 키워드별 `total`(총 문서수)
  수집 → `scoreVisibility` 가 무경쟁(<300) 노출은 0.3배로 깎고 경쟁 키워드
  노출은 1.3배 인정. 분모를 키워드 수로 두어 "무경쟁만 1위" 만점 방지.
  - `VisibilityHit.competition`, `VisibilityScore.lowCompetitionHits` 추가
  - 결과 페이지 노출 상세에 키워드별 "경쟁 약/보통/있음/높음" 라벨 표시
  - 노출 다수가 무경쟁이면 인사이트로 경고

### ② AI 인용 준비도(메이트/GEO) 고도화
- `mate-readiness.ts` 5→6 체크: "도입부 팩트" → **"답변 우선 도입부"**(키워드+
  정의/단정/방법 패턴), **"요약·결론 블록"** 신규. 가중치 `MATE_WEIGHTS` export
  → `MateReadinessCard` 가 import(중복 제거). 팁/문구 AI 브리핑 기준으로 갱신.

### 검증
- 단위테스트 112건 통과(+11: 경쟁도 보정 3, mate v2.2 6, 기타). tsc·build 통과.

### 남은 작업 (③, 블로커)
- AI 브리핑 **실측 인용 probe**는 이 원격 환경 egress 허용목록이 네이버
  (`search.naver.com`)를 차단해 타당성 스파이크 불가. 허용목록 추가 후 진행 예정.

---

## 2026-06-23 — 모바일 터치 타겟 · 스크롤 어포던스 (Phase 59.1)

### 점검
- 모바일 UI/UX 전수 점검(2개 Explore 에이전트 병렬) → 검증 후 오탐 2건 제외
  (MosaicTool은 이미 터치 지원 / SwapModal 16px input은 iOS 줌 방지로 정상)

### 변경 (High 우선순위)
- **터치 타겟 44px 상향**:
  - `community/Pagination.tsx` — 페이지/화살표 버튼 `min-w/h-[44px]`
  - `community/CategoryChips.tsx` — 칩 `min-h-[44px] px-4 text-sm`
  - `trending/page.tsx` — 카테고리 칩 `min-h-[44px]`
  - `image-search/page.tsx` — 다운로드 버튼 `w-9→w-11`(36→44px)
  - `prompt-generator/page.tsx` — 세부 카테고리 `min-h-[36px]→[44px]`
  - `blog-diagnose/page.tsx` — 분야 선택 버튼 `min-h-[44px]`
- **가로 스크롤 어포던스**: CategoryChips·trending 카테고리 행에 우측 페이드
  마스크(`mask-image`)로 "더 스크롤 가능" 시각 신호 추가
- 빌드·`tsc --noEmit` 통과

---

## 2026-06-23 — 모바일 앱화 3차: 리스트 필터 바텀시트 (Phase 60.3)

### 변경 (모바일 전용, 데스크탑 유지)
- 신규 `community/FilterBottomSheet` — 목록 필터를 모바일 하단 시트로(배경 잠금·완료 버튼)
- **tips 목록**: 카테고리 칩·정렬을 모바일에선 "필터" 버튼 → 시트로. 검색창만 상시 노출. 활성 시 점 표시
- **companions 목록**: 지역·시군구·모집중 필터를 "필터" 버튼 → 시트로. 버튼에 현재 선택 요약 표시
- PR #89 → main squash merge

---

## 2026-06-23 — 모바일 앱화 2차: 무거운 화면·모달 (Phase 60.2)

### 변경 (모바일 전용, 데스크탑 유지)
- **진단 ScoreGauge 반응형**: 고정 px → SVG fluid(`width:100%` + `maxWidth`)로 작은 화면 오버플로 방지
- **에디터 Quill 최소 높이**: `400px` → `min(400px, 50vh)`
- **AI 글쓰기 옵션 패널 모바일 기본 접힘**(matchMedia) — 스크롤 단축, 생성 버튼 근접
- **이미지 편집 높이**: `80vh/minHeight500` → `clamp(420px,72vh,760px)`
- **모달 바텀시트화**: SwapModal·ReportModal 모바일 하단 시트(rounded-t·max-h·overflow) + 닫기 X
- PR #88 → main squash merge

---

## 2026-06-23 — 모바일 앱화 1차: 네비게이션·폼·터치 (Phase 60.1)

### 변경 (모바일 전용, 데스크탑 유지)
- **앱식 상단 back 바** 신규 `MobileSubHeader` 컴포넌트(sticky top-14, 뒤로+제목).
  적용: community tips/[id]·companions/[id]·tips/new·companions/new, profile/setup.
  기존 breadcrumb/← 목록 링크는 `hidden sm:*` 로 데스크탑 전용 전환
- **긴 폼 제출 버튼 sticky 하단 액션바**(모바일, `bottom-16` 바텀탭 위): tips/new·companions/new·profile, 버튼 `min-h-[44px]`
- **터치 타겟·피드백**: trending 카드 "분석하기" `min-h-36→44`, 리스트 행 `active:bg-*`
- **iOS 자동 줌 방지**: 폼 입력/댓글/본문 textarea `text-base sm:text-sm`(16px) 통일
- PR #__ → main squash merge

---

## 2026-06-23 — 모바일 앱 느낌 정리 (Phase 59.3)

### 변경 — 모바일에서 불필요한 장식/공백 제거 (데스크탑 유지)
- 커뮤니티 허브: 상단 여백 추가 압축(`pt-4 pb-10`), 히어로는 이미 모바일 숨김
- 큰 hero 세로 패딩 축소(모바일): trending/competitor/image-search `py-8 → py-5`,
  start `py-12 → py-6`, blog-diagnose `py-8 → py-5`, lab `py-12 → py-6`,
  ai-writer `py-8 → py-5`
- 장식 요소 모바일 숨김: `lab` 마스트헤드·`ed-eyebrow`·`ed-rule`,
  blog-diagnose 상단 pill 배지
- 중복/장황한 hero 부제 모바일 숨김(`hidden sm:block`): trending·competitor·
  keyword-analysis·image-search·image-tools·prompt-generator·lab·blog-diagnose·
  community swap/tips/companions, 공통 `PageHeader` subtitle(→ tools·contact·ai-writer)
- PR #__ → main squash merge

---

## 2026-06-23 — 모바일 커뮤니티 허브 정리 (Phase 59.2)

### 변경
- 커뮤니티 허브(`app/community/page.tsx`) 메뉴 3개를 모바일에서도 **한 줄 3열**로
  (`grid-cols-3`, 컴팩트 아이콘+제목, 설명/배지/바로가기는 sm 이상). 메뉴별 아이콘 추가
- 커뮤니티 규칙: 모바일 **아이콘 리스트(세로 구분선)**, sm 이상 3열 카드 그리드로 가독성 개선
- PR #81 → main squash merge

---

## 2026-06-22 — 모바일 UI/UX 업그레이드 (Phase 59)

### 리서치
- 2025~2026 모바일 트렌드 리서치 → `docs/mobile-ux-references.md` 정리
  (하단 탭바 표준 · 바텀시트 · FAB 통합 · 마이크로 인터랙션 + 햅틱 · 스켈레톤)

### 변경
- **하단 탭바 모션 강화** (`MobileBottomNav.tsx`): Material 3 스타일 활성 인디케이터
  필(아이콘 뒤 알약, 200ms morph) + 탭 시 `active:scale-90` 마이크로 인터랙션
- **가운데 글쓰기 FAB**: 하단 바 중앙에 떠 있는 주요 액션 버튼(→ `/start`).
  탭 4개 → `grid-cols-5` (홈·도구 / FAB / 커뮤니티·진단) 구조로
- **햄버거 → 바텀시트** (`Navbar.tsx`): 상단 드롭다운 메뉴를 하단에서 올라오는
  바텀시트로 전환 — 드래그 핸들 + 스와이프-다운 닫기 + backdrop 탭 닫기 +
  배경 스크롤 잠금. 엄지 접근성 ↑
- `globals.css`: `.animate-sheet-up`, `.animate-backdrop-in` 키프레임 추가
- 빌드·`tsc --noEmit` 통과

---

## 2026-06-15 — 모자이크 도구 최적화 (Phase 58.3)

### 변경
- 드래그 상태를 ref로 전환 → mousemove 중 불필요한 re-render 제거
- `requestAnimationFrame` 스로틀링으로 60fps 렌더링
- 드래그 중 실시간 모자이크/블러 미리보기 (점선만 → 실제 효과)
- 증분 적용: 새 영역은 현재 위에 바로 적용, undo만 전체 리플레이
- blur 임시 캔버스 재사용 (GC 부하 감소)
- `Ctrl+Z` / `Cmd+Z` 되돌리기 단축키
- 윈도우 리사이즈 시 캔버스 자동 재조정 + 커서 clamp
- PR #77 → main squash merge

---

## 2026-06-15 — 영역 모자이크 · 블러 도구 (Phase 58.2)

### 변경
- `MosaicTool.tsx` 신규: 이미지 위에 드래그하여 특정 영역 픽셀화(모자이크) 또는 가우시안 블러 적용
- 풀해상도 처리 (표시 캔버스와 원본 캔버스 분리), 모바일 터치 지원
- 되돌리기/초기화, 강도 슬라이더(8~50)
- 2단계 워크플로우: ① 모자이크·블러 → ② Filerobot 편집기 (단계 인디케이터 UI)
- "바로 저장" 옵션으로 편집기 건너뛰기 가능
- PR #75 → main squash merge

---

## 2026-06-15 — 이미지 편집 클립보드 붙여넣기 (Phase 58.1)

### 변경
- 이미지 편집 페이지에 `Ctrl+V`(Cmd+V) 클립보드 이미지 붙여넣기 지원 추가
- `window paste` 이벤트 리스너로 `clipboardData.items` 에서 이미지 파일 추출
- 업로드 영역 안내 문구에 "Ctrl+V로 붙여넣기 가능" 표시 추가
- PR #72 → main squash merge

---

## 2026-06-15 — 메뉴 재구성 + Filerobot 이미지 편집기 (Phase 58)

### 배경
1. 상단 메뉴 "더보기"가 이미지 검색·편집·연구실을 한데 묶어 이질감
2. 기존 이미지 편집기(커스텀 Canvas, ~1700줄)가 무겁고 기능 부족

### 변경 A — 메뉴 재구성
- **"더보기" 제거** → **"이미지 ▼"** 드롭다운(이미지 검색 + 이미지 편집) + **"연구실"** 평면 링크
- 모바일 햄버거 메뉴도 동일 구조로 업데이트
- `CLAUDE.md` 메뉴 구조 Phase 53 → Phase 58 반영

### 변경 B — Filerobot 이미지 편집기 통합
- `react-filerobot-image-editor` v5 (Scaleflex, MIT, ★4.9k) 도입
- `styled-components` + `react-konva` peer deps 설치
- `app/image-tools/page.tsx`: ~1700줄 커스텀 Canvas → ~170줄 Filerobot 래퍼
- 탭: Adjust / Finetune / Filters / Annotate / Resize + Crop 프리셋(1:1, 16:9, 9:16, 4:3, 3:4)
- Turbopack `canvas` 모듈 호환: `next.config.ts` resolveAlias + `empty-module.js`
- sessionStorage `pendingImage` 연동(이미지 검색→편집 흐름) 유지

---

## 2026-06-15 — 진단 결과 페이지 정리 + 시각화 강화 (Phase 57)

### 배경
1. 메이트 선정까지 얼마나 부족한지 한눈에 보기 어렵다는 피드백
2. 결과 페이지에 정보가 너무 많아 핵심이 묻힘

### 변경 A — GEO 시각화 강화
- **GeoHeadline**: 4단계 등급 구간 색상 게이지바 + 현재 위치 마커 + 메이트 기준선(75) + "N점 부족" 메시지
- **MateReadinessCard**: 항목별 "+N점 가능" 뱃지 + 우선 개선 항목 요약(효과 큰 순 3개) + 예상 점수 시뮬레이션

### 변경 B — 결과 페이지 대폭 정리 (-465줄)
**제거 (6개 섹션)**: 3축 ScoreCard(중복) / 30일 ActionPlan(일반적) / Insights(중복) / 코치 카드(겹침) / 경쟁 패턴 카드(비핵심) / MethodologyPanel
**추가**: `HowItWorks` 카드 — "이 진단은 이렇게 작동해요" 3단계 시각 설명 (RSS수집 → 키워드검색 → 3축점수)
**통합**: 키워드 상세 목록을 노출 분포 차트 안에 접이식(`<details>`)으로 병합
**새 순서**: HowItWorks → 총점 → GEO게이지 → 메이트준비도 → 건강체크 → 노출분포(+키워드) → CTA

---

## 2026-06-11 — 진단 정확도 개편: 본문 실측 기반 메이트/코치 + GEO 헤드라인 (Phase 56)

### 배경
진단 로직 점검 결과, 메이트(GEO)·코치가 **RSS 요약 280자** 기반이라 구조·데이터·길이 체크가 구조적으로 과소평가됨. 메인 진단은 본문 12편을 PostView로 실측하면서 그 텍스트를 버리고 있었음. 또 `fetchPostBody` 가 본문 컨테이너~문서 끝까지 슬라이스해 댓글·관련글 위젯까지 포함→글자수·이미지 과대측정.

### 변경
**`app/lib/diagnose/naver-blog.ts`**
- `fetchPostBody` 가 `text`(줄바꿈 보존 본문, 8,000자 캡)도 반환 → 메이트/코치가 실측 본문으로 분석 가능
- `boundPostRegion` 추가: 댓글·관련글·태그·플로팅 위젯 경계에서 컷 → 글자수·이미지 과대측정 제거
- `stripHtmlPreserveLines` 추가(블록 경계→\n) — 소제목·도입부 구조 신호 보존

**`app/api/blog-diagnose/route.ts`**
- 가져온 실측 본문을 `items[].contentSnippet` 에 주입 → 같은 데이터로 `analyzeMateReadiness`·`analyzeCoach` 계산(본문 재fetch 0, 네이버 차단 위험 ↓)
- 응답에 `geo{score,grade}` + `mate` + `coach` 포함
- 로그인 저장: insert 후 best-effort `update({geo_score})` (0013 미적용 시 무시, 비파괴)

**결과 페이지 / 카드**
- `GeoHeadline` — 총점과 분리된 "AI 인용 적합성(GEO)" 헤드라인 지표 추가 (총점 미반영 명시)
- `MateReadinessCard`·`HeuristicCoachCard` 에 `initial` prop → 메인이 계산한 리포트 즉시 사용(lazy fetch 폴백 유지)
- MethodologyPanel 에 GEO 데이터 소스·한계 문구 추가

**`supabase/migrations/0013_diagnose_geo_score.sql`** (신규) — nullable `geo_score smallint`. SQL Editor 실행 필요(미실행이어도 진단·저장 정상).

### 보류 (의도적)
- 노출 랭킹은 검색 OpenAPI `sort=sim` — 실제 통합검색 탭 순위와 다름(무료 API 한계). MethodologyPanel 에 이미 고지.
- GEO 를 총점 4번째 축으로 편입하는 안은 기존 저장 점수·밴드 호환 위해 보류(별도 지표 유지).

### 검증
- `tsc --noEmit` + `npm run build` 50/50 + `qa-unit-tests` 87/87. PR #68 → main.

## 2026-06-11 — 백로그 정리: 모바일 도구 허브 + 토큰화 + console.log (Phase 55)

### 변경
**모바일 도구 허브 (신규 `app/tools/page.tsx`)**
- 모바일 하단 탭 "도구"가 `/keyword-analysis`로 직행하던 것 → `/tools` 허브로 변경
- Phase 53 IA(키워드 리서치·글쓰기·진단·이미지/기타)를 그대로 펼친 그룹형 목록. 데스크톱 그룹 드롭다운과 모바일 탐색 격차 해소
- `MobileBottomNav.tsx`: href `/keyword-analysis` → `/tools`, match 배열에 `/tools`·`/start` 추가
- 허브 카드는 `.card` 토큰 사용 (인라인 tailwind 재구현 지양)

**디자인 토큰화 (`app/page.tsx`)**
- 홈 "전체 도구 보기" 8단계 그리드 카드: 인라인 border/bg/hover → `.card` 클래스로 통일

**품질 (`app/api/ai-draft/route.ts`)**
- 스트림 성공 경로 `console.log`(타이밍·글자수) 제거. 미사용된 `elapsed`/`ttfb` 변수도 함께 정리 (에러 경로 `console.error`는 디버깅용으로 유지)

### 보류 (의도적)
- 레거시 `.ed-*`/`.bg-paper`/`.text-ink` CSS 별칭: 8개 파일 40+곳에서 **실제 사용 중** → 제거 시 스타일 깨짐. "정리"가 아니라 대규모 마이그레이션이라 제외.

### 검증
- `tsc --noEmit` + `npm run build` 50/50 정적 생성. PR #67 → main.

## 2026-06-11 — 내비 드롭다운 키보드 접근성 (Phase 54)

`app/components/Navbar.tsx` 드롭다운 4종(키워드 리서치·글쓰기·커뮤니티·더보기)에 WAI-ARIA menu 키보드 패턴 추가:
- Esc 로 닫기 (document 레벨 → 트리거 버튼 포커스 상태에서도 동작)
- `role="menuitem"` + `aria-current` 부여
- ↑/↓ · Home/End 항목 포커스 이동, Esc 시 트리거로 포커스 복귀(분실 방지)
- 트리거 버튼 ↓ 입력 시 메뉴 열고 첫 항목 포커스
- 검증: `tsc --noEmit` + `npm run build` 49/49 통과. PR #65 → main.

남은 백로그(미착수): 모바일 "도구" 허브 전략, page.tsx 디자인 토큰화, 레거시 `.ed-*`/console.log 정리.

## 2026-06-11 — 메뉴 문서 갱신 + 온보딩 잔재 수정 (Phase 53.1)

- `CLAUDE.md` 메뉴 구조(확정) 다이어그램을 Phase 53 기준으로 갱신
- `OnboardingTour.tsx` 마지막 슬라이드 안내에 "키워드 리서치" 추가 (Phase 53 누락 보정)
- 최종 점검(Explore) 결과 백로그로 정리: 드롭다운 a11y(Esc·role=menuitem·포커스), 모바일 "도구" 허브 전략, page.tsx 토큰화, 레거시 .ed-* 정리

## 2026-06-11 — 내비 IA 재구성: 목표 기반 그룹핑 (Phase 53)

### 배경
3관점(기획자/UI·UX/블로거) 메뉴 점검 결과, **키워드 리서치 3종(인기검색어·키워드분석·상위노출)이 메뉴 3곳에 분산**된 게 최대 문제로 확인됨. Phase 52에서 인기검색어를 평면 링크로 승격한 게 발견성은 해결했으나 형제 도구와의 비대칭을 키움. 문서(CLAUDE.md)에 원래 있던 그룹형 구조로 복원 + 보강.

### 변경
**`app/components/Navbar.tsx`**
- 신규 `KEYWORD_MENU` 드롭다운: 인기검색어 · 키워드 분석 · 상위노출 분석 (3종 통합)
- `WRITING_MENU`: '키워드부터'(키워드분석) 제거 → 키워드 리서치로 이관, '프롬프트 생성'을 더보기에서 글쓰기 흐름으로 편입
- `MORE_MENU`: 메가패널(ToolGroup[]) → 단순 드롭다운(ToolItem[] 3개: 이미지 검색·편집·연구실)
- 데스크톱 순서: **키워드 리서치 ▼ · 글쓰기 ▼ · 진단 · 커뮤니티 ▼ · 더보기 ▼**
- 모바일 햄버거: 분석(진단) · 키워드 리서치 · 글쓰기 · 커뮤니티 · 더보기 그룹 정합

**`app/components/MobileBottomNav.tsx`**
- 하단 탭 `연구실` → `진단` 교체 (전환 동력을 엄지존으로, 연구실은 햄버거로 강등)

### 검증
- `npx tsc --noEmit` 통과 + `npm run build` 49/49 정적 생성

### 배포
- PR #63 → main merge → Vercel 자동 배포

## 2026-06-11 — 내비: 인기검색어 상단 승격 + UI 카피에서 AI 브랜드명 제거 (Phase 52)

### 변경
**`app/components/Navbar.tsx`**
- 인기검색어(`/trending`)가 `더보기` 메가패널 2단계 안쪽에 있어 발견성이 낮던 문제 해결
- 데스크톱: `진단` 옆 평면 top-level 링크로 승격 + `isTrendingActive` 추가
- 모바일: "분석" 그룹에 블로그 진단 다음으로 추가
- 중복 방지로 메가패널 "키워드 리서치" 그룹에서는 제거

**AI 브랜드명 제거 (마케팅·UI 카피 → 'AI'/'최신 AI')**
- 홈(`page.tsx`), `not-found`, 온보딩, `about`, `lp/ai`(칩+메타), `ai-writer`/`prompt-generator`/`start` 메타, `prompt-generator` 본문 카피
- "Claude Sonnet 4.6", "Claude 자동 작성", "ChatGPT 등" 등 → 일반 표현으로

### 유지 (의도적)
- **약관·개인정보처리방침**: 위탁 처리자(Anthropic, PBC / Claude API) 고지는 PIPA 의무라 보존
- 코드·주석·API 모델 상수(`claude-sonnet-4-6`): 화면 비노출이라 변경 없음

### 배포
- PR #61 → main merge → Vercel 자동 배포

## 2026-06-11 — UI/UX: 프리미엄 hero 파일럿 + 앰비언트 모션 토큰 (Phase 51)

### 배경
참고 레포 [uxjoseph/supanova-design-skill](https://github.com/uxjoseph/supanova-design-skill)(에이전시급 랜딩페이지 생성 스킬)을 분석. supanova는 "전환 중심 랜딩페이지"용이라 도구·대시보드·게시판 화면에 통째로 적용하면 정보 밀도·접근성이 후퇴. 따라서 **2단(Two-Tier) 전략** 채택:
- **Tier A(마케팅 표면)**: 홈 hero + LP 3종에만 supanova 감성 도입
- **Tier B(도구/대시보드/커뮤니티)**: 현행 유지, 토큰만 미세 흡수

### 변경

**`app/globals.css` — 토큰 레이어 (전 페이지 재사용 기반)**
- `--ease-premium: cubic-bezier(0.16,1,0.3,1)` — entrance/hover 물성용 감속 곡선
- `--shadow-ambient` / `--shadow-ambient-accent` — 초확산 깊이 그림자 (라이트/다크 분리)
- `@keyframes fade-up` + `.animate-fade-up` + `.stagger-1~4` + `.shadow-ambient*` 유틸
- `prefers-reduced-motion`에서 기존 전역 블록이 자동 무력화 (추가 코드 0)

**`app/page.tsx` — 홈 `AnonHero` 리디자인 (파일럿)**
- 넓은 hero 여백(py-20→32), `display-hero` fluid 타이포(40~56px)
- 장식 앰비언트 글로우 2개(aria-hidden), 떠 있는 프리미엄 검색바, 요소 순차 등장

**`app/lp/{ai,diagnose,keyword}/page.tsx` — 동일 패턴 확산**
- 중앙 hero 뒤 앰비언트 글로우, 칩→h1→본문→폼 스태거 등장
- 입력형(diagnose·keyword)은 떠 있는 프리미엄 입력바, 단일 CTA(ai)는 accent 리프트

### 배포
- PR #60 → main merge → Vercel 자동 배포

## 2026-06-10 — 글쓰기 지침 GEO 우선 개편 (프롬프트 생성 + AI 글쓰기)

### 배경
네이버 메이트가 'AI브리핑 인용 수'로 선정되고 인용 수가 2026년 1월부터 누적 집계됨에 따라, 글쓰기 지침의 최우선 목표를 **홈판 노출 → AI브리핑 인용(GEO)** 으로 재정렬. 홈피드 노출은 2순위로 유지(GEO 위에 후킹을 얹는 방식). 다카테고리 도구 특성상 테니스/메이트 분야 특화 내용은 제외하고 GEO 원칙만 보편 적용.

### 변경

**`app/prompt-generator/page.tsx` (`generatePrompt`)**
- 기존 "네이버 블로그 글쓰기 5단계(홈판 노출)" 지침을 GEO 우선 7섹션으로 교체:
  - `[0]` 우선순위 명시 (AI브리핑 인용 1순위 / 홈피드 2순위, 충돌 시 GEO 먼저)
  - `[1]` 정확성 — 작성 직전 검색 교차검증 + 모든 수치·날짜에 기준 시점(`오늘 날짜 기준`) 동반
  - `[2]` 인용 최적화 — 핵심 질문 1개, 인트로 두괄식 답, 자기완결적 사실 문장, 1인칭 경험, 소제목=소질문→소답변, 외부 링크 없는 투명성
  - `[3]` 홈피드(2순위) — 제목 키워드(앞)+호기심(뒤), 낚시 단독 금지
  - `[4]` 본문 형식 — 1,500~2,500자, 마침표 후 줄바꿈, 인용형 귀속, 인명 '한글(영문)'
  - `[5]` 한국 인명·용어 표기 / `[6]` 해시태그 30개 / `[7]` 금지사항 + GEO 최종 점검
- 기존 옵션 시스템·뉴스 컨텍스트·핵심정보(keyFacts) 주입 로직은 그대로 유지

**`app/api/ai-draft/route.ts` (`buildSystemPrompt`)**
- 시스템 프롬프트 최상단에 최우선 목표(GEO 1순위) 블록 추가
- 인트로를 회상톤 시작 → 두괄식 답 우선으로 전환 (해요체 스타일 가이드도 수정)
- 자기완결적 사실 문장 / 1인칭 경험 / 외부 링크 미노출 투명성 / 기준 시점 추가
- 자체 검토 체크리스트를 GEO 항목 중심으로 개편
- 분량 범위 조정 (compact 1,500~1,900 / standard 1,800~2,400)
- `## 1.~## 6.` 출력 섹션 헤더는 보존 → ai-writer 클라이언트 파싱 정상 동작

### 배포
- PR #58 → main squash merge → Vercel 자동 배포

## 2026-06-04 — 블로그 진단: 네이버 메이트 인용 준비도 추가

### 변경

**`app/lib/diagnose/mate-readiness.ts` (신규)**
- `analyzeMateReadiness(items, categoryKeywords)` → `MateReadinessReport`
- 5개 체크 항목 (AI API 0, 휴리스틱만):
  1. 구조화된 소제목 (번호·기호·볼드 마커 감지)
  2. 도입부 팩트 배치 (첫 200자에 키워드+숫자 동시 존재)
  3. 숫자·데이터 포함 (단위 포함 수치, 비교 패턴 등)
  4. 질문형 제목 ("어떻게", "차이", "추천", "?" 등)
  5. 충분한 글 길이 (1,200자 이상)
- 가중 합산 → 0~100 점수 + 4단계 등급 (excellent/good/needs-work/low)

**`app/api/diagnose-mate/route.ts` (신규)**
- `GET ?blogId&category` — RSS 12편 fetch + analyzeMateReadiness
- 5min fresh + 10min SWR CDN 캐시

**`app/components/diagnose/MateReadinessCard.tsx` (신규)**
- 원형 점수 링 + 등급 라벨 + 항목별 프로그레스 바 + 개선 팁
- good/warn/bad 상태 아이콘 + 색상 분류

**`app/blog-diagnose/page.tsx`**
- 액션 플랜 아래, 코치 리포트 위에 MateReadinessCard 삽입

### 배포
- PR #55 → main squash merge → Vercel 자동 배포

---

## 2026-06-04 — Lab 누락 썸네일 보완: post_11~16

### 변경
- `post_11~16.webp` 6개 생성 — 각 글 주제에 맞는 고유 그래픽 (계단 차트, 벤 다이어그램, 폰, 방패, 뉴럴넷, 채팅 버블)
- `scripts/generate-missing-thumbnails.mjs` 추가

### 배포
- PR #54 → main squash merge → Vercel 자동 배포

---

## 2026-06-04 — Lab 콘텐츠 추가: 네이버 메이트 3편 + GEO 가이드 1편

### 변경

**새 글 4편 (`public/posts/`)**
- `post_17` — 네이버 메이트란? 블로거가 반드시 알아야 할 핵심 변화 5가지
- `post_18` — 네이버 메이트 시대, 블로그 검색 노출 전략이 달라진다
- `post_19` — 네이버 메이트에 내 블로그가 인용되려면? 콘텐츠 구조 설계법
- `post_20` — GEO(생성형 엔진 최적화) 완벽 가이드 — AI가 내 글을 추천하게 만드는 법

**썸네일 (`public/posts/images/`)**
- post_17~20.webp — sharp로 SVG→WebP 변환 생성 (각각 고유 컬러 테마)
- `scripts/generate-thumbnails.mjs` 스크립트 추가

**`public/posts/posts.json`** — 4편 메타데이터 추가 (날짜·설명 포함)

### 배포
- PR #53 → main squash merge → Vercel 자동 배포

---

## 2026-05-17 — Phase 54: 진단 v2.1 — 휴리스틱 코치 (AI API 0)

v2.0 (외부 비교) 와 짝이 되는 **내부 자가 진단**. 사용자 최근 글 12편의 RSS 메타 + contentSnippet 을 키워드 패턴·정규식으로 분석해 글 스타일·약점·Quick Wins 추출. AI 호출 0.

### 변경

**`app/lib/diagnose/heuristic-coach.ts` (신규)**
- `analyzeCoach(items, categoryKeywords)` → `CoachReport`
- **글 스타일 분류** (정보형/후기형/일상형/기타) — 각 스타일별 키워드 사전(13~17개 단어) 매칭. 제목+snippet 합쳐서 빈도 카운트, 최다 = dominant.
- **약한 시그널** 6개 검사 (12편 중 N편 발견):
  - 제목 첫 12자에 카테고리 키워드 없음
  - 본문 도입부에 카테고리 키워드 없음
  - 이미지 없는 글
  - 본문 800자 미만 짧은 글
  - 제목에 숫자 거의 안 씀 (>70%)
  - 제목 15자 미만 짧은 글 (>50%)
- severity (high/mid/low) + affectedCount 로 정렬
- **Quick Wins** — 가장 임팩트 큰 약점을 즉시 실행 액션으로 4개 이내 변환
- 가장 약점 많은 글 1편을 예시로 제공

**`app/api/diagnose-coach/route.ts` (신규)**
- `GET ?blogId&category` — 사용자 RSS 1회 fetch + analyzeCoach
- 5min fresh + 10min SWR CDN 캐시
- maxDuration 15s

**`app/components/diagnose/HeuristicCoachCard.tsx` (신규)**
- 진단 결과 페이지 lazy fetch
- 3 섹션:
  1. 스타일 분포 — 가로 막대 4분할 (info/review/daily/other)
  2. 약한 시그널 — severity 배지 + N/12 + 처방
  3. Quick Wins — 번호 매긴 즉시 실행 액션

**`app/blog-diagnose/page.tsx`**
- ActionPlan 다음 → **HeuristicCoachCard (내부 자가 진단)** → CompetitorPatternsCard (외부 비교) 순서
- 사용자 mental flow: "내 글 약점 → 상위 블로거는 어떻게 하는지"

### 차별화 + 완성도

| | 다른 도구 | Boheme v2.1 |
|---|---|---|
| 글 스타일 분류 | ✗ 또는 AI | **휴리스틱 — 재현 가능** |
| 약점 우선순위 | ✗ | severity + affectedCount 정렬 |
| Quick Wins | 일반 조언 | **약점 기반 자동 생성** |
| 비용 | $$ | 0 (사용자 RSS 1회만) |
| 일관성 | AI 출력 편차 | 같은 글 = 같은 결과 |

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린, +1 신규 라우트(`/api/diagnose-coach`).

### 후속 (v2.2+)
- 커뮤니티 percentile (diagnose_results 누적 데이터 — 표본 50+ 시 자동 활성)
- v2.0 카드의 HTML 파싱 확장 (헤딩 / 외부 링크 / alt)
- DataLab 트렌드 통합

---

## 2026-05-17 — Phase 53: 진단 v2.0 — 상위 블로거 패턴 비교 (AI API 0)

블로그 진단의 근본적 차별화. SEMrush / 네이버 자체 통계가 못 하는 것 = **같은 카테고리 상위 블로거의 실제 패턴**을 자동 수집해 사용자와 직접 비교. **AI API 사용 0**, 휴리스틱·통계만.

### 변경

**`app/lib/diagnose/competitor-patterns.ts` (신규)**
- `fetchCompetitorPatterns(category)` — 카테고리 시드 키워드 5개 균등 샘플 → 네이버 블로그 검색 OpenAPI → bloggerlink 에서 blogId 추출 → 빈도 카운트 상위 5명 선정 → 각 RSS 최근 5편 → 휴리스틱 추출. **24h 메모리 캐시** (`competitor-patterns:<category>`).
- `extractFeatures(item, keywords)` — 글 한 편 → `PostFeatures` (titleLength, titleHasNumber, titleStartsWithKeyword, charCount, imageCount, publishHour, publishDow KST).
- `compareToPatterns(patterns, userFeatures)` — 사용자 글과 차이 계산. ±25% 임계로 short/long/ok, ratio 는 ±20%p 임계로 under/over/ok.
- 통계 헬퍼: numStats (avg/median/min/max), ratio, histogram, mode.

**`app/api/competitor-patterns/route.ts` (신규)**
- `GET ?category=<cat>&blogId=<id>` — 패턴 + (blogId 있으면) 비교 결과 반환.
- 진단 본 API 와 분리 → 진단 결과 즉시 표시 후 카드만 lazy load.
- Cache-Control 1h fresh + 2h SWR (CDN 캐시).
- maxDuration 30s.

**`app/components/diagnose/CompetitorPatternsCard.tsx` (신규)**
- 진단 결과 페이지 lazy fetch. 분석 중 skeleton.
- 비교 표 6행: 본문 글자수 / 이미지/글 / 제목 글자수 / 제목 숫자 비율 / 제목 첫 12자 키워드 / 발행 시간대.
- 각 행에 진단 라벨: `부족 ⚠` / `많음` / `적정 ✓` / `낮음 ⚠` / `높음` / 정보.
- **개선 우선순위 인사이트** — 휴리스틱 기반 자연어 조언 (AI 없음).
- 분석 대상 5명 블로거 ID 투명하게 노출 (사용자 검증 가능).

**`app/blog-diagnose/page.tsx`**
- 30일 액션 플랜 다음에 `<CompetitorPatternsCard category={...} blogId={...} />` 삽입.
- import 추가.

### 차별화 포인트

| 항목 | 다른 SEO 도구 | Boheme v2.0 |
|---|---|---|
| 비교 대상 | "이상적 점수" 추상 | **실제 상위 블로거 5명의 글 25편** |
| 분석 방식 | 점수 / 등급 | 글자수·이미지·제목 패턴 직접 비교 |
| 한국 블로그 특화 | ✗ | ✓ |
| 비용 | 유료 | 무료 (네이버 OpenAPI + RSS 만) |
| AI 의존 | 일부 ✓ | **0** (재현 가능, 일관성 ↑) |

### 운영 비용 / 한계

- 네이버 OpenAPI 호출: 카테고리 1개당 검색 5 + RSS 5 = 10회. 24h 캐시로 같은 카테고리 사용자 100명 = 1번 측정.
- RSS contentLength 는 추정치 (RSS 가 본문을 잘라줄 수 있음). PostView.naver 본문 측정은 후속 PR.
- 카테고리당 sampleSize 5명 × 5편 = 25편 — 표본 작음. 분기별로 늘리거나 사용자 피드백 받으며 조정.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린, +1 신규 라우트(`/api/competitor-patterns`).

### 후속 (v2.1+)
- 본문 HTML 직접 파싱으로 헤딩 / 외부 링크 / alt 비율 추가 (PostView.naver)
- 휴리스틱 코치 리포트 (글 스타일 분류, 가독성)
- 커뮤니티 percentile (`diagnose_results` 누적 데이터)
- Naver DataLab 검색어 추이 통합

---

## 2026-05-17 — Phase 51: UX 일괄 보정 (이미지·위키·뉴스 진입·바로 글쓰기)

사용자 리포트 5건 일괄 처리.

### 변경

**1. 이미지 검색 카드 — 클릭 시 편집기로 (다운로드는 우상단 아이콘)**
- `app/image-search/page.tsx`
- 카드를 `role="button"` + `tabIndex` + onClick/onKeyDown(Enter/Space)으로 만들고, 기본 동작이 `sendToEditor`. 다운로드는 우상단 9×9 아이콘 버튼으로 분리 (stopPropagation).
- hover 시 카드 중앙 하단에 "편집기로 →" 시각 시그널 + 오렌지 오버레이.
- 안내 문구 강조: "카드를 클릭하면 이미지 편집기로 전송됩니다. 다운로드만 받으려면 우상단 ↓ 버튼".
- 사진작가 / 소스 링크는 `e.stopPropagation()` 로 우발적 전송 방지.

**2. 이미지 편집기 — 클립보드 복사 버튼**
- `app/image-tools/page.tsx`
- `handleCopyToClipboard()` 신설: `canvas.toBlob('image/png')` → `navigator.clipboard.write([new ClipboardItem({...})])`. 성공 시 "복사 완료! 네이버 블로그 글쓰기 창에 붙여넣기(Ctrl+V) 하세요." 토스트.
- ClipboardItem 미지원 브라우저는 "다운로드 후 첨부" 안내.
- 공통 기능 버튼 영역에 "복사 (블로그 붙여넣기)" 가 primary, "다운로드" 가 secondary 로 자리 변경.
- `useToast` import 추가.

**3. 키워드 분석 — "위키(일평균)" 컬럼 hover 설명 추가**
- 데스크탑 테이블 헤더 "위키(일평균)" 옆에 ⓘ 아이콘 + group-hover popover. 검은 배경 + 흰 텍스트, 너비 256px, 측정 기준·예시까지 안내.
  > **위키 페이지뷰 (일평균)** — 한국어 위키백과에서 같은 이름의 문서가 최근 30일 동안 받은 페이지뷰의 하루 평균값. 키워드의 대중 인지도(검색 의도의 깊이) 지표.
- 모바일 카드 dt "위키(일)" 에는 `title` 속성으로 동일 설명 (브라우저 기본 툴팁).

**4. 키워드 클릭 모달 — "최신 뉴스로 프롬프트 만들기" 옵션 추가 (primary)**
- 기존 2개 옵션 위에 새 primary CTA. 클릭 시 `setActionKeyword(null)` + `setNewsKeyword(kw)` → NewsPanel 모달(`selectable`)이 열리고 사용자가 뉴스 3건 선택 → 프롬프트 생성기로 자동 이동(기존 흐름 재사용).
- "추천" 배지 시각 강조. 사용자 의도: "최신 뉴스 기반 글쓰기가 가장 좋은 기능".

**5. 프롬프트 생성 — "AI 글쓰기로 바로" 버튼 추가**
- `autoGoToWriter` state + `useEffect` 로 generatePrompt 완료 후 자동 sendToAiWriter.
- 3개 버튼: "프롬프트만 생성"(secondary, 미리보기·복사 용도) / **"AI 글쓰기로 바로 →"** (primary) / "초기화".
- 사용자 의도: "굳이 글쓰고 싶다면 프롬프트는 볼 필요 없음".

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린

---

## 2026-05-17 — Phase 50: 홈 대시보드 가독성 정비 (1:1 카드 + 큰 폰트 + 즐겨찾기 자동 분석)

사용자 리포트 3건:
1. 즐겨찾기 키워드 클릭 시 자동 분석되어야 함
2. 키워드 검색 카드 vs 마지막 진단 카드를 1:1 비율로
3. 전체 폰트가 너무 작음 — 더 크고 보기 좋게

### 변경

**즐겨찾기 칩 자동 분석 보강**
- `app/keyword-analysis/page.tsx`: searchParams 처리에 `autoAnalyze` 파라미터 명시 인지. `autoAnalyze !== '0'` 일 때 자동 분석(기존 동작 유지 + 명시화).
- `app/page.tsx` LoggedInSearchCard 칩 onClick: URL에 `&autoAnalyze=1` 추가, `aria-label="자동 분석"`, `title` 툴팁으로 사용자에게 자동 동작 알림.

**1:1 비율 dashboard**
- `app/page.tsx` LoggedInHero dashboard grid: `lg:grid-cols-3` + `lg:col-span-2` → `lg:grid-cols-2` (양쪽 1:1).

**폰트 크기 / 시각 위계 강화**

`app/page.tsx` LoggedInHero greeting:
- 부제 라벨 `text-[10px]` → `text-xs`
- 헤딩 `text-2xl sm:text-3xl font-semibold` → `text-3xl sm:text-4xl font-bold`
- 본문 `text-sm` → `text-base sm:text-lg` + leading-relaxed

`app/page.tsx` LoggedInSearchCard:
- 카드: `rounded-md p-5` → `rounded-xl p-5 sm:p-6`
- 라벨 `text-[10px]` → `text-xs`
- 헤딩 `text-base font-semibold` → `text-xl sm:text-2xl font-bold`
- 본문 `text-xs` → `text-sm sm:text-base`
- 검색 입력 아이콘 16px → 20px, padding `py-2.5` → `py-3`, font `text-base sm:text-sm` → `text-base` 일관
- 버튼 `btn-md` → `btn-lg text-base`
- 즐겨찾기 라벨 `text-[10px]` → `text-xs`, 칩 `text-xs px-2.5 py-1` → `text-sm px-3 py-1.5` (탭 영역 ↑)
- 빈 상태 안내 `text-[11px]` → `text-sm`

`app/components/dashboard/LatestDiagnoseCard.tsx`:
- 카드: `rounded-md p-5` → `rounded-xl p-5 sm:p-6`
- 빈 상태 헤딩 `text-base` → `text-xl sm:text-2xl font-bold`, 본문 `text-xs` → `text-sm sm:text-base`, 버튼 `btn-sm` → `btn-lg text-base`
- 진단 결과 메타 `text-xs` → `text-sm`, band 라벨 `text-base font-semibold` → `text-lg sm:text-xl font-bold`, delta `text-xs` → `text-sm`
- "다시 진단" 링크 `text-xs` → `text-sm`
- sparkline 캡션 `text-[10px]` → `text-xs`

### 효과

- 검색 카드 ↔ 진단 카드 1:1 비율로 시각 균형
- 헤딩 폰트 2 단계 ↑ (`base/lg` → `xl/2xl`), 본문 1 단계 ↑ (`xs/sm` → `sm/base`)
- 즐겨찾기 칩 클릭 시 자동 분석 (URL `&autoAnalyze=1` 명시 + a11y label/title)
- 카드 모서리 통일 (rounded-xl) + padding 강화 (p-5 sm:p-6)

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린

---

## 2026-05-17 — Phase 49: TrendingTicker 재디자인 (1~10위 + 월 검색량 가독성)

사용자 리포트: "메인 화면의 내 분야 트렌드 TOP 10 — 1~10위가 명확하게 눈에 잘 들어와야 하고 월 검색량도 잘 보여야". 직전 Phase 38 디자인은 1·2·3위만 메달로 강조하고 4~10위는 작은 회색 숫자 + 월 검색량은 11px 작은 텍스트로 묻혀 있었음.

### 변경 — `app/components/dashboard/TrendingTicker.tsx`

**행 구조 — 3-컬럼 grid 로 명확화**
```
[01~10 순위 박스]  [키워드 + 검색량 비율 막대]  [월 검색량 큰 숫자]
```

**1. 순위 박스 (모두 동일 형태)**
- `01` ~ `10` 두 자리 padStart, tabular-nums, w-10/11 × h-10/11 라운드 박스.
- 1·2·3위: `rankBg` 강한 그라데이션 + 그림자 + 흰색 텍스트 (1위 오렌지→앰버, 2위 zinc, 3위 앰버→오렌지800).
- 4~10위: `bg-zinc-100` + 회색 텍스트. Hover 시 오렌지 톤.
- 4~10위도 같은 박스 모양이라 1~10위가 한눈에 비교됨.

**2. 키워드 + 검색량 비율 막대**
- 키워드는 굵은 본문(text-sm sm:text-[15px]), 1·2·3위는 한 단계 더 굵게.
- 그 아래 1px 두께 progress bar — 1위 검색량 대비 비율(4%~100%) 시각화.
- 막대 색도 메달 톤(1·2·3) 또는 기본 오렌지 그라데이션.

**3. 월 검색량 (우측)**
- 큰 굵은 숫자 (text-base sm:text-lg font-bold tabular-nums).
- 모바일은 K/M 축약(`23K`), 데스크탑은 풀 포맷(`23,456`).
- 1·2·3위는 오렌지 톤, 4~10위는 zinc-900 → hover 시 오렌지.
- 숫자 아래 "월 검색" 작은 라벨 (10px uppercase tracking-wider).

**4. 부수 정리**
- 카드: `rounded-md` → `rounded-xl` + `shadow-sm` (시각 위계 ↑).
- 헤더 라벨에 오렌지 강조색.
- 스켈레톤 행 높이 11px → 58~64px (실 행 높이와 일치).
- 메달 SVG 아이콘 제거 (순위 숫자 자체가 충분히 강조됨).

### 의도

- 1~10위 모두 동일 박스 모양으로 **랭킹 비교 직관성** ↑.
- 월 검색량을 11px → 16~18px 굵은 숫자로 **2배 이상 강조**.
- progress bar로 1위 대비 비율을 시각적으로 함께 인지.
- 색감은 Hermès Luxe Theme(오렌지 + 앰버) 유지.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

---

## 2026-05-16 — Phase 48-P4: 첫 진입 온보딩 (3슬라이드 투어) — 로드맵 완료

UX 로드맵 P4(마지막). 비로그인 첫 방문자에게 3장의 슬라이드로 사이트 가치를 보여주고 P1 의도 카드 / P2 마법사로 자연 진입.

### 변경

**`app/components/onboarding/OnboardingTour.tsx` 신설**
- 3슬라이드: 진단 / 글쓰기 / 커뮤니티. 각 슬라이드에 emoji + eyebrow + title + body + CTA.
- 모바일은 바텀시트(드래그 핸들 + safe-bottom), 데스크탑은 센터 모달(max-w-lg).
- 표시 조건:
  - `useUser()` 비로그인 (user === null)
  - sessionStorage `onboardingSeen` 없음
  - 홈(/)에서만 — 호출 위치로 보장
  - mount 후에만 결정 → SSR/CSR hydration 불일치 방지
- 닫기 (모두 sessionStorage 기록):
  - X / 백드롭 클릭 / ESC / "건너뛰기" 링크 / 마지막 슬라이드 CTA 클릭
- 네비:
  - dot indicator 클릭 → 해당 슬라이드
  - ← → 키 + 좌우 화살표 버튼
  - 첫 슬라이드 ← 비활성
- a11y:
  - `role="dialog"`, `aria-modal`, `aria-labelledby="onboarding-title"`
  - dot 에 `aria-current="true"` (현재 슬라이드)
  - `useBodyScrollLock` 적용 (R1 패턴)

**`app/page.tsx`**
- `<OnboardingTour />` 를 페이지 최상단(다른 hero 위)에 삽입. 첫 진입 시에만 마운트.

### 의도

- 사이트가 무엇을 해주는지 첫 진입에 7초 안에 전달.
- "글쓰기 · 진단 · 커뮤니티" 3축이 메뉴 구조(P3)와 일치 — 닫은 후에도 mental model 유지.
- 한 번 보면 다시 안 나옴(같은 세션) — 재방문에 부담 0.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

---

## Phase 48 UX 로드맵 — 완료

| P | 주제 | PR | 핵심 |
|---|---|---|---|
| P1 | 홈 의도 카드 | #43 | IntentCards (full/compact), 8단계 그리드 details 접기 |
| P2 | 글쓰기 마법사 step bar | #44 | WizardStepBar + FlowNav `mode='writing'`, 4페이지 통합 |
| P3 | Navbar 7개 → 4개 | #45 | 글쓰기/진단/커뮤니티/더보기, 활성 강조 자동 |
| P4 | 첫 진입 온보딩 | (이번) | OnboardingTour 3슬라이드 |

각 Phase 독립 PR, 빌드 클린, 라우트 0개 변경. P1·P2·P3는 squash 머지 완료, P4 PR 진행 중.

### 핵심 효과

- **첫 진입 직관성**: "도구 카탈로그" → "할 일 진입로" 전환 (P1 + P4)
- **흐름 시각화**: 4페이지가 분리되어 있으되 하나의 마법사로 인지 (P2)
- **메뉴 인지 부하**: 7개 → 4개 슬롯, 고급 도구는 한 클릭 (P3)
- **온보딩**: 첫 7초 안에 사이트 가치 전달 (P4)

라우트·DB 변경 0, SEO·즐겨찾기 안전. 모든 기존 기능 보존 + 사용자 흐름 재정렬.

---

## 2026-05-16 — Phase 48-P3: Navbar 4개 슬롯 재구성

UX 로드맵 P3. 데스크탑 Navbar 7개 메뉴 → 4개 슬롯으로 압축. 입문자 인지 부하 낮추고 파워 유저 한 클릭 접근 보존.

### 변경 — `app/components/Navbar.tsx`

**메뉴 상수 재정의**
- `CORE_TOOLS` (7개 평면) → 삭제
- `WRITING_MENU` (신규): 글쓰기 4개 (`/start`, `/keyword-analysis`, `/ai-writer`, `/editor`) — P2 마법사 진입로
- `MORE_MENU` (신규, `WORKFLOW` 대체): 3그룹 메가패널
  - 키워드 리서치: 인기검색어, 상위노출 분석
  - 글쓰기 보조: 프롬프트 생성
  - 이미지·기타: 이미지 검색, 이미지 편집, 연구실
- `COMMUNITY_MENU` (유지): 서이추, 정보공유, 체험단 동행
- `WRITING_PATHS` / `MORE_PATHS` 활성 강조용 set

**데스크탑 메뉴 (4 슬롯)**
```
글쓰기 ▼ | 진단 | 커뮤니티 ▼ | 더보기 ▼
```

- 글쓰기 ▼: 4항목 단순 드롭다운 (w-72)
- 진단: 평면 단일 (차별화 포인트 강조)
- 커뮤니티 ▼: 기존 그대로
- 더보기 ▼: 680px 메가패널, 3컬럼 그룹 (STEP 번호 제거 — 더 깔끔)

**활성 강조 로직**
- `isWritingActive` / `isMoreActive` / `isDiagnoseActive` / `isCommunityActive` — 드롭다운 안 항목 진입 시 부모 메뉴 강조
- `pathname === href || pathname.startsWith(href + '/')` 패턴

**호버/클릭 핸들러 정리**
- `makeOpen` / `makeScheduleClose` 헬퍼 함수로 3개 드롭다운 (writing/more/community) 공통화
- 150ms 닫기 타이머 패턴 일관

**모바일 햄버거 메뉴 (정합)**
- 평면 구조 유지 (audit 옵션 B — 최소 변경)
- 그룹 라벨 재정렬: 분석 → 글쓰기(WRITING_MENU) → 커뮤니티 → 더보기(MORE_MENU 그룹별)
- STEP 번호 제거, "워크플로우" 그룹 라벨 제거 (의도가 명확해진 그룹명)

### 라우트 영향 — **0개 변경**

모든 라우트 보존: `/blog-diagnose`, `/keyword-analysis`, `/competitor-analysis`, `/prompt-generator`, `/ai-writer`, `/editor`, `/image-search`, `/image-tools`, `/lab`, `/community/*`, `/start`, `/trending`. SEO·즐겨찾기·외부 링크 모두 안전.

### MobileBottomNav 정합

이번 P3에서는 변경 없음 (옵션 B). MobileBottomNav 4탭 (홈/도구/커뮤니티/연구실) 그대로. 데스크탑(글쓰기/진단/커뮤니티/더보기)과 슬롯 의미가 다르지만 모바일은 입문자 시각의 평면이 더 친화적. 통합은 P4 또는 후속 라운드에서.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

### 다음
- **P4** — 첫 진입 온보딩 (3슬라이드 투어, sessionStorage 1회 표시)

---

## 2026-05-16 — Phase 48-P2: 글쓰기 마법사 통합 (step bar)

UX 로드맵 P2. 키워드분석 → 프롬프트 → AI 글쓰기 → 에디터 4페이지를 시각적으로 하나의 마법사로 묶음. 라우트·로직은 그대로(위험 최소화).

### 변경

**`app/components/WizardStepBar.tsx` 신설**
- 4단계 sticky 상단 진행 표시. `sticky top-14` (navbar 56px 아래).
- 각 단계: 번호 배지 + 라벨. 완료 단계는 체크 아이콘 + 오렌지 톤, 현재 단계는 강조, 미진입 단계는 회색.
- 모든 단계 클릭 가능(자유 이동). sessionStorage 핸드오프 그대로 사용.
- 모바일에서는 현재 단계 라벨만 표시, 데스크탑은 모든 라벨 노출.

**`app/components/FlowNav.tsx` — `mode` prop**
- `mode='full'` (default): 기존 8단계 라벨 + `hidden md:block` (변경 없음, 다른 페이지 안전).
- `mode='writing'`: 글쓰기 4단계 라벨 `['키워드분석', '프롬프트 생성', 'AI 글쓰기', '에디터']` + `block` (모바일/데스크탑 모두 표시).

**글쓰기 4페이지 통합**
- `/keyword-analysis` (1/4): WizardStepBar + FlowNav `mode='writing'`. CTA 순서 swap — "프롬프트 생성"이 primary, "상위노출 분석"은 secondary(선택).
- `/prompt-generator` (2/4): WizardStepBar + FlowNav `mode='writing'`. CTA: "AI 글쓰기"(primary) / "에디터 직접"(건너뛰기).
- `/ai-writer` (3/4): WizardStepBar + 기존 PageHeader 유지. FlowNav `mode='writing'`.
- `/editor` (4/4): WizardStepBar + FlowNav `mode='writing'` (마지막 단계, "이미지 찾기"만).

### 영향 / 위험

- **다른 페이지 영향 없음**: `/competitor-analysis`, `/trending`, `/image-search`, `/image-tools` 등은 FlowNav `mode='full'` 그대로 사용. 변경 0.
- **/start 흐름**: 자체 진행(`keyword → choose → generating → result`) 그대로. 결과 후 `/ai-writer` 또는 `/editor` 진입 시점에 WizardStepBar 자연스럽게 등장.
- **모바일에서 FlowNav 노출**: `mode='writing'` 일 때만 `hidden md:block` 해제 → 글쓰기 4페이지 모바일에서도 "다음 단계" 카드 보임.

### 의도

- 사용자 mental model: "키워드분석/프롬프트/AI 글쓰기/에디터는 같은 글쓰기 흐름" — 페이지를 합치지 않고도 시각적 연속성으로 인지.
- 모든 단계 자유 이동 가능: 진단·키워드부터 시작하든, 바로 에디터로 가든 자연스럽게.
- CTA 텍스트 정리: "다음 단계 — XXX", "(선택)", "(건너뛰기)" 명시.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

### 다음
- **P3** — Navbar 7개 → 4개 재구성 ("글쓰기 / 진단 / 커뮤니티 / 더보기")
- **P4** — 첫 진입 온보딩 (3슬라이드 투어)

---

## 2026-05-16 — Phase 48-P1: 홈 의도(intent) 진입 카드

UX 고도화 4단계 로드맵(P1~P4) 의 P1. 도구가 많아져 첫 진입이 복잡해 보이는 문제를 "의도 우선" 진입로로 단순화.

### 변경

**`app/components/home/IntentCards.tsx` 신설**
- 4개 의도: 진단(emphasis) / 글쓰기(/start) / 키워드 찾기 / 블로거 만나기
- `variant: 'full' | 'compact'`
  - full: 비로그인 hero 아래 2×2 큰 카드 (emoji + 제목 + 설명 + meta + CTA, 강조 카드는 오렌지 그라데이션 + 링)
  - compact: 로그인 dashboard 카드 아래 1×4 행 (emoji + 제목 + meta + 화살표)

**`app/page.tsx` 정리**
- 기존 `features` 4 KPI 카드 섹션 **제거** → IntentCards 로 흡수.
- 비로그인: hero 바로 아래 IntentCards (full) 섹션 신설.
- 로그인(LoggedInHero): 검색카드 + 진단카드 dashboard 아래에 IntentCards (compact) 추가.
- 기존 8단계 워크플로우 그리드 → `<details>` 로 접어 보존 ("전체 도구 보기" 펼침). 입문자 시야에선 헤더만, 파워 유저는 한 클릭으로 진입.
- 클로징 CTA 그대로.

### 의도

- "도구 카탈로그" → "할 일 진입로" 로 mental model 전환.
- 8단계 워크플로우 학습 부담 제거 + 기능 발견성은 보존(접힘).
- 라우트/컴포넌트 구조는 보존(SEO·즐겨찾기 안전).

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

### 다음
- **P2** — 글쓰기 마법사 통합(키워드→프롬프트→AI 글쓰기→에디터 step bar)
- **P3** — Navbar 7개 → 4개 재구성
- **P4** — 첫 진입 온보딩 (3슬라이드 투어)

---

## 2026-05-15 — Phase 47-R5: SEO / 메타 (5R 사이클 R5 — 마지막)

R5 — SEO. Audit 15건 중 검색 인덱싱·공유 미리보기에 직접 영향 주는 항목.

### 변경

**P0 — `/public/sitemap.xml` 삭제**
- 2026-01-27 고정 날짜의 stale 파일. `app/sitemap.ts` 가 동적으로 작동 중이라 중복·충돌. `app/sitemap.ts` 만 유지.

**P0 — `app/layout.tsx` title template + default canonical + Organization JSON-LD**
- `title.template: '%s - Boheme BlogLab'` — 자식 페이지가 title 만 주면 자동 suffix.
- `alternates.canonical: '/'` default — 자식이 override.
- `<script type="application/ld+json">` Organization schema — Google Knowledge Graph 진입용. 운영자/언어/지역 명시.

**P0 — 'use client' 페이지 19개에 `layout.tsx` 신설 (메타데이터 가능하게)**
- 도구 (11): `ai-writer`, `blog-diagnose`, `keyword-analysis`, `trending`, `editor`, `image-search`, `image-tools`, `prompt-generator`, `competitor-analysis`, `start`, `login`
- 커뮤니티 (4): `community`(허브), `swap`, `tips`(noindex), `companions`
- LP (3): `lp/ai`, `lp/diagnose`, `lp/keyword`
- 개인 (1): `profile/setup`(noindex)
- 각 layout: title + description(50~120자 한국어 검색 최적화) + keywords + canonical + openGraph. `login`/`tips`/`profile/setup` 은 `robots: { index: false }`.
- 검색 파라미터 있는 페이지(`keyword-analysis` 등)의 canonical 은 base path 만 — 중복 인덱싱 방지.

### Audit 채택 안 한 항목 (별도 라운드로 분리)

- **동적 og:image 생성 (per /lab/[slug], /community/tips/[id] 등)**: `/api/og-image/...` 라우트 신설 + 동적 디자인 필요. 별도 폴리시 라운드.
- **BlogPosting / BreadcrumbList JSON-LD**: lab/[slug] 단위. 별도.
- **FAQPage 스키마 (`/contact`)**: 별도.
- **manifest.ts categories**: 추가 가능하지만 우선순위 낮음.
- **`/community/tips/*` robots disallow 정합성**: 의도된 비활성화 상태 (sitemap.ts에서도 보류 명시).

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.
- /public/sitemap.xml 제거 — Vercel 자동 배포 시 `app/sitemap.ts` 동적 생성 활성.

---

## R 5라운드 사이클 종합 (Phase 47-R1 ~ R5)

| R | 주제 | 커밋 | 핵심 결과 |
|---|---|---|---|
| R1 | 모바일 UX 심화 | 5a4d851 | iOS 줌 방지, scroll-lock, 44px 터치, 키보드 최적화 |
| R2 | 성능 | c2ee020 | 이미지 14.8MB → 0.6MB(96%), AVIF formats, CDN 캐시 헤더 |
| R3 | a11y + 토큰 | ef87333 | dialog 시맨틱, skip-link, prefers-reduced-motion |
| R4 | 에러 견고성 | 7140f8f | blog-diagnose safeJson, image-search toast/검증 |
| R5 | SEO | (이번) | 19개 layout.tsx, canonical, Organization JSON-LD |

각 라운드 [Audit(Explore) → Plan(메인 검증·필터) → Implement → Verify(build) → Polish] 사이클로 진행. Audit 결과 중 추정·과대평가는 일관되게 제외, 검증 통과한 것만 채택.

---

## 2026-05-15 — Phase 47-R4: 에러 견고성 (5R 사이클 R4)

R4 — 에러 견고성. Audit 14건 중 검증 통과한 4건. CLAUDE.md 섹션 6의 회귀 패턴(`SyntaxError: Unexpected token`) 차단이 핵심.

### 변경

**P0 — `/blog-diagnose` submit `res.json()` → `safeJson`**
- `blog-diagnose/page.tsx:198-225` — 비-JSON 응답(Vercel 504, HTML 에러 페이지 등) 시 SyntaxError로 진단 화면이 깨지던 회귀 패턴 차단.
- 4xx/5xx 별 사용자 메시지 분기 (504/408 → "시간 안에 끝나지 않았어요", 5xx → "서버 응답 안 함").
- `_parseError` 명시 분기 → "서버 응답을 처리할 수 없습니다".

**P1 — `/image-search` 다운로드 견고성 + alert 제거**
- `downloadDirect` `res.ok` 체크 누락 보강 → 403/404 등에서 빈 blob 다운로드 차단.
- 403 케이스에 "이미지 접근이 거부되었습니다" 명시 메시지.
- 성공 시 `toast('이미지를 다운로드했어요.', 'success')`.
- 모든 `alert()` 호출을 `useToast`로 교체 (CLAUDE.md 표준).

**P1 — `/start` `_parseError` 명시 구분**
- 기존 "AI 응답을 파싱하지 못했어요" (한 문구) → 두 케이스 분리:
  - `_parseError`: "서버 응답 형식이 올바르지 않아요. 네트워크 상태를 확인…"
  - `!data.draft`: "AI가 빈 응답을 반환했어요. 잠시 후 다시…"

### Audit 채택 안 한 항목 (검증 결과 audit 오독)

- **ai-writer 사용량 useEffect `_parseError` 누락 (P0-2)**: 실제 코드는 `safeJson` 사용 + `typeof d.limit === 'number'` 체크. `_parseError` 케이스도 `limit` undefined → `setUsage(null)`로 정상 처리됨.
- **skeleton → error 깜빡임**: 일반적 UX 패턴, 영향 미미.
- **댓글/좋아요 RLS 메시지 친절화**: 큰 작업, 다음 polish 라운드 후보.
- **`beforeunload` 페이지 이탈 경고**: AI 호출은 서버에서 계속되므로 의미 약함.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

---

## 2026-05-15 — Phase 47-R3: 접근성 + 디자인 토큰 일관성 (5R 사이클 R3)

R3 — a11y + 토큰. Audit 28건 중 WCAG AA 직접 영향 + 안전한 일관성 개선만.

### 변경

**P0 a11y — 모달 시맨틱 3곳**
- `ConfirmModal`, `ReportModal`, `SwapModal`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 추가. 제목 `h3`에 id 부여. 스크린리더가 대화창으로 인식.

**P0 a11y — SwapModal 에러 메시지 연결**
- 폼에 `aria-describedby={error ? 'swap-modal-error' : undefined}`.
- 에러 div에 `id="swap-modal-error"`, `role="alert"` — 즉시 announce.
- textarea에 `aria-required="true"`.
- 필수 표기 별표(`*`)에 `aria-hidden` (스크린리더가 "별표" 읽지 않도록).

**P1 a11y — prefers-reduced-motion 글로벌 처리**
- `globals.css` 전역 미디어 쿼리: 모든 animation/transition을 0.01ms로 축소(완전 제거는 transitionend 의존 컴포넌트에 위험).

**P1 a11y — Skip-to-content 링크**
- `layout.tsx` 최상단에 `<a href="#main-content" class="skip-to-content sr-only focus:not-sr-only">본문 바로가기</a>`.
- `<main>`에 `id="main-content"`.
- CSS는 `globals.css` `.skip-to-content` (포커스 시 translateY(0)로 슬라이드 인).

**P1 a11y — companions/new Field 헬프 텍스트 `aria-live="polite"`**
- 글자수 카운터 ("1234/2000자") 가 변경될 때 스크린리더 announce.
- 정적 help 텍스트는 영향 없음(변경 안 되면 announce 없음).
- 별표(`*`)는 `aria-hidden`으로 시각용 표시만.

**P1 a11y/UX — SwapModal `fieldCls` iOS 줌인 방지**
- `text-sm` → `text-base sm:text-sm` (R1 패턴 통일). 모달 내 input/select/textarea 동시 적용.

**P1 a11y — SwapModal 글자수 카운터 `aria-live="polite"`**
- 200자 한도 카운터의 변경을 스크린리더가 안내.

### Audit 채택 안 한 항목

- **placeholder 대비 부족**: zinc-500(#71717a) on #fafaf9 ≈ 4.6:1, WCAG AA 통과. placeholder는 WCAG에서 강제 아님.
- **`bg-red-600` 토큰 위반**: `--danger`=`#dc2626`=Tailwind `red-600`. 의미상 동일, 시각 결과 동일.
- **Navbar `role="menu"` + `role="menuitem"`**: 추가 가치 미미. 영향 측정 어려움.
- **modal focus trap**: ESC + 외부 click 닫기 모두 동작. 다음 라운드 polish 후보.
- **shadow/radius 일관성**: modal > card > input 의 의도된 hierarchy.
- **금지 색(indigo/violet) 잔재**: 0건 확인 ✓ (Phase 31에서 깨끗하게 마이그레이션 됨).

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.

---

## 2026-05-15 — Phase 47-R2: 성능 (5R 사이클 R2)

5라운드 사이클 R2 — 성능. Audit(Explore) 27건 중 검증 통과한 핵심만 처리.

### 변경

**P0 — `/posts/images/` PNG → WebP (14.17MB → 0.6MB, 96% 절감)**
- `scripts/convert-post-images-to-webp.ts` 신설. sharp(quality 82, effort 5)로 일괄 변환.
- 10개 PNG (각 1.3~1.9MB) → WebP (각 30~90KB).
- `app/lab/page.tsx` 의 `PostImage` src `.png` → `.webp`.
- PNG 원본 삭제 (디스크 + git tracked size 정리).

**P0 — `next.config.ts` 이미지 최적화 설정**
- `formats: ['image/avif', 'image/webp']` — AVIF 우선 서빙(추가 절감), 미지원 시 WebP fallback.
- `minimumCacheTTL: 31일` — Vercel CDN 캐시 보존 강화.

**P1 — 공개 API CDN 캐싱 헤더**
- `/api/trending-keywords`: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (5분 fresh + 10분 SWR). 카테고리·기간 조합이 한정적 → 캐시 hit율 높음.
- `/api/wiki-pageviews`: `s-maxage=3600, stale-while-revalidate=7200` (1h fresh + 2h SWR). 일 단위 데이터.
- HIT/MISS/404 응답 모두에 적용. 4xx/5xx에는 미적용.

### Audit 채택 안 한 항목 (부정확/위험)
- **RSC 경계 (page.tsx/Navbar/ThemeProvider `'use client'`)**: "use client → SSR 손실"은 부정확. Client component도 SSR된다. 의미 있는 분리는 큰 리팩터인데 임팩트 측정도 어려워 보류.
- **`/api/trending-keywords` 직렬 fetch + setTimeout(200ms)**: Naver Search Ad API rate limit 회피용 의도. 병렬화하면 401/429 위험.
- **Quill CSS import**: 이미 `dynamic({ssr:false})` 라우트 chunk로 분리됨.
- **Navbar useReducer 통합**: 영향 미미.
- **금칙어 검사 web worker**: 복잡도 증가 vs 영향 측정 안 됨.

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린.
- public/ 사이즈: 15M → 824K (-94%).

---

## 2026-05-15 — Phase 47-R1: 모바일 UX 심화 (5R 사이클 R1)

5라운드 멀티 에이전트 최적화 사이클 R1. Audit(Explore) → Plan(메인) → Implement → Verify(build) → Polish 흐름.

### 변경

**P0 — iOS 입력 줌인 방지**
- `globals.css:354` `.input-base { font-size: 0.875rem → 1rem }` — Safari가 input 클릭 시 자동 줌인하는 16px 임계값을 만족.

**P0 — 모달 body scroll-lock**
- `app/lib/useBodyScrollLock.ts` 신설. 중첩 모달 안전한 카운트 기반 훅.
- 적용: `ConfirmModal`, `ReportModal`, 키워드분석의 액션/뉴스 모달.

**P1 — Navbar 터치 타깃**
- 다크모드 토글 `w-9 h-9 → w-11 h-11 md:w-9 md:h-9` (모바일만 44px, 데스크탑 유지)
- 햄버거 메뉴 `w-9 h-9 → w-11 h-11` + `aria-expanded`, `aria-label` 동적
- 모바일 메뉴 `max-h-[calc(100vh-56px)] → max-h-[calc(100vh-56px-64px)]` + `pb-6` — 하단 탭바(64px) 가림 해소

**P1 — NewsPanel selectable 체크박스**
- `w-4 h-4 → w-5 h-5` (16→20px). 카드 전체가 label이라 실제 탭은 더 크지만 시각 인지도 향상.

**P1 — 검색 입력 모바일 키보드 최적화 (3곳)**
- `/` 두 곳(`AnonHero`, `LoggedInSearchCard`), `/start`, `/keyword-analysis` 메인 입력
- `type="search"`, `inputMode="search"`, `enterKeyHint="search"`, `autoComplete="off"`, `autoCapitalize="none"`
- 기본 font-size 를 `text-base sm:text-sm` 으로 — 모바일은 16px(줌인 방지), 데스크탑은 14px 유지

### Audit 시 채택 안 한 항목
- `/start` draft `<pre>` 가로 짤림 — 이미 `whitespace-pre-wrap` 적용되어 안전
- ConfirmModal `max-w-sm` 360px 짤림 — `w-full` 동반으로 안전
- btn-md 일괄 44px 상향 — 영향 범위 큼, 케이스별 처리
- manifest 다크 theme_color — `layout.tsx`의 themeColor media query가 이미 처리

### 검증
- `npm run build` (IP_HASH_SALT) — 46 routes 클린, 신규 경고 0건

---

## 2026-05-14 — Phase 47: 모바일 UI 짤림 일제 정비 + 키워드 분석 뉴스 UI 재디자인

사용자 리포트 2건:
1. "모바일로 볼때 UI가 짤리는 경우가 많아요" → 전 페이지 일제 점검
2. "키워드 분석에서 분석 결과가 나왔을때 뉴스가 보기 어렵게" → NewsPanel 재디자인

브랜치 `claude/fix-mobile-ui-layout-OVqwc`.

### 변경

**키워드 분석 결과 테이블 → 모바일 카드 레이아웃** (`app/keyword-analysis/page.tsx`)
- `sm:hidden` 카드 리스트 + `hidden sm:block` 테이블 듀얼 렌더
- 카드: 키워드 (탭하면 액션 선택), 핵심 지표 2개(총검색량/경쟁률) + 보조 4개(PC/모바일/문서수/위키), 풀폭 "📰 뉴스 보기" CTA
- 데스크탑 테이블은 그대로 유지

**뉴스 모달 → 모바일 바텀시트** (`app/keyword-analysis/page.tsx`)
- 모바일: 화면 하단에서 올라오는 시트(`items-end` + `rounded-t-2xl` + 드래그 핸들) + 92vh + safe-bottom
- 데스크탑: 기존 센터 모달 그대로

**NewsPanel 카드 재디자인** (`app/components/NewsPanel.tsx`)
- 행 → 카드: border + hover/selected 강조, padding 통일
- 메타 (출처 도메인 + "n시간 전" 상대시각) 를 제목 위에 명확히
- 제목·설명에 키워드 토큰 `<mark>` 하이라이트 (XSS-safe escape 후)
- "원문 보기 →" 보조 CTA + 로딩 스켈레톤 4건
- 선택 상태시 카드 자체가 오렌지 톤으로 강조 (체크박스 안 봐도 됨)
- 모바일: 안내 텍스트 "선택한 뉴스로 " 부분만 숨김

**인기검색어(/trending) 테이블 → 모바일 카드** (`app/trending/page.tsx`)
- `sm:hidden` 카드: 순위 배지 + 키워드 + (PC/모바일/총 3분할 그리드) + 분석하기 풀폭 버튼
- 데스크탑 테이블 그대로

**상위노출 분석 메타 wrap** (`app/competitor-analysis/page.tsx`)
- 블로거명/날짜 메타: `flex-wrap` + 블로거명 `truncate` + 날짜 `whitespace-nowrap` — 좁은 화면에서도 두 줄로 안전

**TrendingTicker 메타 압축** (`app/components/dashboard/TrendingTicker.tsx`)
- 모바일에서 검색량은 K/M 축약 ("23K", "1.2M"), 데스크탑은 풀 포맷 ("월 23,456")
- 키워드 영역에 `flex-shrink-0` 누락 보강 (메타 우측)

**블로그 진단 키워드 진입 순위** (`app/blog-diagnose/page.tsx`)
- 행 `min-w-0 flex-1` + 순위 `whitespace-nowrap` — 긴 키워드도 두 줄로 줄바꿈

**에디터 맞춤법 단어 칩** (`app/editor/page.tsx`)
- 긴 오타 단어 `whitespace-nowrap` → `break-all`, 부모 `flex-wrap`/`min-w-0` 보강

**전역 가드** (`app/globals.css`)
- `body { overflow-x: hidden }` — 의도치 않은 가로 스크롤 차단
- `p, li, h1~h6 { overflow-wrap: break-word }` — 긴 URL/영문 토큰 안전망

### 검증
- `npm run build` (IP_HASH_SALT 지정) — 46 routes 클린, TypeScript 경고 없음

---

## 2026-05-12 — Phase 46: 홈 좌우 swap + 즐겨찾기 키워드 칩 통합

LoggedInHero 두 가지 사용자 요청 처리. PR #40 머지.

### 변경
- **좌우 swap + 비중 swap**: `LatestDiagnoseCard` (2/3 좌) + `LoggedInSearchCard` (1/3 우) → `LoggedInSearchCard` (2/3 좌) + `LatestDiagnoseCard` (1/3 우). 검색이 메인 행동 + 즐겨찾기 칩 공간 확보.
- **즐겨찾기 키워드 통합**: `profile.saved_keywords` (최대 10개) 를 검색 카드 안에 칩으로 노출. 칩 클릭 → `/keyword-analysis?keyword=<kw>` 즉시 분석. "관리" 링크는 `/profile/setup`. 0개일 땐 어떻게 저장하는지 안내.
- **타입**: `Profile` 인터페이스에 `saved_keywords` / `prompt_preset` 컬럼 추가 (`select('*')` 가 이미 반환하던 컬럼 — 타입만 따라잡음).

### 검증
- `npm run build` — 46 routes 클린
- `npx tsc --noEmit` — 클린

---

## 2026-05-12 — Phase 45: 홈 개선 + 사이트 전반 QA 감사 17건 처리

운영 시작 직전 점검 + 수정 라운드. 총 4 PR (#36 / #37 / #38 + DEVLOG).

### 45a. 홈 — 즐겨찾기 → 키워드 검색 + 카드 높이 통일 (PR #36)
- `SavedKeywordsCard` 자리에 `LoggedInSearchCard` (1입력창 + 검색 버튼) — 행동 진입점으로 전환
- 모든 카드 그리드 `items-stretch` + `h-full` + `flex flex-col` + CTA `mt-auto` 패턴으로 통일

### 45b. QA 배치 1 — LP 정확성 + 브랜드 + alert 제거 (PR #37)

사이트 전반 QA 감사(general-purpose 에이전트) 결과 31건 발견. 16건 일괄 처리:

**P0 (5/5)** — LP 카피 정확성
- `/lp/ai` "일 5회 무료" → 비로그인 실제 1회 (베이트앤스위치 수정)
- `/lp/ai` "제목 후보 20개·이미지 프롬프트" → 기본 옵션 정확 반영 + 옵션 패널 안내
- `/lp/diagnose` "30초" 약속 + 카테고리 선택 단계 명시
- `/lp/diagnose` "본인만 확인 가능" 거짓 표기 제거
- `/lp/keyword` "키워드 자동 추출" 실제와 다름 → 정확 설명

**P1 (10/11)** — 브랜드 + UX
- Share card BAND_META 컬러 (초록/파랑/회색/핑크) → 전 band amber→orange gradient 통일
- `alert()` 16개 / `confirm()` 2개 전량 제거 → `useToast` + `ConfirmModal danger variant`

**P2/P3 핵심**
- 진단 페이지 `reset()` 이 `prefillNotice` 도 클리어, progress-beat interval 마지막 beat 도달 시 `clearInterval`
- `/api/trending-keywords` `limit` 파라미터 1~50 clamp

### 45c. 에디터 서식 보존 (PR #38) ★ 가장 큰 P0

**원인**: `optimizeReadability` / `handleReplace` 두 함수가 `getText()` 평문화 → 정규식 → `clipboard.convert({html})` → `setContents` 흐름 사용. 결과 (a) 사용자 서식(bold·heading·list 등) 침묵 파괴, (b) 사용자 입력 `<` `&` 가 HTML 로 해석되는 escape 버그.

**처리**: Quill 의 `insertText` / `deleteText` 만 사용해 정확한 인덱스 위치만 surgical 수정. 주변 서식 자동 보존 + escape 문제 자동 해결.
- `optimizeReadability`: 마침표·쉼표 뒤 \n 삽입 위치 수집 → **뒤에서부터** 삽입 (인덱스 안정성)
- `handleReplace`: `deleteText` + `insertText` 2줄로 단순화. 단어가 bold 안에 있었으면 교체 후에도 bold.

### 검증
- `npm run build` — 46 routes 클린
- `npx tsc --noEmit` — 클린
- `scripts/qa-unit-tests.ts` — 87/87

### QA 31건 처리 현황
| | 발견 | 처리 |
|---|---|---|
| P0 | 5 | **5 (100%)** |
| P1 | 11 | 10 |
| P2 | 8 | 2 |
| P3 | 7 | 1 |

미처리 14건은 모두 cosmetic doc / 로깅 일관성 / band 라벨 미세 차이 수준. 운영 시작에 문제 없음.

---

## 2026-05-12 — Phase 44: SNS 유입 인프라 (랜딩 페이지 + 진단 공유 카드)

인스타·쇼츠 유료/유기 트래픽을 받기 위한 두 가지 핵심 성장 인프라. PR #33, #34 머지.

### 44a. 시나리오별 랜딩 페이지 3개 (PR #33)

쇼츠/릴스 광고에서 약속한 가치를 사이트 도착 5초 안에 fulfill 하는 단일 CTA 랜딩.

| LP | 영상 후킹 카피 | 단일 CTA |
|---|---|---|
| `/lp/diagnose` | "여러분 블로그는 몇 점일까요?" | URL 1개 → 30초 진단 |
| `/lp/keyword`  | "여러분 키워드는 황금일까요, 쓰레기일까요?" | 키워드 1개 → 30초 분석 |
| `/lp/ai`       | "여러분 글을 1분 만에 초안으로" | 프롬프트 생성기로 |

UTM 자동 추적 (`utm_source/medium/campaign/content`). `useSearchParams` 대신 `window.location.search` 사용해 Suspense 회피.

`/blog-diagnose` 페이지에 `?url=` 자동 채움 추가. `/keyword-analysis` 는 기존에 `?keyword=` 지원.

### 44b. 진단 결과 공유 카드 (PR #34) ★ 핵심 성장 메커니즘

**유기적 확산 루프**:
1. 사용자가 진단 완료
2. 점수 게이지 아래 "📤 인스타에 공유하기" 버튼 클릭
3. 1080×1920 PNG (band별 그라데이션) 즉시 생성 → 모바일은 Web Share API → 인스타 스토리
4. 친구·팔로워 호기심 ("내 점수는?") → 도메인 방문 → 또 진단 → 또 공유

**구현**:
- `lib/og/font.ts` (신규) — `loadGoogleFont` 헬퍼 분리 (OG 카드 + share card 공용)
- `app/api/share-card/diagnose/route.tsx` (신규) — Edge runtime, ImageResponse 1080×1920
  - band별 그라데이션: top5 초록 / top15 파랑 / top35 주황 / mid 회색 / growing 핑크
  - 큰 점수 360px + 3축 가로 막대 + 브랜드 + 도메인 CTA
  - 캐시: 브라우저 1h / Vercel CDN 24h
- `app/components/diagnose/ShareCardButton.tsx` (신규) — Web Share API Level 2 + `<a download>` fallback
- `app/blog-diagnose/page.tsx` — 점수 게이지 바로 아래 버튼 마운트 (사용자 시선 동선)

### 검증
- `npm run build` — 46 routes (43 → 46 LP + ƒ /api/share-card/diagnose) 클린
- `npx tsc --noEmit` — 클린
- `scripts/qa-unit-tests.ts` — 87/87

### 머지 후 사용법
홍보 영상 설명란에 LP 링크 + UTM 으로 추적:
```
https://bohemebloglab.com/lp/diagnose?utm_source=instagram&utm_campaign=diagnose_live
https://bohemebloglab.com/lp/keyword?utm_source=youtube_shorts&utm_campaign=golden_kw
https://bohemebloglab.com/lp/ai?utm_source=threads&utm_campaign=1min_draft
```

---

## 2026-05-12 — Phase 43: 해시태그 30개 단순화 + 표 복붙 호환

AI 글쓰기 결과 두 가지 사용성 개선. PR #31 머지.

### 1. 해시태그 30개만 (추천 10개 제거)
- `app/api/ai-draft/route.ts`: 5단계 프롬프트의 "추천 10개" 지시 제거, 출력 템플릿도 30개 한 줄로 단순화
- `app/ai-writer/page.tsx`: 섹션 subtitle "전체 30개 + 핵심 추천 10개" → "전체 30개", 사이드바 6단계 안내도 "해시태그 30+10" → "해시태그 30개"

### 2. 본문 미리보기 표 → 실제 표로 복붙
**원인**: `markdownToHtml`에 table 분기가 없어서 AI가 만든 `| a | b |` 형태 markdown 표가 `<p>` 안에 텍스트로 들어가 있었음. 네이버·티스토리 에디터는 `<table>`만 진짜 표로 인식 → 우리가 그 마크업을 안 만들고 있었던 게 원인.

**처리**:
- `app/lib/format/article-formats.ts`
  - `parseTableRow()` / `isTableSeparator()` 헬퍼 추가 (align separator·`\|` escape 지원)
  - 메인 루프 `for...of` → 인덱스 `for` 로 변경 (다음 라인 lookahead 필요)
  - 출력: `<table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>` — 셀 내부 `**bold**` 보존
  - `markdownToPlain()` — separator 제거 + 파이프 공백 변환 (일반 텍스트도 표 가독성 OK)
- `app/globals.css` — `.preview-naver table` 보더·헤더 틴트 스타일 (복사되는 HTML 에는 미포함 → 네이버 자체 표 스타일이 자연스럽게 적용됨)

`RichCopyButton` 이 이미 `text/html` + `text/plain` 동시 복사를 처리 중이라 컴포넌트 자체는 무변경. `markdownToHtml` 이 `<table>` 을 만들기만 하면 자동으로 네이버 에디터에서 실제 표로 인식됨.

### 단위 테스트 +8건 → 87/87
- `markdownToHtml` 표 그룹 신규: 단순 표 / align separator / 셀 내부 bold / 표 → 단락 전환 / false-positive 가드 / `markdownToPlain` separator 제거 + 본문 보존

### 검증
- `npx tsx scripts/qa-unit-tests.ts` — 87/87
- `npm run build` — 43 routes 클린
- `npx tsc --noEmit` — 클린

---

## 2026-05-12 — Phase 42: OG 카드 재디자인 (임팩트형, 동적 ImageResponse)

링크 공유 시 카카오톡·디스코드·트위터 등에 보이는 미리보기 카드 재설계. 정적 PNG → Next.js App Router `opengraph-image` 컨벤션 + `ImageResponse` 로 전환. PR #29 머지.

### 컨셉
- **임팩트형** — 큰 카피 + 주황 그라데이션 + 미니멀, 정보보다 분위기/브랜드 어필
- 카피: "블로그 운영의 / 모든 것을 한 곳에서"
- 배경: `#fb923c → #f97316 → #ea580c → #c2410c` 135° gradient
- 상단: 흰 박스 [B] 로고 + 브랜드명, 하단: 도메인 + 강조선
- 데코: 부드러운 빛 구체 2개 + 48px 그리드 텍스처

### 구현
- `lib/og/render.tsx` (신규) — 공유 ImageResponse 렌더러
  - Noto Sans KR 500/800 Google Fonts CSS2 API + `&text=` 필터로 사용 글리프만 다운 (수 KB)
  - 카피 상수 4개(`BRAND`/`MAIN_LINE_1`/`MAIN_LINE_2`/`DOMAIN`)만 수정하면 다음 배포부터 자동 반영
- `app/opengraph-image.tsx` / `app/twitter-image.tsx` (신규) — `runtime: edge` 컨벤션
- `app/layout.tsx` — `openGraph.images` / `twitter.images` 항목 제거 (컨벤션 자동 주입)
- `public/og-image.png` 삭제 (120KB)

### 부가효과
이 PR 머지가 Vercel 자동 재배포 트리거 → 최근 등록한 `NEXT_PUBLIC_OPERATOR_BLOG_URL` 환경변수도 함께 새 빌드에 박혀 `/about` Founder note 운영자 블로그 칩이 표시되기 시작.

### 검증
- `npm run build` — 43 routes + `/opengraph-image` `/twitter-image` 동적 라우트 클린
- `npx tsc --noEmit` — 클린

### 머지 후 후속
- Facebook Sharing Debugger / KakaoTalk 디버거로 OG 캐시 갱신 (외부 캐시 무효화)
- `https://bohemebloglab.com/opengraph-image` 직접 접속해 PNG 확인

---

## 2026-05-12 — Phase 41: `/terms` v1.1 + `/about` Founder note + GitHub Actions CI

출시 전 추가 점검에서 발견된 4건 중 3건 처리. 에러 추적은 운영자 결정으로 보류. PR #27 머지.

### 1. `/terms` v1.1 동기화
- 시행일/최종수정일 → 2026-05-12, v1.1, 한 줄 changelog
- 제6조 회원가입: "자동 동의 간주" → Phase 39 명시적 체크박스 흐름 반영
- 제8조 AI 콘텐츠: Google AdSense "Scaled content abuse" 정책 안내 + 광고 수익 손실 면책
- 제16조 신설: 만 14세 미만 가입 제한 — `/privacy §15` 와 정합
- 부칙 v1.0 → v1.1 개정 요지 명시

### 2. `/about` Founder note 섹션
- "이용 대상" 다음에 강조 박스로 신설
- 3단락: 본인 블로거 경험 출발 / 실측 데이터 원칙 / AI 광고 정책 입장 / 운영 원칙
- 운영자 본인 블로그 URL 은 `NEXT_PUBLIC_OPERATOR_BLOG_URL` 환경변수로 옵션화 — 미설정 시 칩만 숨김
- Phase 38 점검에서 지적된 "운영자 신뢰 신호 부족" 보완

### 3. GitHub Actions CI 게이트
- `.github/workflows/ci.yml` 신규 — push to main + 모든 PR 에 자동 실행
- 단계: `npm ci` → `tsc --noEmit` → `qa-unit-tests.ts` (79건) → `next build`
- Node 20, npm cache, 10분 타임아웃, 동일 ref 새 커밋 시 이전 실행 자동 취소
- `IP_HASH_SALT` 더미값 주입(빌드 통과용) — 실제 키는 Vercel env 유지
- **1인 운영 안전망** — push 시 회귀 자동 차단

### 검증
- `npm run build` — 43 routes 클린
- `npx tsc --noEmit` — 클린
- `npx tsx scripts/qa-unit-tests.ts` — 79/79

### 남은 후속 과제 (출시 후)
- 에러 추적 도입 (Sentry 무료 또는 Vercel Error Reporting)
- E2E 테스트 (Playwright) — 네이버 paste 자동 검증
- API 입력 검증(zod)
- AdSense 광고 단위(`<ins>` 태그) 실제 배치
- Status page · 비용 알람
- README/CLAUDE.md Phase 41 갱신

### 출시 권장도 변동
- Phase 40 종료: 7.5 / 10
- Phase 41 종료: **8.0 / 10** (정식 출시 가능, 후속 6건은 운영하면서 보강)

---

## 2026-05-12 — Phase 40: `/privacy` PIPA 30·31·22-2조 보강

출시 전 개인정보처리방침 점검에서 발견된 4건 — PR #25 머지.

### 1. 보호책임자 실명 표기 (PIPA 31조)
- §12 가 "Boheme BlogLab 운영자" 로 generic 했던 부분 → 시행령 32조 의무(성명·직책·연락처) 위반 가능
- `NEXT_PUBLIC_PRIVACY_OFFICER_NAME` 환경변수 패턴 — 빌드 시 주입, 미설정 시 페이지에 자리표시자 노출 → 운영자가 즉시 인지
- `.env.example` 에 항목·배포 노트 추가
- **🚨 머지 후 후속 필수**: Vercel Dashboard 에서 환경변수 설정해야 자리표시자가 실명으로 대체됨

### 2. Google AdSense 3곳에 명시
- §6 위탁 표: Google LLC (AdSense) — 광고 게재·맞춤 광고·성과 측정
- §7 국외 이전: Google LLC (AdSense) — 미국
- §10 쿠키: "광고 쿠키" 항목 신설 + `adssettings.google.com` 안내

### 3. §15 만 14세 미만 조항 신설 (PIPA 22조의2)
- 명시적 가입 거부
- `/login` 의 "만 14세 이상" 체크박스와 정합
- 허위 가입 발견 시 즉시 파기 절차 명시

### 4. 헤더 메타데이터 갱신
- 최종수정/시행일: 2026-05-12 (Phase 39 변경분 반영)
- 버전 v1.1 도입
- 한 줄 changelog 표기 — 운영 투명성

### 검증
- `npm run build` — 43 routes 클린

---

## 2026-05-12 — Phase 39: 출시 전 안전망 5종 정비

출시 전 4가지 페르소나 점검(QA·테스터·CEO·블로거) 결과 도출된 launch-blocker 5건을 한 PR(#23)로 처리.

### 1. 에러 바운더리 3종 (전부 신규)
- `app/error.tsx` — 라우트 세그먼트 에러 + `reset()` + digest 표시 + 홈/문의 CTA
- `app/global-error.tsx` — root layout 자체가 죽었을 때 외부 컴포넌트·CSS 의존 없이 인라인 스타일로 표시되는 최후 방어선
- `app/not-found.tsx` — 브랜드 톤 404 + 핵심 도구 4개 빠른 이동 카드

이전에는 어떤 라우트에서든 런타임 에러 시 Next.js 기본 회색 페이지 노출 → 사용자 충격·브랜드 손상.

### 2. AI 결과 안전 배지 + `/contact` AdSense FAQ
- `/ai-writer` 결과 화면 최상단에 **amber callout** — 사실 확인 필수 / 본인 경험 추가 / 의료·금융·법률(YMYL) 주의 / AdSense 정책 4가지
- `/contact` FAQ에 "AI 결과 그대로 발행 가능?" + "AdSense 차단 방지" 2개 항목 추가
- Google "Scaled content abuse" 정책 리스크와 사용자 책임 명시 — 정식 출시 시 광고 자격 보호

### 3. IP 기반 분당 rate limit (`app/lib/security/rate-limit.ts` 신규)
- IP_HASH 키 기반 in-memory sliding window — bucket 분리, 5분마다 sweep, 인스턴스당 5k 키 상한
- 비용 발생 외부 API 7개 라우트에 적용:
  - `keywords` 20/분 · `trending` 30/분 · `competitor` 20/분 · `news` 30/분 · `document-count` 30/분 · `spellcheck` 20/분 · `wiki` 30/분
- 429 응답에 `Retry-After` + `X-RateLimit-Remaining/Reset` 헤더
- 봇 1마리가 분당 수백 회 두드려 네이버 API 일일 한도(25,000건)를 17분만에 소진하는 시나리오 차단

### 4. 동의 흐름
- **`/login` 약관·개인정보 동의 체크박스** (필수). 미체크 시 Google 로그인 버튼 비활성화. 동의 시각·버전을 `localStorage` 에 기록 (분쟁 시 입증)
- **`CookieConsent.tsx` 신규** — 동의 전에는 AdSense + Vercel Analytics 마운트 자체 안 됨. "전체 동의" / "필수만 허용" 2가지. `layout.tsx` 에서 두 스크립트 직접 import 제거하고 CookieConsent 한 줄로 교체
- GDPR / KISA 가이드 기본값(동의 전 비활성) 충족 — EEA 트래픽 노출 리스크 해소

### 5. 네이버 호환 HTML 출력
- `markdownToHtml` 의 `em` / `code` 출력을 모두 `strong` 으로 통일
- 네이버 스마트에디터는 paste 시 `<em>` / `<code>` 서식이 사라지는 케이스가 있어 미리보기와 실제 결과의 차이가 발생할 위험 → strong 으로 보수적 변환
- JSDoc 도 실제 화이트리스트(h2/h3/p/strong/ul/ol/li/blockquote/br) 로 업데이트

### 검증
- `npm run build` — 43 routes, 클린 (Turbopack)
- `npx tsc --noEmit` — 클린
- `npx tsx scripts/qa-unit-tests.ts` — 79/79 통과

### 출시 권장도 변동
- Phase 38 종료 시점: 5.5 / 10 (조건부 베타)
- Phase 39 종료 시점: 7.5 / 10 (정식 출시 가능 수준)

### 남은 후속 과제 (출시 후 1~3개월)
- Sentry 또는 Vercel Error Reporting 연동 (중앙 에러 수집)
- `.github/workflows` CI — push 시 build + tsc + unit tests 자동 실행
- API 입력 검증 라이브러리(zod) 도입
- Status page · 비용 알람 · 백업 정책 문서화
- E2E 테스트(Playwright) — 네이버 paste 실측 자동화
- About 페이지에 운영자 신뢰성 신호 보강

---

## 2026-05-12 — Phase 38: trending polish — chips·매핑·리더보드

사용자 피드백 3건 — PR #21 머지.

### 1. `/trending` 카테고리 칩 1줄 가로 스크롤
- 항목 16개가 2줄로 깨지던 문제 → `overflow-x-auto scrollbar-hide` + `flex-shrink-0 whitespace-nowrap`
- 모바일·데스크탑 동일하게 한 줄 가로 스와이프

### 2. 프로필 카테고리 ↔ 트렌드 매칭 버그 수정 🐛
- **버그**: `COMMUNITY_TO_TRENDING_CATEGORY` 의 키가 진단 카테고리 코드(`food-travel`, `info-howto`, `lifestyle`...) 8개로 작성돼 있었음. 그러나 `profile.category` 에는 `app/lib/community/categories.ts` 의 **한국어 라벨**(`'맛집'`, `'IT/기술'`, `'게임'`...)이 저장됨 → 100% 키 불일치 → `myCategoryLabel` 항상 `undefined` → "내 분야 트렌드" 가 늘 전체 트렌드로 폴백되고 있었음 (조용히)
- **수정**: 매핑을 한국어 카테고리 키 16종 1:1 로 다시 작성. '맛집' → '요리/음식' 만 흡수. '일상' / '기타' 는 의도적 미매핑(→ 전체 폴백)

### 3. `TrendingTicker` 시상대 비유 제거 → 통합 리더보드
- 1~10위를 동일한 행 디자인으로 통일 — 배지 / 키워드(검색량 막대 배경) / 월 검색량 / 화살표
- 1·2·3위만 행 배경 그라데이션 + 메달 배지(왕관·별) + ring + bolder weight 로 강조
- 모바일·데스크탑 레이아웃 통일 (`sm:order` 트릭 제거)
- 정보 위계 명확, 가독성·스캔성 우선

### 검증
- `npm run build` — 43 routes, 클린 (Turbopack)

### 후속 후보
- 카테고리 매핑 단위 테스트 추가 (`scripts/qa-unit-tests.ts`)
- 리더보드 행 클릭 분석(어떤 위/카테고리에서 가장 많이 점프하는지)

---

## 2026-05-11 — Phase 37: contact-as-FAQ + visual podium + rich-text paste for Naver

사용자 피드백 3건을 한 PR(#19)로 머지.

### 1. FAQ → `/contact` 페이지로 분리
- `app/page.tsx` 의 인라인 FAQ 섹션(49줄) 제거 — 메인은 도구 그리드·워크플로우·클로징만 남김
- `app/contact/page.tsx` 전면 재작성 — outdated 콘텐츠(PostLab 옛 이름, "회원가입 없음", 회색 톤) 청산하고 **FAQ 우선 + 메일 보조** 구조로:
  - FAQ 8개 (회원가입, 무료 정책, 진단 데이터, **네이버 서식 복사**, 키워드 데이터, 비공개 정책, 커뮤니티 규칙, 오류 신고)
  - 하단 강조 카드: "여기서 답을 못 찾으셨나요?" + 메일 CTA (제목·본문 prefill 포함)
- `app/components/Footer.tsx` 의 "문의" 링크가 `mailto:` → `/contact` 로 변경

### 2. TOP 10 포디움 시각 강화
- `app/components/dashboard/TrendingTicker.tsx` 전면 개편:
  - 데스크탑에서 **2위 · 1위(가운데, 크게, 광채) · 3위** 시상대 배치 (`sm:order-*`)
  - 1위 = 왕관 SVG, 2/3위 = 별 메달, 모두 ring + gradient 그림자
  - 4~10위 행에 **검색량 비율 막대 그래프** 배경 추가 — 1위 대비 너비로 한 눈에 비교
  - 모바일은 자연 세로 배치 유지

### 3. AI 글쓰기 결과 — 미리보기 우선 + 서식 복사
- `app/ai-writer/page.tsx`:
  - `FormatTab` 타입 확장: `'preview' | 'html' | 'markdown' | 'plain'`, 기본 `preview`
  - 미리보기 탭은 `dangerouslySetInnerHTML` 로 실제 렌더, 네이버 본문 톤 스타일 적용
  - 미리보기 탭 메인 CTA: 신규 `RichCopyButton` — 큰 primary 버튼 "네이버에 붙여넣기 (서식 포함)"
  - HTML/MD/일반 탭은 보조 코드 뷰로 유지, 탭별 사용처 안내(티스토리·Notion·메모장)
- `app/components/ui/RichCopyButton.tsx` 신규:
  - `ClipboardItem({'text/html', 'text/plain'})` 로 서식+텍스트 동시 클립보드 저장
  - 네이버 에디터에 일반 Ctrl+V 만으로 제목·소제목·강조·인용·리스트 그대로 유지
  - Fallback: `clipboard.writeText` → contenteditable + `execCommand('copy')`
- `app/globals.css` 에 `.preview-naver` 클래스 추가 — 글자 16px / line-height 1.78 / h2 underline / em 형광펜 / blockquote 좌측 border 등 네이버 블로그 본문 톤

### 검증
- `IP_HASH_SALT=... npm run build` — 43 routes, 클린 빌드
- TypeScript / ESLint 모두 통과 (Turbopack)

### 다음 후보
- contact 페이지 검색 박스(FAQ 항목 필터)
- AI 글쓰기 결과 미리보기에 "이미지 자리표시자" 시각화
- 포디움 카드에 sparkline (7일 변동) 추가

---

## 2026-05-11 — Phase 36.6: README · CLAUDE.md 일괄 업데이트

Phase 28~36.5 변경사항을 두 문서에 반영.

### CLAUDE.md (슬림 자동 로드용)
- `main 직접 push` → `PR + GitHub MCP merge` 흐름으로 정정 (직접 push 403)
- AI 글쓰기 기본 옵션 (compact / single / no-images) + SSE 스트리밍 추가
- 진단 12h rate limit (RLS 0012 + API 사전 체크) 추가
- Vercel 운영 노트: `maxDuration=300`, per-request SDK timeout, 보안 헤더 5종
- minify-safe 에러 분류 (constructor.name → err.name + status + regex) 주의사항
- 마이그레이션 0012, scripts/ QA 4종 추가
- 디버깅 항목 4건 신규 (12h rate limit, ai-draft 로그, JSON 파싱 에러)

### README.md (사용자 안내용)
- 홈 — TOP 10 포디움 + sparkline
- 블로그 진단 — 결과 5개 섹션 + 12h rate limit 명시
- AI 글쓰기 — SSE 스트리밍 + 기본 옵션 + 1회 비용
- 마이그레이션 0012 추가
- QA 스크립트 실행법 (`scripts/qa-*`)
- 보안 항목 — SSRF 방어, safe-redirect, 보안 헤더, 12h rate limit
- 디렉토리 — `dashboard/`, `charts/`, `diagnose/`, `scripts/`
- 신규 "운영 현황" 섹션 (phase, 테스트 자동화 카운트, 비용 시나리오)

---

## 2026-05-11 — Phase 36.5: maxDuration 60s → 300s + per-request SDK timeout

**문제**: Phase 36.4 에서 스트리밍을 도입했음에도 timeout 메시지가 계속 발생.

**근본 원인** (두 개의 hard limit 이 그대로 남아 있었음):
1. `export const maxDuration = 60` — Vercel 함수가 60초에 강제 종료. 스트리밍이라도 함수 자체는 종료됨.
2. `new Anthropic({ timeout: 58_000 })` — SDK 가 streaming/non-streaming 모두에 58초 default timeout 적용. 스트리밍 응답이 58초를 넘으면 SDK 가 abort.

스트리밍은 byte 가 흐르는 동안 Vercel 이 *연결을* 안 끊지만, 함수 자체의 *실행 시간 cap*은 그대로 유효.

### 수정
1. **`maxDuration: 60 → 300`** (Vercel Pro 플랜 최대치). Hobby 라면 60 으로 자동 cap 됨.
2. **인스턴스 default timeout 제거**, 호출별로 per-request 명시:
   - 스트리밍: `{ timeout: 290_000 }` (290초, Vercel 300s 직전)
   - 비-스트리밍(/start): `{ timeout: 58_000 }` (60s 함수 한도 직전, 기존 동작)
3. **Elapsed-time 로그**: 스트리밍 시작/종료/실패 시점에 `totalMs`, `ttfbMs` (time-to-first-byte), `outChars` 출력 — 실제로 얼마나 걸리는지 추적 가능.

이제 스트리밍 호출은 5분까지 안정적으로 처리 가능. 비-스트리밍은 기존 동작 유지.

### 검증
- `npm run build` 클린.
- 단위 테스트 79/79.

---

## 2026-05-11 — Phase 36.4: AI 글쓰기 SSE 스트리밍 도입 (timeout 진짜 해결)

**문제**: Phase 36.3 의 max_tokens 축소 + compact 기본값으로도 일부 사용자에게 timeout 지속.

**원인 분석**:
- 입력은 ~1,500~1,800 토큰으로 작음 (input 시간은 1~2초)
- **출력이 ~2,500~3,300 토큰** × Sonnet 4.6 출력 속도 50~80 tok/s = 31~66초
- Vercel maxDuration 60s 와 충돌 → 일부 케이스에서 timeout 불가피
- 같은 함수 안에서 전체 응답을 받아 한 번에 반환하는 구조라 60s 한도가 절대 한계

**해결 — SSE 스트리밍** (`app/api/ai-draft/route.ts`):
- 요청 body 에 `stream: true` 시 `Content-Type: text/event-stream` 으로 응답.
- `anthropic.messages.stream({...})` 사용, `text` 이벤트마다 SSE 프레임 발송:
  - `data: {"type":"chunk","text":"..."}\n\n`
  - 완료 시 `{"type":"done","usage":{...}}`
  - 에러 시 `{"type":"error","error":"..."}`
- 1차 byte 가 흐르는 한 Vercel 은 함수를 끊지 않음 → **timeout 사실상 사라짐**.

**클라이언트** (`app/ai-writer/page.tsx`):
- `fetch` 응답을 `getReader()` 로 읽고, `\n\n` 단위로 SSE 이벤트 파싱.
- chunk 이벤트마다 `setDraft(acc)` → **사용자가 글이 만들어지는 걸 실시간으로 확인** (UX 대폭 개선).
- error 이벤트 도착 시 부분 출력은 유지하고 에러 메시지만 표시 — 사용자가 부분 결과도 활용 가능.

**`/start` 호환성**: stream 플래그 미전송 시 기존 JSON 응답 그대로 → /start 페이지는 변경 없음.

### 검증
- `npm run build` 클린 (43 페이지).
- 단위 테스트 79/79.
- 배포 후 기대: AI 글쓰기 timeout 메시지 발생률 ~0% + 출력이 한 자씩 흘러나오는 UX.

---

## 2026-05-11 — Phase 36.3: AI 글쓰기 실제 timeout 완화 + minify-safe 에러 분류

**Vercel 로그**:
```
[ai-draft] Claude call failed — class=eB status=none msg="Request timed out."
```

**두 가지 원인** 모두 잡음:

### 1. minify로 인한 class name 매칭 실패
- Vercel production 빌드가 `constructor.name` 을 `'eB'` 같은 1~2자로 압축.
- Phase 36.2 의 status 기반 분기는 OK 하지만 timeout 시 `status=none` 이므로 timeout 분기에 도달 못함.
- 정규식 `/timeout|aborted/i` 가 실제 메시지 `"Request timed out."` (공백 들어간 "timed out") 을 못 잡음.

**수정** (`route.ts` catch 블록):
- `err.name` 명시값 우선 사용 (SDK 가 `this.name = 'APIConnectionTimeoutError'` 명시 시 minify 후에도 보존).
- 정규식 확장: `/time(?:d|out)|aborted|abort/i` — "timed out", "timeout", "aborted", "abort" 전부 매칭.
- 추가 키워드: `fetch failed`, `EAI_AGAIN`.
- 로그에 `name` 필드도 노출 — Vercel 추적 더 쉬워짐.

### 2. 실제 호출이 58s 안에 안 끝남
Sonnet 4.6 출력 속도 ~50-80 tok/s. `max_tokens=4500` (단일 모드) 인 경우 50-90s 소요 → 우리 timeout 58s 초과.

**수정**:
- `max_tokens`: single `4500 → 3500`, multi `6000 → 5000`.
- Anthropic SDK timeout: `55s → 58s` (Vercel 60s 한도 직전).
- `DEFAULT_OPTIONS.length`: `'standard'(1,700~2,200자) → 'compact'(1,300~1,700자)`. compact 출력은 약 2,200 tokens → 30~40s 소요로 안정.
- 사용자는 옵션 패널에서 standard 로 토글 가능 (UX 손실 없음).

### timeout 사용자 메시지 개선
"AI 응답이 시간 안에 도착하지 않았어요. 잠시 후 다시 시도해주세요. (글 길이를 줄이거나 옵션을 단순화하면 안정적입니다)" — 조치 가이드 포함.

### 검증
- `npm run build` 클린, 단위 테스트 79/79.

---

## 2026-05-11 — Phase 36.2: `/api/ai-draft` 에러 분류 + 로그 보강

**문제**: Phase 36.1 패치 후에도 사용자가 `AI 생성 중 일시적인 오류가 발생했어요` 메시지를 받고 있음. 이 카피는 fallback (status=502).

**근본 원인**: catch 블록의 분기에서 `cls === 'APIError'` 만 검사했는데, Anthropic SDK 는 base `APIError` 가 아니라 subclass(`BadRequestError` / `AuthenticationError` / `RateLimitError` / `InternalServerError` / `OverloadedError` / `NotFoundError` / `APIConnectionError`) 로 throw 함. `constructor.name` 은 subclass 이름이라 매칭 실패 → 모든 케이스가 fallback 으로 떨어짐.

### 수정 (`app/api/ai-draft/route.ts` catch 블록)
- **class 이름 의존 제거** — `err.status` 필드만 보고 분기. subclass 어떤 것이든 status 만 있으면 정확히 분기.
- **분기 확대**:
  - 401/403 → 운영자 알려주세요
  - 404 → 모델 설정 문제 (운영자)
  - 429 → 호출량 한도 초과
  - 503/529 → 일시 혼잡
  - 400/422 → 프롬프트 형식 문제
  - >=500 → 서버 오류 응답
  - `APIConnectionError` / network 에러 → 연결 실패
  - timeout / abort → 시간 초과
- **로그 강화**: `class=X status=Y msg="..."` 한 줄 — Vercel 로그에서 즉시 원인 추적 가능.

### 검증
- `npm run build` 클린, 단위 테스트 79/79.
- 운영 배포 후 Vercel Function 로그에서 `[ai-draft] Claude call failed — class=X status=Y` 라인 확인 → 실제 어떤 에러가 일어났는지 파악 가능.

---

## 2026-05-11 — Phase 36.1: AI 글쓰기 JSON 파싱 에러 + 미니멀 푸터 + 비용 절감 기본값

### 1. AI 글쓰기 `Unexpected token 'A', "An error o"...` 에러
**근본 원인**: `/api/ai-draft` 가 Vercel maxDuration(60s) 초과 또는 Anthropic 일시 장애 시 plain text "An error occurred ..." 응답을 받음. 클라이언트(`/ai-writer`, `/start`)는 `await res.json()` 직접 호출 → SyntaxError 로 화면 깨짐.

**3중 방어로 해결**:
- **`safeJson()` 헬퍼** (`app/lib/clientFetch.ts`) — 응답을 text로 읽고 try-parse. 실패 시 `{ _parseError, _raw }` 객체 반환. 절대 throw 없음.
- **`/ai-writer` + `/start`**: `safeJson` 으로 교체. 비-JSON / 빈 본문 / 504/408/5xx 마다 사용자 친화 메시지 분기.
- **서버 측 timeout 가드**: `new Anthropic({ apiKey, timeout: 55_000, maxRetries: 0 })` — Vercel 60s 한도 5s 전에 우리가 먼저 abort → 항상 JSON 에러로 응답. catch 블록에서 `APIConnectionTimeoutError` / 529 overload / 401/403 / 400 각각 적절한 status + 메시지 분기.

### 2. Footer 미니멀화
- 4컬럼(소개·도구·커뮤니티·문의) + brand row + 약관 row → **한 줄 구성** (modern SaaS 트렌드).
- 좌: 브랜드 마크 + © 텍스트, 우: 소개·이용약관·개인정보·문의(mailto) 4개 링크만.
- 도구·커뮤니티 네비게이션은 Navbar / MobileBottomNav 가 담당하므로 footer 중복 제거.
- py-12 → py-6 으로 footer 높이 절반 축소.

### 3. AI 글쓰기 기본 옵션 — 비용 절감
**변경** (`app/ai-writer/page.tsx` DEFAULT_OPTIONS):
- `titleMode: 'multi'` → `'single'` (제목 20개 → 1개)
- `imagePrompts: true` → `false` (이미지 프롬프트 5줄 제거)

사용자는 옵션 패널 토글로 다시 켤 수 있다 — UX 손해 없이 기본 호출만 가벼움.

**측정 결과** (cost estimate 재실행):
| 항목 | 이전 (multi + img) | 신 기본값 (single + no-img) | 절감 |
|---|---|---|---|
| 1회 비용 (cache miss) | $0.08~0.11 | **$0.05~0.07** | -39% |
| 월 비용 @ DAU 200 | $571 | **$346** | -39% |
| 월 비용 @ DAU 500 | $2,856 | **$1,732** | -39% |
| 출력 토큰 평균 | 6,025 | 3,540 | -41% |

### 검증
- `npm run build` 클린 (43 페이지)
- 단위 테스트 79/79 통과

---

## 2026-05-11 — Phase 36: 진단 12시간 1회 rate limit + Claude API 비용 분석

### 1. 블로그 진단 12시간 1회 제한
**배경**: 진단 1회당 외부 API 호출이 비싼 작업 — 네이버 검색 OpenAPI 30회 + PostView.naver 12회 + RSS 1회. 기존 RLS 는 24h/20건 cap 이었으나 너무 느슨함.

- **마이그레이션 0012** (`supabase/migrations/0012_diagnose_rate_limit_12h.sql`): RLS INSERT 정책을 `not exists (... where created_at > now() - interval '12 hours')` 로 강화. 클라이언트 우회 불가.
- **`/api/blog-diagnose` POST**: 외부 호출 전에 사전 체크 — 12h 내 진단 이력 있으면 `429 + nextAvailableAt` 응답. `약 N시간 후에 다시 시도해주세요.` 메시지로 사용자 친화 안내.
- **결과 페이지**: "한 달 뒤에 다시" → "**12시간에 한 번씩** 할 수 있어요" 안내로 정정.
- **MethodologyPanel "측정 한계"** 마지막 항목에 12h 정책 추가.

### 2. Claude API 비용 분석 스크립트 (`scripts/qa-claude-cost-estimate.ts`)
**측정 결과** (Sonnet 4.6, 환율 1,450원/$):
- **1회 호출 비용**: cache miss `$0.08~0.11 (₩117~159)`, cache hit `$0.077~0.106 (₩112~153)`
- **입력**: system prompt 1,344~1,434 tokens + user prompt 200~300 tokens
- **출력**: 5,075~6,975 tokens (본문 1,700~2,200자 + 제목 20개 + 해시태그 + 이미지 프롬프트 + 자체 검토)
- **월간 시나리오** (cache miss · 출력 중간):
  - DAU 50 · 1회/일: 월 `$143 (~₩207k)`
  - DAU 200 · 1회/일: 월 `$571 (~₩828k)`
  - DAU 500 · 2회/일: 월 `$2,856 (~₩4.14M)`
- 현재 한도(비로그인 1회/일 · 로그인 5회/일)로 사용자당 월 최대 30~150회 캡

스크립트는 `messages.countTokens` SDK 호출 우선 사용하고, API 키 없으면 한국어 1.5 tok/char + 영문 0.25 tok/char 휴리스틱으로 fallback.

### 검증
- `npm run build` 클린 (43 페이지)
- 단위 테스트 79/79 통과 (회귀 없음)

---

## 2026-05-11 — Phase 35.2: favicon · 아이콘 브랜드 통일

**문제**: 브랜드 아이덴티티가 세 곳에서 따로 놀고 있었음.
- Navbar / Footer 로고 박스: 오렌지 사각형 + **"B"** 글자
- `public/icon.svg` / 생성된 PNG (PWA·홈스크린): 오렌지 사각형 + **연필** 아이콘 ✏️
- `app/favicon.ico` (브라우저 탭): 별도 old 파일 (May 4)

### 수정
**1. `public/icon.svg` 를 "B" 디자인으로 교체**
- 같은 오렌지 그라데이션 사각형 (rx=96).
- 흰색 "B" 글자를 path로 (폰트 의존성 제거 — sharp librsvg에서 OS 폰트 미설치 시 fallback 사라지는 리스크 방지).
- evenodd fill-rule 로 가운데 두 빈 공간 처리.

**2. PNG 일괄 재생성** (sharp + librsvg, compressionLevel 9)
- `icon-192.png` / `icon-512.png` (PWA maskable)
- `apple-touch-icon.png` (180×180, iOS 홈스크린)

**3. `app/favicon.ico` 멀티 사이즈 재생성**
- 16/32/48 PNG payload 를 ICONDIR + ICONDIRENTRY 로 패키징한 multi-resolution ICO.
- Windows Vista+ 와 모든 modern 브라우저는 PNG payload 형태의 ICO 지원.

**4. `app/layout.tsx` metadata.icons 확장**
- `icon: [SVG + favicon.ico + icon-192 + icon-512]` 순서 — modern 브라우저는 SVG 우선, 구버전은 ICO fallback.
- `shortcut: [favicon.ico]` 별도 명시 (legacy `rel="shortcut icon"` 호환).

### 검증
- `npm run build` 클린 (43 페이지).
- 192px / 32px 렌더 시각 확인 — 오렌지 그라데이션 + 굵은 흰색 "B".

이제 브라우저 탭 / 모바일 홈스크린 / 사이트 헤더가 같은 브랜드 마크를 사용.

---

## 2026-05-10 — Phase 35.1: QA 단위/통합/회귀 테스트 + 자투리 정리

**배경**: 오픈 전 전문 QA 점검. 단위 테스트(93) / 통합 스모크(47) / 회귀(40) 작성하고, 검증 중 발견된 issue 정리.

### 신규 QA 스크립트 (`scripts/`)
- `qa-unit-tests.ts` — 9개 영역 79 unit asserts. safeNextPath / escapeLikePattern / extractBlogId / mapHits / scoreActivity / scoreVisibility / scoreQuality / compose / validateNickname·BlogUrl. Phase 34.1 글자수 임계값(300/1200) 회귀 포함.
- `qa-ssrf-tests.ts` — 14 SSRF asserts. `fetchPostBody` 가 외부 도메인의 `PostView.naver` / IP literal / localhost / file:/data: scheme / 잘못된 ID 형식 등을 모두 차단/재조립하는지 fetch 인터셉트로 검증.
- `qa-smoke.sh` — production server에 curl 으로 26 페이지 + 8 static asset + 보안 헤더 5개 + 입력 검증 + 404 등 47 항목 확인.
- `qa-regression.sh` — Phase 34~35 변경사항(랭킹 보드, MethodologyPanel, 메뉴 일관성, /about, layout metadata, 보안 헤더, PWA 아이콘, 입력 검증 순서, ai-draft fail-safe) 41 항목 검증.

### QA 중 발견된 fix
**1. `/api/ai-draft` GET — fail-safe 추가**
- Supabase 환경변수 누락 / `getAuthedUsage` throw 등 모든 경로에서 빈 응답 → 클라이언트 JSON 파싱 에러 가능.
- 전체를 try-catch로 감싸 익명 기본값(used=0, limit=1, remaining=1, authedLimit=5)을 항상 반환.

**2. `/api/blog-diagnose` — 입력 검증을 환경 체크 앞으로**
- 기존: NAVER API 키 체크 → 입력 검증. 운영자 메시지가 사용자 입력 에러를 가림.
- 수정: 입력 정규화·blogId 추출·카테고리 시드 검증 → 환경 가드 → 외부 호출.
- 사용자에게 "블로그 ID를 입력해주세요" / "메인 카테고리를 선택해주세요" 가 우선 노출.

**3. lint cleanup — `<a href="/lab">` → `<Link>` 6건**
- `app/ai-writer/page.tsx`, `competitor-analysis/page.tsx`, `editor/page.tsx`, `image-search/page.tsx`, `image-tools/page.tsx`, `keyword-analysis/page.tsx` 에 `import Link from 'next/link'` 추가 후 일괄 치환.
- `@next/next/no-html-link-for-pages` 오류 0건 달성.

### 테스트 결과 요약
| Phase | 항목 | 결과 |
|---|---|---|
| 1. Static | tsc / build | ✅ 클린 |
| 1. Static | eslint critical | ✅ 0 (한글 escape / unused vars / prefer-const 등 cosmetic만) |
| 2. Unit | 79 asserts | ✅ 79/79 |
| 2. Unit (SSRF) | 14 asserts | ✅ 14/14 |
| 3. Integration | 47 항목 | ✅ 47/47 (env fix 후) |
| 4. Regression | 41 항목 | ✅ 40/41 (1건은 Navbar dropdown description이라 SSR 패턴 매칭 false negative — 실 동작 정상) |

### 운영 오픈 판정
- 운영 환경변수(NAVER / SUPABASE / ANTHROPIC / IP_HASH_SALT) 가 Vercel에 설정되어 있다면 즉시 오픈 가능.
- 본 테스트는 환경변수 미설정 상태에서 fail-safe 동작까지 검증.

---

## 2026-05-10 — Phase 35: 오픈 전 launch-readiness 일괄 패치

**배경**: 오픈 전 정밀 점검에서 발견된 10개 이슈 일괄 처리. 법무 페이지는 사실상 충분(개인 사이트라 법인 정보 불요)이라 그쪽은 가벼운 다듬기만.

### CRITICAL/HIGH

**1. `safeNextPath` 이중 인코딩 → 로그인 후 원위치 복귀 실패** (`app/lib/security/safe-redirect.ts`)
- `?next=` 값이 인코딩되어 들어왔을 때 한 단계 `decodeURIComponent` 후 검증.
- `app/profile/setup/page.tsx:166` 의 nested `next` 도 inner를 별도 인코딩.

**2. 진단 30~50초 결과 휘발 방지** (`app/blog-diagnose/page.tsx`)
- `bbl:diagnose:v1` sessionStorage 키에 `{blogInput, category, result, savedAt}` 저장.
- 진단 시작 시 입력값, 결과 도착 시 결과까지 캐시. 24시간 만료.
- 마운트 시 자동 복원. `reset()` 호출하면 캐시 클리어.

**3. `/start` → 8단계 모드 전환 시 draft 유실 방지** (`app/start/page.tsx:385`)
- `<Link>` → `<button>`으로 바꿔 클릭 시 `sessionStorage.setItem('aiDraft', ...)` 후 `router.push`.

**4. PWA manifest PNG 아이콘** (`public/icon-{192,512}.png`, `public/apple-touch-icon.png`)
- sharp로 `icon.svg` → 192/512/180 PNG 생성. manifest.icons 갱신.
- `app/layout.tsx` metadata.icons에 `apple` 항목 추가 (iOS 홈스크린 고해상도).
- 동시에 og-image.png 686KB → 122KB로 압축.

**5. `next.config.ts` 보안 헤더 추가**
- HSTS, X-Content-Type-Options, X-Frame-Options=SAMEORIGIN, Referrer-Policy, Permissions-Policy. CSP는 의존성 많아 후일 별도 phase.

**6. SSRF 방어 강화** (`app/lib/diagnose/naver-blog.ts:toPostViewUrl`)
- 외부 도메인의 `?...PostView.naver`도 그대로 받아주던 분기 제거. 항상 `blog.naver.com`으로 재조립. blogId/logNo 화이트리스트 정규식 두 번 검증.

**7. `/ai-writer` 한도 초과 안내 배너**
- `usage.remaining <= 0` 전용 카피: "오늘 한도 모두 사용 / 자정(KST) 초기화 / 키워드 분석·프롬프트 생성·금칙어는 무제한". 비로그인이면 Google 로그인 CTA 유지.

### MEDIUM/LOW

**8. `/about` 다크모드 + 콘텐츠 갱신**
- `bg-gray-*` 토큰 → `dark:bg-zinc-*` 적용. `Boheme PostLab` (legacy 명) → `Boheme BlogLab`.
- 5개 핵심 도구 카드 + 서비스 특징 + 법적 안내 링크.

**9. 메뉴 일관성**
- Navbar `COMMUNITY_MENU` 의 tips 주석 해제 (서이추 / 정보 공유 / 체험단 동행 3개 모두 노출).
- `/community/page.tsx` 허브에 tips 카드 추가 (3개로).
- `Footer.tsx`에 "커뮤니티" 컬럼 신설 + tools 컬럼에 AI 글쓰기 추가.

**10. 닉네임 24h 변경 제한 사전 안내** (`app/profile/setup/page.tsx`)
- `existing.nickname_changed_at` 기반으로 "다음 변경 가능: 약 N시간 후" 동적 help text.

**11. 모바일 하단 탭바 폰트 11px → 12px (`text-xs`)**
- WCAG AA 가독성.

**12. Layout metadata 정리**
- title `Boheme PostLab` → `Boheme BlogLab` 정정. description/og/twitter 일치.
- `icons` 항목 신설.

**13. console.error 정보 노출 정리**
- `app/components/AdSense.tsx`: 무시.
- `app/api/ai-draft/route.ts:Claude API error`: 응답 본문 누설 방지 — 에러 클래스명만 로깅, 사용자에겐 일반 메시지.

**14. 린트 에러**
- `/lab` 향한 `<a>` → `<Link>` (`prompt-generator/page.tsx`, `trending/page.tsx`).

### 검증
- `npm run build` 클린 (43 페이지). manifest 타입 에러는 `purpose: 'any maskable'` → 별 항목 분할로 해결.

---

## 2026-05-10 — Phase 34.2: 진단 방법·측정 기준 패널 (`MethodologyPanel`)

**배경**: 사용자에게 점수가 어떻게 산출되는지 투명하게 알려야 신뢰가 쌓임. 8개 건강 체크 항목의 통과 기준, 3축 가중치, 데이터 소스, 측정 한계를 한 번에 볼 수 있게.

### 추가 — `MethodologyPanel` (collapsible, `<details>`)
- **3축 가중평균**: 활동성 25% / 노출 50% / 품질 25%를 카드 그리드로.
- **건강 체크 8개 통과 기준 표**: 항목명 + 통과 임계값 (예: "주 2회 이상 발행 = 최근 30일 8편 이상", "글당 평균 800자+ = 최근 12편 본문 평균 800자 이상").
- **데이터 소스**: RSS / 검색 OpenAPI / PostView.naver(본문) 각각이 어느 점수의 원천인지 명시.
- **측정 한계**: 비공개 데이터, RSS 비공개·카테고리 미설정 블로그 한계, "1페이지 진입"이 30위 기준이라는 점, 밴드는 임계값 매핑이라는 점.

### 노출 위치
- **입력 페이지**: 카테고리 카드 아래, amber "측정 한계" 박스 위. 기본 닫힘.
- **결과 페이지**: warnings 섹션 다음, "다음 단계" 위. 기본 닫힘.

### 검증
- `IP_HASH_SALT=… npm run build` → 클린.

---

## 2026-05-10 — Phase 34.1: 진단 본문 측정 정확도 개선 (PostView.naver)

**버그**: HealthChecklist의 "글당 평균 800자+" / "글당 이미지 2장+" 체크가 실제 1,000자/2장 이상인 글에서도 항상 미통과. 원인은 `quality.avgCharsPerPost` / `avgImagesPerPost`가 RSS `<description>`(본문 일부 250~500자 + 썸네일 0~1장)을 기반으로 계산되고 있어서 실제값보다 훨씬 작게 측정되던 것.

### 1. `naver-blog.ts` — `fetchPostBody(postUrl)` 추가
- RSS link → `https://blog.naver.com/PostView.naver?blogId=...&logNo=...` 변환 후 fetch.
- iframe 내부 본문 HTML이 직접 응답되므로 본문 영역 정확 측정 가능.
- 본문 컨테이너 우선순위: `.se-main-container` (스마트에디터 ONE) → `#postViewArea` (구 에디터) → `<body>` 전체 (fallback).
- timeout 8초 + retry 1회. 실패 시 null 반환 → 호출자가 RSS 값 유지.

### 2. `/api/blog-diagnose/route.ts` 흐름 변경
- RSS 받은 직후 최근 12편 본문을 병렬 fetch (concurrency 3).
- 성공한 글은 `RssItem`의 `contentLength` / `imageCount`를 실제값으로 덮어씀, `fetchedIndices: Set<number>`에 인덱스 기록.
- `scoreQuality(qualityItems)` 호출 시 fetch 성공한 글들만 입력 → RSS 잘린 데이터로 평균이 끌려 내려가지 않음.
- 실패 시 warnings에 명확히 안내 ("X편 중 Y편만 본문 측정 성공" 또는 "전부 실패 — RSS 요약 기준").

### 3. `scoring.ts` 임계값 재조정
- 정확 측정 도입에 맞춰 `sChars`: `(avgChars - 200)/600` → `(avgChars - 300)/1200`. 1,500자 만점 / 300자 미만 0.
- "RSS 본문은 잘려 있어 실제는 더 길 수 있어요" 안내 문구 제거 (더이상 사실 아님).

### 4. UI 문구 정리 (`blog-diagnose/page.tsx`)
- HealthChecklist `글당 평균 800자+` 디테일 "(RSS 기준)" → "(최근 글 본문 측정)".
- 미통과 advice에서 "RSS는 본문이 잘릴 수 있어..." 한 문장 제거.

### 영향
- 추가 네트워크 비용: 최근 12편 × 3 동시성 → 약 4~10초. 기존 30~50초 진단 + 4~10초 = 35~60초 (Vercel maxDuration 60초 한계 안).
- quality 점수가 일반적으로 +20~40점 상승 가능 (그동안 RSS 잘림으로 페널티 받던 부분이 해소).
- HealthChecklist 8개 체크 중 글자수·이미지 체크가 실제 콘텐츠 기준으로 정확히 통과/미통과.

---

## 2026-05-10 — Phase 34: 인기검색어 랭킹 보드 + 진단 차별화 (분포·체크·30일 플랜)

**배경**: 사용자 피드백 — (1) 홈 인기 검색어가 가로 스크롤 12개 칩이라 "순위" 느낌이 없음, (2) 블로그 진단은 매번 블로그 URL/카테고리를 다시 입력해야 하고, 결과 페이지의 게이지가 잘려 보이며, 다른 사이트와 비교해 분석이 얕음.

### 1. 인기 검색어 → 랭킹 보드 (`TrendingTicker.tsx`)
- 12 → **TOP 10**으로 축소 (`limit=10`).
- 가로 스크롤 칩 → **포디움 + 리스트** 2단 구성:
  - **TOP 3**: gradient 카드 + 메달 아이콘(GOLD/SILVER/BRONZE) + 큰 키워드 + 월간 검색량.
  - **4~10위**: divide 라인 컴팩트 리스트 + 호버 시 화살표 노출 + 검색량 우측 정렬.
- 다크모드 메달 톤(orange-400 / zinc-500 / amber-500)도 별도 정의.

### 2. 블로그 진단 — 입력 자동 채움 (`/blog-diagnose`)
- `useUser()` + `fetchMyProfile()`로 로그인 시 프로필 정보 자동 prefill:
  - `profile.blog_url` → 블로그 주소 입력란 (사용자가 비워둔 경우만).
  - `profile.category`(한국어) → `PROFILE_TO_DIAGNOSE` 매핑(17개)으로 진단 카테고리 시드(영문 슬러그) 자동 선택.
- 자동 입력 발생 시 상단에 안내 배너(`prefillNotice`) — "프로필에서 블로그 주소 · 분야를 가져왔어요. 필요하면 수정 가능합니다.".

### 3. ScoreGauge 반원 게이지 잘림 버그 수정 (`ScoreGauge.tsx`)
- 기존 `cy = size - stroke / 2` (예: size=180에서 cy=174)가 `viewBox` 높이 102 바깥에 있었음 → 호의 윗부분만 12px 정도 보이고 점수·캡션 텍스트는 완전 클리핑.
- 수정: `cy = size / 2`, `viewBox` 높이 = `size/2 + stroke + size*0.10`. arc는 `M ... A ...` 절대 좌표로 명시.
- 점수 텍스트 `y = cy - size*0.04`, 캡션 `y = cy + size*0.085`로 호 안쪽·하단에 위치.
- size 180 → **200**으로 살짝 키워서 결과 페이지 시인성 ↑.

### 4. 진단 결과 차별화 — 3개 신규 섹션
**(a) `RankDistribution`** — 30개 키워드를 1~10/11~20/21~30/미진입 4구간으로 스택바 + 4개 미니 카드. 분포 비율에 따라 "권위 누적 중" / "TOP10 부족" / "롱테일 공략" 자동 해석 문구.

**(b) `HealthChecklist`** — 8개 핵심 체크포인트 (`주 2회 이상 발행`, `7일 이내 최신 글`, `꾸준한 발행 간격`, `1페이지 진입 30%+`, `TOP 10 진입 글 보유`, `글당 평균 800자+`, `글당 이미지 2장+`, `카테고리 집중도 50%+`). 통과/미통과 ✓/✗ + 미통과 항목엔 구체적 advice. 우상단에 `4 / 8 통과` 식 종합 점수.

**(c) `ActionPlan`** — 3축 중 가장 점수 낮은 영역(`activity` / `visibility` / `quality`)에 따라 **4주짜리 weekly 액션 플랜** 자동 추천. activity 약하면 발행 페이스 회복, visibility 약하면 진입 가능 키워드 공략 + 상위 글 패턴 복제, quality 약하면 글 길이·이미지·카테고리 집중. 미진입 키워드 상위 3개를 동적으로 끼워 넣어 진짜 내 블로그 맞춤 플랜.

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린, 타입 에러 없음.

### 배포
- 직접 `git push origin main`이 원격에서 403으로 차단됨 → GitHub MCP로 PR #5 생성 후 머지(머지 커밋 `d640116`). 이후 main 직접 push가 막혀 있을 경우 동일 흐름(PR + merge)으로 진행.

---

## 2026-05-08 — Phase 33: 상위노출 분석 시각화 + 진단 점수 sparkline

**배경**: Phase 32 후속에서 남아있던 두 항목 일괄 처리 — (1) `/competitor-analysis`에 패턴 시각화, (2) `LatestDiagnoseCard`에 시간순 점수 sparkline.

### 1. 새 차트 컴포넌트 (`app/components/charts/`)
- **`MonthlyDistribution.tsx`** — Recharts BarChart. YYYYMM/YYYYMMDD/YYYY-MM-DD 키 자동 정규화 → 월(YY.MM)별로 합산 후 막대. 다크모드 자동 감지(`MutationObserver`). Tooltip / cursor / radius 4 디자인 토큰화.
- **`ScoreSparkline.tsx`** — 경량 SVG 라인+영역 차트. 최신 포인트 강조(원 + 텍스트). Y 도메인은 데이터 ±5 padding으로 변동 감각 ↑. 2개 미만이면 null 반환(자동 숨김).

### 2. 진단 API 확장 (`app/api/blog-diagnose/route.ts`)
- GET이 `latest`/`previous`/`delta` 외에 `history: { date, score }[]` 추가 (최근 12건, 오래된→최신 순).
- 비로그인·미저장 시 `history: []`.
- 응답 타입(`app/lib/dashboard/types.ts`)에 `DiagnoseHistoryPoint`, `DiagnoseLatestResponse.history?` 필드 추가.

### 3. `LatestDiagnoseCard` 점수 추이 sparkline 결합
- 점수 카드 하단에 점선 분리 후 `ScoreSparkline` + "최근 N회 진단" 라벨.
- 진단 2건 이상 누적 시에만 노출. 1건이면 미니바만.

### 4. `/competitor-analysis` 패턴 시각화
- **발행 시간 분포** 새 카드 — `MonthlyDistribution`. 기존엔 `dateDistribution` 데이터가 있어도 화면 어디에도 안 보였음 → 즉시 가시화.
- **자주 사용되는 단어** 카드 — pill 칩 → `HorizontalBarList`(상위 15개, count 비례 막대). 단어별 빈도 비교가 한눈에.
- **상위 노출 블로거** 카드 — 평면 list → `HorizontalBarList`(post 수 비례). 점유율 차이 즉시 인지.
- 카드 톤 / 보더 색상도 Hermès Luxe 토큰(`#221c17` / `#2e2723`)으로 통일.

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린
- 한 번 Recharts Tooltip formatter 타입 에러 (number ↔ undefined) → 명시 타입 제거로 수정

### 시각화 적용 현황 (전체)
| 페이지 | 차트 |
|---|---|
| `/blog-diagnose` 결과 | 게이지 + 3축 레이더 + 미니바 |
| 대시보드 홈 (로그인) | mini 게이지 + 미니바 + **점수 추이 sparkline** (Phase 33) |
| `/trending` | TOP 10 가로 막대 |
| `/keyword-analysis` | TOP 10 가로 막대 |
| `/competitor-analysis` | **월별 막대 + 단어/블로거 가로 막대** (Phase 33) |

---

## 2026-05-08 — Phase 32: 키워드 분석 페이지에 TOP 10 비교 시각화

**배경**: 사용자 질문 — "키워드 분석에도 시각화가 추가됐나요?" 확인해보니 표·숫자만 있고 가로 막대 같은 비교 시각화가 없는 상태. Phase 29·31의 후속 권장에 있던 작업.

### 변경 (`app/keyword-analysis/page.tsx`)
- `HorizontalBarList` 컴포넌트 import (이미 Phase 29에서 만들어둔 재사용 컴포넌트)
- 결과 표 위에 **"TOP 10 검색량 비교"** 카드 추가:
  - `sortedKeywords` 사본을 `totalSearchVolume` 내림차순 정렬 후 상위 10개
  - 각 항목에 순위 + 키워드 라벨 + 검색량 값 + 막대 (가장 큰 값 대비 비율)
  - 클릭 시 `/competitor-analysis?keyword=...`로 이동 (다음 단계 자연 연결)
  - `sortedKeywords.length > 1`일 때만 노출 (1개면 비교 의미 없음)
- 기존 표는 그대로 유지 — 풀 데이터 + 정렬·CSV·삭제 기능 보존

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린

### 시각화 적용 현황 정리
- ✅ `/blog-diagnose` 결과: 게이지 + 3축 레이더 + 미니바 (Phase 29~31)
- ✅ 대시보드 홈: mini 게이지 + 미니바 (Phase 29)
- ✅ `/trending`: TOP 10 가로 막대 카드 (Phase 29)
- ✅ `/keyword-analysis`: TOP 10 가로 막대 카드 (Phase 32, 본 작업)

### 후속 권장
- `/competitor-analysis`: 상위 블로그의 패턴(글자수·이미지수)을 분포 그래프로
- 진단 점수 시간순 sparkline (이력 누적되면)

---

## 2026-05-08 — Phase 31: Hermès Luxe 리브랜드 + 콘트라스트 강화 + 블로그 진단 UX 개편

**배경**: 사용자 피드백 — (1) Phase 30의 sapphire blue가 잘 안 보임, 에르메스 시그니처 오렌지로 럭셔리하게 바꾸기. (2) 글자 콘트라스트 약함, 가독성 boost 필요. (3) 블로그 진단의 카테고리 선택이 클릭 가능해 보이지 않음 — UI/UX 개편으로 빠르게 진행할 수 있게.

### 1. 컬러 — Hermès Luxe (orange + warm cocoa dark)
- **Light**: `--bg-base #fafaf9` (warm zinc-50, 살짝 크림) / `--accent #ea580c` (orange-600 — Hermès 시그니처) / text zinc-950
- **Dark**: `--bg-base #1a1410` (deep cocoa-charcoal — Hermès leather 톤) / `--bg-surface #221c17` / `--accent #fb923c` (orange-400, 다크에서 부드럽게)
- 다크 버튼 primary 텍스트: `#1a1410` (배경과 일치하는 코코아 — orange-400 위에 어두운 텍스트가 더 가독)
- 51개 .tsx `blue-*` → `orange-*` sed
- 44개 .tsx `slate-*` → `zinc-*` sed (Phase 30 후속 정리)

### 2. 콘트라스트 boost — 글자 가독성 ↑
**globals.css 토큰 강화:**
- Light `--text-secondary`: `#52525b` (zinc-600) → `#3f3f46` (zinc-700)
- Light `--text-muted`: `#71717a` (zinc-500) → `#52525b` (zinc-600)
- Dark `--text-secondary`: `#a1a1aa` (zinc-400) → `#d4d4d8` (zinc-300) — 다크에서 본문 가독성 폭증
- Dark `--text-muted`: `#71717a` → `#a1a1aa` (zinc-400)
- `--border-strong`: `#d4d4d8` (zinc-300) → `#a1a1aa` (zinc-400). hover 시 시각적 변화 명확.
- `--accent-soft` opacity 다크 0.12 → 0.18 (배지 가독성 ↑)

### 3. 블로그 진단 페이지 UX 전면 개편 (`app/blog-diagnose/page.tsx`)
- **Hero 톤 전환**: 옛 `text-ink` 잔재 클래스 → 명시적 `text-zinc-950 dark:text-zinc-50` + 큰 디스플레이 타이틀(text-5xl)
- **진행 스텝 표시**: 새 progress chip ol — "1 블로그 입력 → 2 분야 선택 → 3 진단 시작"이 입력 진행에 따라 자동 ✓로 전환. 사용자에게 "지금 어디까지 했는지" 즉시 알림.
- **블로그 입력 카드화**: 옛 `border-b-2` underline 입력 → 명시적 카드 컨테이너 + 두꺼운 input border + bg-zinc-50 + focus 시 ring-orange-500/20. 클릭 가능 영역이 한눈에 보임.
- **카테고리 선택 카드화 (핵심)**:
  - 옛: `gap-px` 배경색만 다른 8개 평면 박스 → 클릭 가능한지 모름
  - 새: 각 항목이 **rounded border-2 카드**, hover 시 orange-300 border + soft bg + shadow
  - 선택됨: orange-500 두꺼운 border + orange-50 bg + ring-2 + 우상단 ✓ 체크 아이콘 + orange-700 텍스트
  - 라벨 헤더에 "✓ {선택된 분야} 선택됨" 실시간 표시
  - `aria-pressed` 추가 (스크린리더 호환)
- **CTA 버튼 동적 라벨**: 입력 미완성 시 "입력을 모두 완료해주세요" / 완료 시 "진단 시작 (30~50초) →" — 상태 명시.
- **경고 배너 톤업**: 옛 회색 hairline 박스 → amber-50 bg + amber-200 border (눈에 띄도록).

### 4. 차트 팔레트 정렬
- `ScoreGauge` band color 임계: orange-500/orange-600/orange-700 변형 + 저점 yellow-300/yellow-600
- `DiagnoseRadar` accent: `#ea580c` (light) / `#fb923c` (dark), axisText 콘트라스트 boost
- 차트 텍스트 색을 `--text-secondary` boost 값에 맞춰 zinc-700/zinc-300 사용

### 5. 잔여 정리
- `manifest.ts theme_color`: `#047857` → `#ea580c` (Hermès)
- `layout.tsx viewport themeColor`: light `#fafaf9` / dark `#1a1410` (warm cocoa)
- `::selection`, `.pill-accent` border RGB 모두 orange로 정렬
- status 컬러 중 `--warning`을 yellow-600으로 (orange와 hue 분리 — accent와 안 헷갈림)

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린

### 후속 권장
- 키워드 분석 결과 표 검색량 컬럼에 `HorizontalBarList` 적용 (사용자가 한눈에 비교)
- `/community` 작성 페이지에도 진단 페이지처럼 진행 스텝 표시 + 카드형 입력 적용
- Wanted Sans Variable FOUT 완화 (`font-display: swap`)

---

## 2026-05-08 — Phase 30: Wanted Sans + Modern Monochrome 리브랜드 (인터랙티브 조화)

**배경**: Phase 29 Sage & Charcoal에 사용자가 만족하지 못함. 폰트도 더 트렌디한 변수 폰트 원함. "메뉴/버튼/호버/클릭 색 변화 모두 조화롭게"가 핵심 요청. `frontend-design` 스킬 + 한국어 SaaS 트렌드 조사 후 옵션 제시 → A. Wanted Sans Variable + A. Modern Monochrome (Linear/Vercel 톤) 합의.

### 1. 폰트 — Wanted Sans Variable
- `app/layout.tsx`: jsdelivr CDN으로 Wanted Sans Variable webfont 추가. Pretendard는 fallback으로 보존.
- `globals.css`:
  - `@theme --font-sans`에 Wanted Sans 우선 + Pretendard fallback + 시스템 폰트
  - 타입 스케일 재조정: body 15px / h1 32-36px / h2 22-24px / h3 17px / display fluid clamp(2.5rem, 5vw + 1rem, 3.5rem)
  - 트래킹: body -0.005em, headings -0.022em ~ -0.025em, display -0.03em
  - line-height: 1.6 body / 1.15 h1 / 1.25 h2
  - `font-variation-settings: 'wght' N` 적용 (variable font 활용)
  - 새 클래스 `.display-hero`, `.display-2` (Hero 큰 타이틀용)

### 2. 컬러 — Modern Monochrome (zinc + sapphire)
- **Light**: `--bg-base #fafafa` (zinc-50) / `--accent #2563eb` (blue-600 sapphire) / text zinc-900
- **Dark**: `--bg-base #0a0a0a` (near-black) / `--bg-surface #161618` / `--accent #60a5fa` (blue-400)
- Border: zinc-200 light / zinc-800 dark — 따뜻한 forest 톤 폐기
- Status: green-600 / amber-600 / red-600 / sky-500 (info — 액센트와 hue 분리)
- 새 토큰: `--accent-ring` (포커스 ring 전용 RGB tint), `--ease-out`/`--duration-{fast,base,slow}`
- 셀렉션·focus shadow의 RGB 값까지 전부 sapphire로 정렬

### 3. Tailwind 클래스 일괄 마이그레이션
- 48개 .tsx 파일 sed:
  - `\bemerald-\([0-9]\+\)` → `blue-\1`
  - `\bstone-\([0-9]\+\)` → `zinc-\1`
- 하드코딩 헥사 sed (Phase 29 잔재 8종 → zinc tokens):
  - `#0f1411` → `#0a0a0a` (dark bg)
  - `#161b18` → `#161618` (dark surface)
  - `#1d2320` → `#1f1f23` (dark elevated)
  - `#2a322d` → `#27272a` (dark border)
  - `#fafaf9` → `#fafafa` (light bg)
  - `#1c1917` → `#18181b` (light text)
  - 기타 `#1a1f1c`/`#3a443d`도 통일
- 차트 컴포넌트 하드코딩 sage 헥사 → sapphire 팔레트로 재작성:
  - `ScoreGauge` band color (35/50/65/80 임계): muted/amber/blue-300/blue-500/blue-700 (light)
  - `DiagnoseRadar` accent / grid / axisText
- `manifest.ts` `theme_color` `#047857` → `#0a0a0a`
- `layout.tsx` viewport themeColor light `#ffffff` → `#fafafa`, dark `#0f172a` → `#0a0a0a`

### 4. 인터랙티브 상태 조화 — 모든 primitives 통일
**`globals.css`에서 일괄 정의:**
- 모든 transition: `var(--duration-fast/base/slow) var(--ease-out)` (cubic-bezier(0.22, 1, 0.36, 1))
- `.btn-primary` hover: `accent-hover` (blue-700 light / blue-300 dark) + shadow elevation
- `.btn-primary` active: shadow 제거 + translateY(1px)
- `.btn-secondary` hover: bg-elevated + border-strong / active: bg-border (강한 piano feel)
- `.btn-ghost` hover: bg-elevated + text-primary / active: bg-border-subtle
- `.btn-base:focus-visible` 통일된 ring: `0 0 0 3px var(--accent-ring)` (light: rgba(37,99,235,0.18) / dark: rgba(96,165,250,0.30))
- `.input-base:hover:not(:focus)`: border-strong (피드백 추가)
- `.input-base:focus`: border-accent + ring-3px
- `.card:hover`: shadow-md + border-strong (기존엔 shadow만)
- `.kpi-card:hover`: border-strong 추가
- 새 `.link` 클래스: 호버 시 underline + offset 3px + thickness 1px

### 5. 잔여 정리
- `/login` 페이지 그라디언트 `from-emerald → from-blue-500 to-amber-600` (Phase 29 sed 부산물) → `from-blue-500 to-blue-700`로 일관성 회복
- Navbar / MobileBottomNav active state는 이미 sed로 blue 적용됨 — 변경 없음

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린
- 빌드 캐시에 잔존 emerald/stone 없음 확인

### 후속 권장
- `slate-XXX` 잔존 클래스도 `zinc-XXX`로 마이그레이션하면 톤이 더 통일됨 (현재도 큰 충돌은 없음)
- 모바일 viewport에서 Wanted Sans Variable의 한국어 메트릭이 너무 가벼울 수 있어 body weight 425 정도로 시도 가능

---

## 2026-05-08 — Phase 29: Sage & Charcoal 리브랜드 + 데이터 시각화 + 로그인 안내

**배경**: 사용자 피드백 — (1) 메인 컬러 주황이 별로다, 세련된 톤 + 다크모드 눈 편함 원함. (2) 인기검색어·진단 결과가 표·숫자만이라 분석하기 어렵다, 그래프/시각화 필요. (3) 로그인이 필요한 기능을 사전에 안내해주기. `frontend-design` 스킬 로드 후 3개 컬러 팔레트 / 3개 시각화 라이브러리 / 3개 로그인 안내 방식 옵션 제시 → A. Sage & Charcoal + Recharts + 🔒 인라인 배지 합의.

### 1. 컬러 시스템 — Sage & Charcoal (`globals.css` 토큰 재정의)
- **Light**: `--bg-base #fafaf9` (stone-50, 따뜻한 화이트) / `--accent #047857` (emerald-700, 깊은 세이지 그린) / text stone-900
- **Dark**: `--bg-base #0f1411` (숲 향 도는 차콜, 순흑 X — 장시간 작업 눈 편함) / surface `#161b18` / `--accent #6ee7b7` (emerald-300, 부드러운 민트, 글레어 ↓)
- **Status**: success=green-600 (액센트와 구분), warning=amber-600, danger=red-600, info=sky-600
- **Border**: warm forest tint(`#2a322d`) — 다크에서 차가운 zinc 대신 따뜻한 톤
- 포커스 ring·셀렉션·input shadow의 RGB 값까지 emerald로 갱신
- Tailwind 클래스 일괄 마이그레이션: 43개 .tsx 파일 `orange-XXX` → `emerald-XXX` (sed `\borange-\([0-9]\+\)` → `emerald-\1`)
- `manifest.ts` PWA `theme_color` `#f97316` → `#047857`

### 2. 데이터 시각화 — Recharts + 자체 SVG 컴포넌트
- `npm install recharts@^3.8.1` (React 19 호환 확인)
- **`app/components/charts/`**:
  - `DiagnoseRadar.tsx` — 활동성·노출·품질 3축 레이더. MutationObserver로 다크모드 자동 감지, 토큰 색상 스왑.
  - `ScoreGauge.tsx` — 점수 0~100 SVG 반원 게이지(`half=true` 기본) + 풀 도넛 모드. 점수 구간별 색 미세 조정 (35/50/65/80 임계). `<ScoreMiniBar/>` 보조 export.
  - `HorizontalBarList.tsx` — 키워드 검색량 비교 가로 막대. max 정규화 + 클릭 시 키워드 분석 점프.
- **연결 위치**:
  - `/blog-diagnose` 결과: 총점 카운트만 → 게이지 + 3축 레이더 + 미니바 3분할의 그리드 레이아웃.
  - 대시보드 `LatestDiagnoseCard`: 큰 숫자만 → mini 게이지 + ScoreMiniBar 3개로 전환.
  - `/trending`: 표 위에 "TOP 10 한눈에" 가로 막대 카드 추가 (표는 보존 — 풀 데이터 + 비교 시각 한눈에 두 마리).

### 3. 로그인 안내 — 비차단적 패턴
- **`app/components/auth/`**:
  - `LoginRequiredBadge.tsx` — 🔒 작은 칩, 호버 툴팁("구글 계정으로 1초 로그인"), 클릭 시 `/login?next=현재경로` redirect.
  - `EmptyStateLogin.tsx` — 빈 상태 카드. 큰 자물쇠 + 제목 + 설명 + [구글 로그인] CTA. dashed border + emerald soft ring.
- **적용 위치**:
  - 홈 anon hero — 핵심 도구 4종 카드의 "AI 글쓰기"에 `authNote` 필드 + 🔒 작은 안내 ("비로그인 1회/일 · 로그인 5회/일")
  - `SavedKeywordsCard` — 비로그인 사용자에게 EmptyStateLogin 카드 ("로그인하면 즐겨찾기 키워드를 저장할 수 있어요")로 분기. State machine: `loading | anon | empty | list`.

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린
- TypeScript 통과
- 한 번 JSX 파싱 에러 (트렌딩 페이지에서 중첩 `{}` 위치 실수) → 수정 후 통과

### 후속 권장
- 진단 점수 추적 그래프 (시간순 sparkline) — 진단 이력이 누적되면 `LatestDiagnoseCard` 안에 작은 라인 차트 추가 가능
- 키워드 분석 결과 표에 검색량 가로 막대 추가 (HorizontalBarList 재사용)
- 커뮤니티 작성 페이지에 사전 LoginRequiredBadge 노출 (현재는 RLS 차단 후 에러)
- `slate-XXX` Tailwind 클래스도 stone으로 마이그레이션 (선택 — 현재도 가독성 OK)

---

## 2026-05-07 — Phase 28: 데일리 대시보드 홈 + 진단 결과 영구 저장

**배경**: Phase 27(SaaS Analytics 톤)은 깔끔하지만 정적 랜딩이라 한 번 둘러보고 글 쓰면 끝나는 구조였음. 사용자가 "마케팅 전 대대적인 개편 — 누구나 쉽게 쓰고 오래 체류할 수 있게" 요청. 5축 전략(데일리 대시보드 / 스튜디오 워크스페이스 / 진단 추적 / 도구↔커뮤니티 / 모바일) 중 ROI가 가장 높은 ① 데일리 대시보드를 첫 phase로 선택. 진단 결과가 누적되어야 변동(delta)을 보여줄 수 있어 ③ 일부(저장 + 최근 1건 조회)도 함께 포함.

### 결정
- 홈 = 정적 랜딩 → **들어오자마자 가치 있는 작업대**.
- 비로그인 / 로그인 분기 (useUser).
- 진단 결과는 로그인 사용자에 한해 DB 저장 (RLS로 본인만 SELECT/INSERT, 24h 20건 cap).
- 트렌딩 키워드는 `profile.category`로 자동 카테고리 매핑 (커뮤니티 분야 → 네이버 트렌딩 분야).

### 1. 데이터 — 마이그레이션 0011 (`supabase/migrations/0011_diagnose_results.sql`)
- 컬럼: `id / user_id / blog_id / blog_title / category / category_label / total_score / activity_score / visibility_score / quality_score / band / posts_last_30d / hit_count / top_ten_count / insights jsonb / created_at`
- 인덱스 2개: `(user_id, created_at desc)` 최근 결과 조회 / `(user_id, blog_id, created_at desc)` 같은 블로그 추적
- RLS:
  - SELECT/DELETE: 본인 row만
  - INSERT: 본인 + 24h 20건 sub-select rate-limit
- band CHECK: top5/top15/top35/mid/growing

### 2. API (`app/api/blog-diagnose/route.ts`)
- POST 엔드포인트 끝에 **로그인 사용자 자동 저장** 블록 추가. 저장 실패는 swallow → 진단 응답 자체는 항상 정상 반환.
- 새 GET 엔드포인트: 본인 최근 진단 2건 fetch → `{ latest, previous, delta }` 반환. 비로그인·미저장이면 `{ latest: null }`.
- 환경변수 미설정 가드(`isSupabaseConfigured()`로 wrap).

### 3. 클라이언트 헬퍼 (`app/lib/dashboard/types.ts`)
- `TrendingItem`, `DiagnoseLatest`, `DiagnoseLatestResponse`, `BAND_LABEL` 타입 일괄 export.
- `COMMUNITY_TO_TRENDING_CATEGORY` — `food-travel → 여행`, `info-howto → IT/기술` 등 8개 분야 매핑 (profile.category가 트렌딩 API 카테고리와 다른 enum이라 변환 필요).

### 4. 대시보드 위젯 3종 (`app/components/dashboard/`)
- **`TrendingTicker.tsx`** — 가로 스크롤 칩. `/api/trending-keywords?category=...&period=daily&limit=12` fetch. 클릭 시 `/keyword-analysis?keyword=...`로 직행. 로딩 스켈레톤 + 에러 핸들링 + 빈 상태.
- **`LatestDiagnoseCard.tsx`** — 점수 + delta(↑↓) + band 배지 + 활동성/노출/품질 미니 미터 3분할. 진단 이력 없으면 "내 블로그는 어디쯤일까요?" 빈 상태 카드(orange ring + emphasis).
- **`SavedKeywordsCard.tsx`** — `profiles.saved_keywords` 칩 그리드. 클릭 시 키워드 분석. 비어 있으면 "키워드 분석으로 가기" CTA.

### 5. 홈 (`app/page.tsx`) — 전면 재작성
- 분기: `userLoading → HeroSkeleton`, `user → LoggedInHero`, 그 외 `AnonHero`.
- **AnonHero**: 기존 Phase 27 hero(검색창 + 진단 CTA + 3분 미니) 그대로.
- **LoggedInHero**:
  - "{닉네임}님, 오늘도 데이터로 시작해볼까요?" 인사 + M월 D일 라벨
  - 그리드: `LatestDiagnoseCard` (lg:col-span-2) + `SavedKeywordsCard` (lg:col-span-1)
  - 분야 미등록 안내 1줄
- 공통: `TrendingTicker` (로그인 시 내 분야, 비로그인 시 전체) + 도구 4종 + 워크플로우 + FAQ + 클로징 CTA.

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린, TypeScript 통과.
- 마이그레이션 0011은 운영 DB에 별도 적용 필요 (Supabase SQL Editor).

### 후속
- **다음 phase 후보**: 진단 점수 추적 그래프(③ 나머지) / Streak·일일 미션(④) / 스튜디오 워크스페이스(②). 모바일 데일리 위젯(⑤)은 PWA 위젯 API 검토 필요.
- 운영 DB 마이그레이션 0011 적용 전까지는 진단 저장이 무시(swallow)되므로 GET은 `{ latest: null }` 반환 → 대시보드는 빈 상태 카드 자동 노출.

### 2026-05-07 (후속) — README/CLAUDE 동기화 + main 머지
- README: Daily Dashboard / Blog Diagnose 기능 섹션 추가, 마이그레이션 목록 0008~0011 보강, DB 카운트 8 → 10, 대시보드 위젯 명시.
- CLAUDE.md: 홈 대시보드 워크플로우 1줄, `app/components/dashboard/` · `app/lib/dashboard/` 디렉토리 등재, 마이그레이션 표 0008~0011, 데스크톱 navbar에 "블로그 진단" 첫 항목, 대시보드 위젯 재사용 힌트, 0011 미적용 시 디버깅 가이드 추가.
- `claude/redesign-ui-strategy-XU6AV` → main fast-forward 머지 + push 완료. Vercel 자동 배포.

---

## 2026-05-07 — Phase 27: Modern SaaS Analytics 재설계 (매거진 톤 폐기)

**배경**: Phase 23(매거진 에디토리얼)이 분석 사이트의 기능과 안 맞는다는 사용자 피드백. 매거진 톤은 "한 번 읽고 가는" 콘텐츠 사이트용이고, 본 프로젝트는 "매번 데이터를 보고 행동하는" 분석·작업 도구라 데이터가 주인공이 되어야 한다는 진단. 사용자가 4개 옵션 중 ① Modern SaaS Analytics (Linear/Vercel/Stripe 계열)를 선택해 전면 교체.

### 핵심 결정
- **타입**: Pretendard 단일 (디스플레이 세리프 IBM Plex Serif + Noto Serif KR 제거)
- **컬러**: 흰 종이 → 순백/zinc-950 dark, 잉크 → zinc-950, 주황 액센트 유지, 차트용 status 4종 추가
- **카드**: 8px radius + 1px hairline + shadow-xs (rgba(0,0,0,0.04))
- **장식**: 마스트헤드·이탤릭·풀쿼트·§ 마크·종이 노이즈·드롭 캡 모두 폐기

### 변경 요약
**`app/globals.css` 전면 재작성**
- 토큰 재정의: `--bg-base` zinc-50 / `--bg-surface` 흰색 / `--text-primary` zinc-950 / `--border` zinc-200
- 다크 모드: `--bg-base` zinc-950 / `--bg-surface` zinc-900 / 텍스트 zinc-50 → zinc-400 (WCAG AA 준수)
- 새 유틸리티: `.kpi-card`/`.kpi-label`/`.kpi-value`/`.kpi-delta(positive/negative/neutral)`, `.panel`/`.panel-header`/`.panel-body`, `.pill-{success,warning,danger,info,accent,neutral}`, `.tabular`
- Phase 23 잔재 호환 별칭: `.ed-eyebrow` / `.ed-display` / `.ed-byline` / `.ed-rule` / `.ed-ornament` / `.ed-dropcap` 모두 SaaS 톤으로 자동 매핑 (italic·ornament 라인 제거, plain uppercase 라벨로 변경)
- `.text-ink*` / `.bg-paper*` / `.border-rule*` 별칭 유지로 미수정 페이지도 자연스럽게 SaaS 톤
- @theme의 slate→베이지 매핑 모두 제거 → Tailwind 기본 cool slate 복귀
- body의 종이 grain SVG 배경 제거

**`app/layout.tsx`**
- IBM Plex Serif + Noto Serif KR 로드 제거. Pretendard 단일.

**공통 컴포넌트**
- `PageHeader`: hairline rule·italic·세리프 모두 제거 → pill 라벨 + sans-serif H1 + 회색 subtitle
- `Navbar`: italic serif 워드마크 → 8px 라운드 오렌지 박스 + Pretendard "Boheme​BlogLab"; active 상태를 underline → orange-50 soft 배경(`bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300`); 드롭다운 패널은 모서리 둥근 흰색 카드 + shadow-lg
- `Footer`: 매거진 Colophon 제거, 표준 3-col SaaS 푸터 (소개/도구/문의)
- `MobileBottomNav`: 상단 2px 룰 인디케이터 제거, 액센트는 텍스트 색만

**`app/page.tsx` 전면 재작성**
- 매거진 마스트헤드·italic 헤드라인·풀쿼트·§ 마크 모두 제거
- 새 구조:
  1. Hero — 짧은 타이틀 + 검색 input(쇼우 + 액센트 보더) + 2차 CTA(블로그 진단 / 3분 미니)
  2. 핵심 도구 4개 KPI 스타일 카드 (Diagnose 강조, ring 효과)
  3. 8단계 워크플로우 4-col 그리드 (큰 번호 + 짧은 라벨)
  4. FAQ — 둥근 카드 안 details 리스트
  5. 클로징 CTA — 흰 배경 + 두 버튼

**도구·콘텐츠 페이지 일괄 정리**
- `/blog-diagnose`, `/start`, `/lab`, `/lab/[slug]`, `/community` 마스트헤드 + italic 잔재 sed 일괄 제거
- 거대 디스플레이 헤드라인 다운: `text-[5rem]`→`text-3xl sm:text-4xl`, `text-[7rem]`(총점)→`text-6xl`, `text-[2.5rem]`→`text-2xl sm:text-3xl`

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린
- 회귀 위험: 페이지마다 `text-ink-*`/`bg-paper*`/`border-rule*` 사용분이 호환 별칭으로 자동 매핑되어 깨짐 없음

### 후속 권장
- `.ed-*` 호환 별칭은 매거진 → SaaS 이행기 호환용. 다음 phase에서 페이지별로 `text-slate-900`/`text-slate-600` 같은 표준 Tailwind 클래스로 점진 이주 권장
- 진단 결과 페이지(`/blog-diagnose`)의 점수 표시를 KPI 카드(`.kpi-card`/`.kpi-value`)로 정밀 정돈하면 차이 더 큼
- 차트 라이브러리(예: Tremor) 도입 검토 — 진단 결과의 3축 점수를 막대/링 차트로 표현하면 SaaS 분석 도구 톤이 완성됨

---

## 2026-05-07 — Phase 26.1: 메뉴 재정리 (내 블로그 폐기 + 블로그 진단 우선)

**배경**: Phase 25 직후 사용자 피드백 — "내 블로그" 드롭다운은 진단 기능을 한 단계 더 숨기는 효과만 있었고, 즐겨찾기 키워드는 본질적으로 프로필 영역. 두 항목을 분리해 더 직관적으로 정리.

### 변경
**`app/components/Navbar.tsx`**
- `MYBLOG_MENU` 상수 + 관련 state(`myblogOpen`)·ref(`myblogRef`)·timer 전부 제거
- 데스크톱 드롭다운 JSX 제거, 모바일 메뉴 "내 블로그" 섹션 제거
- `CORE_TOOLS` 첫 항목으로 `/blog-diagnose` (라벨 "블로그 진단") 추가 → 데스크톱 평면 메뉴 맨 앞에 노출
- 모바일 메뉴: WORKFLOW 그룹 위에 "분석" 단일 그룹 신설 (블로그 진단 링크 1개)

**`app/profile/setup/page.tsx`**
- 마운트 시 `profiles.saved_keywords` 로드 (프로필 페치와 같은 effect 안)
- 폼 아래 "즐겨찾기 키워드" 섹션 추가:
  - 칩 그리드 (각 칩 = `Link to /keyword-analysis?keyword=X` + 우측 × 삭제)
  - 빈 상태 CTA → 키워드 분석으로 가기
  - `removeSavedKeyword`는 optimistic update + 실패 시 롤백
- N/10 카운터 표시

### 데이터 모델
변경 없음. `profiles.saved_keywords text[]` 기존 컬럼 그대로 사용. 키워드 추가는 여전히 키워드 분석 페이지에서 (발견 위치에서 즐겨찾기), 프로필은 중앙 보기 + 삭제 위치.

### 검증
- `IP_HASH_SALT=… npm run build` → 클린
- 모바일 메뉴 4그룹 (분석 / 키워드 리서치 / 글쓰기 / 이미지) → 5그룹 (커뮤니티) → 연구실
- `/blog-diagnose`는 데스크톱·모바일 모두 1순위 진입점

### UX 방향성 후속 (별도 phase 예정)
사용자가 매거진 톤(Phase 23)이 분석 사이트와 안 맞는다고 피드백. 다음 응답에서 SaaS·핀테크·노션 계열 3개 방향 제시 후 합의 → Phase 27 재설계.

---

## 2026-05-07 — Phase 25: 블로그 진단 MVP (카테고리 상위 % + 약점 분석)

**배경**: 사용자 요청 — 특정 네이버 블로그가 메인 카테고리 안에서 상위 몇 %인지 진단하고 약점을 알려주는 도구. Phase 24의 retention 감사에서 식별된 "재방문 동기 강화" 후속 작업과 결이 같음. 한 달에 한 번 자기 위치를 점검하는 용도로 회귀 자연스러움.

### 요구사항 명확화 (AskUserQuestion 합의)
- **MVP 범위**: ② 표준 — 4축 중 3축 (Activity / Visibility / Quality, 댓글·공감 D축 제외)
- **메뉴 위치**: ① "내 블로그" 새 메뉴 신설 (Navbar 평면 노출)
- 동기 단일 호출, 진단 이력 미저장, 카테고리 시드 30개 (다음 phase에서 100개·캐시 확장 예정)

### 1. 점수 라이브러리 (`app/lib/diagnose/`)
- **`category-seeds.ts`** — 8개 카테고리 × 30개 키워드 시드 사전.
  - food-travel / lifestyle / info-howto / review / culture / health-fitness / parenting / fashion-beauty
  - 키워드 분포: 헤드(검색량 1만+) 5개 + 미드(1천~1만) 15개 + 롱테일 10개로 균형
- **`naver-blog.ts`** — 외부 데이터 헬퍼.
  - `extractBlogId()` — URL/PostList.naver?blogId=foo/bare ID 모두 인식
  - `fetchRss()` — `https://rss.blog.naver.com/{id}.xml` 정규식 미니 파서로 제목·링크·발행일·카테고리·본문 일부·이미지 개수 추출. CDATA 처리.
  - `searchBlogByQuery()` — 기존 NAVER OpenAPI 활용
  - `findRankInResults()` — 검색 결과 중 특정 blogId의 1-based 순위
  - `fetchWithRetry` 활용 (500ms backoff, 10s timeout, 2 retry)
- **`scoring.ts`** — 점수 산출 엔진.
  - `scoreActivity()` — 30일 발행수(40%) + 마지막 발행 활성도(40%) + 발행 간격 CV(20%)
  - `scoreVisibility()` — 진입율(50%) + 상위 10위 비율(30%) + 평균 순위 보너스(20%)
  - `scoreQuality()` — 글자수(40%) + 이미지(20%) + 카테고리 일관성(40%)
  - `compose()` — 가중평균(A 25% / B 50% / C 25%) → 총점 0~100 + band(top5/top15/top35/mid/growing) + 한국어 인사이트 자동 생성 6개

### 2. API (`app/api/blog-diagnose/route.ts`)
- POST: `{ blogInput, category }` → 정규화 → RSS fetch → 30개 키워드 검색(동시성 5, 120ms gap) → 점수 산출 → 응답
- Vercel `maxDuration=60`, 실측 ~30~50초. 운영 단계에서 여유 있는 편.
- 일부 검색 실패 시 graceful degradation (실패 개수 warnings에 명시)
- RSS 못 받으면 활동성·품질 0점 + 노출 점수만 사용하도록 안내

### 3. UI (`app/blog-diagnose/page.tsx`)
단일 페이지 4-state machine (input → running → result → error). 매거진 톤 일관:
- **input**: hairline-bottom 큰 입력 + 8셀 카테고리 그리드 + 측정 한계 안내
- **running**: 회전 progress beat 5개 + 체크리스트 시각 (`/start`와 동일 패턴)
- **result**: 거대 디스플레이 총점(7rem) + band 라벨 + 3축 점수 카드 (1px 분리 그리드) + 인사이트 ordered list + 전체 키워드 진입 표 (한 화면에 30개) + 측정 한계 + 다음 액션 2개 (약한 키워드로 글쓰기 / 다른 블로그 진단)
- **error**: 다시 시도 / 홈 복귀

### 4. 네비게이션
- **Navbar**: "내 블로그 ▼" 신설 (Community와 연구실 사이). 드롭다운에 블로그 진단 + 즐겨찾기 키워드.
- **Mobile menu**: 같은 그룹 평면 노출.
- **홈 배너**: 기존 "처음 오셨나요" 단독 배너를 1px hairline 2-cell 그리드로 변경. 우측에 "이미 운영 중이세요 — 내 블로그는 카테고리 상위 몇 %일까요?" 신규 셀, /blog-diagnose 진입점.

### 측정 한계 (UI에 명시)
- 네이버는 일일 방문자·블로그 지수 비공개 → 공개 데이터로 합리적 추정만 가능
- RSS 본문은 잘려 있어 글자수가 보수적 (실제는 더 길 수 있음)
- "상위 N%"는 진짜 백분위가 아닌 점수→밴드 매핑 (Phase 26에서 카테고리 베이스라인 분포 캐시 도입 예정)
- 진단 이력 미저장 (이번 phase 범위 외)

### 검증
- `IP_HASH_SALT=… npm run build` → 43 페이지 클린 (`/blog-diagnose` static, `/api/blog-diagnose` dynamic)
- 회귀 위험: 기존 라우트·API 무영향, Navbar 추가만 발생

### 다음 단계 후보
- **Phase 26**: 카테고리 베이스라인 분포 캐시 (`category_baselines` 테이블) → 진짜 percentile 산출. 진단 이력(`diagnoses` 테이블) 추가 → "한 달 전 대비 +12점" 비교.
- **Phase 27**: 시드 키워드 30 → 100개 확장 + 키워드별 검색량 가중치 (검색량 큰 키워드 진입은 가산점).
- **Phase 28**: 진단 결과를 커뮤니티 정보공유에 한 번에 공유하는 동선 (proof of work + 자연스러운 유입).
- **Phase 29**: D축 참여도 — 댓글·공감 스크래핑. 단 DOM 변경 위험 있어 별도 토글로.

---

## 2026-05-07 — Phase 24: 3분 Quick Start 미니 플로우 (첫 방문 온보딩)

**배경**: Phase 23(매거진 리디자인) 후속 사용성 감사에서 가장 높은 우선순위로 식별된 마찰점. 첫 방문자가 8단계 워크플로우를 한꺼번에 마주하면 "어디서 시작해야 할지" 모름. 평행 트랙으로 미니 시작 경로 도입 (8단계는 정밀 모드로 그대로 유지).

### 신규: `/start` 페이지 (단일 페이지 상태 머신)
3단계 시각 + generating + result + error:
1. **키워드** — 자동 포커스 큰 입력 + 6개 추천 키워드 칩(수원 맛집 추천 / 재택근무 노하우 / 강아지 산책 / 캠핑 초보 / 다이어트 식단 / 책 추천 2026)
2. **분야 + 어투** — 분야 6개 단순 버킷(맛집·여행 / 일상 / 정보·노하우 / 제품 리뷰 / 책·문화 / 건강) + 어투 2개(해요체 / 합니다체) + 사용량 안내
3. **AI 생성** — 회전 progress beat 5개 (주제 정리 → 제목 → 도입부 → 전개 → 마무리) + 체크리스트 시각
4. **결과** — 본문 800자 미리보기 + 에디터로 보내기 / 다시 / 8단계 정밀 모드 분기
5. **에러 폴백** — 다시 시도 / 홈 복귀

### `/api/ai-draft` 옵션 단축 모드 활용
Phase 22에서 추가한 `options` 파라미터를 `titleMode='single' / length='compact' / imagePrompts:false / sources:false / selfReview:false`로 호출 → 응답 약 25~40초로 줄어듦 (정밀 모드 30~60초 대비). 첫 경험의 체감 속도가 핵심.

### 홈 변경
- Hero 바로 아래 "처음 오셨나요?" 배너 섹션 신설
- 좌측: ed-eyebrow + 디스플레이 헤드라인 "3분이면 첫 글 1편이 완성됩니다"
- 우측: 큰 ink CTA 버튼 → `/start` + "회원가입 없이 무료 1회 · 로그인 시 5회/일" 명시
- 기존 8단계 Feature 섹션은 그 아래로 자연스럽게 이어짐

### 매거진 톤 일관성 유지
모든 단계가 Phase 23 토큰만 사용 — 박스/그림자/외부 색 없음. 키워드 칩은 hairline border, 카테고리 그리드는 1px 분리 hairline grid, 선택 시 ink-on-paper, 결과는 박스 없는 본문 매거진 형식.

### 검증
- `IP_HASH_SALT=… npm run build` → 42 페이지 클린 (`/start` 정적 prerender)
- `tsc --noEmit` 클린

### 후속 권장
- 이번 phase는 사용성 감사의 ① 항목만 처리. 나머지 ②(작업 캐싱) ③(개인화 홈) ④(모바일 다듬음)은 별도 phase 후보.
- `/start` 사용 후 "다른 키워드로 다시" 누른 사용자에게 "이번엔 8단계 정밀 모드도 시도해 보세요" 작은 안내 추가 검토.
- A/B: 홈 Hero 자체에 quick-start CTA를 합칠지, 별도 배너로 둘지 사용 데이터 보고 결정.

---

## 2026-05-07 — Phase 23: Editorial Magazine 리디자인 (전 사이트)

**배경**: 사용자 요청 — anthropic/frontend-design 스킬 설치 후 사이트 전체 UI 개선. SKILL.md의 Design Thinking 4단계(Purpose/Tone/Constraints/Differentiation)를 본 프로젝트에 적용해 합의:
- **Purpose**: 한국 블로거 워크플로우 + 커뮤니티 도구 (효율성 우선)
- **Tone**: 한국 매거진 에디토리얼 — Plex Serif/Noto Serif KR 헤드라인 + Pretendard 본문 + 따뜻한 베이지 종이 + 잉크 검정 + 주황 액센트
- **Constraints**: Next.js 16 / Tailwind v4 / 한국어 / PWA / 기존 RLS·로직·라우팅 보존
- **Differentiation**: 매거진의 정성스러운 톤 → generic SaaS 프레임 깨기

### Step 0: 스킬 설치
- `.claude/skills/frontend-design/SKILL.md`+`LICENSE.txt` (anthropics/skills@main 4.4KB) 벤더 등록
- 본 프로젝트의 미래 세션이 자동 참조하도록 commit

### Step 1: 디자인 토큰 + 매거진 폰트
**`app/globals.css` 전면 재작성**
- 따뜻한 종이 토큰: `--paper #faf7f2` / `--paper-deep #f3ede3` / `--ink #111` / `--ink-muted #4a443f` / `--rule` / `--rule-soft`
- Tailwind v4 `@theme inline`에서 `--color-slate-*` 11계 값을 따뜻한 톤으로 재정의 → 페이지마다 흩어진 `bg-slate-50` / `bg-slate-900` / `text-slate-700` 등이 자동으로 매거진 종이/잉크로 매핑됨 (페이지별 수정 0회)
- Body에 미세 SVG 노이즈 텍스처(220×220 dataURI) — 라이트/다크 변형
- 새 에디토리얼 유틸리티: `.ed-eyebrow` / `.ed-display` / `.ed-dropcap` / `.ed-rule` / `.ed-ornament` / `.ed-byline`
- 카드: 외곽선 1px hairline, 그림자 제거, radius 4px
- 입력: hairline-bottom 스타일, focus 시 잉크 보더
- 버튼 primary: ink-on-paper → 호버 시 orange-on-white (브루탈 + 정확)
- Selection: ink 배경 + paper 글자

**`app/layout.tsx`**
- Google Fonts에서 `IBM Plex Serif` (영문) + `Noto Serif KR` (한글) 헤드라인용 동시 로드
- Pretendard는 본문용 그대로 유지

### Step 2: Chrome (Header/Nav/Footer/Mobile)
- **PageHeader**: 상단 hairline + eyebrow 라벨 + 디스플레이 헤드라인 (2~3.25rem) + 본문 폰트 subtitle (max-w 58ch)
- **Navbar**: 그라디언트 로고 → 매거진 워드마크 (italic serif "Boheme" + small-caps "BlogLab"). active 상태: 솔리드 박스 → 2px 액센트 룰 (텍스트 톤만 ink)
- **Footer**: Colophon 마스트헤드 + ed-byline 섹션 라벨 + hairline 디바이더 (그림자 제거)
- **MobileBottomNav**: bg-paper + ink 톤 + 상단 2px 액센트 룰

### Step 3: 홈 매거진 표지
**`app/page.tsx` 전면 재작성** (463줄 → 232줄, gradient/blur 모두 제거)
- 마스트헤드 (Vol. 01 / 오늘 날짜 / 태그라인)
- Hero: 12-col 비대칭 그리드 — 좌측 5.5rem 디스플레이 헤드라인 / 우측 hairline-bottom 검색 + side note
- "Feature" 5단계 워크플로우 — 3/9 split + 매거진 2-column 그리드, italic 로마 숫자 (I. II. III.) 키커
- 풀쿼트 섹션 (인용부호 + Trending 배너)
- "여덟 개의 작업대" — 1px hairline 그리드로 8개 도구 인덱스
- 3-column 에디토리얼 ("§ 1/2/3" 마크 + 디스플레이 헤드)
- FAQ — 박스 제거, hairline 디바이더 + 디스플레이 질문체
- 닫는 CTA: ink 배경 + paper 텍스트 + italic 헤드라인 ("오늘 한 편을 시작하면 / 한 달 뒤에 서른 편이 쌓입니다")

### Step 4: 연구실(Lab) 매거진화
- **인덱스**: 마스트헤드 + 디스플레이 헤드라인 + 첫 글을 7/5 split의 "Cover Story"로 승격, 나머지는 3-col 인덱스 그리드 (top hairline + 16:9 + display headline + byline)
- **글 본문**: 새 에디토리얼 헤더 (eyebrow → display H1 → italic standfirst → byline rule), Tailwind prose 매핑 (display serif H2/H3, ink-muted 본문, orange strong, hairline hr), 하단 `— END —` ed-ornament + 목록 복귀 링크
- **PostImage 폴백**: blue→orange gradient → "№" 매거진 글리프 on paper-deep

### Step 5: 커뮤니티 허브
- 그라디언트 blob 카드 → 1px hairline 그리드 2-cell (paper hover)
- 큰 디스플레이 숫자(01/02) + 매칭/Companion 키커
- "커뮤니티 규칙" 3-column 에디토리얼 (§ 1/2/3 마크 — 홈 페이지와 톤 맞춤)

### Step 6: 도구 페이지
사용성 보호 우선 — 구조·레이아웃·폼 위치 무변경. 토큰 자동 매핑으로 다음이 자동 적용됨:
- `bg-slate-*` / `text-slate-*` → 따뜻한 종이/잉크
- `<h1>` / `<h2>` → 디스플레이 세리프 (globals.css 기본값)
- `.card` / `.btn-*` / `.input-base` → 에디토리얼 hairline 스타일

`image-tools`만 hardcoded blue-600/700/900 8곳을 sed로 orange-500/600/700 + ink 토큰으로 일괄 교체.

### 검증
- `IP_HASH_SALT=… npm run build` → 41 페이지 클린 (Step별 확인 5회)
- `tsc --noEmit` 클린

### 커밋 시퀀스 (main에 7커밋 push)
```
635574b chore: install anthropic frontend-design skill
6864c3e Phase 23 Step 1: editorial design tokens + magazine display fonts
d9e6f5c Phase 23 Step 2: editorial chrome
6fce2b7 Phase 23 Step 3: home page — Korean magazine cover
f99ce51 Phase 23 Step 4: lab as a magazine
8fa586e Phase 23 Step 5: community hub editorial
d6b80f8 Phase 23 Step 6: tool pages — drop hardcoded blue
```

### 후속 권장
- 모바일 헤드라인 폰트 사이즈 점검 (디스플레이 5.5rem이 작은 화면에 압도적일 수 있음)
- 도구 페이지의 inline `<h1 className="text-2xl font-bold ...">`를 PageHeader 컴포넌트로 점진 마이그레이션 — 헤더 룰·아이브로우 통일감
- prose 스타일이 적용되지 않는 외부 HTML 포스트(`public/posts/*.html`)는 인라인 `<style>` 그대로 유지됨 — 매거진 톤과 약간 거리감, 차후 재작성 검토
- 추가 디테일: 디스플레이 글자에 `font-feature-settings: "lnum"` 적용해 숫자 라이닝 figure 통일

---

## 2026-05-05 — Phase 22.1: 작은 UX 다듬기 + main 머지

Phase 22 직후 사용자 피드백 두 건을 즉시 반영하고, 그동안 누적된 4개 커밋(Phase 21, Phase 22, STEP fix, 뉴스 라벨 정리)을 main에 fast-forward 머지.

### 1. AI 글쓰기 PageHeader STEP 배지 제거
- `app/ai-writer/page.tsx`의 `step={5} totalSteps={8}` prop 삭제.
- 상단 메뉴(도구 ▼ → AI 글쓰기)로 직접 진입 시 워크플로우 번호가 의미 없어 어색했던 부분 해소.
- Phase 16.2의 Navbar STEP 배지 제거와 같은 맥락.

### 2. "트렌드 반영" → "관련 뉴스/뉴스 보기" 일괄 정리
실제 기능은 키워드 관련 뉴스를 AI 프롬프트에 함께 전달하는 것인데, "트렌드 반영"이라는 라벨이 추상적이어서 직관성이 떨어짐.

| 위치 | 이전 | 이후 |
|---|---|---|
| keyword-analysis 표 컬럼 | 트렌드 | **관련 뉴스** |
| keyword-analysis 표 버튼 | 📰 트렌드 반영 | **📰 뉴스 보기** |
| 첫 행 NEW 펄스 뱃지 | 표시 | **제거** (Phase 19에서 추가, 더 이상 NEW 아님) |
| 안내 배너 제목 | [NEW] 트렌드 반영 글쓰기 | **관련 뉴스를 함께 넣어 글 퀄리티 ↑** |
| prompt-generator 빈 상태 카드 | "트렌드 반영을 시도해보세요" | **"관련 뉴스를 함께 넣어보세요"** |
| prompt-generator 뉴스 로드 라벨 | 참고 뉴스 컨텍스트 | **가져온 관련 뉴스** |
| 홈 1.5단계 카드 | 📰 트렌드를 더합니다 | **📰 관련 뉴스를 함께 넣습니다** |

기능(키워드 → 뉴스 모달 → 프롬프트 생성기 → 본문 자연 반영)은 그대로, 라벨만 실제 동작 기준으로 정리.

### 머지 결과
- `claude/enhance-prompt-generation-tOJyY` → `main` fast-forward (`80d3802..ea09897`).
- 포함 커밋: Phase 21(프롬프트 정밀화·뉴스 본문 강화·연구실 5편) / Phase 22(AI 글쓰기 6단계 통합·구조 결과 카드) / STEP 배지 제거 / 뉴스 라벨 정리.
- Vercel 자동 배포 트리거.

---

## 2026-05-05 — Phase 22: AI 글쓰기 6단계 통합 워크플로우 + 구조화 결과 화면

**배경**: 사용자 요청 — Boheme BlogLab 자체 가이드(5단계, 해요체)와 Gemini Gems 가이드(6단계, 평서체, 정보 수집·이미지 프롬프트 강조)를 결합해 네이버 블로그 홈판 노출에 최적화된 통합 워크플로우를 AI 글쓰기 결과 화면에 표시.

### 1. API route 통합 시스템 프롬프트
**`app/api/ai-draft/route.ts`** 전체 재구성:
- `buildSystemPrompt(opts: DraftOptions)` 함수로 옵션에 따라 동적으로 6단계 프롬프트 생성.
- 출력 마크다운을 `## 1. 참고 출처`, `## 2. 제목 후보`, `## 3. 본문`, `## 4. 해시태그`, `## 5. 이미지 프롬프트`, `## 6. 자체 검토` 헤더 구조로 강제.
- 6단계 통합:
  1. 사실 검증 (내부)
  2. 제목 1개 또는 20개 (SEO 5 + 후킹 5 + 손해회피 5 + 숫자형 5)
  3. 소제목 ▣ 5/6/7개
  4. 본문 (해요체 또는 평서체 + 분량 옵션)
  5. 해시태그 30개 + 추천 10개
  6. 이미지 프롬프트 (영문, 소제목별, Photorealistic+8k+cinematic, 인물은 East Asian/Korean, 정확 묘사 대상은 accurate likeness 명시)
- 자체 검토 결과를 `## 6` 섹션에 체크리스트(✓/✗)로 출력.
- `max_tokens` 동적 — multi 제목 모드는 6000, single은 4500 (20개 제목+이미지 프롬프트로 응답이 길어짐).

### 2. AI Writer 페이지 — 최적화 옵션 패널 + 섹션 결과 카드
**`app/ai-writer/page.tsx`** 전체 재작성:
- **최적화 옵션 패널** (collapsible, 기본 열림):
  - 문체 (해요체/평서체)
  - 글 분량 (짧고 정밀 1300~1700 / 표준 1700~2200)
  - 제목 후보 (베스트 1개 / 20개 후보)
  - 소제목 개수 (5/6/7)
  - 인물·제품 정확 묘사 대상 (텍스트 입력)
  - 이미지 프롬프트 / 참고 출처 / 자체 검토 토글
  - 옵션은 `localStorage`에 자동 저장·복원.
- **결과 화면 — 섹션별 카드**:
  1. 🔗 참고 출처 (선택 시)
  2. 📝 제목 후보 — 20개 모드면 라디오 카드 → 선택 시 본문 위에 H1으로 자동 적용
  3. 📄 본문 — HTML/마크다운/일반 3탭 + 공백 제외 글자수 표시 + 에디터로 보내기
  4. 🏷️ 해시태그
  5. 🎨 이미지 프롬프트 (mono, 한 번에 복붙 가능)
  6. ✅ 자체 검토 체크리스트
- 각 섹션마다 독립 복사 버튼.
- 파싱 실패 시 원본 마크다운 폴백 카드 표시.

### 3. 섹션 파서
- `String.split` 캡처 그룹 사용 (JS는 `\Z` lookahead 미지원).
- 정규식: `/^##\s*(\d)\.\s*[^\n]*\n?/m`.
- `extractTitleCandidates()` — 제목 마크다운에서 `1. ...` 형태 후보 자동 추출 (카테고리 부제목은 무시).

### 검증
- `IP_HASH_SALT=test-... npm run build` → 41 페이지 클린 통과.
- `tsc --noEmit` → 클린.

### 후속 권장
- multi 제목 모드는 토큰 사용이 커서 5회 한도가 빠르게 소진 — 옵션 변경 시 예상 토큰 안내 추가 검토.
- 자체 검토 ✗ 항목이 있으면 카드 색상으로 경고 표시(현재는 텍스트로만).
- 이미지 프롬프트 → 이미지 생성 도구 연동(별도 API 키 필요).

---

## 2026-05-05 — Phase 21: 프롬프트 생성 정밀화 + 뉴스 본문 반영 강화 + 연구실 5편 추가

**배경**: 사용자 피드백 3건 일괄 반영.
1. 프롬프트 생성기 입력 옵션이 너무 적어 네이버 블로그 최적화 글에 필요한 정보를 다 담지 못함.
2. "트렌드 반영(뉴스)" 활용 시 정작 작성된 글에 뉴스 흐름이 거의 안 녹아드는 문제.
3. 연구실 콘텐츠가 정체 — 기존과 안 겹치는 신규 토픽 필요.

### 1. 프롬프트 생성기 — 입력 필드 7종 추가
**양쪽 모드 노출 (1종)**
- **글의 목적** — 정보 가이드 / 후기·리뷰 / 추천·비교 / 모객·홍보 / 일상 공유 (5종 카드형). 결말과 CTA 톤이 자동으로 달라짐.

**고급 모드 — 새 "맞춤 정보" 박스 (6종)**
- **지역 정보** (text input) — 본문·해시태그에 자연스럽게 분산해 네이버 하이퍼로컬 노출 강화.
- **본문에 꼭 포함할 핵심 정보** (textarea) — 가격·시간·장소·연락처 등을 한 줄에 하나씩. 자체 검토 단계에서 누락 점검 항목으로 자동 추가.
- **이 글만의 차별화 포인트** (textarea) — 작가의 관점·이력·시각. 도입부와 결론에서 명확히 드러나도록 지침에 반영.
- **본문 구조** — 자유 / 짧게 3섹션 / 표준 5섹션 / 심층 7섹션. 3단계(본문) 지침의 소제목 개수가 동적으로 바뀜.
- **시기·시즌** — 무관/봄/여름/가을/겨울/연말연시/명절·연휴/학기/휴가철. 시즌 키워드 1섹션 + 해시태그 강제.
- **결말 CTA** — 댓글 유도/공감/이웃추가/시리즈/외부 링크. 결론 한 줄을 정확히 어떻게 닫을지 지정.

**구현 디테일**
- 7종 모두 Supabase `prompt_preset`에 저장 → 다음 방문 자동 복원.
- `resetForm()` 갱신.
- TS 타입 안전 (`'flexible' | 'compact' | 'standard' | 'deep'` 등).

### 2. 뉴스 컨텍스트 본문 반영 — 3중 강제
이전: 프롬프트 상단에 "자연스럽게 본문에 반영" 1줄만 prefix → AI가 무시하기 쉬움.

새로 추가:
- **prefix 강화**: 🔴 표시 + "최소 1개 섹션 직접 다뤄야 함" + 작가 톤 재구성 예시 + 고유명사·날짜·수치 정확 유지 명시.
- **3단계(본문) 지침에 직접 주입**: "본문 N개 섹션 중 최소 1개는 위 뉴스의 흐름·수치·사건·인물 중 1~2개를 직접 언급하면서 풀어내세요" — 본문 작성 위치에 명시.
- **5단계(자체 검토) 추가 항목**: "🔴 뉴스 반영 점검 — 단순한 '최근 뉴스에 따르면…' 한 줄로 끝내지 말고 한 섹션의 논지와 연결되어야. 누락 시 보강 후 출력".

### 3. 연구실 — 신규 5개 포스트 추가 (기존과 겹치지 않는 토픽)
- **post_12**: 네이버 C-Rank vs D.I.A. 알고리즘 — 2026년 상위 노출 작동 원리
- **post_13**: 모바일 가독성 — 이탈률 30% 줄이는 5가지 포맷팅 규칙
- **post_14**: 협찬·체험단 글, 페널티 안 받고 안전하게 표시하는 5가지 규칙 (공정위 + 네이버)
- **post_15**: AI 시대의 블로그 차별화 — 경험·관점·로컬 데이터로 살아남기
- **post_16**: 댓글·공감 1.5배 늘리는 인터랙션 설계 — 단골 만드는 5가지 장치

기존 11편(키워드/제목/수익화/이미지/저품질/색인/체류시간/애드센스/파이프라인/시작가이드)과 카테고리 미겹침 확인.

### 검증
- `IP_HASH_SALT=test-salt-... npm run build` → 41 페이지(연구실 5편 추가) 클린 통과.
- 신규 7개 입력 필드 TypeScript 타입 안전.
- 프리셋 저장·복원 path 동작.

### 후속 권장
- 신규 5편 썸네일 이미지(`public/posts/images/post_12~16.png`)는 placeholder로 대체됨 — 디자인 리소스 확보 시 추가.
- 프롬프트 생성기 고급 모드 입력이 길어진 만큼, 모바일에서 sticky 미리보기 패널 도입 검토.

---

## 2026-05-02 — Phase 20: UI/UX 진단 + 가독성·폰트 최적화

**진단 범위**: 색상·타이포그래피·폰트 로딩·다크모드 대비.

### 진단 요약
| 영역 | 결과 |
|---|---|
| 컬러 토큰 | ✅ 잘 정의됨 (light/dark, WCAG AA 명시) |
| Pretendard 폰트 | ✅ 한국어 최적화. ⚠️ FOUT 있음 |
| 컨셉 컬러 일관성 | ✅ 주황 통일 (Phase 10 마이그레이션 완료) |
| `text-[10px]` 사용 | 🔴 14곳 — 한국어 최소 12px 권장 위반 |
| `text-[11px]` 사용 | 🟡 40곳 — 메타 라벨엔 OK, 본문엔 부적절 |
| 다크모드 `text-slate-500` | 🟡 36곳 — 대비 약 4:1, 본문엔 경계선 |

### 적용한 개선 4가지

#### 1. `text-[10px]` → `text-[11px]` 일괄 격상 (가독성)
- 14곳 sed 치환. 한국어 표시 시 11px(0.6875rem)부터 안정적 가독.
- 영향: 홈 NEW 배지, 카드 그룹 라벨, 커뮤니티 카테고리 배지 등.

#### 2. FontLoader 제거 → SSR `<link>` 태그로 변경 (FOUT 해소)
- 기존: `useEffect`에서 `document.head.appendChild(link)` → 첫 렌더 시스템폰트 → 깜빡임.
- 변경: `app/layout.tsx`의 `<head>`에 `preconnect` + `<link rel="stylesheet">` 직접 삽입.
- 추가 최적화: `pretendard.min.css`(전체) → **`pretendard-dynamic-subset.min.css`** (한국어 자모 동적 서브셋) 사용 → 용량 약 40% 감소.
- `app/components/FontLoader.tsx` 파일 삭제.

#### 3. globals.css 한국어 가독성 강화
- `body`에 `letter-spacing: -0.01em` (Pretendard 권장 자간).
- `font-feature-settings: 'cv02','cv03','cv04','cv11'` (Pretendard cv 변종 — 영문 'i','j','l','y' 가독성).
- `text-rendering: optimizeLegibility` 추가.
- 헤딩(`h1~h6`)엔 더 좁은 자간 `-0.02em` (시각적 안정감).
- 작은 라벨(`text-[11px]`, `text-xs`)은 자간 0으로 리셋 (작은 글자 자간 좁히면 가독성 ↓).

#### 4. (보류) 다크모드 본문 색 강화
- 36곳의 `dark:text-slate-500`은 점진 마이그레이션 필요 (회귀 위험).
- 이미 정의된 `--text-secondary: #a3afc4` 토큰이 적절한 값(다크 5.7:1)이라 페이지에서 `text-secondary` 클래스로 점진 교체 권장.

### 검증
- `tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.
- 빌드 후 화면 첫 로드: FOUT 사라짐 (Pretendard 즉시 표시).

### 후속 권장 (별도 phase)
- 36곳 `dark:text-slate-500` 본문 → `--text-secondary` 토큰 또는 `dark:text-slate-400`로 점진 마이그레이션.
- `.text-\[11px\]`이 모바일에서 더 작아 보이는 문제 → `text-xs` (12px)로 격상하거나 모바일 미디어쿼리에서 자동 격상 검토.
- font-display 옵션 제어 (현재 CDN 기본값 사용 중).

---

## 2026-05-02 — Phase 19: 트렌드 반영(뉴스 컨텍스트) 부각 — 3개 진입점 강화

**배경**: 사용자 피드백 — 키워드 분석의 "뉴스 보기" 기능이 BlogLab의 차별화 포인트인데 표 마지막 컬럼에 작은 버튼으로만 노출되어 발견율 낮음.

### 19-A. 1단계: 키워드 분석 결과 위 dismissible 안내 배너
- `keyword-analysis/page.tsx`: 결과 표 위에 그라데이션 카드 (📰 + "[NEW] 트렌드 반영 글쓰기 — 글 퀄리티 ↑").
- 우상단 × 버튼으로 닫기. sessionStorage(`newsHintDismissed`)로 세션당 1회 노출.
- 신규 사용자에게 기능 존재를 명시적으로 알림.

### 19-B. 2단계: 뉴스 보기 버튼 라벨/배지 강화
- 컬럼 헤더: "뉴스" → **"트렌드"** (목적 직관화).
- 버튼 라벨: "🗞 뉴스 보기" → **"📰 트렌드 반영"** (행동 + 결과 명시).
- 첫 번째 결과 행에만 우상단에 **`NEW` 배지** (rose-500 + animate-pulse) 부착.
- title 툴팁 강화: "이 키워드의 최신 뉴스를 AI 프롬프트에 자동 반영합니다".

### 19-C. 3단계: 두 곳에 진입점 추가
**홈 "How it works"에 1.5 단계 카드 신설**:
- 기존 4단계 사이에 점선 테두리 + rose 색상 + "Boheme 차별화" 배지.
- 시각적으로 옵션 단계임을 명시 (점선) + 차별화 강조 (배지).
- "📰 트렌드를 더합니다 (선택)" + 키워드 분석 페이지로 이동 CTA.

**프롬프트 생성 페이지에 미진입 안내**:
- `newsContext`가 없을 때만 표시되는 점선 테두리 카드.
- "더 풍부한 글을 원하시나요? 트렌드 반영을 시도해보세요" + 키워드 분석으로 이동 링크.
- 현재 입력된 키워드가 있으면 `?keyword=` 자동 prefill.
- 뉴스 컨텍스트가 있는 상태(작성자가 뉴스를 가져와 도착)에선 자동으로 숨김 → 비침습적.

### 검증
- `tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.

### 효과 기대
- 신규 사용자: 홈 → 키워드 분석 → 결과 보면서 안내 배너 + NEW 배지로 자연스럽게 발견.
- 직진 사용자(프롬프트 생성 직접 진입): 미진입 안내로 키워드 분석 흐름으로 유도.
- 균형: 검색량/경쟁률 같은 핵심 지표는 그대로 보이고, 뉴스 기능만 부각 (점선/색상 차별화로 옵션임을 표현).

---

## 2026-05-02 — Phase 18: 네이버 SEO 지침 v2 + 사용자 프리셋 + 키워드 즐겨찾기 + 홈 재설계

### 18-A. 프롬프트 생성 — 네이버 블로그 글쓰기 지침 v2 (5단계)

사용자가 클로드 메모리에 등록한 작성 지침을 그대로 프롬프트 빌더에 통합:

- [1단계] 사전 검증 — `web_search` 1차 출처, 출처 불분명 정보 배제
- [2단계] 제목 — 메인 키워드 맨 앞 + 이모지 1개
- [3단계] 본문 2,000자 이내
  - 도입부: 에피소드/기억으로 시작, 키워드 자연 삽입, 글쓴이 경험·감정 신호
  - ▣ 기호 소제목 최대 5개, 명사형
  - 표는 수치 비교 시만 3~4행
  - 친근한 해요체 + 구어체("솔직히", "~더라고요")
  - 메인 키워드 5~6회 반복
  - 이모지 1개로 마무리
- [4단계] 해시태그 30개 (높은 검색량 + 니치 조합)
- [5단계] 자체 검토 — 금지 표현(무조건/최고/100%/보장/낫는다/치료된다) 인용형 변환

기존 "네이버 SEO 기본 요구사항" 6줄 → 5단계 지침 약 35줄 상세 가이드로 대체.

### 18-B. 마이그레이션 0010 — 사용자 프리셋 컬럼

`profiles`에 추가:
- `prompt_preset jsonb` — 프롬프트 생성 마지막 선택값 (4KB 제한)
- `saved_keywords text[]` — 키워드 즐겨찾기 (최대 10개, CHECK 제약)

### 18-C. 프롬프트 생성 자동 저장/복원 (로그인 사용자)

- 페이지 진입 시 `profiles.prompt_preset` 조회 → 모드/분야/스타일/어투/이모지/길이/광고/경험/추가옵션 자동 복원
- 옵션 변경 시 1초 디바운스 후 자동 UPDATE
- 비로그인 사용자는 영향 없음 (기존과 동일)
- 헤더 아래에 "로그인 사용자 — 옵션 자동 저장" emerald 배너 표시

### 18-D. 키워드 즐겨찾기 (`/keyword-analysis`)

- 입력창 아래 "⭐ 즐겨찾기 (N/10)" 섹션 노출 (로그인 사용자만)
- "+ 현재 키워드 저장" 버튼으로 첫 번째 키워드 저장
- 저장된 키워드 칩: 클릭 → 즉시 자동 분석, × 버튼 → 삭제
- 10개 도달 시 "기존 항목 먼저 삭제" 안내
- 비로그인 사용자: UI 미노출 (영향 없음)

### 18-E. 홈 메인 화면 재설계

기존 Hero + Steps + 인기검색어 배너 + Features Grid 위에 새 4개 섹션 추가:
1. **How it works** — 4단계 사용 가이드 (키워드 → 프롬프트 → AI → 마무리), 각 카드에 CTA 버튼
2. **Why Boheme** — 핵심 가치 3개 (한 곳에서 모두 / 네이버 API 기반 / 무료부터 시작)
3. **자주 묻는 질문 (FAQ)** — `<details>` 6개 (회원가입/AI 무료/네이버 호환/데이터 출처/프라이버시/협찬 글)
4. **Final CTA** — 그라데이션 풀스크린 박스 ("키워드 분석으로 시작" + "사용 가이드 보기")

기존 "더 자세한 사용법은 연구실에서" 작은 링크는 Final CTA로 흡수.

### 검증
- `tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.

### 배포 체크리스트
⚠️ Supabase에 `0010_user_presets.sql` 실행 필요. 미실행 시 로그인 사용자가 프롬프트 생성·키워드 분석 페이지 진입 시 콘솔에 `column "prompt_preset" does not exist` 에러 (UI는 정상 동작, 자동 저장만 실패).

---

## 2026-05-02 — Phase 17: 프로필 메뉴 추가 + 프롬프트 생성 SEO 강화 (초보자/고급 모드)

### 17-A. 프로필 수정 메뉴 진입점 추가
**증상**: 우측 사용자 드롭다운에 "로그아웃"만 있어 닉네임 변경 경로가 숨겨져 있음.

- `Navbar.tsx` 데스크톱 사용자 드롭다운: "로그아웃" 위에 **"프로필 수정"** 링크 추가 (`/profile/setup`).
- 모바일 메뉴: 사용자 카드 우측에 "프로필 · 로그아웃" 두 링크 나란히.

### 17-B. 프롬프트 생성 페이지 SEO 강화 + 초보자 친화

**문제**: 옵션이 8종이라 초보자에게 압도적, 최신 네이버 SEO 가이드(E-E-A-T, 광고 표시, LSI 키워드) 미반영.

**신규 추가 옵션**:
- **연관 키워드(LSI)** input — 메인 키워드 외 보조 키워드를 콤마 구분 입력. 본문에 자연 분산 배치되어 SEO ↑.
- **광고·협찬 표시** 라디오 — 일반 / 협찬·체험단 / 제휴 마케팅 3종. 미표시 시 네이버 페널티 대상이라 도입부 자동 명시.
- **개인 경험 강조도** 라디오 — 없음 / 약간 / 경험 중심 (E-E-A-T). 50%+ 경험 글이 네이버 노출 우대.
- **추가 옵션 5개 → 10개**: FAQ 섹션 / 비교표 / 체크리스트 / 출처·참고자료 / CTA 강화 신설.

**초보자/고급 모드 토글**:
- 우상단 segmented control: **초보자 모드 ↔ 고급 모드**.
- 초보자: 키워드 + 분야 + 글 스타일 + 어투(필수) + 글 길이 + 생성 버튼만 노출. 안내 박스로 모드 전환 유도.
- 고급: 모든 옵션 + SEO 강화 섹션(연관키워드/광고표시/경험 강조도/이모지/추가옵션 10종) + 제목 스타일 + 타겟 독자.

**프롬프트 빌더 강화** (generatePrompt):
- 메인 키워드 도입부 2~3문장 자동 포함, 본문 4~6회 분산 배치 명시.
- 광고·협찬일 경우 도입부에 명시 문구 자동 삽입.
- 경험 강조도별 차등 (객관적 정보 / "[나의 경험 삽입]" placeholder 1~2개 / 50%+ 경험 비중).
- 금칙어 회피 가이드(최저가/특가/보장 등) 자동 포함.

### 검증
- `tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.

### UX 효과 기대
- 신규 사용자: 초보자 모드 4~5개 필드만 보고 부담 없이 시작.
- 숙련 사용자: 고급 모드 + LSI + 경험 강조도로 네이버 노출 최적화.
- 협찬 글: 자동 표시 문구로 네이버 가이드 위반 방지.

---

## 2026-05-02 — Phase 16.2: Navbar STEP 배지 제거 + 닉네임 변경 안내

**증상 보고**: 키워드분석을 누르면 Navbar에 "STEP 2/8"이 떠서 어색함. 모든 도구 페이지에 일률적으로 STEP이 표시되어 부담스러움. 그리고 서이추 모달에서 닉네임이 read-only로 보여 변경 방법을 모름.

### 수정
- `Navbar.tsx`: 로고 옆 `STEP N/8` 배지 제거 + 미사용 `findCurrentStep()` 함수 + `currentStep` 변수까지 dead code 정리. 워크플로우 안내는 페이지 하단의 `FlowNav` 컴포넌트가 자연스럽게 이끌도록.
- `SwapModal.tsx`: 닉네임 read-only 안내 문구에 "[프로필에서 변경 →] (24시간 1회)" 링크 추가. 사용자가 변경 경로를 즉시 발견 가능.

### 검증
- `tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.

---

## 2026-05-02 — Phase 16.1: diagnose SQL hotfix

`supabase/diagnose_community.sql` 섹션 [6] (Rate Limit INSERT 정책 점검)에서 `pg_policies.polname` 참조 → 실제 컬럼명 `policyname`로 수정.

**증상**: Supabase SQL Editor 실행 시 `ERROR: 42703: column "polname" does not exist` 발생.
**원인**: 다른 PostgreSQL 시스템 catalog(`pg_policy`)는 `polname`이 맞지만, view인 `pg_policies`는 `policyname`을 사용.
**수정**: 2줄 (select / order by) → `policyname`로 통일.

---

## 2026-05-02 — Phase 16: 정식 오픈 준비 (tips 임시 숨김 + 약관 갱신 + 진단 SQL + 시작 가이드)

**범위**: 정식 오픈 직전 4가지 마무리 작업.

### 16-A. /community/tips 임시 숨김 (페이지 보존)

사용자 요청: "어느 정도 사이트가 활성화된 이후 오픈". 코드는 보존, 노출만 차단.

- `Navbar.tsx`의 `COMMUNITY_MENU` 배열에서 tips 항목 주석 처리.
- `community/page.tsx` 허브 카드에서 tips 제거. 그리드를 `md:grid-cols-3` → `md:grid-cols-2`로 조정.
- `app/sitemap.ts`에서 `/community/tips` 라우트 주석 처리.
- `app/robots.ts`의 disallow에 `/community/tips`, `/community/tips/*` 추가 → 검색엔진 색인 차단.
- 페이지 자체와 `tips_*` Supabase 테이블은 그대로 유지. 향후 한 줄씩 다시 살리면 즉시 재오픈 가능.

### 16-B. 약관 / 개인정보처리방침 갱신

**날짜**: 2026-04-23 → 2026-05-02 (모두 동일).

`/privacy`:
- 수집 항목 다. 커뮤니티 이용 시 신규 추가 — 닉네임/블로그 URL/분야/자기소개/게시글/댓글/좋아요/체험단 지역·연락방법/신고 사유.
- 민감 정보 입력 자제 안내 (전화번호·계좌 등).
- 보유 기간에 커뮤니티 게시글, 신고 기록(1년), 차단 기록(차단 해제 시까지), 비로그인 IP 해시(30일) 추가.
- 처리 목적에 커뮤니티 운영 + 자동 숨김 + Rate Limit 추가.
- 처리 위탁표에 Pexels / Unsplash / LanguageTool / Wikimedia 추가.
- 국외 이전 목록에도 동일 추가.

`/terms`:
- 제4조 제공 서비스에 커뮤니티 항목 추가.
- **신설 제9조 (커뮤니티 이용)** — 7개 하위 조항:
  - 가. 작성 한도(서이추 1/24h, 체험단 3/24h, 댓글 5/분 100/24h)
  - 나. 닉네임 정책 (2~16자, 24h 1회 변경)
  - 다. 금지 행위 (도배·욕설·음란·개인정보·불법·결제유도)
  - 라. 신고 5건 자동 숨김
  - 마. 차단 정책 (이메일 소명)
  - 바. 체험단 동행 안전 안내 (오픈채팅 권장, 분쟁 면책)
  - 사. 게시물 권리 및 책임
- 기존 제9~14조 → 제10~15조로 번호 재정렬.

### 16-C. diagnose_community.sql 9개 마이그레이션 전체 검증

기존 5개 점검 → 8개 섹션으로 확장:
1. 마이그레이션 9개의 핵심 테이블 (10개 테이블 ✅/❌)
2. 각 테이블 행 개수
3. RLS 활성화 (🔒 ON / 🔓 OFF)
4. SELECT 정책 (누구나 읽기 가능 6개 테이블)
5. **is_hidden 컬럼 + auto_hide_trg 트리거** (0009 검증)
6. **Rate Limit INSERT 정책** (0008/0009 검증)
7. **닉네임 24h cooldown 트리거** (0003 검증)
8. **pg_trgm 확장 + region_city 컬럼** (0007 검증)

운영자가 한 번 실행해서 모두 ✅이면 9개 마이그레이션 정상 적용 완료 확정.

### 16-D. lab 시작 가이드 글 신규 추가

기존 lab 글 10개(post_1~10)는 모두 콘텐츠 충실하나 **사이트 자체 사용 가이드가 부재**. `post_11` 신규 추가:

- **제목**: "Boheme BlogLab 시작 가이드 — 8단계로 완성하는 첫 포스팅"
- **분량**: 약 1500자, 8단계 워크플로우를 단계별로 설명
- **포함**: 황금 키워드 기준(검색량 500+ / 경쟁률 0.3-), AI 한도 정책, 네이버 호환 마크다운 변환, 커뮤니티 안내
- `posts.json` 최상단에 등록 (description + date 메타) → lab 페이지 진입 시 가장 먼저 노출.

### 검증

- `npx tsc --noEmit`: 클린.
- `npm run build`: 40 페이지.

### 정식 오픈 직전 잔여 To-do (코드 외)

1. Supabase에서 `supabase/diagnose_community.sql` 실행 → 모두 ✅ 확인
2. 본인 계정으로 smoke test (글 작성/한도 차단/신고/모바일 PWA)
3. Vercel Spend Management + Anthropic Usage Limits 알림 설정

---

## 2026-05-02 — Phase 15: Quill HTML sanitize + 무한 스크롤 + sitemap/robots

**범위**: 정식 오픈 전 잔존 3개 항목 처리.

### 15-A. Quill HTML sanitizer

**조사 결과**: quill 출력은 우리 사이트 어디에서도 다른 사용자에게 dangerouslySetInnerHTML로 노출되지 않음. 본인 quill 인스턴스에만 다시 들어가고 마크다운으로 변환되어 클립보드 복사. 실질 위협은 자해 수준.

그래도 미래 대비 + 클립보드 변환 흐름 안전성을 위해 화이트리스트 sanitizer 추가:
- `app/lib/format/sanitize-html.ts` 신규: DOMParser 기반, ALLOWED_TAGS + 태그별 ALLOWED_ATTRS.
- 차단: `<script>`, `<iframe>`, `<form>`, `on*` 핸들러, `style` 속성, `javascript:` / `data:` 스킴.
- 외부 링크(`a` 태그)는 자동 `target="_blank" rel="noopener noreferrer nofollow"` 강제.
- `app/editor/page.tsx`: `setContent` wrapper로 모든 quill HTML 갱신을 sanitize 통과시킴.

### 15-B. 무한 스크롤 (페이지네이션 → IntersectionObserver)

**전환 이유**: 모바일 UX 향상 + 한국 게시판 사용자에 친숙. 다만 SEO·딥링크는 sitemap이 보완.

- `app/components/community/InfiniteScrollSentinel.tsx` 신규: IntersectionObserver + 200px 미리 로드 + "더 보기" fallback 버튼 + 스피너.
- 3개 목록 페이지(`/community/swap`, `/tips`, `/companions`) 모두 적용:
  - `Pagination` 제거, `fetchPage(targetPage, append)` 패턴으로 리팩토링.
  - 필터 변경 시 `setPage(1) + setPosts([])` 리셋.
  - sentinel이 보이면 `loadMore()` → `page+1` + append.
  - visibility focus 시엔 1페이지만 silent 갱신 (누적 결과 유지).
  - 마지막 도달 시 "마지막 글까지 모두 봤어요 (총 N건)" 표시.

### 15-C. SEO — sitemap.xml + robots.txt

- `app/sitemap.ts` 신규 (Next.js Metadata API):
  - 정적 라우트 19개 (홈/도구 8단계/커뮤니티 허브+3종/lab/about/privacy/terms/login).
  - 동적: `public/posts/posts.json`에서 lab 게시글 10개 자동 추가.
  - 페이지별 `changeFrequency`/`priority` 차등화 (커뮤니티 hourly priority 0.8, 도구 monthly priority 0.8~0.9, 약관 yearly priority 0.3).
- `app/robots.ts` 신규:
  - `/api/`, `/auth/`, `/login`, `/profile/setup`, `/community/*/new`, `?id=` 수정 모드 disallow.
  - sitemap URL 명시: `https://bohemebloglab.com/sitemap.xml`.
- 빌드 결과 `/sitemap.xml`, `/robots.txt` 자동 생성됨.

### 검증

- `npx tsc --noEmit`: 클린.
- `npm run build`: 40 페이지 (이전 38 + `/sitemap.xml` + `/robots.txt`).

### 정식 오픈 후 작업

- Google Search Console에서 `https://bohemebloglab.com/sitemap.xml` 제출.
- 네이버 웹마스터 도구에 동일 sitemap 등록.
- 커뮤니티 동적 게시글(`/community/tips/[id]` 등)은 robots.txt 허용으로 자연 색인됨 (Search Console에서 페이지 발견 후 자동).

---

## 2026-05-02 — Phase 14: react-quill 제거 + Rate Limiting + 신고/차단 시스템

**범위**: Phase 13에서 권장한 잔존 보안 항목 3개 일괄 처리.

### 14-A. react-quill 제거 (Phase 13 잔존 #1)

**발견**: react-quill은 package.json에 의존성으로만 남아있고 코드에서 import 안 됨. `app/editor/QuillEditor.tsx`는 `quill@2.0.3`(latest)을 직접 사용.

- `npm uninstall react-quill` — lodash transitive(@4.17.23 high CVE)도 함께 제거됨.
- npm audit: 7 → 3 vulnerabilities (4개 해소).
- 남은 3개는 quill@2.0.3(latest)의 HTML export advisory — 우리는 본인 글만 본인 마크다운으로 변환하므로 자해 위험만 존재.
- **별도 phase 후보**: 향후 sanitize-html이나 DOMPurify로 quill HTML 출력 정화.

### 14-B. Rate Limiting (마이그레이션 0008)

RLS INSERT 정책에 시간 윈도우 sub-select 추가 (서이추 1일 1글과 동일 패턴):

| 테이블 | 한도 |
|---|---|
| `swap_posts` | 1일 1글 (기존 유지) |
| `tips_posts` | 24h 5건/사용자 |
| `tips_comments` | 분당 5건 + 24h 100건/사용자 |
| `companion_posts` | 24h 3건 + visit_date 미래 |

- 인덱스 추가: `(user_id, created_at desc)` 3개 — count 쿼리 빠르게.
- 클라이언트: `42501` (RLS 차단) 코드 받으면 친절한 메시지 (`'하루 글 작성 한도(5건)를 초과했습니다.'`).
- 댓글은 toast로, 글 작성은 alert + setError 동시.

### 14-C. 신고 / 차단 / 자동 숨김 (마이그레이션 0009)

**테이블 신규**:
- `reports` — `report_target` enum (`swap_post`/`tips_post`/`tips_comment`/`companion_post`), 6개 사유(`spam`/`abuse`/`adult`/`privacy`/`illegal`/`etc`), 상세 사유 500자.
  - `unique (reporter_id, target_type, target_id)`: 한 사람이 같은 글 1회만 신고.
  - 신고 분당 5건 한도 (악용 방지).
  - 본인 신고만 SELECT.
- `blocked_users` — RLS 정책 없음 → service_role만 INSERT/DELETE. 운영자가 Supabase Dashboard에서 직접 관리.

**기존 테이블 변경**:
- `swap_posts` / `tips_posts` / `tips_comments` / `companion_posts`에 `is_hidden boolean default false` 추가.
- 부분 인덱스 `where is_hidden = false` 4개 — 정상 글만 빠르게 조회.

**자동 숨김 트리거**:
- `auto_hide_on_reports()` SECURITY DEFINER — `reports` INSERT 시 동일 대상 누적 카운트가 5 이상이면 대상 테이블의 `is_hidden = true`로 갱신.

**차단 사용자 작성 차단**:
- swap/tips/comment/companion INSERT 정책에 `not exists (select 1 from blocked_users where user_id = auth.uid())` 추가.

### 14-D. 신고 UI

- `app/components/community/ReportModal.tsx` 신규 — 6개 사유 라디오 + 상세 textarea(500자) + 한도 초과 시 친절 메시지.
- `app/components/community/ReportButton.tsx` 신규 — 본인 글이면 hidden, 비로그인은 로그인 페이지 redirect, 아이콘/텍스트 variant.
- `app/lib/community/reports.ts` 신규 — `ReportTarget`, `ReportReasonCode`, `REPORT_REASONS`.

**적용**:
- swap 행: 본인 글이면 [수정][삭제], 아니면 🚩 신고 (데스크톱·모바일 둘 다).
- tips/[id] 본문: isMine ? [수정][삭제] : 🚩 신고.
- tips/[id] 댓글: 본인 댓글이면 [삭제], 아니면 🚩 아이콘.
- companions/[id]: isMine ? [상태변경 + 수정 + 삭제] : 🚩 신고.

### 14-E. 숨김 글 자동 필터

모든 목록·상세 SELECT 쿼리에 `.eq('is_hidden', false)` 추가:
- swap 목록 / tips 목록 + 상세 + 댓글 / companions 목록 + 상세
- 본인 글이라도 자동 숨김된 경우 표시 안 됨 (운영자만 Supabase Dashboard에서 확인).

### 검증

- `npx tsc --noEmit`: 클린.
- `IP_HASH_SALT=...` `npm run build`: 38 페이지.
- `npm audit`: 7 → 3 (모두 quill@latest, 별도 phase).

### 배포 체크리스트

⚠️ Supabase SQL Editor에서 순서대로 실행:
1. `0008_rate_limits.sql` — 기존 RLS 정책 교체 + 인덱스
2. `0009_reports_and_moderation.sql` — 신규 테이블 + is_hidden 컬럼 + 트리거 + INSERT 정책 재정의

**중요**: 0009는 0008의 정책을 다시 `drop policy if exists ... create policy`로 재정의하므로 순서 지킬 것.

### 운영자 가이드

- 신고 5건 누적 → 자동 숨김 (DB 트리거)
- 운영자는 Supabase Dashboard에서:
  - `reports` 테이블 직접 조회 (target_id로 원본 글 추적)
  - `swap_posts/tips_posts/...`에서 `is_hidden = true` 조회 → 검토 후 복원/유지 결정
  - 악성 사용자 차단: `insert into blocked_users (user_id, reason) values ('<uuid>', '사유')`
  - 차단 해제: `delete from blocked_users where user_id = '<uuid>'`

---

## 2026-05-02 — Phase 13: 보안 감사 + 단위 검증 + 통합 테스트

**범위**: 사용자 요청 — 전체 소스 보안 검사, 잠재 오류 단위 테스트, 통합 검증.

### 13-A. 보안 감사 (12개 카테고리 점검)

| # | 카테고리 | 결과 |
|---|---|---|
| 1 | 민감 정보 노출 (.env, service_role, console.log) | ✅ 안전. `.env*` gitignore, service_role은 서버 라우트 전용 (`api/ai-draft/route.ts`), console.error에 키 노출 없음 |
| 2 | XSS (`dangerouslySetInnerHTML`) | ❗ **수정** — `competitor-analysis/page.tsx`가 네이버 API의 `post.title`을 직접 주입. ✅ 다른 4곳은 안전 (정적 상수/`markdownToHtml`로 escape됨) |
| 3 | SSRF | ✅ `images/proxy`에 도메인 화이트리스트 (Pexels/Unsplash/Google). 다른 fetch는 코드에 박힌 URL만 |
| 4 | Open Redirect (`?next=` 파라미터) | ❗ **수정** — `auth/callback`, `login`, `profile/setup`에서 검증 없이 redirect. `next=//evil.com` 등 외부 도메인으로 우회 가능했음 |
| 5 | RLS 정책 (8개 테이블 24개 정책) | ✅ 모두 활성화 + 본인만 INSERT/UPDATE/DELETE 강제. anon_draft_usage는 service_role 전용 |
| 6 | IDOR (다른 사용자 데이터 접근) | ✅ 클라이언트의 `.eq('user_id', ...)` + RLS의 `auth.uid() = user_id` 이중 방어 |
| 7 | SQL Injection / LIKE 와일드카드 | ⚠️ **수정** — Supabase가 SQL injection은 막지만 `%`, `_` 와일드카드는 escape 안 함 (의도치 않은 매칭/DoS 가능) |
| 8 | Rate Limiting / DoS | ⚠️ AI는 한도 있음. 댓글·좋아요·일반 글 작성 분당 한도 없음 (후순위 — 보고서만) |
| 9 | 의존성 취약점 (`npm audit`) | ❗ **수정** — Anthropic SDK 0.91 → 0.92 (file permissions, 우리 영향 없음). ⚠️ react-quill의 lodash/quill (maintained 안 됨, 별도 phase 필요) |
| 10 | CORS / Security Headers | ✅ Vercel 자동 처리, `images/proxy` 화이트리스트 |
| 11 | 인증 우회 / 세션 | ✅ Supabase 토큰 + middleware 세션 갱신. `useUser` 훅으로 보호 |
| 12 | Path Traversal | ✅ `lab/[slug]`에서 `path.join`만 사용 (사용자 입력 없음, 정적 파일만) |

### 13-B. 수정 4개

1. **XSS 방어 — `sanitizeSearchHighlight()`**
   - `app/lib/format/article-formats.ts`에 신규 함수 추가
   - `escapeHtml()` 후 `<b>`, `</b>`만 화이트리스트 복원
   - `competitor-analysis/page.tsx:236`의 `post.title` dangerouslySetInnerHTML 직전에 적용

2. **Open Redirect 방어 — `safeNextPath()`**
   - `app/lib/security/safe-redirect.ts` 신규
   - 차단: 빈 값, "/" 미시작, "//evil", "/\\evil", "/javascript:" 등
   - 적용: `auth/callback/route.ts`, `login/page.tsx`, `profile/setup/page.tsx`

3. **LIKE 와일드카드 escape — `escapeLikePattern()`**
   - `safe-redirect.ts`에 함께 추가 (`%`, `_`, `\` → `\$&`)
   - 적용: `swap/page.tsx`, `tips/page.tsx`의 ilike 검색

4. **Anthropic SDK 0.91 → 0.92**
   - `package.json` 업데이트
   - 우리 코드는 `messages.create()`만 사용 → 호환성 영향 없음

### 13-C. 단위 검증 (45/45 통과)

임시 검증 스크립트(`/tmp/verify.mjs`)로 helper 로직 단위 검증 후 삭제:

| 함수 | 통과 |
|---|---|
| `safeNextPath` | 11/11 (정상 path / protocol-relative 차단 / javascript scheme 차단 / fallback) |
| `escapeLikePattern` | 5/5 (`%` `_` `\` 조합) |
| `escapeHtml` / `sanitizeSearchHighlight` | 8/8 (`<b>` 보존, `<script>`·`<img onerror>` escape) |
| `validateNickname` / `validateBlogUrl` | 13/13 (길이/문자/스킴) |
| `formatRelativeKr` | 6/6 (방금 전 / N분 / N시간 / N일 / 절대 날짜) |
| `REGIONS` / `REGION_CITIES` | 3/3 (19개 시·도, 서울 25, 경기 31) |

### 13-D. 통합 검증

- `npx tsc --noEmit`: 클린 (0 errors)
- `IP_HASH_SALT=...` `npm run build`: 38 페이지 정상 (Turbopack 컴파일 성공)
- `npm audit`: 7 → 4 vulnerabilities (남은 4개는 react-quill 의존, 별도 phase)

### 잔존 권장사항 (별도 phase)

- **react-quill 마이그레이션** — `react-quill-new` 또는 다른 React 19 호환 에디터로 교체 (현재 react-quill은 maintained 안 됨, lodash/quill 취약점 동반)
- **댓글/좋아요/일반 글 작성 Rate Limiting** — 분당 N건 제한 (Vercel KV 또는 Supabase RPC + window function)
- **신고/차단 기능** — 악의적 사용자 대응

---

## 2026-05-02 — Phase 12: 작성 후 목록 이동 + 체험단 지역 세분화 + 문서 갱신

### 12-A. 글 등록 후 목록 자동 이동
**증상**: 정보공유/체험단 작성 후 상세 페이지로 이동 → 사용자가 본인 글이 목록에서 안 보인다고 느낌.
- `/community/tips/new`: INSERT 성공 시 `router.push('/community/tips')`로 변경 (기존: 상세 페이지). 수정(update)은 그대로 상세로 이동.
- `/community/companions/new`: 동일 패턴 적용.
- 목록 페이지의 useEffect는 마운트 시 자동 fetch이므로, 작성 즉시 본인 글이 최상단 노출됨.
- 서이추는 모달 작성이므로 같은 페이지에서 reload — 변경 불필요.

### 12-B. 체험단 지역 세분화 (시·도 → 시·군·구)
**요청**: "경기도면 너무 넓어요. 시까지 구별이 필요해요."

마이그레이션:
- `0007_companion_region_city.sql` — `companion_posts.region_city text` 컬럼 추가, `(region, region_city, visit_date)` 복합 인덱스. 기존 `region` 시·도 단일 컬럼은 유지 (호환성).

데이터:
- `app/lib/community/regions.ts` — `REGION_CITIES: Record<string, string[]>` 신규. 17개 시·도별 시·군·구 (서울 25, 경기 31, 부산 16, ... 총 약 250개).
- 헬퍼 추가: `getCities(region)`, `formatFullRegion(region, regionCity)` ("경기 수원시" 형식).

UI:
- `companions/new`: 지역 필드를 시·도 select + 시·군·구 select 2단계로. 시·도 변경 시 시·군·구 자동 초기화. 세종/온라인/기타는 시·군 select 비활성화.
- `companions/page.tsx`: 시·도 선택 시에만 시·군·구 select 추가 노출. 필터 쿼리에 `region_city` 적용.
- 카드 행 + 모바일 + 상세 페이지: `formatFullRegion()`으로 "경기 수원시" 통합 표시.

### 12-C. 문서 갱신
- **`CLAUDE.md`**: Phase 8~11 누적 변경 반영.
  - 커뮤니티 정책 섹션 신규 (1일 1글, 닉네임 24h, 작성 후 목록 이동)
  - 디렉토리 구조에 `community/`, `profile/setup`, `manifest.ts`, 마이그레이션 0003~0007 추가
  - 디자인 시스템 항목에 Toast/Pagination/BoardSkeleton/EmptyState 등 신규 컴포넌트 추가
  - 컬러 = 주황 명시 (indigo/violet 사용 금지)
  - 디버깅 섹션에 RLS·마이그레이션·1일 1글 에러 코드(`42501`/`42P01`) 추가
- **`README.md`**: 처음부터 다시 작성 (Next.js 기본 README 제거).
  - 8단계 워크플로우 + 커뮤니티 3종 + 모바일 PWA 정리
  - 환경변수 / 마이그레이션 순서 / 빌드 검증 가이드
  - 보안 정책 명시 (IP 해시, RLS, 이미지 프록시 화이트리스트)

### 검증
- `npx tsc --noEmit`: 클린.
- `IP_HASH_SALT=...` `npm run build`: 38 페이지 정상.

### 배포 체크리스트
- ⚠️ Supabase에 `0007_companion_region_city.sql` 실행 필요. 실행 전엔 신규 체험단 작성 시 `region_city` 컬럼 부재로 INSERT 실패 가능.

---

## 2026-05-02 — Phase 11: UI 우선순위 높음+중간 일괄 개선

**범위**: 사용자 요청 — 우선순위 높음 4개 + 중간 6개 항목 일괄 개선.

### 신규 공통 컴포넌트/유틸
- **`app/lib/format/relative-time.ts`** — `formatRelativeKr` / `formatAbsoluteKr` 추출 (3개 파일에 중복되어 있던 함수 제거).
- **`app/components/ui/Toast.tsx`** — ToastProvider + useToast hook. success/error/info 3종, 우상단 fixed, 3초 자동 닫힘, slide-in 애니메이션, safe-top 적용.
- **`app/components/community/Pagination.tsx`** — 공유 페이지네이션. **키보드 ←/→** 단축키 (input/textarea 포커스 중엔 자동 비활성), `aria-current`, 가운데 정렬 안정화 (start 5개 내에서 슬라이드).
- **`app/components/community/BoardSkeleton.tsx`** — 게시판 행 리스트용 N행 스켈레톤. `animate-pulse` + 헤더 placeholder.

### 우선순위 높음 (4개)
1. **페이지 폭 통일**: 목록(`/swap`, `/tips`, `/companions`) `max-w-6xl`, 상세(`tips/[id]`, `companions/[id]`) `max-w-3xl`. 상하 패딩도 `pt-6 pb-10`로 통일.
2. **로딩 스켈레톤**: 텍스트 "불러오는 중..." 제거 → `<BoardSkeleton rows={6} />`로 교체. 시각적 깜빡임 해소.
3. **alert() 토스트 대체**: `app/layout.tsx`에 `ToastProvider` 마운트. swap 모달/tips 상세/companions 상세에서 `alert()` → `toast(message, variant)` 일관 교체. 성공·실패·정보 색상 분리.
4. **페이지네이션 일관 적용**: swap/companions에 PAGE_SIZE 20 + count: 'exact'로 페이지네이션 추가. 모든 게시판이 동일한 키보드 화살표 지원.

### 우선순위 중간 (6개)
5. **상단 sticky 필터**: 카테고리 칩 + 검색 + 정렬 영역을 `sticky top-14` (Navbar 56px 아래) + `bg-slate-50/90 backdrop-blur-md`로 고정. 스크롤해도 필터 항상 접근.
6. **다크모드 주황 톤다운**: `--accent`을 dark에서 `#fb923c`(orange-400) → `#fdba74`(orange-300)로 한 단계 부드럽게.
7. **EmptyState 일러스트**: 단순 텍스트 → 그라데이션 원형 + 이모지 + `hints[]` 가이드 항목. variant prop (`swap`/`tips`/`companions`)별 색상.
8. **상세 페이지 작성자 메타**: 닉네임만 표시 → **아바타(이니셜 + 그라데이션) + 분야 칩 + 블로그 링크 버튼**. `fetchProfileByUserId(post.user_id)`로 별도 fetch.
9. **MobileBottomNav 활성 인디케이터**: 활성 탭 상단에 `w-8 h-1` 주황 라인 추가 (시인성 향상).
10. **검색 input 디바운스 spinner**: `query.trim() !== debouncedQuery` 동안 input 우측에 4×4 회전 원 표시.

### 코드 품질
- 3개 파일에 중복되던 `formatRelativeKr` 제거 (swap/tips/companions/[id]).
- tips 페이지의 인라인 `Pagination` 함수 → 공유 컴포넌트로 교체.

### 검증
- `npx tsc --noEmit`: 클린.
- `npm run build`: 38 페이지.

---

## 2026-05-02 — Phase 10.1: 커뮤니티 게시판형 UI + 필터 한 줄 고정

**증상 보고**: ① 커뮤니티가 일반 게시판처럼 보이지 않음 (카드 그리드라 리스트 가독성 떨어짐). ② 필터 칩이 줄바꿈됨.

### 10.1-A. CategoryChips 컴포넌트 자체를 nowrap + 가로 스크롤로
- `flex-wrap` 제거 → `whitespace-nowrap overflow-x-auto scrollbar-hide`. 칩 자체에 `flex-shrink-0` 부여.
- `globals.css`: `.scrollbar-hide` 유틸 추가 (webkit·firefox·IE 대응).

### 10.1-B. 게시판형 행 리스트로 전환
- **서이추** (`/community/swap`): 카드 그리드 → 그리드 행(`grid-cols-[88px_140px_1fr_120px_100px_80px]`). 컬럼: 분야 / 닉네임 / 한마디 / 작성일 / 블로그 / 관리. 모바일은 컴팩트 카드 행 유지.
- **체험단** (`/community/companions`): 카드 그리드 → 행 리스트. 컬럼: 상태 / 제목 / 지역 / 방문일 / 작성자 / 작성일.
- **정보공유** (`/community/tips`): 기존 행 리스트에 컬럼 헤더 추가. 컬럼: 분류 / 제목 / 작성자 / 작성일 / 조회 / 추천. `tabular-nums`로 숫자 정렬.
- 공통: 리스트 컨테이너 `rounded-2xl`, 헤더 `bg-slate-50 dark:bg-slate-900/50` + uppercase tracking-wider.

### 10.1-C. 필터 한 줄 고정
- tips 카테고리 탭: `flex-wrap` 제거 → 가로 스크롤.
- 검색 + 정렬: `flex-col sm:flex-row` → `flex items-center` 한 줄 고정.
- companions 지역 select + 모집중 토글: 한 줄 + `whitespace-nowrap overflow-x-auto`.

### 검증
- `npx tsc --noEmit`: 클린.
- `npm run build`: 38 페이지.

---

## 2026-05-02 — Phase 10: 브랜드 컬러 주황색 + 커뮤니티 모더나이즈 + PWA + 모바일 하단 탭

**범위**: ① 보라색(indigo/violet) → 주황색(orange/amber) 일괄 컨셉컬러 변경. ② 커뮤니티 메뉴 UI 최신 트렌드(bento grid + 그라데이션 + soft shadow) 모더나이즈. ③ 사이트 전체 통일성. ④ 모바일 PWA 형태(manifest + viewport + safe-area + 하단 탭).

### 10-A. 브랜드 컬러 시스템 변경
- `app/globals.css` 토큰: `--accent` indigo `#6366f1` → orange `#f97316`. dark mode `#fb923c`. focus-ring · selection · input shadow도 주황 RGB로.
- 35개 파일에서 `bg/text/border/ring/from/to-{indigo|violet}-*` → `orange/amber-*`로 sed 일괄 치환. 잔존 클래스 0개 확인.
- `indigo-600` → `orange-500`, `indigo-700` → `orange-600` 매핑 (한 단계 어두운 색이 hover로 작동하도록).

### 10-B. PWA 기반
- `app/manifest.ts` 신규: name/short_name, `theme_color #f97316`, `display: standalone`, SVG 아이콘.
- `public/icon.svg` 신규: 그라데이션 + 펜 아이콘.
- `app/layout.tsx`: `Viewport` export 추가 (width device-width, viewportFit cover, themeColor light/dark).
- `globals.css`: `safe-top/bottom/left/right` 유틸 + `@media display-mode standalone` overscroll-behavior.

### 10-C. 모바일 하단 탭 네비게이션
- `app/components/MobileBottomNav.tsx` 신규: 4탭(홈/도구/커뮤니티/연구실). md:hidden, fixed bottom, backdrop-blur, safe-bottom.
- 활성 탭은 주황색 + 굵은 stroke (`strokeWidth 2.4`), 비활성은 slate-500.
- 에디터·로그인·OAuth callback 페이지에선 자동 숨김 (몰입감).
- `globals.css` `body { padding-bottom }` 모바일에서 64px 추가하여 탭바와 콘텐츠 겹침 방지.

### 10-D. 커뮤니티 모더나이즈
- **허브** (`/community`): bento grid (서이추는 `md:col-span-2`), 그라데이션 배경 카드, 12px 이모지 아이콘 박스, 우상단 배지, blur 오브 데코, hover lift. 하단 3개 안내 카드(읽기/쓰기/안전).
- **서이추 / 정보공유 / 체험단 목록**: breadcrumb를 "›"로 통일, 헤더에 이모지 prefix (🤝/💡/🚶‍♂️), 작성 버튼을 `rounded-full` + 그라데이션 (`from-orange-500 to-orange-600`).
- 카드: `rounded-2xl` 통일, hover 시 `border-orange-200`로 강조, `hover:-translate-y-0.5 + shadow-lg`.
- 검색 input: `rounded-xl` + 포커스 시 `bg-white` 트랜지션.

### 10-E. 통일성
- 모든 카드 라운드: `rounded-2xl`.
- 작성 버튼: `rounded-full` + orange 그라데이션.
- breadcrumb 구분자: `›`.
- focus ring 컬러: `focus:ring-orange-500` 통일.

### 검증
- `npx tsc --noEmit`: 클린.
- `npm run build`: 38 페이지 (이전 37 + `/manifest.webmanifest` 자동 생성).
- 모바일 Lighthouse 항목 향상: viewport 메타, theme-color, manifest 모두 충족.

### 사용자 안내
- ⚠️ Vercel 배포 후 모바일 브라우저에서 "홈 화면에 추가"하면 standalone PWA로 실행됩니다.
- ⚠️ `public/icon.svg`는 SVG라 모든 사이즈 대응. 필요 시 192/512 PNG는 추후 추가 가능.

---

## 2026-05-02 — Phase 9.1: 커뮤니티 fetch/error 핸들링 hotfix

**증상 보고**: 게시물 등록 후 목록 화면이 갱신되지 않고, 본인이 등록한 글도 안 보임.

**가능한 원인**: ① Supabase 마이그레이션 0003~0006 미실행으로 INSERT가 RLS·테이블 부재로 silent fail / ② Next.js Router cache 30s로 list 페이지가 stale / ③ 에러가 `setError`로만 화면 끝에 노출되어 사용자가 인지 못 함.

### 9.1-A. fetch 자동 갱신
- `/community/swap/page.tsx`, `/community/tips/page.tsx`, `/community/companions/page.tsx`: `fetchPosts(silent)` 함수로 분리 + `visibilitychange` / `window focus` 리스너 등록 → 다른 탭/페이지에서 돌아오면 silent 재fetch.
- `/community/tips/new/page.tsx`, `/community/companions/new/page.tsx`: INSERT/UPDATE 성공 후 `router.push` 직전에 `router.refresh()` 호출 → RSC 캐시 무효화.

### 9.1-B. 에러 피드백 강화
- swap 모달 / tips/new / companions/new: INSERT 실패 시 `setError` + `alert()` + `console.error` 동시 호출.
- swap 모달: PostgreSQL 에러 코드별 친절 메시지 매핑 (42501=RLS차단=24h제한 / 42P01=테이블없음=마이그레이션 안내).
- INSERT 응답 `data`가 `null`이면 "RLS 정책 확인" 안내 alert.

### 9.1-C. 진단 헬퍼
- `supabase/diagnose_community.sql` 신규 — 5가지 점검 쿼리 (테이블 존재, 행 수, RLS 활성화, SELECT 정책, pg_trgm 설치)를 한 번에 실행.

### 검증
- `npx tsc --noEmit`: 클린.
- `npm run build`: 37 페이지 정상 생성.

---

## 2026-05-02 — main 머지 (Phase 8 + Phase 9 production 반영)

`claude/analyze-source-code-rncaC` → `main` fast-forward 머지. origin/main이 `0ed5fb6` → `2877d54`로 이동. Vercel 자동 배포 트리거됨.

**main에 들어간 커밋 (11개)**:
- 2877d54 Phase 9 community features
- 388b259 Phase 8 DEVLOG entry
- 232f732 Phase 8 보안·타입 강화 + 데드 코드 제거
- 0ed5fb6 (이미 origin/main에 있던 IA cleanup) 외 8개

**🔴 배포 체크리스트 (Vercel 환경에 반드시)**
1. Supabase SQL Editor에서 `0003_profiles.sql` → `0004_swap_posts.sql` → `0005_tips.sql` → `0006_companions.sql` 순서대로 실행
2. Vercel 환경변수 `IP_HASH_SALT`에 32자 이상 랜덤값 설정 (`openssl rand -hex 16`) — **미설정 시 비로그인 AI 글쓰기 503**
3. `pg_trgm` 확장 권한 확인 (0003에서 자동 시도)

---

## 2026-05-02 — Phase 9: 커뮤니티 기능 1차 구축 (서이추 / 정보공유 / 체험단동행)

**브랜치**: `claude/analyze-source-code-rncaC`
**배경**: 사용자 요청 — 회원 간 커뮤니티 3종 (서이추, 정보공유, 체험단동행) 신설. 기획서 작성 후 결정 사항 6개 확정 → Phase A → B → C(정보공유) → E(체험단) 일괄 구현.

### 결정 사항 (확정)
- 메뉴 명칭: **커뮤니티**
- 비로그인 정책: 읽기 누구나, 쓰기·댓글·좋아요는 로그인 필요
- 닉네임 변경 정책: 24시간 1회 (트리거로 강제)
- 서이추 1일 1글 (RLS policy로 강제)
- 체험단 연락 방법: 자유 텍스트 (오픈채팅 URL 권장)

### 9-A. 공통 기반
- **마이그레이션 0003 `profiles`**: nickname unique(2~16자), blog_url, category, bio, nickname_changed_at, RLS(모두 읽기 / 본인만 쓰기), pg_trgm 닉네임 검색 인덱스, 닉네임 24h cooldown 트리거.
- **`app/lib/community/`**: `categories.ts` (16개 분야 + 일상/맛집), `regions.ts` (지역·시간대·companion status), `profile.ts` (검증·CRUD 헬퍼).
- **공통 컴포넌트**: `CategoryChips`, `NicknameBadge`, `EmptyState`, `ConfirmModal` (각 메뉴 재사용).
- **`app/profile/setup/page.tsx`**: 닉네임/블로그URL/분야/소개 등록·수정. Suspense 래핑 (useSearchParams).
- **`app/community/page.tsx`**: 3개 카드 허브 (그라데이션 액센트 + 안내문).
- **Navbar**: "커뮤니티" 드롭다운 추가 (호버/클릭, 외부클릭 닫기 150ms 딜레이). 모바일 메뉴 평면 노출.

### 9-B. 서이추 해요 (`/community/swap`)
- **마이그레이션 0004 `swap_posts`**: nickname/blog_url/category/message(200자), pg_trgm 닉네임 인덱스, **RLS INSERT 정책에 24시간 내 작성 이력 검사 강제** (sub-select). 본인만 UPDATE/DELETE.
- **목록**: 카드 그리드 (분야 필터 칩 + 닉네임 ilike 검색 debounce 300ms), 본인 글이면 [수정][삭제] 노출.
- **작성 모달**: 1일 1글 안내 + profile에서 닉네임/블로그URL 자동 채움. RLS 차단 시 "하루에 한 번만 작성할 수 있습니다" 안내. 수정은 cooldown 무관.

### 9-C. 정보 공유 (`/community/tips`, `/new`, `/[id]`)
- **마이그레이션 0005 `tips_posts/comments/likes`**:
  - `tips_category` enum (질문/정보공유/노하우/트러블슈팅/수익후기/잡담)
  - `tips_posts`: title(2~80자), body(10000자), view/like/comment count, pg_trgm 제목 인덱스, 카테고리·인기·최신 다중 인덱스.
  - `tips_comments`: post_id FK cascade, 1000자 제한.
  - `tips_likes`: composite PK, INSERT/DELETE trigger로 like_count 동기화.
  - 댓글 INSERT/DELETE trigger로 comment_count 동기화.
  - `tips_increment_view(post_id)` SECURITY DEFINER RPC (anon/authenticated 모두 호출 가능).
- **`app/lib/community/tips.ts`**: TIPS_CATEGORIES + 카테고리 배지 색상 매핑.
- **목록**: 행 리스트 (카테고리 배지 + 제목 + 댓글수 / 닉네임·시간·조회·추천), 카테고리 탭, 제목 검색, 최신순/인기순 토글, 페이지네이션 (20개/페이지, count: exact).
- **작성** (`new`): 마크다운 textarea + 미리보기 토글 (`markdownToHtml` 재사용). `?id=` 쿼리로 수정 모드.
- **상세** (`[id]`): 마크다운 렌더링, 좋아요 토글, 댓글 작성/삭제, 조회수 sessionStorage 중복 방지, 본인 글 수정/삭제.

### 9-E. 체험단 동행해요 (`/community/companions`, `/new`, `/[id]`)
- **마이그레이션 0006 `companion_posts`**:
  - `companion_status` enum (모집중/마감/완료), `companion_time_slot` enum.
  - title/brand_name/region/visit_date/visit_time_slot/participants(1~10)/contact_method(200자)/message(2000자).
  - **RLS INSERT에 `visit_date >= current_date` 강제** (과거 날짜 차단).
  - status+visit_date / region+visit_date 복합 인덱스.
- **목록**: 카드 그리드, 지역 select 필터, 모집중만 보기 토글, 방문일 임박순 정렬. 안전 안내 amber 박스.
- **작성**: 날짜 input min=today, 인원 1~10 clamp, 연락 방법 오픈채팅 권장 안내.
- **상세**: dl 레이아웃 정보 표시, 연락 방법은 URL이면 자동 링크화. 본인 글이면 status select(모집중/마감/완료) + 수정/삭제.

### 라우팅 / 정적 페이지 처리
- `useSearchParams` 사용 페이지 3종 (`profile/setup`, `tips/new`, `companions/new`)는 `Suspense` 래퍼 + 내부 컴포넌트 분리로 prerender 호환.

### 검증
- `npx tsc --noEmit`: 클린.
- `IP_HASH_SALT=...` `npm run build`: **37개 페이지** 정상 생성 (이전 30 + 커뮤니티 7 + profile/setup).
- lint: 새 파일 0 errors / 0 warnings.
- 신규 파일 17개, 마이그레이션 SQL 4개 (0003~0006).

### 배포 전 체크리스트
1. Supabase SQL Editor에서 마이그레이션 0003 → 0004 → 0005 → 0006 순서대로 실행.
2. `pg_trgm` extension 설치 확인 (0003에서 자동 시도).
3. 비로그인 사용자도 SELECT 가능하도록 RLS 정책 확인.

### 후속 작업 (Phase D / F — 미실시)
- 좋아요 카운터의 race condition 검증 (현재 trigger로 동기화)
- 신고/차단 시스템
- 마이페이지 (내 글 모음)
- Postgres FTS (현재는 ilike 부분일치만)
- 운영자 공지 핀

---

## 2026-05-02 — Phase 8: 보안·타입 강화 + 데드 코드 정리

**커밋**: `232f732` (브랜치 `claude/analyze-source-code-rncaC`)
**배경**: 전체 소스코드 분석 결과 5개 개선 항목 도출 — 그 중 실제 미적용분만 수정, 동시에 미사용 코드 정리.

### 분석에서 이미 적용 확인됨 (수정 불필요)
- `/api/images/proxy`: ALLOWED_HOSTS 화이트리스트 이미 적용됨 (Pexels/Unsplash 호스트만 허용).
- `/api/news`, `/api/spellcheck`, `/api/competitor-analysis`, `/api/wiki-pageviews`, `/api/images/search`: 응답 타입 인터페이스 모두 이미 정의됨.
- `app/lab/PostImage.tsx`: next/image 이미 사용 중.
- 테스트 파일/디렉토리: 처음부터 없음.

### 8-1. IP_HASH_SALT 평문 fallback 제거 (`app/lib/security/ip-hash.ts`)
- 기존: `process.env.IP_HASH_SALT || 'boheme-bloglab-default-salt'` — 환경변수 미설정 시 코드에 박힌 평문이 그대로 사용돼 비로그인 IP 해시가 사실상 익명화 안 됨.
- 변경: salt 미설정 또는 16자 미만이면 throw. `app/api/ai-draft/route.ts` POST/GET 양쪽에서 try/catch로 감싸 503 `IP_HASH_NOT_CONFIGURED` 응답 처리.

### 8-2. next/image 마이그레이션 + 도메인 화이트리스트
- `next.config.ts`: `images.remotePatterns`에 pexels/unsplash/google avatar 도메인 추가.
- `app/components/Navbar.tsx`: 데스크톱·모바일 사용자 아바타 `<img>` → `<Image unoptimized>` (Google CDN URL 잦은 변경 대응).
- `app/image-search/page.tsx`: 검색 결과 그리드 `<img>` → `<Image fill sizes>` (썸네일 12장 자동 최적화 + lazy loading).

### 8-3. `any` 제거 + API 응답 타입화
- `app/components/AdSense.tsx`: `(window as any).adsbygoogle` → `declare global { Window.adsbygoogle?: ... }` augmentation.
- `app/api/keywords/route.ts`: `NaverKeywordToolItem` / `NaverKeywordToolResponse` 인터페이스 추가, `cache.get<unknown>` → `<NaverKeywordToolResponse>`.
- `app/api/document-count/route.ts`: `data: any` → `{ total?: number }`.
- `app/api/competitor-analysis/route.ts`: `data: any` → `{ total?: number; items?: BlogPost[] }`.
- `app/api/trending-keywords/route.ts`: keywordList 응답에 `{ keywordList?: NaverKeywordItem[] }` 캐스팅.

### 8-4. 데드 코드 제거
- `app/components/AdPlaceholder.tsx`: 어디서도 import되지 않은 미사용 컴포넌트 — 파일 자체 삭제.
- `app/lib/fetchRetry.ts`: 미사용 `fetchJsonWithRetry`, `FetchError` 클래스 제거.
- `app/lib/cache.ts`: 미사용 `TTLCache.wrap` 메서드 제거.
- `app/lab/PostImage.tsx`: 사용되지 않던 `slug` prop 제거 (호출부 `app/lab/page.tsx`도 정리).

### 검증
- `npx tsc --noEmit`: 클린.
- `IP_HASH_SALT=...` `npm run build`: 30개 페이지 모두 정상 생성, Turbopack 컴파일 21.6s.
- 변경 라인: +92 / -89 (15 files changed).

### 영향 / 후속
- 비로그인 IP 해시가 운영 환경에서 진짜 익명화됨 (salt 강제 → Vercel env에 미설정 시 명확한 503).
- 이미지 그리드의 LCP·CLS 개선 (next/image 자동 최적화).
- 향후 Naver 검색광고 API 응답 추가 필드 활용 시 타입 도움말 자동 제공.
- ⚠️ 배포 전 Vercel 환경변수에 `IP_HASH_SALT` (32자 이상 권장, `openssl rand -hex 16`)가 설정되어 있는지 확인 필수.

---

## 2026-04-27 — Phase 7: IA 정리 — 메뉴 메가패널 + 가이드를 lab으로

**커밋**: 단일 커밋 (이번 작업)
**배경**: 사용자가 두 가지 IA 문제 지적 — (1) 모든 도구 페이지 하단의 GuideSection이 워크플로우 흐름을 깨고 반복적이며 부자연스러움. (2) 메뉴 그룹핑이 깊어 도구 발견에 매번 두 번 클릭.

### 7-1. GuideSection 일괄 제거 (9개 도구 페이지)
- `app/page.tsx`, `trending/page.tsx`, `keyword-analysis/page.tsx`, `competitor-analysis/page.tsx`, `prompt-generator/page.tsx`, `ai-writer/page.tsx`, `editor/page.tsx`, `image-search/page.tsx`, `image-tools/page.tsx`에서 `<GuideSection ... />` JSX 블록과 `import GuideSection` 제거.
- 자리에 작은 lab 링크 1줄 ("📖 더 자세한 사용법은 연구실에서 확인하세요 →")로 교체. 도구 흐름은 깨끗하게, 학습 욕구는 lab으로 유도.
- `app/lab/page.tsx`는 그대로 유지 — lab이 학습 허브 역할이니 GuideSection 자연스러움.
- `GuideSection.tsx` 컴포넌트는 lab에서 계속 쓰니 보존.
- 순 -150여 라인 코드 간소화. 가이드 콘텐츠 자체는 git 히스토리에 보존(추후 lab 글로 점진 마이그레이션 가능).

### 7-2. Navbar 메가패널로 재구성 (`app/components/Navbar.tsx` 재작성)
- **데스크톱 평면 노출**: `[로고 + STEP 배지] | 키워드분석 | AI 글쓰기 | 에디터 | 모든 도구 ▾ | 연구실` — 가장 자주 쓰는 핵심 도구 3개가 한 클릭에 접근.
- **현재 단계 배지**: pathname을 8단계 워크플로우와 매칭해 로고 옆에 `STEP N/8` 칩 표시 (lg+ 화면).
- **"모든 도구" 메가패널**: 호버(150ms 닫힘 딜레이) 또는 클릭으로 펼침. 3-컬럼 그리드로 워크플로우 좌→우 표시:
  - STEP 1~3 키워드 리서치 (인기검색어 / 키워드분석 / 상위노출 분석)
  - STEP 4~6 글쓰기 (프롬프트 생성 / AI 글쓰기 / 금칙어·맞춤법)
  - STEP 7~8 이미지 (이미지 검색 / 이미지 편집)
  각 항목에 step 번호 + label + description 함께 노출. 현재 페이지면 indigo bg 강조.
- 외부 클릭/페이지 이동/Esc 시 자동 닫힘.
- **모바일 햄버거**: 그룹 헤딩(STEP N~N + 그룹명) + 8단계 평면 항목 + 연구실 별도. 항목마다 step 번호, label, description, min-h-[44px] iOS 터치 타겟.
- WORKFLOW 데이터 구조 단일 소스로 관리 — 데스크톱 메가패널·모바일 메뉴·STEP 배지가 같은 배열에서 파생.

### 영향 / 효과
- 도구 페이지에서 시선 분산 요소 제거, 워크플로우(FlowNav)와 가이드(lab 링크)가 한 줄씩 자기 역할만 함.
- 핵심 도구 3개는 한 클릭, 나머지 5개는 호버 1회 + 클릭으로 모두 워크플로우 순서 그대로 노출.
- "지금 몇 단계인가"가 로고 옆 STEP 배지 + 메가패널 강조로 두 곳에서 시각화.
- 빌드 + tsc 클린.

---

## 2026-04-27 — Phase 6: 뉴스→프롬프트 흐름 + 관련도 필터링

**커밋**: 단일 커밋 (이번 작업)
**배경**: 사용자가 키워드 분석의 "관련 뉴스" 기능이 글쓰기 방향 결정에 핵심적이라 평가 → 버튼이 작아서 발견 어렵고, 뉴스 본 뒤 프롬프트로 이어지는 흐름이 단절됨. 또한 본문에 키워드 한 번만 있어도 노출되는 관련도 문제 지적.

### 6-1. NewsPanel 강화 (`app/components/NewsPanel.tsx` 재작성)
- **API 정렬 기본값 `sort=sim`** (정확도순) — 기존 `date`(최신순)에서 변경. props로 override 가능.
- **클라이언트 사이드 점수**: 제목 매칭 +10 (반복 +3), 설명 매칭 +1, 모든 토큰 제목 포함 +5, 7일 이내 +2.
- **"관련도 낮은 항목 숨김" 토글** (기본 ON) — 점수 < 5 항목 숨김. 모두 필터링되면 안전망으로 무시.
- **정렬 토글 UI**: 정확도순 ↔ 최신순 segment control.
- **체크박스 + CTA** (selectable=true 시): 최대 3건 선택, 하단 sticky 버튼 "선택한 뉴스로 프롬프트 만들기".
- `onCreatePrompt` 콜백 prop으로 부모에 위임 (router 결합도 분리).
- `display` 기본 10 → 15 (필터 후에도 충분한 항목 남기기).

### 6-2. 키워드 분석 — "뉴스" 컬럼 분리 + chip 버튼 (`app/keyword-analysis/page.tsx`)
- 테이블 헤더에 "뉴스" 컬럼 신설 (액션 컬럼 앞).
- 기존 신문 아이콘(16×16)을 indigo chip 버튼 "📰 뉴스 보기"로 교체 (`btn`-스타일, min-h-[32px], 텍스트+아이콘).
- 액션 컬럼은 삭제 아이콘만 남김.
- 모달의 NewsPanel에 `selectable` + `onCreatePrompt` 콜백 전달:
  - `sessionStorage.setItem('promptNewsContext', { keyword, items })`
  - 모달 닫고 `/prompt-generator?keyword=...`로 라우팅.

### 6-3. 프롬프트 생성 — 뉴스 컨텍스트 수신 + UI + prompt prefix (`app/prompt-generator/page.tsx`)
- mount 시 `promptNewsContext` 읽고 state 적재 후 sessionStorage 즉시 정리 (1회성).
- "프롬프트 설정" 카드 상단에 indigo 컨텍스트 카드 추가:
  - 뉴스 N건 표시, 제목 1줄씩 line-clamp.
  - "제거" 버튼으로 컨텍스트 해제 가능.
- `generatePrompt()`에 prefix 주입 — 뉴스 N건의 제목·요약·날짜를 list로 정리 + "위 뉴스 흐름을 본문에 자연스럽게 반영하되, 그대로 인용하지 말고 재구성하라"는 가이드 문장.

### 흐름 요약
```
키워드 분석 [뉴스 보기] → NewsPanel 모달 (정확도순+필터) → 체크박스 1~3건 선택
→ "선택한 뉴스로 프롬프트 만들기" → /prompt-generator
→ 컨텍스트 카드 자동 표시 + 프롬프트 생성 시 뉴스 prefix 자동 포함
→ AI 글쓰기로 보내면 시의성·구체성 강한 글 생성
```

### 비용
관련 뉴스 호출은 **네이버 오픈API의 뉴스 검색** (무료, 일 25,000회 한도). 클로드 API와 무관 — AI 비용 0원.

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
