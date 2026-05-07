import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : htmlContent;

  return (
    <div className="min-h-screen">
      {/* Magazine masthead */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
          <Link href="/lab" className="hover:text-ink transition-colors">
            ← 포스팅 연구실
          </Link>
          <span>Lab Notes — 본문</span>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Headline */}
        <header className="mb-10">
          <div className="ed-eyebrow mb-5">Article</div>
          <h1 className="font-display text-[2rem] sm:text-[3rem] lg:text-[3.75rem] leading-[1.05] tracking-tight text-ink mb-6">
            {post.title}
          </h1>
          {post.description && (
            <p className="font-display italic text-lg sm:text-xl text-ink-muted leading-[1.6] mb-6">
              {post.description}
            </p>
          )}
          <div className="flex items-center justify-between border-y border-rule py-3">
            {post.date ? (
              <time dateTime={post.date} className="ed-byline">
                {new Date(post.date).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </time>
            ) : (
              <span className="ed-byline">Boheme BlogLab Editorial</span>
            )}
            <span className="ed-byline">— Lab Notes —</span>
          </div>
        </header>

        {/* Body — original HTML kept as-is, but enclosed in editorial prose styling */}
        <div
          className="ed-article-body prose prose-lg max-w-none
            prose-headings:font-display prose-headings:text-ink prose-headings:font-semibold
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:tracking-tight
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-ink-muted prose-p:leading-[1.85]
            prose-strong:text-orange-700 dark:prose-strong:text-orange-400 prose-strong:font-semibold
            prose-em:text-ink prose-em:not-italic prose-em:font-medium
            prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
            prose-ul:text-ink-muted prose-li:my-1
            prose-hr:border-rule-soft"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Closing rule + back link */}
        <div className="mt-20 pt-8 border-t border-rule">
          <div className="ed-ornament mb-8">— END —</div>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-ink hover:text-orange-600 dark:hover:text-orange-400 border-b border-ink hover:border-orange-600 dark:hover:border-orange-400 pb-0.5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            전체 기사 목록
          </Link>
        </div>
      </article>
    </div>
  );
}
