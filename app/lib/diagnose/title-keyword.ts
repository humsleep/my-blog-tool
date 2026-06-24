/**
 * 블로그 글 제목 → 검색 노출 측정용 핵심 키워드 추출 (AI API 0, 형태소 분석기 0).
 *
 * 진단 v3 (Phase 59): "분야 고정 키워드 30개"가 아니라 "내가 실제로 쓴 글이 노린 키워드"로
 * 노출을 측정하기 위해, 각 글 제목에서 검색어로 쓰였을 핵심 구를 휴리스틱으로 뽑는다.
 *
 * 전제: 한국어 블로그 제목은 핵심 키워드를 앞쪽에 배치하는 것이 정석
 *       (코치의 "제목 첫 12자 키워드" 체크와 동일 전제).
 *       → 말머리(대괄호)·이모지·꼬리 표현(후기/리뷰/다녀왔어요 등)을 걷어낸 뒤
 *         앞쪽 콘텐츠 토큰 2~3개를 검색 키워드로 본다.
 */

/** 키워드가 아니라 글 형식·말투를 가리키는 꼬리표 토큰 — 통째로 제거. */
const FILLER_TOKENS = new Set([
  '후기', '리뷰', '솔직후기', '내돈내산', '추천템', '총정리', '모음',
  '모음집', '방문기', '사용기', '개봉기', '체험기', '구매기', '비교기',
  '브이로그', 'vlog', '일기', '잡담', '근황', 'feat', 'with', 'review',
]);

/** 시간·감탄 등 말머리에 자주 붙는 토큰 — 조사가 붙어도 잡도록 prefix 매칭. */
const LEADING_FILLER = [
  '오늘', '어제', '내일', '요즘', '드디어', '드뎌', '진짜', '완전',
  '너무', '정말', '역시', '일상', '데일리', '기록',
];

/** 서술형 종결 토큰(동사·형용사) — 키워드가 될 수 없음. */
const VERB_TAIL =
  /(했어요|했다|해요|합니다|니다|봤어요|봤다|봤어|가봤|다녀왔|다녀온|먹어봤|써봤|써본|샀어요|샀다|입니다|이에요|예요|네요|더라|드려요|드림|할까|일까|될까|어때|어땠|추천해|추천드)/;

function isFiller(token: string): boolean {
  const lower = token.toLowerCase();
  if (FILLER_TOKENS.has(lower)) return true;
  if (LEADING_FILLER.some((f) => lower.startsWith(f))) return true;
  return false;
}

/**
 * 제목에서 검색 키워드 추출. 못 뽑으면 null.
 * 결과는 2자 이상, 보통 2~3 토큰(최대 20자)의 검색어.
 */
export function extractTargetKeyword(rawTitle: string): string | null {
  if (!rawTitle) return null;
  let t = rawTitle;

  // 1) 말머리/꼬리 괄호 그룹 제거: [내돈내산] 【협찬】 (광고) <리뷰> 「공지」
  t = t.replace(/[[(<【「][^\])>】」]*[\])>】」]/g, ' ');

  // 2) 이모지·특수문자 제거 — 한글·영문·숫자·공백만 남김
  t = t.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;

  const tokens = t.split(' ').filter(Boolean);
  const picked: string[] = [];
  for (const tok of tokens) {
    // 1음절 한글 토큰(한·두·그·이·약·총 등 관형사/수사)은 키워드 본체가 아님 → 소프트 종료.
    // 숫자 1자리("5" 등)는 의미 있을 수 있어 제외.
    const isSingleSyllable = tok.length === 1 && /[가-힣]/.test(tok);
    if (isFiller(tok) || VERB_TAIL.test(tok) || isSingleSyllable) {
      // 꼬리 표현/노이즈를 만났는데 이미 키워드를 모았다면 거기서 종료.
      if (picked.length > 0) break;
      continue; // 아직 못 모았으면 말머리로 보고 건너뜀
    }
    picked.push(tok);
    if (picked.length >= 3) break;
  }

  let keyword = picked.join(' ').trim();
  if (keyword.length > 20) keyword = picked.slice(0, 2).join(' ').trim();

  // 폴백 — 아무것도 못 뽑았으면 정제 제목 앞 2토큰.
  if (keyword.length < 2) {
    keyword = tokens.slice(0, 2).join(' ').slice(0, 20).trim();
  }
  return keyword.length >= 2 ? keyword : null;
}

/**
 * 글 목록 → 중복 제거된 검색 키워드 목록 (출처 제목 동반).
 * 같은 키워드를 노린 글이 여러 편이면 첫 글만 대표로 남긴다.
 */
export function buildTargetKeywords(
  items: { title: string }[],
  limit: number,
): { keyword: string; postTitle: string }[] {
  const seen = new Set<string>();
  const out: { keyword: string; postTitle: string }[] = [];
  for (const it of items) {
    if (out.length >= limit) break;
    const kw = extractTargetKeyword(it.title);
    if (!kw) continue;
    const key = kw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ keyword: kw, postTitle: it.title });
  }
  return out;
}
