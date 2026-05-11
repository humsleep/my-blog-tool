/**
 * SSRF 방어 테스트 — `toPostViewUrl` 은 internal export지만 동작 검증을 위해
 * 동등 로직을 인라인으로 복제하지 않고, 외부 export인 `fetchPostBody`를
 * 통해 invalid URL이 빠르게 null 반환되는지(즉 fetch가 일어나지 않는지) 본다.
 *
 * 실제 외부 호출은 일어나지 않게 fetch를 mock 한다.
 */

import { fetchPostBody } from '../app/lib/diagnose/naver-blog';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function expect(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) passed++;
  else { failed++; failures.push(`  ✗ ${name}\n      expected: ${e}\n      actual:   ${a}`); }
}

// fetch를 가로채 호출된 URL을 기록 + 항상 실패 응답
let fetchCalls: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: any, _init?: any) => {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  fetchCalls.push(url);
  // 의도적으로 실패 → fetchPostBody가 빈 응답으로 처리
  return new Response('', { status: 500 });
};

async function runCase(name: string, input: string, expectedFetched: boolean, expectedHost?: string) {
  fetchCalls = [];
  await fetchPostBody(input);
  const fetched = fetchCalls.length > 0;
  if (fetched !== expectedFetched) {
    failed++;
    failures.push(`  ✗ ${name}\n      expected fetch: ${expectedFetched}, actual: ${fetched} (${fetchCalls[0] ?? 'none'})`);
    return;
  }
  if (expectedFetched && expectedHost) {
    const u = new URL(fetchCalls[0]);
    if (u.host !== expectedHost) {
      failed++;
      failures.push(`  ✗ ${name}\n      expected host: ${expectedHost}, actual: ${u.host}`);
      return;
    }
  }
  passed++;
}

(async () => {
  console.log('── SSRF defense (toPostViewUrl rebuilds URL on blog.naver.com) ──');

  // 정상 — 표준 URL
  await runCase('valid naver path URL',
    'https://blog.naver.com/myblog/12345', true, 'blog.naver.com');
  await runCase('valid mobile URL',
    'https://m.blog.naver.com/myblog/12345', true, 'blog.naver.com');

  // SSRF 시도 — 외부 도메인의 PostView.naver
  await runCase('attacker.com/PostView.naver blocked',
    'https://attacker.com/PostView.naver?blogId=myblog&logNo=12345', true, 'blog.naver.com'); // 파라미터만 추출, blog.naver.com으로 재조립
  await runCase('IP literal external blocked',
    'http://192.168.1.1/PostView.naver?blogId=foo&logNo=99', true, 'blog.naver.com'); // 같은 — 호스트 무시
  await runCase('non-naver path URL not fetched',
    'https://attacker.com/myblog/12345', false);
  await runCase('localhost not fetched',
    'http://localhost:8080/admin', false);
  await runCase('file scheme not fetched',
    'file:///etc/passwd', false);
  await runCase('data scheme not fetched',
    'data:text/html,<script>', false);

  // ID 위변조
  await runCase('blogId with special chars rejected',
    'https://blog.naver.com/my-blog/12345', false); // hyphen not in [a-zA-Z0-9_]
  await runCase('logNo non-numeric rejected',
    'https://blog.naver.com/myblog/abcde', false);
  await runCase('empty input',
    '', false);

  // 파라미터 형태
  await runCase('query param blogId+logNo',
    'https://blog.naver.com/PostView.naver?blogId=foo&logNo=42', true, 'blog.naver.com');

  // 잘못된 입력
  await runCase('plain text not URL',
    'not a url', false);
  await runCase('blogId too long via query',
    'https://blog.naver.com/PostView.naver?blogId=' + 'x'.repeat(60) + '&logNo=1', false);

  globalThis.fetch = originalFetch;

  console.log(`\nTotal: ${passed + failed}    Passed: ${passed}    Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(f);
    process.exit(1);
  }
})();
