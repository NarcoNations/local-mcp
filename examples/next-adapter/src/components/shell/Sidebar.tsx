"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Fragment } from "react";

import { navItems } from "@/data/navigation";
import { cn } from "@/utils/cn";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

const sidebarVariants = {
  initial: { x: -24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -12, opacity: 0 },
};

export function Sidebar({ mobileOpen, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <nav className="flex h-full flex-1 flex-col gap-6 overflow-y-auto px-4 py-6" aria-label="Primary">
      <div className="flex items-center gap-2 px-2 text-sm font-semibold uppercase tracking-widest text-muted/80">
        <Menu className="h-4 w-4" aria-hidden />
        Systems
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                onNavigate?.();
                onClose();
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-highlight/15 text-highlight shadow-inner"
                  : "text-muted hover:bg-surface-muted/80 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 transition group-hover:scale-105" aria-hidden />
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface-muted/60 px-4 py-3 text-xs text-muted">
        <p className="font-medium uppercase tracking-[0.2em] text-muted/70">// EDIT HERE</p>
        <p className="mt-1 font-semibold text-foreground">Narco Nations · VibeOS</p>
        <p className="mt-2 text-muted/80">Calibrate your stack, expand the network, orchestrate the vibe.</p>
      </div>
    </nav>
  );

  return (
    <Fragment>
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-surface/90 px-2 py-4 lg:flex lg:flex-col lg:backdrop-blur-lg">
        {content}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              aria-label="Close navigation"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/60 bg-surface shadow-lg"
              variants={sidebarVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
