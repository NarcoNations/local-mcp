import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type Trend = "up" | "down" | "flat";

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  delta?: {
    value: string;
    trend?: Trend;
  };
  align?: "start" | "center" | "end";
  className?: string;
}

const trendColors: Record<Trend, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-muted",
};

const trendIcons: Record<Trend, string> = {
  up: "▲",
  down: "▼",
  flat: "■",
};

export function Stat({ label, value, helper, delta, align = "start", className }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-border bg-surface px-4 py-3",
        align === "center" && "items-center text-center",
        align === "end" && "items-end text-right",
        className
      )}
    >
      <span className="text-xs uppercase tracking-[0.22em] text-muted">{label}</span>
      <span className="text-2xl font-semibold leading-tight text-primary">{value}</span>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {delta ? (
          <span className={cn("flex items-center gap-1 font-medium", trendColors[delta.trend ?? "flat"]) }>
            <span aria-hidden="true">{trendIcons[delta.trend ?? "flat"]}</span>
            {delta.value}
          </span>
        ) : null}
        {helper ? <span className="text-muted">{helper}</span> : null}
      </div>
    </div>
  );
}
