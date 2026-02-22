import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdPlaceholder from '../../components/AdPlaceholder';
import fs from 'fs';
import path from 'path';

interface Post {
  slug: string;
  title: string;
  date?: string;
  filename: string;
  description?: string;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const postsPath = path.join(process.cwd(), 'public', 'posts', 'posts.json');
    const fileContents = fs.readFileSync(postsPath, 'utf8');
    const posts: Post[] = JSON.parse(fileContents);
    return posts.find((post) => post.slug === slug) || null;
  } catch (error) {
    console.error('Error reading posts:', error);
    return null;
  }
}

async function getPostContent(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'posts', filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading post content:', error);
    return '';
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다 - Boheme PostLab',
    };
  }

  return {
    title: `${post.title} - 포스팅 연구실`,
    description: post.description || `${post.title} 포스트`,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const htmlContent = await getPostContent(post.filename);

  // HTML에서 body 내용만 추출
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : htmlContent;

  // 목록으로 돌아가기 버튼 컴포넌트
  const BackButton = () => (
    <Link
      href="/lab"
      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>목록으로 돌아가기</span>
    </Link>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {post.title}
          </h1>
          {post.date && (
            <div className="flex items-center text-sm text-gray-500">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          )}
        </div>

        {/* Ad Banner */}
        <div className="mb-6">
          <AdPlaceholder size="banner" />
        </div>

        {/* Post Content */}
        <article className="bg-white rounded-lg shadow-md border border-gray-100 p-6 sm:p-8">
          <div
            className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        {/* 하단 Back Button */}
        <div className="mt-8 flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  );
}

