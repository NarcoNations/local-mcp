'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  publish: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const publish = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...message, id }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ publish }), [publish]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className="pointer-events-auto w-full max-w-sm rounded-lg border border-[hsl(var(--color-border)/0.6)] bg-surface/95 px-4 py-3 shadow-subtle backdrop-blur"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="text-sm font-semibold">{message.title}</p>
              {message.description ? <p className="text-sm text-muted">{message.description}</p> : null}
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
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
