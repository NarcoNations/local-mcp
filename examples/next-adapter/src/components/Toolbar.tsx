import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type Density = "comfortable" | "compact";

const densityClasses: Record<Density, string> = {
  comfortable: "gap-4 px-5 py-4",
  compact: "gap-3 px-4 py-3",
};

interface ToolbarProps {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  density?: Density;
  className?: string;
}

export function Toolbar({
  title,
  description,
  children,
  actions,
  density = "comfortable",
  className,
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        "flex flex-wrap items-center justify-between rounded-2xl border border-border bg-surface-elevated text-primary shadow-subtle",
        densityClasses[density],
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {title ? <h2 className="text-lg font-semibold leading-tight">{title}</h2> : null}
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
