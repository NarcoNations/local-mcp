import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type PillTone = "success" | "warning" | "error" | "info" | "neutral";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  icon?: ReactNode;
  children: ReactNode;
}

const toneClass: Record<PillTone, string> = {
  success: "bg-highlight/15 text-highlight border-highlight/40",
  warning: "bg-gold/20 text-gold border-gold/40",
  error: "bg-accent/15 text-accent border-accent/40",
  info: "bg-highlight/20 text-highlight border-highlight/40",
  neutral: "bg-surface-muted/80 text-muted border-border/60",
};

export function Pill({ tone = "neutral", icon, children, className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
