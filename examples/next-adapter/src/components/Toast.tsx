"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/utils/cn";

type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-highlight" aria-hidden />,
  info: <Info className="h-4 w-4 text-highlight" aria-hidden />,
  warning: <TriangleAlert className="h-4 w-4 text-gold" aria-hidden />,
  error: <XCircle className="h-4 w-4 text-accent" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, variant = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { id, title, description, variant, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:right-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto rounded-2xl border border-border/70 bg-surface-elevated/90 p-4 shadow-lg backdrop-blur",
                toast.variant === "success" && "border-highlight/60",
                toast.variant === "error" && "border-accent/60",
                toast.variant === "warning" && "border-gold/60",
              )}
            >
              <div className="flex items-start gap-3">
                <div aria-hidden>{icons[toast.variant ?? "info"]}</div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-foreground">{toast.title}</p>
                  {toast.description && <p className="mt-1 text-muted">{toast.description}</p>}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-border/60 p-1 text-xs text-muted transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-highlight"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
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
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
