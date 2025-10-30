"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export type ToastVariant = "default" | "success" | "danger" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variants: Record<ToastVariant, string> = {
  default: "border-border bg-surface-elevated",
  success: "border-success bg-success-soft",
  danger: "border-danger bg-danger-soft",
  info: "border-info bg-info-soft",
};

const motionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next: ToastItem = {
        id,
        variant: "default",
        duration: 5000,
        ...toast,
      };
      setToasts((current) => [...current, next]);
      if (typeof window !== "undefined" && next.duration) {
        window.setTimeout(() => dismiss(id), next.duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              variants={motionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              className={cn(
                "pointer-events-auto rounded-2xl border px-4 py-3 text-sm text-primary shadow-raised",
                variants[toast.variant ?? "default"]
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{toast.title}</p>
                  {toast.description ? <p className="text-muted">{toast.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="focus-ring rounded-full border border-border px-2 py-1 text-xs uppercase tracking-[0.2em]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
