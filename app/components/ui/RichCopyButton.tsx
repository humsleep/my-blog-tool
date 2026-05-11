'use client';

import { useState } from 'react';

interface RichCopyButtonProps {
  /** 클립보드에 들어갈 HTML — 네이버 에디터에 붙여넣으면 서식 그대로 적용 */
  html: string;
  /** HTML을 지원하지 않는 곳에 fallback으로 들어갈 일반 텍스트 */
  plain: string;
  /** 버튼 라벨 */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** 강조 버튼 (기본 primary) */
  variant?: 'primary' | 'secondary';
  /** 전체 너비 */
  fullWidth?: boolean;
}

/**
 * 서식까지 복사하는 버튼.
 *
 *  네이버 블로그 / 티스토리 / 워드프레스 에디터 모두 "서식 있는 텍스트 붙여넣기"를 지원한다.
 *  ClipboardItem 에 text/html + text/plain 을 동시에 넣으면 에디터가 자동으로 골라 사용 →
 *  네이버 에디터에서 일반 붙여넣기(Ctrl+V) 만으로도 제목·소제목·강조 모두 그대로 적용됨.
 *
 *  ClipboardItem 미지원 환경(구 브라우저 / HTTP 환경) 에서는 plain 텍스트 fallback.
 */
export default function RichCopyButton({
  html,
  plain,
  label = '네이버에 붙여넣기 (서식 포함)',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
}: RichCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    setError(false);
    try {
      // 1차 시도: ClipboardItem 으로 HTML + Plain 동시 복사
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      }
      // 2차 시도: writeText (서식 손실)
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // 3차 시도: contenteditable 영역에 HTML 넣고 selection + execCommand
      try {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.innerHTML = html;
        div.style.position = 'fixed';
        div.style.opacity = '0';
        document.body.appendChild(div);
        const range = document.createRange();
        range.selectNodeContents(div);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand('copy');
        sel?.removeAllRanges();
        document.body.removeChild(div);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        setError(true);
        setTimeout(() => setError(false), 2200);
      }
    }
  };

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md';
  const stateClass = copied ? 'btn-primary' : error ? 'btn-secondary' : `btn-${variant}`;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-base ${stateClass} ${sizeClass} ${fullWidth ? 'w-full' : ''}`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>서식까지 복사됨!</span>
        </>
      ) : error ? (
        <span>복사 실패 — 직접 선택해주세요</span>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
