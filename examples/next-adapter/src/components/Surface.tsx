import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type SurfaceVariant = "default" | "subdued" | "elevated" | "glass";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: SurfaceVariant;
  title?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  padding?: boolean;
  contentClassName?: string;
}

const baseClasses = "rounded-3xl border border-border/60 bg-surface/80 shadow-sm transition-colors";

const variantMap: Record<SurfaceVariant, string> = {
  default: "",
  subdued: "bg-surface-muted/80",
  elevated: "bg-surface-elevated/80 shadow-lg",
  glass: "surface-glass",
};

export function Surface({
  as: Component = "section",
  variant = "default",
  title,
  toolbar,
  footer,
  padding = true,
  contentClassName,
  className,
  children,
  ...props
}: SurfaceProps) {
  const hasHeader = Boolean(title || toolbar);
  return (
    <Component className={cn(baseClasses, variantMap[variant], className)} {...props}>
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-6 pb-4 pt-5">
          {typeof title === "string" ? (
            <h2 className="text-lg font-semibold tracking-tight text-foreground/95">{title}</h2>
          ) : (
            title
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <div
        className={cn(
          padding ? "px-6 py-5" : undefined,
          hasHeader && padding ? "pt-4" : undefined,
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer && <div className="border-t border-border/50 px-6 pb-5 pt-4 text-sm text-muted">{footer}</div>}
    </Component>
  );
}
