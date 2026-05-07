# DEVLOG — Boheme BlogLab

> 시간순 작업 일지. 새 세션은 `/resume` 슬래시 커맨드로 최근 항목 + git log를 한 번에 로드합니다.
> CLAUDE.md는 본질만 (자동 로드, 슬림 유지). 진행 상황은 여기에 누적.

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
