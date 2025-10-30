'use client';

import { ReactNode } from 'react';
import { cn } from '../lib/cn';

type PillTone = 'success' | 'warn' | 'error' | 'info' | 'neutral';

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = 'neutral', children, className }: PillProps) {
  const toneClass = {
    success: 'bg-[hsl(var(--color-success)/0.15)] text-[hsl(var(--color-success))]',
    warn: 'bg-[hsl(var(--color-warning)/0.2)] text-[hsl(var(--color-warning))]',
    error: 'bg-[hsl(var(--color-danger)/0.2)] text-[hsl(var(--color-danger))]',
    info: 'bg-[hsl(var(--color-info)/0.18)] text-[hsl(var(--color-info))]',
    neutral: 'bg-[hsl(var(--color-border)/0.2)] text-muted',
  }[tone];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', toneClass, className)}>
      {children}
    </span>
  );
}
