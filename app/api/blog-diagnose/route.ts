import { NextResponse } from 'next/server';
import { extractBlogId, fetchRss, fetchPostBody, searchBlogWithMeta, findRankInResults } from '@/app/lib/diagnose/naver-blog';
import { findCategorySeed, detectCategory } from '@/app/lib/diagnose/category-seeds';
import { buildTargetKeywords } from '@/app/lib/diagnose/title-keyword';
import { scoreActivity, scoreVisibility, scoreQuality, compose, summarizeRss, type VisibilityHit } from '@/app/lib/diagnose/scoring';
import { analyzeMateReadiness } from '@/app/lib/diagnose/mate-readiness';
import { analyzeCoach } from '@/app/lib/diagnose/heuristic-coach';
import { analyzeAiCitation } from '@/app/lib/diagnose/ai-citation';
import { createClient } from '@/app/lib/supabase/server';

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const runtime = 'nodejs';
export const maxDuration = 60;        // Vercel hobby 한도

interface DiagnoseRequest {
  blogId?: string;
  blogInput?: string;     // URL/ID 어떤 형식이든 받아 normalize
  category?: string;
}

const CONCURRENCY = 5;
const PER_REQUEST_GAP_MS = 120;

/** 동시성 N으로 작업 풀 처리 — 풀이 다 끝날 때까지 결과 보존. */
async function runPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
      if (PER_REQUEST_GAP_MS > 0) {
        await new Promise((r) => setTimeout(r, PER_REQUEST_GAP_MS));
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export async function POST(request: Request) {
  // 1) 입력 검증 먼저 — 사용자 친화적인 에러 메시지가 환경설정 메시지에 가려지지 않도록.
  let body: DiagnoseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const rawInput = (body.blogId || body.blogInput || '').trim();
  if (!rawInput) {
    return NextResponse.json({ error: '블로그 ID 또는 주소를 입력해주세요.' }, { status: 400 });
  }
  const blogId = extractBlogId(rawInput);
  if (!blogId) {
    return NextResponse.json(
      { error: '인식할 수 없는 형식이에요. "https://blog.naver.com/아이디" 또는 그냥 아이디만 입력해주세요.' },
      { status: 400 },
    );
  }

  // 2) 환경설정 가드 — 입력 검증 통과 후, 외부 API 호출 직전에 검증.
  //    (분야 시드는 RSS 를 가져온 뒤 글 내용으로 자동 감지 — 진단 v3)
  const naverIdSet = !!process.env.NAVER_CLIENT_ID && !!process.env.NAVER_CLIENT_SECRET;
  if (!naverIdSet) {
    return NextResponse.json(
      { error: '네이버 검색 API가 설정되지 않았습니다. 운영자에게 문의해주세요.' },
      { status: 503 },
    );
  }

  // 2.6) Rate limit — 로그인 사용자는 12시간에 1회만 진단 가능.
  //      외부 API 호출 비용·시간이 크므로 사전에 막아 무용한 호출 방지.
  //      RLS 마이그레이션 0012 가 INSERT 단에서도 한 번 더 강제하지만 (서버 신뢰), 여기서
  //      먼저 검사해 사용자에게 명확한 메시지 + 다음 가능 시각을 안내.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabase
          .from('diagnose_results')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1);
        if (recent && recent.length > 0) {
          const lastAt = new Date(recent[0].created_at as string).getTime();
          const nextAt = lastAt + 12 * 60 * 60 * 1000;
          const remainMs = Math.max(0, nextAt - Date.now());
          const remainHours = Math.max(1, Math.ceil(remainMs / 3_600_000));
          return NextResponse.json(
            {
              error: `진단은 12시간에 1번씩 할 수 있어요. 약 ${remainHours}시간 후에 다시 시도해주세요.`,
              nextAvailableAt: new Date(nextAt).toISOString(),
            },
            { status: 429 },
          );
        }
      }
    } catch (err) {
      // 검사 실패는 swallow — 진단 자체는 진행. RLS 가 INSERT 시점에 한번 더 강제.
      const cls = err instanceof Error ? err.constructor.name : 'UnknownError';
      console.error(`[blog-diagnose] rate-limit probe failed: ${cls}`);
    }
  }

  // 3) RSS 가져오기 (활동성/품질 데이터 소스)
  const rss = await fetchRss(blogId);
  const { items, warnings } = summarizeRss(rss);

  // 3.5) 최근 N편 본문 실제 측정.
  //      RSS description은 잘려있어 글자수·이미지 수가 부정확 (실제 1,500자/3장이어도 RSS는 400자/1장 수준).
  //      네이버 PostView.naver를 추가 호출해 정확한 본문 길이/이미지 수로 덮어쓴다.
  //      샘플은 최근 12편만 — 시간(maxDuration 60초) + 비용 균형.
  const QUALITY_SAMPLE_SIZE = 12;
  const sampleSize = Math.min(items.length, QUALITY_SAMPLE_SIZE);
  const fetchedIndices = new Set<number>();
  if (sampleSize > 0) {
    const sample = items.slice(0, sampleSize);
    const bodies = await runPool(
      sample,
      async (it) => fetchPostBody(it.link),
      3,
    );
    for (let i = 0; i < sampleSize; i++) {
      const b = bodies[i];
      if (b) {
        items[i].contentLength = b.contentLength;
        items[i].imageCount = b.imageCount;
        // RSS 요약(280자) 대신 실측 본문 텍스트로 교체 → 메이트/코치 분석 정확도 ↑
        items[i].contentSnippet = b.text;
        fetchedIndices.add(i);
      }
    }
    if (fetchedIndices.size === 0) {
      warnings.push('본문 상세 측정에 실패해 RSS 요약 기준으로 글자수·이미지 수가 산출됐어요. (네이버 일시 차단 또는 비공개 글 가능성)');
    } else if (fetchedIndices.size < sampleSize) {
      warnings.push(`최근 ${sampleSize}편 중 ${fetchedIndices.size}편만 본문 측정에 성공했어요. 나머지는 RSS 요약 기준입니다.`);
    }
  }

  // 3.7) 분야 자동 감지 — 사용자가 고르지 않고 실제 글 내용으로 추정 (진단 v3).
  //      명시적으로 category 를 보냈고 유효하면 그대로 존중(하위호환).
  const explicitSeed = findCategorySeed(body.category || '');
  const seed = explicitSeed ?? detectCategory(
    items.flatMap((it) => [it.title, it.category ?? '', it.contentSnippet]),
  );

  // 4) 내 글이 노린 키워드로 검색해 "내 글이 1페이지에 뜨는가" 측정 (노출 점수, 진단 v3).
  //    최근 글 제목에서 핵심 키워드를 뽑아(중복 제거) 검색 → 내 블로그 랭크 매핑.
  //    분야 고정 키워드 대신 내 글 기준이라, 전문 키워드를 안 쓰는 블로그도 공정하게 측정.
  const VISIBILITY_SAMPLE = 18;
  const targets = buildTargetKeywords(items, VISIBILITY_SAMPLE);

  const searchResults = await runPool(
    targets,
    async (t) => {
      const r = await searchBlogWithMeta(t.keyword, 30);
      return { keyword: t.keyword, postTitle: t.postTitle, result: r };
    },
    CONCURRENCY,
  );

  const failed = searchResults.filter((r) => r.result === null).length;
  if (failed > 0) {
    warnings.push(`내 글 키워드 ${targets.length}개 중 ${failed}개 검색이 실패했어요. 점수가 보수적으로 산출됩니다.`);
  }
  if (targets.length > 0 && targets.length < 5) {
    warnings.push(`최근 글이 ${targets.length}편뿐이라 노출 점수가 적은 표본으로 산출됐어요. 글이 쌓이면 더 정확해집니다.`);
  }

  const hits: VisibilityHit[] = searchResults.map((r) => ({
    keyword: r.keyword,
    postTitle: r.postTitle,
    rank: r.result ? findRankInResults(r.result.items, blogId) : null,
    competition: r.result ? r.result.total : undefined,
  }));

  // 5) 점수 산출
  //    품질은 본문 fetch가 성공한 최근 샘플만으로 — RSS 잘린 데이터로 평균이 낮아지지 않도록.
  const activity = scoreActivity(items);
  const visibility = scoreVisibility(hits);
  const qualityItems = fetchedIndices.size > 0
    ? items.filter((_, i) => fetchedIndices.has(i))
    : items;
  const quality = scoreQuality(qualityItems);

  if (items.length === 0) {
    warnings.push('RSS에서 글을 찾지 못해 활동성·품질 점수가 0이에요. 노출 점수만 참고해주세요.');
  }

  const result = compose(activity, visibility, quality, warnings);

  // 5.5) 메이트(GEO) 인용 준비도 + 코치 리포트 — 위에서 가져온 실측 본문 12편을 그대로 사용.
  //      (별도 RSS 요약 재호출 없이 동일 데이터로 계산 → 정확 + 본문 재fetch로 인한 네이버 차단 위험 ↓)
  const sampleItems = items.slice(0, sampleSize);
  const mate = analyzeMateReadiness(sampleItems, seed.keywords);
  const coach = analyzeCoach(sampleItems, seed.keywords);

  // 5.6) AI 인용 기대치 — 내 키워드 적합도 × 준비도(mate). 스크래핑 없이 인용 가능성 추정.
  const aiCitation = analyzeAiCitation(targets.map((t) => t.keyword), mate.score);

  // 6) 로그인 사용자 → DB 저장 (Phase 28: 데일리 대시보드 + 추적용)
  //    저장 실패는 무시. 진단 결과 응답 자체는 항상 정상 반환.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: inserted } = await supabase.from('diagnose_results').insert({
          user_id: user.id,
          blog_id: blogId,
          blog_title: rss?.title ?? null,
          category: seed.value,
          category_label: seed.label,
          total_score: result.total,
          activity_score: result.activity.score,
          visibility_score: result.visibility.score,
          quality_score: result.quality.score,
          band: result.band,
          posts_last_30d: Number.isFinite(result.activity.postsLast30d) ? result.activity.postsLast30d : null,
          hit_count: result.visibility.hitCount,
          top_ten_count: result.visibility.topTenCount,
          insights: result.insights,
        }).select('id').single();

        // geo_score 는 best-effort — 0013 마이그레이션 적용 전이면 컬럼이 없어 무시됨(에러 swallow).
        //   기본 insert 와 분리해 컬럼 부재가 핵심 저장을 깨지 않도록 한다 (비파괴).
        if (inserted?.id) {
          await supabase.from('diagnose_results').update({ geo_score: mate.score }).eq('id', inserted.id);
        }
      }
    } catch (err) {
      console.error('[blog-diagnose] DB 저장 실패 (무시):', err);
    }
  }

  return NextResponse.json({
    blogId,
    blogTitle: rss?.title ?? null,
    blogLink: rss?.link ?? `https://blog.naver.com/${blogId}`,
    category: seed.value,
    categoryLabel: seed.label,
    categoryDetected: !explicitSeed,   // 분야를 자동 감지했는지 (진단 v3)
    keywordCount: targets.length,      // 실제 측정한 내 글 키워드 수
    score: result,
    // GEO(메이트 인용 적합도) — 총점과 분리된 별도 헤드라인 지표. 상세 리포트는 mate/coach.
    geo: { score: mate.score, grade: mate.grade },
    mate,
    coach,
    aiCitation,
    rssItemCount: items.length,
    diagnosedAt: new Date().toISOString(),
  });
}

/**
 * GET — 로그인 사용자의 진단 이력
 * - latest, previous: 직전 두 건 (대시보드 점수 카드 + delta 표시)
 * - history: 최근 12건 (최신 순 → 오래된 순으로 reverse) — sparkline 용
 *
 * 비로그인 / 미저장 상태이면 모두 null/빈 배열.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
    }

    const { data, error } = await supabase
      .from('diagnose_results')
      .select('id, blog_id, blog_title, category, category_label, total_score, activity_score, visibility_score, quality_score, band, hit_count, top_ten_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('[blog-diagnose GET] error:', error);
      return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
    }

    const list = data ?? [];
    const latest = list[0] ?? null;
    const previous = list[1] ?? null;

    // sparkline 용 — 오래된 → 최신 순으로 정렬 (최대 12건)
    const history = [...list]
      .reverse()
      .map((r) => ({ date: r.created_at as string, score: r.total_score as number }));

    return NextResponse.json({
      latest,
      previous,
      delta: latest && previous ? latest.total_score - previous.total_score : null,
      history,
    });
  } catch (err) {
    console.error('[blog-diagnose GET] exception:', err);
    return NextResponse.json({ latest: null, previous: null, delta: null, history: [] });
  }
}
