'use client';

interface StatProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction?: 'up' | 'down' | 'flat' };
  hint?: string;
}

export function Stat({ label, value, delta, hint }: StatProps) {
  return (
    <div className="rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {delta ? (
          <span className="text-xs font-medium text-muted">
            {delta.direction === 'down' ? '▼' : delta.direction === 'up' ? '▲' : '◆'} {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
