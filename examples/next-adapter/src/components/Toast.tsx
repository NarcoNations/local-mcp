'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type ToastTone = 'info' | 'success' | 'warn' | 'error';

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  push: (toast: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toneAccent: Record<ToastTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warn: 'text-warn',
  error: 'text-error',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [toasts, setToasts] = React.useState<ToastState[]>([]);
  const timers = React.useRef(new Map<string, number>());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timers.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, []);

  const push = React.useCallback(
    (toast: ToastOptions) => {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
      const tone = toast.tone ?? 'info';
      const duration = toast.duration ?? 6000;
      setToasts((prev) => [...prev, { id, tone, duration, ...toast }]);
      const timeout = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timeout);
      return id;
    },
    [dismiss],
  );

  const clear = React.useCallback(() => {
    setToasts([]);
    timers.current.forEach((timeout) => window.clearTimeout(timeout));
    timers.current.clear();
  }, []);

  const value = React.useMemo(() => ({ push, dismiss, clear }), [push, dismiss, clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end">
          <div className="flex w-full flex-col gap-3 sm:max-w-sm">
            <AnimatePresence initial={false}>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  layout
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: 'easeOut' }}
                >
                  <div
                    className={cn(
                      'pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4 shadow-md',
                      toneAccent[toast.tone ?? 'info'],
                    )}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-1 flex-col gap-1 text-sm">
                      <span className="font-semibold text-foreground">{toast.title}</span>
                      {toast.description && <span className="text-muted">{toast.description}</span>}
                    </div>
                    <button
                      type="button"
                      className="focus-ring-subtle inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border text-muted transition-colors duration-interactive hover:text-foreground"
                      aria-label="Dismiss notification"
                      onClick={() => dismiss(toast.id)}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
