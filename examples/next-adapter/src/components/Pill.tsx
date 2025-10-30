import * as React from 'react';
import { cn } from '../utils/cn';

type PillTone = 'neutral' | 'success' | 'warn' | 'error' | 'info';

type PillSize = 'sm' | 'md';

const toneClasses: Record<PillTone, string> = {
  neutral: 'bg-surface-subdued text-muted border border-border',
  success:
    'bg-[color:var(--color-success-soft)] border border-[color:var(--color-success-border)] text-success',
  warn:
    'bg-[color:var(--color-warn-soft)] border border-[color:var(--color-warn-border)] text-warn',
  error:
    'bg-[color:var(--color-error-soft)] border border-[color:var(--color-error-border)] text-error',
  info:
    'bg-[color:var(--color-info-soft)] border border-[color:var(--color-info-border)] text-info',
};

const sizeClasses: Record<PillSize, string> = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: PillSize;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { tone = 'neutral', size = 'sm', leading, trailing, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wide',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </span>
  );
});

Pill.displayName = 'Pill';
