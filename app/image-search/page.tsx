'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { clientFetchJson, ApiError } from '../lib/clientFetch';
import FlowNav from '../components/FlowNav';
import { useToast } from '../components/ui/Toast';

interface ImageItem {
  id: string;
  source: 'pexels' | 'unsplash';
  thumbUrl: string;
  fullUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  alt: string;
}

interface SearchResponse {
  query: string;
  items: ImageItem[];
  sources: { pexels: boolean; unsplash: boolean };
  errors: { pexels?: string; unsplash?: string };
}

export default function ImageSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [items, setItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<SearchResponse['errors']>({});
  const [transferring, setTransferring] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setLastQuery(q);

    try {
      const data = await clientFetchJson<SearchResponse>(
        `/api/images/search?query=${encodeURIComponent(q)}&perPage=12`
      );
      setItems(data.items);
      setSourceStatus(data.errors);
      if (data.items.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드를 시도해 보세요.');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '이미지 검색에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sendToEditor = async (item: ImageItem) => {
    setTransferring(item.id);
    try {
      const proxied = `/api/images/proxy?url=${encodeURIComponent(item.fullUrl)}`;
      const res = await fetch(proxied);
      if (!res.ok) throw new Error('이미지를 불러오지 못했습니다.');
      const blob = await res.blob();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('FileReader 오류'));
        reader.readAsDataURL(blob);
      });

      sessionStorage.setItem(
        'pendingImage',
        JSON.stringify({
          dataUrl,
          source: item.source,
          photographer: item.photographer,
          sourceUrl: item.sourceUrl,
          createdAt: Date.now(),
        })
      );
      router.push('/image-tools');
    } catch (err) {
      toast(err instanceof Error ? err.message : '편집기 전송 실패', 'error');
    } finally {
      setTransferring(null);
    }
  };

  const downloadDirect = async (item: ImageItem) => {
    try {
      const proxied = `/api/images/proxy?url=${encodeURIComponent(item.downloadUrl)}`;
      const res = await fetch(proxied);
      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? '이미지 접근이 거부되었습니다. 다른 이미지를 선택해주세요.'
            : `다운로드 실패 (HTTP ${res.status})`
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.source}-${item.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('이미지를 다운로드했어요.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : '다운로드 실패', 'error');
    }
  };

  const hasAnyApiKey = sourceStatus.pexels !== 'PEXELS_API_KEY 미설정' || sourceStatus.unsplash !== 'UNSPLASH_ACCESS_KEY 미설정';
  const allKeysMissing = lastQuery &&
    sourceStatus.pexels === 'PEXELS_API_KEY 미설정' &&
    sourceStatus.unsplash === 'UNSPLASH_ACCESS_KEY 미설정';

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen py-5 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">무료 이미지 검색</h1>
          <p className="hidden sm:block text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1.5">
            Pexels + Unsplash 무료 저작권 이미지를 검색하여 블로그에 바로 활용하세요
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) search(); }}
              placeholder="예: coffee, flower, cat (영문 키워드 권장)"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={search}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            영문 키워드가 더 풍부한 결과를 반환합니다. 한국어 키워드도 지원되지만 결과가 적을 수 있습니다.
          </p>
        </div>

        {allKeysMissing && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">API 키 설정 필요</h3>
            <p className="text-sm text-amber-800 dark:text-amber-400 mb-2">
              이미지 검색을 사용하려면 <code className="px-1 bg-amber-100 dark:bg-amber-900/50 rounded">.env.local</code> 파일에 다음 키 중 하나 이상을 입력하세요:
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
              <li>• <code>PEXELS_API_KEY</code> — <a className="underline" href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer">pexels.com/api</a> 에서 무료 발급</li>
              <li>• <code>UNSPLASH_ACCESS_KEY</code> — <a className="underline" href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer">unsplash.com/developers</a> 에서 무료 발급</li>
            </ul>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-2">키 입력 후 개발 서버를 재시작하세요.</p>
          </div>
        )}

        {error && !loading && !allKeysMissing && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            {lastQuery && (
              <button
                onClick={search}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors whitespace-nowrap"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              총 {items.length}장 · <strong className="text-zinc-900 dark:text-zinc-100">카드를 클릭하면 이미지 편집기로 전송됩니다.</strong> 다운로드만 받으려면 우상단 ↓ 버튼을 누르세요.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { if (transferring !== item.id) void sendToEditor(item); }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && transferring !== item.id) {
                      e.preventDefault();
                      void sendToEditor(item);
                    }
                  }}
                  aria-label={`${item.alt || '이미지'} — 편집기로 보내기`}
                  className="group relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={item.thumbUrl}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* 좌상단 소스 배지 */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-semibold bg-black/70 text-white rounded uppercase pointer-events-none">
                    {item.source}
                  </div>
                  {/* 우상단 다운로드 — 작은 아이콘 버튼 (카드 click 과 분리) */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void downloadDirect(item); }}
                    className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white/95 hover:bg-white dark:bg-zinc-900/95 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-200 shadow-sm flex items-center justify-center transition-colors"
                    aria-label="다운로드"
                    title="이미지 다운로드"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {/* hover overlay — "편집기로 전송" 시각 시그널 */}
                  <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/20 dark:group-hover:bg-orange-500/30 transition-colors flex items-end justify-center pb-12 pointer-events-none">
                    <span className="px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      {transferring === item.id ? '전송 중...' : '편집기로 →'}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-white/90 dark:bg-zinc-800/90 truncate">
                    © <a onClick={(e) => e.stopPropagation()} href={item.photographerUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.photographer}</a>
                    {' · '}
                    <a onClick={(e) => e.stopPropagation()} href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.source === 'pexels' ? 'Pexels' : 'Unsplash'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {(sourceStatus.pexels || sourceStatus.unsplash) && hasAnyApiKey && (
              <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
                {sourceStatus.pexels && <>Pexels: {sourceStatus.pexels}. </>}
                {sourceStatus.unsplash && <>Unsplash: {sourceStatus.unsplash}.</>}
              </p>
            )}
          </>
        )}

        <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
          <p className="font-medium mb-1">라이선스 안내</p>
          <p>
            Pexels와 Unsplash의 이미지는 무료로 상업적 이용이 가능하지만, 저작자 표기(attribution)는 권장됩니다.
            각 이미지 하단에 자동으로 저작자 링크가 표시됩니다. 원본 라이선스를 확인하려면{' '}
            <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer" className="underline">Pexels 라이선스</a>,{' '}
            <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer" className="underline">Unsplash 라이선스</a>를 참조하세요.
          </p>
        </div>

        <FlowNav
          currentStep={7}
          totalSteps={8}
          stepLabel="이미지 검색"
          note="이미지 카드의 '편집기로 보내기' 버튼을 누르면 편집 도구로 바로 전송됩니다."
          actions={[
            {
              href: '/image-tools',
              label: '이미지 편집 도구로 이동',
              description: '크롭·모자이크·필터 편집',
            },
          ]}
        />

                {/* 자세한 사용법은 연구실로 안내 */}
        <div className="mt-10 text-center">
          <Link
            href="/lab"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            더 자세한 사용법은 연구실에서 확인하세요
          </Link>
        </div>
      </div>
    </div>
  );
}
