import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../utils/cn";

type SurfaceVariant = "subdued" | "elevated" | "glass";

interface SurfaceProps<T extends ElementType> {
  as?: T;
  variant?: SurfaceVariant;
  title?: ReactNode;
  toolbar?: ReactNode;
  contentClassName?: string;
  className?: string;
  children?: ReactNode;
}

type PolymorphicProps<T extends ElementType> = SurfaceProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SurfaceProps<T>>;

const variantClass: Record<SurfaceVariant, string> = {
  subdued: "surface-subdued shadow-subtle backdrop-blur-sm",
  elevated: "surface-elevated shadow-raised",
  glass: "surface-glass shadow-pop",
};

export function Surface<T extends ElementType = "section">({
  as,
  variant = "subdued",
  title,
  toolbar,
  contentClassName,
  className,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = (as ?? "section") as ElementType;

  return (
    <Component
      className={cn(
        "relative rounded-3xl border border-border p-6 text-primary",
        variantClass[variant],
        className
      )}
      {...(props as ComponentPropsWithoutRef<ElementType>)}
    >
      {(title || toolbar) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {title ? (
            <h2 className="text-lg font-semibold tracking-tight text-primary">
              {title}
            </h2>
          ) : null}
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </header>
      )}
      <div className={cn("flex flex-col gap-4", contentClassName)}>{children}</div>
    </Component>
  );
}
