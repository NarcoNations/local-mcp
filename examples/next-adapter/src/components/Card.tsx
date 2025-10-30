import type { ReactNode } from "react";
import { Surface } from "./Surface";

type CardVariant = "subdued" | "elevated" | "glass";

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  variant?: CardVariant;
  children?: ReactNode;
}

export function Card({
  title,
  description,
  actions,
  footer,
  className,
  variant = "subdued",
  children,
}: CardProps) {
  return (
    <Surface
      title={title}
      toolbar={actions}
      variant={variant}
      className={className}
      contentClassName="flex flex-col gap-5"
    >
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {children}
      {footer ? (
        <footer className="border-t border-border pt-3 text-sm text-muted">{footer}</footer>
      ) : null}
    </Surface>
  );
}
