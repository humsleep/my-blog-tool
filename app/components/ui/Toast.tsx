'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // SSR fallback / Provider 미설치 시 alert로 폴백
    return {
      toast: (message: string) => {
        if (typeof window !== 'undefined') alert(message);
      },
    };
  }
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none safe-top"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((it) => (
          <ToastItemView key={it.id} item={it} onClose={() => remove(it.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => setVisible(false), 3000);
    const t3 = setTimeout(onClose, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-500 text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900',
  }[item.variant];

  const icon = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  }[item.variant];

  return (
    <div
      role="status"
      className={`pointer-events-auto inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-sm transition-all duration-300 ${styles} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <span className="font-bold flex-shrink-0">{icon}</span>
      <span className="text-sm break-words">{item.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 opacity-70 hover:opacity-100 flex-shrink-0"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
