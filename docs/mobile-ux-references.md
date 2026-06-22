# 모바일 UI/UX 레퍼런스 모음 (2025–2026)

> Boheme BlogLab 모바일 화면 업그레이드를 위한 트렌드 리서치 + 적용 가이드.
> 출처는 문서 하단 참고.

---

## 1. 핵심 트렌드 요약

### ① 하단 탭바(Bottom Navigation)가 표준
- 모바일 인터랙션의 **75%가 한 손 엄지**로 이루어짐. 편한 영역은 **화면 하단 1/3 + 주 사용 손 쪽 곡선**.
- 탭은 **3~5개, 4개가 스위트 스폿**. 더 적으면 비어 보이고, 더 많으면 터치 타겟이 좁아짐.
- 선택 탭은 **색 변화 + 인디케이터(언더라인/필/도트)**로 명확히.
- 하단 탭은 상단 메뉴 대비 **탐색 속도 21% 빠름**(UX Movement).

### ② 바텀시트(Bottom Sheet)가 보조 콘텐츠의 기본 컨테이너
- 풀스크린이 필요 없는 모든 것(설정·필터·확인·미리보기·공유·메뉴)은 **드래그 가능한 바텀시트**로.
- 예시: **Apple Maps**(검색 UI 전체를 바텀시트로), **Spotify "Your Library"**(상단 가로 스크롤 칩 + 바텀시트 필터).
- 2026년엔 "보이지 않는 UI"로 진화 — 버튼 클러터를 줄이고 **스와이프/드래그 제스처**로 흐름을 만든다.

### ③ FAB는 "단일 주요 액션"에만
- Material Design의 FAB는 여전히 유효하지만, **콘텐츠를 가리는 스택형 FAB는 퇴조**.
- 트렌드는 **주요 액션을 하단 바에 통합**(가운데 강조 버튼). 우하단 정렬이 가장 흔함(오른손잡이 다수).

### ④ 마이크로 인터랙션 + 햅틱
- 좋아요 바운스, 토글 햅틱 펄스, 탭 시 가벼운 진동 등 **시각 + 촉각 피드백 결합**.
- **300ms 이하** 유지 — 더 길면 딜레이처럼 느껴짐.
- 가벼운 **CSS 트랜지션 / 최적화된 SVG 애니메이션** 선호.

### ⑤ 스켈레톤 로딩
- 펄스 스켈레톤 / "숨 쉬는" 프로그레스 바로 대기 시간을 "진행 중"으로 인식 전환.

---

## 2. 우리 앱에 바로 적용할 패턴

| 트렌드 | 현재 상태 | 적용 방향 |
|---|---|---|
| 하단 탭바 4개 | ✅ 보유 (홈/도구/커뮤니티/진단) | 활성 인디케이터 **모션**(슬라이딩 필/도트) + 탭 시 스케일 |
| 바텀시트 | ❌ 햄버거가 상단 드롭다운 | 모바일 메뉴를 **하단에서 올라오는 바텀시트**(드래그 핸들 + backdrop)로 전환 |
| FAB / 주요 액션 | ❌ | (선택) 하단 바 가운데 **글쓰기 강조 버튼** |
| 마이크로 인터랙션 | 일부 (transition) | `active:scale-95`, 인디케이터 morph, 300ms 이하 |
| thumb-zone | 부분적 (44px 타겟) | 주요 CTA를 하단/엄지 영역에 배치 |
| 스켈레톤 | ✅ 일부 보유 | 유지·확대 |
| safe-area | ✅ 보유 | 유지 |

---

## 3. 참고할 만한 예시 앱 / 갤러리

- **Apple Maps / Spotify** — 바텀시트 + 가로 스크롤 칩 필터
- **Instagram / Threads** — 하단 탭 + 중앙 작성 액션, 부드러운 탭 전환 모션
- **Toss(토스)·당근마켓** — 한국형 모바일 UX 레퍼런스(큰 터치 타겟, 단계형 바텀시트, 햅틱)
- **Mobbin** (mobbin.com) — 실제 앱 스크린 패턴 아카이브(하단 탭/바텀시트/FAB 변형)
- **Material Design 3** (m3.material.io) — Navigation bar / Bottom sheet 스펙

---

## 출처 (Sources)

- [Mobile App Design Trends 2026: UI Patterns — Muzli](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/)
- [Mobile App Navigation Design: 2026 UX Best Practices — Medium](https://medium.com/ui-ux-designing-trends/mobile-app-navigation-design-2026-ux-best-practices-5b2db901790d)
- [Mobile Navigation UX Best Practices, Patterns & Examples (2026) — DesignStudio](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Mobile App UX: Designing for Thumb Zones and Gestures — Elaris](https://elaris.software/blog/mobile-ux-thumb-zones-2025/)
- [Floating Action Button UI Design — Mobbin Glossary](https://mobbin.com/glossary/floating-action-button)
- [5 Micro-Interaction Design Rules for Apps in 2026 — DEV](https://dev.to/devin-rosario/5-micro-interaction-design-rules-for-apps-in-2026-48nb)
- [How Micro-Interactions & Motion Design Improve UX in 2026 — Acodez](https://acodez.in/micro-interactions-motion-design/)
- [16 Key Mobile App UI/UX Design Trends (2026) — Spdload](https://spdload.com/blog/mobile-app-ui-ux-design-trends/)
