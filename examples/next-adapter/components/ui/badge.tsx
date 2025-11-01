import { twMerge } from 'tailwind-merge';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'accent' | 'positive' | 'caution' | 'critical';
};

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    default: 'bg-surface-muted text-text-muted border border-border/60',
    accent: 'bg-accent/15 text-accent border border-accent/40',
    positive: 'bg-positive/15 text-positive border border-positive/40',
    caution: 'bg-caution/15 text-caution border border-caution/40',
    critical: 'bg-critical/15 text-critical border border-critical/40'
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
