import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/app/components/ui/PageHeader';

export const metadata: Metadata = {
  title: '문의 · 자주 묻는 질문 - Boheme BlogLab',
  description: 'Boheme BlogLab에 자주 묻는 질문을 모았습니다. 여기서 답을 못 찾으셨다면 메일로 보내주세요.',
};

const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: '회원가입을 꼭 해야 하나요?',
    a: '아니요. 키워드 분석·인기검색어·프롬프트 생성·이미지 검색은 회원가입 없이 무제한 사용 가능합니다. 회원가입은 AI 글쓰기 일일 5회(비로그인 1회), 커뮤니티 글 작성, 즐겨찾기 키워드 자동 저장, 진단 점수 추적을 위해 필요합니다.',
  },
  {
    q: '서비스는 정말 무료인가요?',
    a: '네, 모든 기능이 무료입니다. AI 글쓰기는 비용이 발생해 비로그인 1회/일, 로그인 5회/일 한도를 두지만 그 외 키워드·진단·프롬프트·금칙어·이미지 도구는 횟수 제한이 없습니다.',
  },
  {
    q: '블로그 진단은 어떤 데이터로 점수를 매기나요?',
    a: '네이버 블로그 RSS로 최근 글의 발행 빈도·글자수·이미지·카테고리를 수집하고, 내가 실제로 쓴 글이 노린 키워드를 검색해 그 글의 1페이지 진입율을 측정합니다. 분야는 글 내용으로 자동 감지합니다. 활동성 25% / 노출 50% / 품질 25% 가중평균으로 0~100점을 산출합니다. 진단은 12시간에 1회 가능합니다.',
  },
  {
    q: 'AI 글쓰기 결과를 네이버 블로그에 바로 붙여넣을 수 있나요?',
    a: 'AI 글쓰기 결과 화면의 "미리보기" 탭에서 "네이버에 붙여넣기 (서식 포함)" 버튼을 누르면 제목·소제목·강조까지 그대로 복사됩니다. 네이버 블로그 에디터에 일반 붙여넣기(Ctrl+V)만 하면 서식이 유지돼요.',
  },
  {
    q: 'AI가 쓴 글을 그대로 발행해도 되나요? (중요)',
    a: (
      <>
        <strong className="text-amber-700 dark:text-amber-300">권장하지 않습니다.</strong>{' '}
        AI 생성 글은 사실 오류·환각(없는 정보를 그럴듯하게 만들어내는 현상)이 발생할 수 있어요. 발행 전에 반드시 (1) 숫자·인용·고유명사·통계를 직접 확인하고, (2) 본인의 경험·관점을 추가해 독창성을 높이고, (3) 의료·금융·법률 등 전문 주제는 전문가 검토를 거치는 것을 권장합니다. AI 글을 검수 없이 대량 발행하면{' '}
        <strong>Google AdSense / 네이버 검색 노출 정책에 위배되어 광고 차단 또는 노출 누락</strong>이 발생할 수 있습니다.
      </>
    ),
  },
  {
    q: 'AdSense 광고가 차단되지 않으려면 어떻게 해야 하나요?',
    a: (
      <>
        Google의 &quot;Scaled content abuse&quot; 정책은 &quot;가치를 더하지 않은 채 자동 생성된 콘텐츠&quot;를 광고 부적격으로 분류합니다. 우리 서비스로 만든 초안은{' '}
        <strong>(1) 본인 경험·관점 삽입</strong>, <strong>(2) 사실 검증</strong>, <strong>(3) 본문 일부 직접 재작성</strong> 후 발행하시면 안전합니다. 에디터 페이지에서 금칙어·맞춤법 검사까지 끝낸 뒤 발행을 권장드려요.
      </>
    ),
  },
  {
    q: '키워드 데이터는 어디서 오나요?',
    a: '네이버 검색광고 API의 실제 월간 검색량과 네이버 블로그 OpenAPI의 발행 문서 수를 기반으로 합니다. 모두 공식 API에서 받아온 실시간 데이터입니다.',
  },
  {
    q: '내가 입력한 키워드나 글이 다른 사람에게 공개되나요?',
    a: '아니요. 키워드 분석·AI 글쓰기 결과는 본인 화면에만 표시되며 저장되지 않습니다. 진단 결과는 본인 계정으로만 저장됩니다. 커뮤니티에 직접 작성한 글만 공개됩니다.',
  },
  {
    q: '커뮤니티 글 작성에 제한이 있나요?',
    a: (
      <>
        로그인 + 닉네임 등록이 필요하며, &quot;서이추 해요&quot;는 1일 1글 제한이 있습니다. 닉네임은 24시간에 1회 변경 가능합니다. 자세한 약관은{' '}
        <Link href="/terms" className="text-orange-600 dark:text-orange-400 hover:underline">
          이용약관
        </Link>{' '}
        및{' '}
        <Link href="/privacy" className="text-orange-600 dark:text-orange-400 hover:underline">
          개인정보처리방침
        </Link>
        을 참고해주세요.
      </>
    ),
  },
  {
    q: '오류가 발생했어요. 어디로 알려야 하나요?',
    a: '아래 메일로 (1) 발생한 페이지 주소 (2) 사용 중인 브라우저·기기 (3) 가능하면 스크린샷·오류 메시지를 함께 보내주시면 가장 빠르게 해결해드립니다.',
  },
];

export default function ContactPage() {
  const mailto =
    'mailto:boheme88@naver.com?subject=' +
    encodeURIComponent('[Boheme BlogLab] 문의') +
    '&body=' +
    encodeURIComponent(
      '발생한 페이지: \n사용 환경 (브라우저/기기): \n문의 내용: \n\n— Boheme BlogLab',
    );

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="문의 · 자주 묻는 질문"
          subtitle="대부분의 궁금증은 아래 FAQ에서 해결됩니다. 못 찾으셨다면 페이지 하단에서 메일로 보내주세요."
        />

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {FAQ_ITEMS.map((item, idx) => (
              <details key={item.q} className="group" {...(idx === 0 ? { open: true } : {})}>
                <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                    {item.q}
                  </span>
                  <svg
                    className="w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── 그래도 못 찾으셨다면 — 메일 안내 ─────────────────── */}
        <section className="rounded-md border border-orange-200 dark:border-orange-900/60 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-md bg-orange-500 items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                여기서 답을 못 찾으셨나요?
              </h2>
              <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                서비스 제안·버그 리포트·기능 문의·제휴 등 어떤 내용이든 환영합니다.
                평일 기준 1~2일 안에 답변드릴게요.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                <a href={mailto} className="btn-base btn-primary btn-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  메일로 문의하기
                </a>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  또는{' '}
                  <a
                    href="mailto:boheme88@naver.com"
                    className="font-mono text-orange-700 dark:text-orange-300 hover:underline"
                  >
                    boheme88@naver.com
                  </a>
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                💡 빠른 답변을 위해 <strong>발생한 페이지 주소</strong>·<strong>브라우저/기기 정보</strong>·<strong>스크린샷</strong>을 함께 보내주세요.
              </p>
            </div>
          </div>
        </section>

        {/* ── 관련 페이지 ──────────────────────────────────────── */}
        <section className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link
            href="/about"
            className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
          >
            서비스 소개 →
          </Link>
          <Link
            href="/terms"
            className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
          >
            이용약관 →
          </Link>
          <Link
            href="/privacy"
            className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
          >
            개인정보처리방침 →
          </Link>
        </section>
      </div>
    </div>
  );
}
