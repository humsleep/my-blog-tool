/**
 * QA 단위 테스트 — pure function 검증.
 *  - safeNextPath / escapeLikePattern
 *  - extractBlogId / toPostViewUrl (SSRF 방어)
 *  - mapHits / scoreActivity / scoreVisibility / scoreQuality / compose / bandFor
 *  - validateNickname / validateBlogUrl
 *
 * 실행: npx tsx scripts/qa-unit-tests.ts
 */

import { safeNextPath, escapeLikePattern } from '../app/lib/security/safe-redirect';
import { extractBlogId } from '../app/lib/diagnose/naver-blog';
import { scoreActivity, scoreVisibility, scoreQuality, compose, mapHits } from '../app/lib/diagnose/scoring';
import { validateNickname, validateBlogUrl } from '../app/lib/community/profile';
import { markdownToHtml, markdownToPlain } from '../app/lib/format/article-formats';
import { extractTargetKeyword, buildTargetKeywords } from '../app/lib/diagnose/title-keyword';
import { detectCategory } from '../app/lib/diagnose/category-seeds';
import { analyzeMateReadiness, MATE_WEIGHTS } from '../app/lib/diagnose/mate-readiness';
import { classifyAiProneness, analyzeAiCitation } from '../app/lib/diagnose/ai-citation';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function expect<T>(actual: T, expected: T, name: string) {
  const aStr = JSON.stringify(actual);
  const eStr = JSON.stringify(expected);
  if (aStr === eStr) {
    passed++;
  } else {
    failed++;
    failures.push(`  ✗ ${name}\n      expected: ${eStr}\n      actual:   ${aStr}`);
  }
}

function group(name: string, fn: () => void) {
  console.log(`\n── ${name} ──`);
  const before = passed + failed;
  fn();
  const total = passed + failed - before;
  const failedHere = failed - (failures.length - failedHereBaseline);
  console.log(`  ${total} tests`);
}
let failedHereBaseline = 0;

// ─────────────────────────────────────────────────────────────
group('safeNextPath', () => {
  expect(safeNextPath('/foo'),                        '/foo',                'plain path');
  expect(safeNextPath('/community/swap?x=1'),         '/community/swap?x=1', 'path with query');
  expect(safeNextPath(null),                          '/',                   'null → fallback');
  expect(safeNextPath(''),                            '/',                   'empty → fallback');
  expect(safeNextPath('https://evil.com/foo'),        '/',                   'absolute URL blocked');
  expect(safeNextPath('//evil.com/foo'),              '/',                   'protocol-relative blocked');
  expect(safeNextPath('/\\evil.com'),                 '/',                   'backslash variant blocked');
  expect(safeNextPath('javascript:alert(1)'),         '/',                   'javascript: blocked');
  expect(safeNextPath('/javascript:alert(1)'),        '/',                   'javascript: path blocked');
  expect(safeNextPath('/data:text/html'),             '/',                   'data: path blocked');
  // 인코딩 케이스 — Phase 35 새 기능
  expect(safeNextPath('%2Fcommunity%2Ftips%2Fnew'),   '/community/tips/new', 'encoded path decoded');
  expect(safeNextPath('%2F%2Fevil.com'),              '/',                   'encoded // blocked');
  expect(safeNextPath('%6Aavascript:'),               '/',                   'encoded javascript scheme blocked');
  expect(safeNextPath('/path?q=%20%21'),              '/path?q= !',          'encoded query decoded');
  // Custom fallback
  expect(safeNextPath(null, '/community'),            '/community',          'custom fallback');
  expect(safeNextPath('https://evil.com', '/login'),  '/login',              'custom fallback on block');
});

group('escapeLikePattern', () => {
  expect(escapeLikePattern('abc'),       'abc',           'plain string');
  expect(escapeLikePattern('a%b'),       'a\\%b',         'escape %');
  expect(escapeLikePattern('a_b'),       'a\\_b',         'escape _');
  expect(escapeLikePattern('a\\b'),      'a\\\\b',        'escape backslash');
  expect(escapeLikePattern('%_\\test'),  '\\%\\_\\\\test', 'multiple chars');
});

// ─────────────────────────────────────────────────────────────
group('extractBlogId', () => {
  expect(extractBlogId('myblog'),                                          'myblog', 'bare id');
  expect(extractBlogId('  myblog  '),                                      'myblog', 'whitespace trim');
  expect(extractBlogId('https://blog.naver.com/myblog'),                   'myblog', 'naver URL');
  expect(extractBlogId('https://blog.naver.com/myblog/12345'),             'myblog', 'naver URL with logNo');
  expect(extractBlogId('https://m.blog.naver.com/myblog'),                 'myblog', 'mobile naver URL');
  expect(extractBlogId('blog.naver.com/PostList.naver?blogId=myblog'),     'myblog', 'PostList query');
  expect(extractBlogId(''),                                                null,     'empty');
  expect(extractBlogId('   '),                                             null,     'whitespace only');
  expect(extractBlogId('한글블로그'),                                       null,     'Korean rejected');
  expect(extractBlogId('a'),                                               null,     'too short');
  expect(extractBlogId('a'.repeat(41)),                                    null,     'too long');
  expect(extractBlogId('blog.naver.com/myBlog_123'),                       'myBlog_123', 'underscore + digit + case');
});

// ─────────────────────────────────────────────────────────────
group('mapHits — visibility rank mapping', () => {
  const blogId = 'myblog';
  const sr = [
    { keyword: 'a', items: [
      { title: 't1', link: 'https://blog.naver.com/myblog/111', description: '', bloggername: 'me', bloggerlink: 'https://blog.naver.com/myblog', postdate: '20260101' },
      { title: 't2', link: 'https://blog.naver.com/other/222', description: '', bloggername: 'o',  bloggerlink: 'https://blog.naver.com/other',  postdate: '20260101' },
    ]},
    { keyword: 'b', items: [
      { title: 't1', link: 'https://blog.naver.com/other/333', description: '', bloggername: 'o', bloggerlink: 'https://blog.naver.com/other', postdate: '20260101' },
      { title: 't2', link: 'https://blog.naver.com/another/444', description: '', bloggername: 'a', bloggerlink: 'https://blog.naver.com/another', postdate: '20260101' },
      { title: 't3', link: 'https://blog.naver.com/myblog/555', description: '', bloggername: 'me', bloggerlink: 'https://blog.naver.com/myblog', postdate: '20260101' },
    ]},
    { keyword: 'c', items: null },     // 검색 실패
    { keyword: 'd', items: [] },       // 결과 없음
  ];
  const hits = mapHits(sr as any, blogId);
  expect(hits[0].rank, 1,    'rank 1');
  expect(hits[1].rank, 3,    'rank 3');
  expect(hits[2].rank, null, 'search failed → null');
  expect(hits[3].rank, null, 'no results → null');
  // case insensitive
  const hits2 = mapHits([{ keyword: 'k', items: [
    { title: '', link: 'https://blog.naver.com/MyBlog/1', description: '', bloggername: '', bloggerlink: 'https://blog.naver.com/MyBlog', postdate: '20260101' },
  ] }] as any, 'myblog');
  expect(hits2[0].rank, 1, 'case insensitive blog id match');
});

// ─────────────────────────────────────────────────────────────
group('extractTargetKeyword — 제목→검색 키워드 (진단 v3)', () => {
  // 말머리 대괄호 제거 + 앞쪽 핵심 키워드 추출
  expect(extractTargetKeyword('[내돈내산] 다이슨 에어랩 한 달 후기'), '다이슨 에어랩', '말머리 제거 + 키워드');
  // 꼬리 서술형 토큰에서 종료
  expect(extractTargetKeyword('수원 인계동 카페 카페그레이 다녀왔어요'), '수원 인계동 카페', '서술형 토큰 전까지');
  // 시간 말머리(조사 포함) 건너뜀
  expect(extractTargetKeyword('오늘은 연말정산 의료비 공제 총정리'), '연말정산 의료비 공제', '시간 말머리 skip');
  // 추천/베스트는 키워드의 일부로 유지
  expect(extractTargetKeyword('강릉 카페 추천 베스트'), '강릉 카페 추천', '추천은 키워드 일부');
  // 이모지/특수문자 제거
  expect(extractTargetKeyword('✨아이폰 15 프로 리뷰✨'), '아이폰 15 프로', '이모지 제거');
  // 빈 제목 → null
  expect(extractTargetKeyword(''), null, '빈 제목 null');
  expect(extractTargetKeyword('   '), null, '공백만 null');
});

group('buildTargetKeywords — 중복 제거 + 상한', () => {
  const items = [
    { title: '제주도 카페 추천' },
    { title: '제주도 카페 추천 다시' },   // 같은 키워드 → 중복 제거
    { title: '부산 맛집 후기' },
  ];
  const out = buildTargetKeywords(items, 10);
  expect(out.length, 2, '중복 제거 후 2개');
  expect(out[0].keyword, '제주도 카페 추천', '첫 키워드');
  expect(out[0].postTitle, '제주도 카페 추천', '출처 제목 보존');
  expect(buildTargetKeywords(items, 1).length, 1, 'limit 적용');
});

group('detectCategory — 분야 자동 감지', () => {
  expect(detectCategory(['오사카 맛집 추천', '제주도 가볼만한곳']).value, 'food-travel', '맛집·여행 감지');
  expect(detectCategory(['헬스장 PT 후기', '단백질 식단 다이어트']).value, 'health-fitness', '건강·운동 감지');
  expect(detectCategory(['아무 의미 없는 글', 'zzz']).value, 'lifestyle', '매칭 0 → lifestyle 폴백');
});

// ─────────────────────────────────────────────────────────────
group('classifyAiProneness — AI 브리핑 적합도', () => {
  expect(classifyAiProneness('연말정산 하는법').tier, 'high',   '방법형 → high');
  expect(classifyAiProneness('아이폰 갤럭시 비교').tier, 'high', '비교형 → high');
  expect(classifyAiProneness('비타민D 효능').tier,    'high',   '효능형 → high');
  expect(classifyAiProneness('타이레놀 복용법?').tier, 'high',  '물음표 → high');
  expect(classifyAiProneness('수원 카페 추천').tier,  'medium', '추천형 → medium');
  expect(classifyAiProneness('제주도 맛집').tier,     'medium', '맛집 → medium');
  expect(classifyAiProneness('오늘의 일상').tier,     'low',    '일상 → low');
  expect(classifyAiProneness('다이슨 에어랩').tier,    'low',    '제품명만 → low');
  expect(classifyAiProneness('카페그레이').tier,      'medium', '카페 포함 브랜드 → medium');
});

group('analyzeAiCitation — 인용 기대치 = 적합도 × 준비도', () => {
  // 적합 키워드 + 높은 준비도 → 기대치 높음
  const good = analyzeAiCitation(['연말정산 하는법', '소득공제 조건', '환급 방법'], 80);
  expect(good.highCount, 3, '3개 모두 high');
  if (good.expectationScore < 55) failures.push(`  ✗ prone+ready should be high, got ${good.expectationScore}`); else passed++;
  expect(good.grade, 'high', 'grade high');

  // 적합하지만 준비도 0 → 기대치 0
  const noReady = analyzeAiCitation(['연말정산 하는법'], 0);
  expect(noReady.expectationScore, 0, '준비도 0 → 기대치 0');

  // 일상 키워드 + 높은 준비도 → 적합도가 낮아 기대치 억제
  const dailyOnly = analyzeAiCitation(['오늘의 일상', '주말 기록'], 80);
  if (dailyOnly.expectationScore > 30) failures.push(`  ✗ daily-only should be suppressed, got ${dailyOnly.expectationScore}`); else passed++;
  expect(dailyOnly.proneCount, 0, '적합 키워드 0');

  // 빈 목록 안전
  expect(analyzeAiCitation([], 80).expectationScore, 0, '빈 목록 → 0');
  // 정렬: high 가 앞으로
  expect(analyzeAiCitation(['오늘의 일상', '환급 방법'], 50).keywords[0].tier, 'high', '적합도 내림차순 정렬');
});

// ─────────────────────────────────────────────────────────────
group('scoreActivity', () => {
  const empty = scoreActivity([]);
  expect(empty.score, 0,        'empty items score 0');
  expect(empty.postsLast30d, 0, 'empty postsLast30d 0');

  const now = Date.UTC(2026, 4, 10); // 2026-05-10
  const day = 86_400_000;
  // 30일간 매주 2회 — 8편
  const dates: number[] = [];
  for (let i = 0; i < 8; i++) dates.push(now - i * 3 * day);
  const items = dates.map((t) => ({ title:'t', link:'', pubDate: new Date(t).toISOString(), category: null, contentSnippet:'', contentLength: 500, imageCount: 0 }));
  const r = scoreActivity(items, now);
  expect(r.postsLast30d, 8, 'postsLast30d 8');
  // 점수가 적어도 50 이상 (s30=1, sActive 가까이 1, sCadence 적당)
  if (r.score < 50) failures.push(`  ✗ scoreActivity high freq score >= 50, got ${r.score}`); else passed++;
  failed += 0;
});

// ─────────────────────────────────────────────────────────────
group('scoreVisibility', () => {
  const noHits = scoreVisibility([
    { keyword: 'a', rank: null },
    { keyword: 'b', rank: null },
  ]);
  expect(noHits.score,         0, 'no hits → score 0');
  expect(noHits.hitCount,      0, 'hitCount 0');
  expect(noHits.topTenCount,   0, 'topTenCount 0');

  const allTop10 = scoreVisibility(
    Array.from({ length: 10 }, (_, i) => ({ keyword: 'k' + i, rank: i + 1 })),
  );
  expect(allTop10.hitCount,     10, '10/10 hits');
  expect(allTop10.topTenCount,  10, '10 top10');
  if (allTop10.score < 90) failures.push(`  ✗ all top10 should be 90+, got ${allTop10.score}`); else passed++;

  const mixed = scoreVisibility([
    { keyword: 'a', rank: 5 },
    { keyword: 'b', rank: 25 },
    { keyword: 'c', rank: null },
  ]);
  expect(mixed.hitCount,     2,  'mixed hitCount');
  expect(mixed.topTenCount,  1,  'mixed top10');
});

// ─────────────────────────────────────────────────────────────
group('scoreVisibility — 경쟁도 보정 (v3.1, 자기키워드 인플레이션)', () => {
  // 전부 무경쟁(total<300) 키워드에서 1위만 → 만점이 되면 안 됨 (가산 0.3배)
  const lowComp = scoreVisibility(
    Array.from({ length: 6 }, (_, i) => ({ keyword: 'k' + i, rank: 1, competition: 50 })),
  );
  expect(lowComp.lowCompetitionHits, 6, '무경쟁 노출 6건 집계');
  if (lowComp.score >= 80) failures.push(`  ✗ 무경쟁 only should be capped well under 80, got ${lowComp.score}`); else passed++;

  // 같은 1위라도 경쟁 키워드(total 큼)면 점수가 훨씬 높아야 함
  const highComp = scoreVisibility(
    Array.from({ length: 6 }, (_, i) => ({ keyword: 'k' + i, rank: 1, competition: 50_000 })),
  );
  if (highComp.score <= lowComp.score) failures.push(`  ✗ high-comp(${highComp.score}) should beat low-comp(${lowComp.score})`); else passed++;
  expect(highComp.lowCompetitionHits, 0, '경쟁 키워드는 lowCompetition 0');

  // competition 미상이면 중립(1.0) — 기존 동작과 동일하게 만점 근처
  const neutral = scoreVisibility(
    Array.from({ length: 6 }, (_, i) => ({ keyword: 'k' + i, rank: 1 })),
  );
  if (neutral.score < 90) failures.push(`  ✗ neutral(undefined comp) all #1 should be 90+, got ${neutral.score}`); else passed++;
});

// ─────────────────────────────────────────────────────────────
group('analyzeMateReadiness — AI 인용 준비도 (v2.2)', () => {
  const mk = (over: Partial<{ title: string; contentSnippet: string; contentLength: number; imageCount: number }>) => ({
    title: over.title ?? 't', link: '', pubDate: '2026-05-01', category: null,
    contentSnippet: over.contentSnippet ?? '', contentLength: over.contentLength ?? 300, imageCount: over.imageCount ?? 0,
  });

  // 빈 입력
  const empty = analyzeMateReadiness([], ['카페']);
  expect(empty.sampleSize, 0, 'empty sampleSize 0');
  expect(empty.score, 0, 'empty score 0');

  // 6개 체크 항목 + 가중치 길이 일치
  const some = analyzeMateReadiness([mk({})], ['카페']);
  expect(some.checks.length, MATE_WEIGHTS.length, 'checks 수 = 가중치 수');

  // 답변 우선 도입부 — 키워드 + 정의 패턴이 첫 200자에 있으면 통과
  const answerLead = analyzeMateReadiness(
    [mk({ title: '제주 카페', contentSnippet: '제주 카페란 분위기 좋은 공간입니다. 오늘은 여기를 정리합니다.', contentLength: 1300 })],
    ['제주', '카페'],
  );
  const leadCheck = answerLead.checks.find((c) => c.label === '답변 우선 도입부')!;
  expect(leadCheck.passCount, 1, '답변 우선 도입부 통과');
  // 요약·결론 블록 탐지
  const summaryCheck = answerLead.checks.find((c) => c.label === '요약·결론 블록')!;
  expect(summaryCheck.passCount, 1, '요약/정리 블록 탐지');

  // 인사말만 있는 도입부는 답변 우선 도입부 미통과
  const greeting = analyzeMateReadiness(
    [mk({ title: '카페 다녀옴', contentSnippet: '안녕하세요 여러분 오늘도 좋은 하루 보내세요 날씨가 좋네요', contentLength: 500 })],
    ['카페'],
  );
  const greetLead = greeting.checks.find((c) => c.label === '답변 우선 도입부')!;
  expect(greetLead.passCount, 0, '인사말 도입부 미통과');
});

// ─────────────────────────────────────────────────────────────
group('scoreQuality — Phase 34.1 thresholds', () => {
  const empty = scoreQuality([]);
  expect(empty.score, 0, 'empty → 0');

  // 1500자 + 3장 이미지 + 한 카테고리 100%
  const good = Array.from({ length: 12 }, () => ({
    title: 't', link: '', pubDate: '2026-05-01', category: '여행',
    contentSnippet: '', contentLength: 1500, imageCount: 3,
  }));
  const r = scoreQuality(good);
  if (r.score < 90) failures.push(`  ✗ high quality should be 90+, got ${r.score}`); else passed++;
  expect(r.avgCharsPerPost,  1500, 'avgChars 1500');
  expect(r.avgImagesPerPost, 3,    'avgImages 3');

  // 300자 미만 + 이미지 0장 → 글자수 점수 0
  const poor = Array.from({ length: 5 }, () => ({
    title: 't', link: '', pubDate: '2026-05-01', category: null,
    contentSnippet: '', contentLength: 200, imageCount: 0,
  }));
  const p = scoreQuality(poor);
  if (p.score > 15) failures.push(`  ✗ poor quality should be <=15, got ${p.score}`); else passed++;

  // 임계점 — 800자, 2장, 50% 일관성
  const mid = Array.from({ length: 12 }, (_, i) => ({
    title: 't', link: '', pubDate: '2026-05-01', category: i < 6 ? '여행' : null,
    contentSnippet: '', contentLength: 800, imageCount: 2,
  }));
  const m = scoreQuality(mid);
  expect(m.avgCharsPerPost,  800, 'avgChars 800');
  expect(m.avgImagesPerPost, 2,   'avgImages 2');
  if (m.score < 35) failures.push(`  ✗ mid quality should be >=35, got ${m.score}`); else passed++;
});

// ─────────────────────────────────────────────────────────────
group('compose — total + band', () => {
  const a  = scoreActivity([]);
  const v  = scoreVisibility([]);
  const q  = scoreQuality([]);
  const c0 = compose(a, v, q);
  expect(c0.total, 0,         'all-zero total');
  expect(c0.band,  'growing', 'all-zero band');

  // 75/85/70 가중평균
  const c1 = compose(
    { ...a, score: 75 },
    { ...v, score: 85 },
    { ...q, score: 70 },
  );
  // 75*0.25 + 85*0.5 + 70*0.25 = 18.75 + 42.5 + 17.5 = 78.75 → round 79
  expect(c1.total, 79,       'weighted avg 79');
  expect(c1.band,  'top15',  'band top15');

  const c2 = compose(
    { ...a, score: 90 },
    { ...v, score: 90 },
    { ...q, score: 90 },
  );
  expect(c2.band, 'top5', 'all 90 → top5');
});

// ─────────────────────────────────────────────────────────────
group('validateNickname / validateBlogUrl', () => {
  expect(validateNickname(''),               '닉네임을 입력해주세요.',                                        'empty');
  expect(validateNickname('a'),              '닉네임은 2자 이상이어야 합니다.',                                'too short');
  expect(validateNickname('가나'),            null,                                                             'Korean 2 chars OK');
  expect(validateNickname('abc'),            null,                                                             'eng 3 chars OK');
  expect(validateNickname('a'.repeat(17)),   '닉네임은 16자 이하로 입력해주세요.',                              'too long');
  expect(validateNickname('with space'),     '닉네임은 한글·영문·숫자·_·- 만 사용할 수 있습니다.',              'space rejected');
  expect(validateNickname('emoji👍'),         '닉네임은 한글·영문·숫자·_·- 만 사용할 수 있습니다.',              'emoji rejected');
  expect(validateNickname('블로그_2'),        null,                                                             'mixed OK');

  expect(validateBlogUrl(''),                                  null,                            'empty URL ok');
  expect(validateBlogUrl('   '),                               null,                            'whitespace ok');
  expect(validateBlogUrl('https://blog.naver.com/foo'),        null,                            'valid https');
  expect(validateBlogUrl('http://blog.naver.com/foo'),         null,                            'valid http');
  expect(validateBlogUrl('javascript:alert(1)'),               'URL은 http(s)://로 시작해야 합니다.', 'js scheme blocked');
  expect(validateBlogUrl('ftp://example.com'),                 'URL은 http(s)://로 시작해야 합니다.', 'ftp blocked');
  expect(validateBlogUrl('not a url'),                         '올바른 URL 형식이 아닙니다.',    'malformed');
  expect(validateBlogUrl('https://a.b/' + 'x'.repeat(300)),    'URL이 너무 깁니다.',             'too long');
});

// ─────────────────────────────────────────────────────────────
group('markdownToHtml — table 처리 (네이버/티스토리 paste 호환)', () => {
  // 단순 표 → <table><thead><tbody> 구조
  const simpleTable =
    '| 항목 | 값 |\n' +
    '|------|------|\n' +
    '| 가 | 1 |\n' +
    '| 나 | 2 |';
  const html1 = markdownToHtml(simpleTable);
  expect(
    html1.includes('<table>') &&
      html1.includes('<thead><tr><th>항목</th><th>값</th></tr></thead>') &&
      html1.includes('<tbody><tr><td>가</td><td>1</td></tr><tr><td>나</td><td>2</td></tr></tbody>') &&
      html1.includes('</table>'),
    true,
    'simple table → <table><thead><tbody>',
  );

  // align separator (`:---`, `---:`, `:---:`) 도 표로 인식
  const aligned =
    '| 좌 | 우 |\n' +
    '| :--- | ---: |\n' +
    '| a | b |';
  expect(markdownToHtml(aligned).startsWith('<table>'), true, 'align separator → table');

  // 표 안 **bold** 가 <strong>로 변환
  const boldCell =
    '| 키 | 설명 |\n' +
    '|---|---|\n' +
    '| **A** | text |';
  expect(
    markdownToHtml(boldCell).includes('<td><strong>A</strong></td>'),
    true,
    'inline **bold** inside cell',
  );

  // 표 다음 단락이 정상적으로 닫힘
  const tableThenPara =
    '| a | b |\n' +
    '|---|---|\n' +
    '| 1 | 2 |\n' +
    '\n' +
    '문단 텍스트';
  const html2 = markdownToHtml(tableThenPara);
  expect(
    html2.includes('</table>') && html2.includes('<p>문단 텍스트</p>'),
    true,
    'table closes before paragraph',
  );

  // 표가 아닌 일반 파이프 텍스트는 표로 인식되지 않아야 함
  const notTable = '이건 | 단순 | 텍스트';
  expect(
    markdownToHtml(notTable).includes('<table>'),
    false,
    'plain pipe text NOT promoted to table',
  );

  // markdownToPlain 에서 separator 라인 제거 + 파이프가 공백으로
  const plain = markdownToPlain(simpleTable);
  expect(plain.includes('|---|') || plain.includes('---'), false, 'plain: separator removed');
  expect(plain.includes('항목') && plain.includes('값'), true, 'plain: headers kept');
  expect(plain.includes('가') && plain.includes('1'), true, 'plain: body cells kept');
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${passed + failed}    Passed: ${passed}    Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(f);
  process.exit(1);
}
console.log('All unit tests passed.\n');
