import type { Metadata } from 'next';
import Link from 'next/link';
import PostImage from './PostImage';
import AdPlaceholder from '../components/AdPlaceholder';
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
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">포스팅 연구실</h1>
          <p className="text-sm sm:text-base text-gray-600">
            블로그 포스팅 관련 연구와 실험 결과를 공유합니다.
          </p>
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdPlaceholder size="banner" />
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center">
            <p className="text-gray-600">아직 작성된 포스트가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">
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
                  className="group block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* 이미지 영역 */}
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                    <PostImage src={imagePath} alt={post.title} slug={post.slug} />
                  </div>
                  
                  {/* 콘텐츠 영역 */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    {post.date && (
                      <p className="text-xs text-gray-500 mb-3">
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    <div className="flex items-center text-blue-600 text-sm font-medium mt-4">
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

        {/* 하단 Ad Banner */}
        <div className="mt-8">
          <AdPlaceholder size="banner" />
        </div>
      </div>
    </div>
  );
}

