import * as React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../utils/cn';

type StatTone = 'neutral' | 'success' | 'warn' | 'error' | 'info';
type StatTrend = 'up' | 'down' | 'flat';

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: {
    value: React.ReactNode;
    tone?: StatTone;
    trend?: StatTrend;
  };
  description?: React.ReactNode;
}

const toneClassMap: Record<StatTone, string> = {
  neutral: 'text-muted',
  success: 'text-success',
  warn: 'text-warn',
  error: 'text-error',
  info: 'text-info',
};

const trendIconMap: Record<StatTrend, React.ReactNode> = {
  up: <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />,
  down: <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />,
  flat: <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />,
};

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, delta, description, className, ...rest },
  ref,
) {
  const tone = delta?.tone ?? 'neutral';
  const trend = delta?.trend ?? 'flat';

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-surface-subdued p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...rest}
    >
      <div className="flex flex-col gap-1 text-sm text-muted">
        <span className="font-medium uppercase tracking-wide text-muted opacity-70">{label}</span>
        {description && <span className="text-xs text-muted opacity-80">{description}</span>}
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {delta && (
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', toneClassMap[tone])}>
            {trendIconMap[trend]}
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
});

Stat.displayName = 'Stat';
