import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { Slot } from '@radix-ui/react-slot';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
};

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-surface font-semibold shadow-[0_10px_30px_-18px_hsl(var(--tone-accent))] hover:bg-accentSoft focus-visible:bg-accentSoft',
  secondary: 'bg-surface-muted text-text hover:bg-surface-strong focus-visible:bg-surface-strong',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-muted/60 focus-visible:text-text'
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 rounded-full px-4 text-sm',
  md: 'h-11 rounded-full px-5 text-sm font-medium',
  lg: 'h-12 rounded-full px-6 text-base font-semibold'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as any}
        className={twMerge(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
