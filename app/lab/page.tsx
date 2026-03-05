import type { Metadata } from 'next';
import Link from 'next/link';
import PostImage from './PostImage';
import GuideSection from '../components/GuideSection';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: '포스팅 연구실 - Boheme PostLab',
  description: '블로그 포스팅 관련 연구와 실험 결과를 공유합니다.',
};

interface Post {
  slug: string;
  title: string;
  date?: string;
  filename: string;
  description?: string;
}

async function getPosts(): Promise<Post[]> {
  try {
    const postsPath = path.join(process.cwd(), 'public', 'posts', 'posts.json');
    const fileContents = fs.readFileSync(postsPath, 'utf8');
    const posts: Post[] = JSON.parse(fileContents);
    
    // 날짜가 있으면 날짜순으로 정렬 (최신순), 없으면 그대로 반환
    return posts.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

export default async function LabPage() {
  const posts = await getPosts();

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">포스팅 연구실</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            블로그 포스팅 관련 연구와 실험 결과를 공유합니다.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">아직 작성된 포스트가 없습니다.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              public/posts/posts.json 파일에 포스트를 추가하세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imagePath = `/posts/images/${post.slug}.png`;
              
              return (
                <Link
                  key={post.slug}
                  href={`/lab/${post.slug}`}
                  className="group block bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  {/* 이미지 영역 */}
                  <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <PostImage src={imagePath} alt={post.title} slug={post.slug} />
                  </div>
                  
                  {/* 콘텐츠 영역 */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    {post.date && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-4">
                      <span>자세히 보기</span>
                      <svg
                        className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 가이드 콘텐츠 */}
        <GuideSection
          title="포스팅 연구실 — 데이터로 증명된 블로그 성장 인사이트"
          items={[
            {
              title: '포스팅 연구실이란?',
              content: `포스팅 연구실은 블로그 운영과 포스팅 최적화에 관한 실제 실험과 연구 결과를 공유하는 공간입니다. 단순한 이론이 아닌, 실제 데이터와 경험을 바탕으로 한 인사이트를 제공합니다.

어떤 키워드 전략이 실제로 효과적인지, 제목 길이에 따라 클릭률이 어떻게 달라지는지, 포스팅 빈도와 블로그 지수의 상관관계는 어떠한지 — 이런 궁금증에 대한 실증적 답을 찾는 것이 연구실의 목표입니다.`,
            },
            {
              title: '연구 기반 블로그 운영이 중요한 이유',
              content: `블로그 운영에는 수많은 '카더라' 정보가 떠돌고 있습니다. "매일 올려야 한다", "긴 글이 좋다", "특정 시간에 올려야 노출된다" 등의 조언이 실제로 효과가 있는지는 검증이 필요합니다.

연구실의 실험들은 이런 통념을 실제 데이터로 검증합니다. 자신의 블로그와 독자층에 맞는 최적화 전략을 찾기 위해서는 주먹구구식 운영보다 가설을 세우고 결과를 측정하는 체계적인 접근이 필요합니다.`,
            },
            {
              title: '연구실 콘텐츠 활용 방법',
              content: `포스팅 연구실의 각 글은 다음 구조로 작성됩니다.

가설 설정: "A 전략이 B 전략보다 노출률이 높을 것이다"
실험 설계: 동일 조건에서 변수를 바꾸어 실제 포스팅 진행
결과 측정: 노출 수, 클릭률, 체류 시간 등 데이터 수집
인사이트 도출: 결과를 바탕으로 실용적인 전략 제안

이 인사이트를 자신의 블로그에 바로 적용해 보고, 결과를 비교해 보세요. 블로그마다 독자층과 주제가 다르기 때문에 실험 결과가 다를 수 있으며, 이것 자체가 또 하나의 배움이 됩니다.`,
            },
            {
              title: '블로그 성장을 가속화하는 데이터 수집 습관',
              content: `성공적인 블로거들은 매 포스팅마다 간단한 기록을 남기는 습관을 가지고 있습니다. 포스팅 날짜, 제목, 키워드, 1주일 후 노출 수, 1개월 후 방문자 수를 스프레드시트에 기록해 두면, 어떤 유형의 글이 자신의 블로그에서 잘 통하는지 패턴을 발견할 수 있습니다.

이 데이터가 쌓일수록 다음 포스팅의 성공 확률이 높아집니다. 연구실의 인사이트를 참고하면서도 자신만의 데이터를 수집하는 습관이 장기적인 블로그 성장의 가장 강력한 무기입니다.`,
            },
          ]}
        />
      </div>
    </div>
  );
}

