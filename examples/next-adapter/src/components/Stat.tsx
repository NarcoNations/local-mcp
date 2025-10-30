import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  delta?: number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  subtle?: boolean;
}

export function Stat({ label, value, delta, unit, trend, subtle }: StatProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-highlight" : trend === "down" ? "text-accent" : "text-muted";

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-surface/60 px-4 py-3", subtle && "bg-transparent border-dashed")}> 
      <p className="text-xs uppercase tracking-[0.35em] text-muted/80">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground/95">{value}</span>
        {unit && <span className="text-sm text-muted/80">{unit}</span>}
      </div>
      {typeof delta === "number" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted">
          <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} aria-hidden />
          <span className={cn("font-medium", trendColor)}>
            {trend === "down" ? "-" : trend === "up" ? "+" : ""}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted/80">vs. last cycle</span>
        </div>
      )}
    </div>
  );
}
