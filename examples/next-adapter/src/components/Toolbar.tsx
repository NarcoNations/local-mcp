'use client';

import { ReactNode, useState } from 'react';
import { cn } from '../lib/cn';

interface ToolbarProps {
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Toolbar({ leading, actions, className }: ToolbarProps) {
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[hsl(var(--color-border)/0.4)] bg-surface-subdued/60 px-4 py-3 text-sm',
        density === 'compact' && 'text-xs',
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-3 text-muted">{leading}</div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-[hsl(var(--color-border)/0.5)] bg-background/70 p-1 text-xs">
          <button
            type="button"
            className={cn(
              'rounded-full px-2 py-1 transition',
              density === 'comfortable'
                ? 'bg-[hsl(var(--color-cyan)/0.15)] text-foreground'
                : 'text-muted hover:text-foreground',
            )}
            onClick={() => setDensity('comfortable')}
            aria-pressed={density === 'comfortable'}
          >
            Cozy
          </button>
          <button
            type="button"
            className={cn(
              'rounded-full px-2 py-1 transition',
              density === 'compact' ? 'bg-[hsl(var(--color-cyan)/0.15)] text-foreground' : 'text-muted hover:text-foreground',
            )}
            onClick={() => setDensity('compact')}
            aria-pressed={density === 'compact'}
          >
            Tight
          </button>
        </div>
        {actions}
      </div>
    </div>
  );
}
