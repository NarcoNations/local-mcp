import * as React from 'react';
import { cn } from '../utils/cn';

type SurfaceVariant = 'subdued' | 'elevated' | 'glass';

export interface SurfaceProps<T extends React.ElementType = 'section'> {
  as?: T;
  variant?: SurfaceVariant;
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
}

type PolymorphicProps<T extends React.ElementType> = SurfaceProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof SurfaceProps<T>>;

const paddingMap = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

const variantMap: Record<SurfaceVariant, string> = {
  subdued: 'bg-surface-subdued border border-border shadow-sm',
  elevated: 'bg-surface-elevated border border-border shadow-md',
  glass:
    'bg-surface-glass border glass-border shadow-md data-[glass]:backdrop-blur-xl supports-[backdrop-filter]:[background-color:var(--color-surface-glass)]',
};

export const Surface = React.forwardRef(function Surface<
  T extends React.ElementType = 'section',
>(props: PolymorphicProps<T>, ref: React.ForwardedRef<Element>) {
  const {
    as,
    children,
    className,
    variant = 'elevated',
    title,
    toolbar,
    padding = 'md',
    id,
    ...rest
  } = props;

  const Component = (as || 'section') as React.ElementType;

  return (
    <Component
      ref={ref as never}
      id={id}
      data-glass={variant === 'glass' ? '' : undefined}
      className={cn(
        'relative rounded-lg sm:rounded-xl transition-colors duration-interactive ease-spring-snappy',
        variantMap[variant],
        paddingMap[padding],
        className,
      )}
      {...rest}
    >
      {(title || toolbar) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {toolbar && <div className="flex items-center gap-2 text-sm text-muted">{toolbar}</div>}
        </div>
      )}
      <div className={cn('flex flex-col gap-4', padding === 'none' && 'gap-0')}>{children}</div>
    </Component>
  );
});

Surface.displayName = 'Surface';
