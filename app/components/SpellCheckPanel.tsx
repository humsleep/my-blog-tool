'use client';

import { useState } from 'react';
import { clientFetchJson, ApiError } from '../lib/clientFetch';

interface SpellMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage: string;
  replacements: string[];
  ruleId: string;
  category: string;
  context: string;
  contextOffset: number;
  contextLength: number;
}

interface SpellCheckResponse {
  total: number;
  matches: SpellMatch[];
  language: string;
}

interface SpellCheckPanelProps {
  getText: () => string;
  onReplace?: (offset: number, length: number, replacement: string) => void;
}

export default function SpellCheckPanel({ getText, onReplace }: SpellCheckPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpellCheckResponse | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const run = async () => {
    const text = getText();
    if (!text.trim()) {
      setError('검사할 텍스트가 없습니다.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDismissed(new Set());

    try {
      const data = await clientFetchJson<SpellCheckResponse>('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'ko-KR' }),
      });
      setResult(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '맞춤법 검사에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const visibleMatches = result?.matches.filter((m) => !dismissed.has(`${m.offset}:${m.length}:${m.ruleId}`)) ?? [];

  const dismiss = (match: SpellMatch) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(`${match.offset}:${match.length}:${match.ruleId}`);
      return next;
    });
  };

  const highlightContext = (match: SpellMatch) => {
    const before = match.context.slice(0, match.contextOffset);
    const target = match.context.slice(match.contextOffset, match.contextOffset + match.contextLength);
    const after = match.context.slice(match.contextOffset + match.contextLength);
    return (
      <span className="font-mono text-xs">
        <span className="text-slate-500 dark:text-slate-400">{before}</span>
        <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold px-0.5 rounded">
          {target}
        </span>
        <span className="text-slate-500 dark:text-slate-400">{after}</span>
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          맞춤법 · 문법 검사
        </h3>
        <button
          onClick={run}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
        >
          {loading ? '검사 중...' : result ? '다시 검사' : '검사 실행'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && result && visibleMatches.length === 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center border border-emerald-200 dark:border-emerald-800">
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">✓ 맞춤법 이슈 없음</span>
        </div>
      )}

      {!error && visibleMatches.length > 0 && (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {visibleMatches.length}개 이슈 발견 · 제안을 클릭하면 에디터에 자동 반영됩니다
          </p>
          {visibleMatches.map((match) => (
            <div
              key={`${match.offset}-${match.length}-${match.ruleId}`}
              className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                  {match.category}
                </span>
                <button
                  onClick={() => dismiss(match)}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 text-xs"
                  title="이 이슈 무시"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mb-1.5">{match.message}</p>
              <div className="mb-2">{highlightContext(match)}</div>
              {match.replacements.length > 0 && onReplace && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center mr-1">제안:</span>
                  {match.replacements.map((rep, i) => (
                    <button
                      key={`${rep}-${i}`}
                      onClick={() => {
                        onReplace(match.offset, match.length, rep);
                        dismiss(match);
                      }}
                      className="px-2 py-0.5 text-xs font-medium bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded transition-colors"
                    >
                      {rep}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
