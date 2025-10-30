"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { commandActions, navItems } from "@/data/navigation";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/components/Toast";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { push } = useToast();

  const currentNav = useMemo(() => {
    return navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  }, [pathname]);

  const shortcuts = useMemo(
    () => [
      {
        key: "k",
        metaKey: true,
        onTrigger: () => setPaletteOpen(true),
      },
      {
        key: "/",
        preventDefault: true,
        onTrigger: () => {
          setSidebarOpen(false);
          searchRef.current?.focus();
        },
      },
      {
        key: "t",
        onTrigger: () => toggleTheme(),
      },
    ],
    [toggleTheme],
  );

  useShortcuts(shortcuts);

  const handleSearch = (query: string) => {
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    push({ title: "Search engaged", description: `Looking for “${query}” across the stack.`, variant: "info" });
  };

  const handlePaletteAction = (action: (typeof commandActions)[number]) => {
    switch (action.id) {
      case "action-upload":
        router.push("/ingest");
        push({ title: "Ingest ready", description: "Drop your files to convert them instantly.", variant: "success" });
        break;
      case "action-chat-export":
        router.push("/corpus");
        push({ title: "Corpus ingestion", description: "Paste export URLs for rapid indexing.", variant: "info" });
        break;
      case "action-index-knowledge":
        router.push("/knowledge");
        push({ title: "Knowledge index armed", description: "Select a corpus to index and deploy.", variant: "info" });
        break;
      case "action-new-brief":
        router.push("/mvp");
        break;
      case "action-focus-search":
        searchRef.current?.focus();
        break;
      case "action-toggle-theme":
        toggleTheme();
        break;
      case "action-open-api-probe":
        router.push("/api-manager");
        break;
      case "action-open-feed":
        router.push("/timeline");
        break;
      default:
        if (action.href) {
          router.push(action.href);
        }
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={() => setPaletteOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar
          title={currentNav?.label ?? "Command Hub"}
          description={currentNav?.description ?? "All systems online."}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onOpenPalette={() => setPaletteOpen(true)}
          onThemeToggle={toggleTheme}
          theme={theme}
          searchRef={searchRef}
          onSearch={handleSearch}
          paletteOpen={paletteOpen}
        />
        <main className="flex-1 bg-background/80">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8" role="main">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAction={handlePaletteAction}
      />
    </div>
  );
}
