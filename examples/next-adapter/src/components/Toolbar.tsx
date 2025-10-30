import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface ToolbarProps {
  children: ReactNode;
  justify?: "start" | "between" | "end";
  dense?: boolean;
  className?: string;
}

export function Toolbar({ children, justify = "between", dense, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border border-border/60 bg-surface/70 backdrop-blur px-4",
        justify === "between" && "justify-between",
        justify === "start" && "justify-start",
        justify === "end" && "justify-end",
        dense ? "py-2" : "py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
