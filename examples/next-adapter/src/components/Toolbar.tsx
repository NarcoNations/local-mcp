import * as React from 'react';
import { cn } from '../utils/cn';

type ToolbarDensity = 'comfortable' | 'compact';

type ToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  density?: ToolbarDensity;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { density = 'comfortable', leading, trailing, children, className, ...rest },
  ref,
) {
  const gapClass = density === 'compact' ? 'gap-2' : 'gap-3';
  const paddingClass = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center justify-between rounded-lg border border-border bg-surface-subdued text-sm shadow-sm backdrop-blur-sm',
        gapClass,
        paddingClass,
        className,
      )}
      {...rest}
    >
      <div className={cn('flex flex-wrap items-center', gapClass)}>{leading ?? children}</div>
      {trailing && <div className={cn('flex flex-wrap items-center', gapClass)}>{trailing}</div>}
    </div>
  );
});

Toolbar.displayName = 'Toolbar';
