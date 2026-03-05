'use client';

import { useState } from 'react';

interface GuideItem {
  title: string;
  content: string; // HTML string or plain text paragraphs joined
}

interface GuideSectionProps {
  title: string;
  items: GuideItem[];
}

export default function GuideSection({ title, items }: GuideSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* 토글 헤더 */}
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 펼쳐지는 콘텐츠 */}
        {open && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-6">
            <div className="space-y-8">
              {items.map((item, idx) => (
                <section key={idx}>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-7 whitespace-pre-line">
                    {item.content}
                  </p>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
