'use client';

import { ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';

type SurfaceVariant = 'subdued' | 'elevated' | 'glass';

interface SurfaceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: SurfaceVariant;
  title?: ReactNode;
  toolbar?: ReactNode;
}

export function Surface({
  as: Component = 'section',
  children,
  className,
  variant = 'subdued',
  title,
  toolbar,
}: SurfaceProps) {
  return (
    <Component
      className={cn(
        'relative flex flex-col gap-4 rounded-xl border border-[hsl(var(--color-border)/0.45)] p-4 transition hover:border-[hsl(var(--color-border)/0.75)]',
        variant === 'subdued' && 'bg-surface-subdued/80',
        variant === 'elevated' && 'bg-surface shadow-subtle',
        variant === 'glass' && 'glass-surface backdrop-blur',
        className,
      )}
    >
      {(title || toolbar) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--color-border)/0.35)] pb-2 text-sm">
          {title ? <h2 className="font-semibold text-foreground">{title}</h2> : <span />}
          {toolbar ? <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{toolbar}</div> : null}
        </header>
      )}
      <div className="flex-1">{children}</div>
    </Component>
  );
}
