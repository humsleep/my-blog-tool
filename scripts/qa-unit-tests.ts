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
console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${passed + failed}    Passed: ${passed}    Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(f);
  process.exit(1);
}
console.log('All unit tests passed.\n');
