import * as React from 'react';
import { cn } from '../utils/cn';
import { Surface, type SurfaceProps } from './Surface';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: SurfaceProps['variant'];
  padding?: SurfaceProps['padding'];
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  props,
  ref,
) {
  const {
    className,
    title,
    description,
    actions,
    header,
    footer,
    children,
    variant = 'elevated',
    padding = 'md',
    ...rest
  } = props;

  return (
    <Surface
      as="div"
      ref={ref as never}
      variant={variant}
      padding={padding}
      className={cn('flex flex-col gap-4', className)}
      {...rest}
    >
      {(title || description || actions || header) && (
        <div className="flex flex-col gap-3">
          {header}
          {(title || description || actions) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
                {description && <p className="text-sm text-muted">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 text-sm">{actions}</div>}
            </div>
          )}
        </div>
      )}
      {children && <div className="flex flex-col gap-3">{children}</div>}
      {footer && <div className="pt-2 text-sm text-muted">{footer}</div>}
    </Surface>
  );
});

Card.displayName = 'Card';
