import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://bohemebloglab.com';

interface Post { slug: string; date?: string }

function readLabPosts(): Post[] {
  try {
    const file = path.join(process.cwd(), 'public', 'posts', 'posts.json');
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw) as Post[];
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                        changeFrequency: 'weekly',  priority: 1.0,  lastModified: now },
    { url: `${BASE_URL}/trending`,                changeFrequency: 'daily',   priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/keyword-analysis`,        changeFrequency: 'monthly', priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/competitor-analysis`,     changeFrequency: 'monthly', priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/prompt-generator`,        changeFrequency: 'monthly', priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/ai-writer`,               changeFrequency: 'monthly', priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/editor`,                  changeFrequency: 'monthly', priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/image-search`,            changeFrequency: 'monthly', priority: 0.7,  lastModified: now },
    { url: `${BASE_URL}/image-tools`,             changeFrequency: 'monthly', priority: 0.7,  lastModified: now },
    { url: `${BASE_URL}/lab`,                     changeFrequency: 'weekly',  priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/community`,               changeFrequency: 'daily',   priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/community/swap`,          changeFrequency: 'hourly',  priority: 0.8,  lastModified: now },
    // /community/tips 는 사이트 활성화 후 오픈 예정 — sitemap 노출 보류
    { url: `${BASE_URL}/community/companions`,    changeFrequency: 'hourly',  priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/about`,                   changeFrequency: 'yearly',  priority: 0.4,  lastModified: now },
    { url: `${BASE_URL}/contact`,                 changeFrequency: 'yearly',  priority: 0.4,  lastModified: now },
    { url: `${BASE_URL}/privacy`,                 changeFrequency: 'yearly',  priority: 0.3,  lastModified: now },
    { url: `${BASE_URL}/terms`,                   changeFrequency: 'yearly',  priority: 0.3,  lastModified: now },
    { url: `${BASE_URL}/login`,                   changeFrequency: 'yearly',  priority: 0.3,  lastModified: now },
  ];

  const labPosts = readLabPosts().map<MetadataRoute.Sitemap[number]>((p) => ({
    url: `${BASE_URL}/lab/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: p.date ? new Date(p.date) : now,
  }));

  return [...staticRoutes, ...labPosts];
}
