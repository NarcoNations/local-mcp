import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type PillVariant = "success" | "warn" | "error" | "info" | "neutral";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  leadingIcon?: ReactNode;
  className?: string;
}

const variantClasses: Record<PillVariant, string> = {
  success: "bg-success-soft text-success",
  warn: "bg-warning-soft text-warning",
  error: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-accent-soft text-primary",
};

export function Pill({ children, variant = "neutral", leadingIcon, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
        variantClasses[variant],
        className
      )}
    >
      {leadingIcon ? <span className="text-sm" aria-hidden="true">{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
