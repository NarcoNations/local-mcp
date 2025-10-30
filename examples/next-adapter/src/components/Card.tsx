import type { HTMLAttributes, ReactNode } from "react";

import { Surface, type SurfaceProps } from "@/components/Surface";
import { cn } from "@/utils/cn";

export interface CardProps extends Omit<SurfaceProps, "children"> {
  children: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({ children, footer, padded = true, className, ...surfaceProps }: CardProps) {
  return (
    <Surface
      {...surfaceProps}
      padding={false}
      className={cn("flex h-full flex-col", className)}
      contentClassName={cn(
        "flex flex-1 flex-col gap-3",
        padded ? "px-6 py-4" : "px-4 py-3",
      )}
    >
      <div className="flex-1">{children}</div>
      {footer && (
        <div
          className={cn(
            "border-t border-border/50 text-sm text-muted",
            padded ? "-mx-6 mb-0 mt-2 px-6 pb-4 pt-4" : "-mx-4 mb-0 mt-2 px-4 pb-3 pt-3",
          )}
        >
          {footer}
        </div>
      )}
    </Surface>
  );
}
