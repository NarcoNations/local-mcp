'use client';

import { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  subtle?: boolean;
}

export function Card({ title, actions, footer, children, className, subtle }: CardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col rounded-xl border border-[hsl(var(--color-border)/0.5)] bg-surface-subdued/70 p-4 transition hover:border-[hsl(var(--color-border)/0.8)] hover:shadow-subtle',
        subtle && 'bg-transparent backdrop-blur',
        className,
      )}
    >
      {(title || actions) && (
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--color-border)/0.3)] pb-2">
          {title ? <h3 className="text-sm font-semibold text-foreground">{title}</h3> : <span />}
          {actions ? <div className="flex items-center gap-2 text-xs text-muted">{actions}</div> : null}
        </header>
      )}
      <div className="flex-1 text-sm text-muted group-hover:text-foreground">{children}</div>
      {footer ? <footer className="mt-4 text-xs text-muted">{footer}</footer> : null}
    </article>
  );
}
