import { forwardRef, type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'surface' | 'positive' | 'caution' | 'critical';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
    default: 'bg-surface-muted/70 border border-border/60 shadow-[var(--shadow-soft)]/40',
    accent: 'bg-accent/10 border border-accent/25',
    surface: 'bg-surface border border-border/50',
    positive: 'bg-positive/10 border border-positive/25',
    caution: 'bg-caution/10 border border-caution/25',
    critical: 'bg-critical/10 border border-critical/25'
  };

  return (
    <div
      ref={ref}
      className={twMerge(
        'relative overflow-hidden rounded-2xl p-6 backdrop-blur transition-all duration-300 ease-out',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});

Card.displayName = 'Card';
