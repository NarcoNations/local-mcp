"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Database,
  ExternalLink,
  FileUp,
  Link2,
  Map,
  PanelRight,
  Rocket,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { Stat } from "@/components/Stat";
import { Toolbar } from "@/components/Toolbar";
import { useToast } from "@/components/Toast";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fadeInUp, stagger } from "@/motion/variants";
import type { DashboardData } from "@/types/dashboard";

interface DashboardClientProps {
  data: DashboardData;
}

const actionIconMap: Record<string, JSX.Element> = {
  upload: <FileUp className="h-4 w-4" aria-hidden />,
  "chat-export": <Link2 className="h-4 w-4" aria-hidden />,
  "index-knowledge": <Database className="h-4 w-4" aria-hidden />,
  "new-brief": <Sparkles className="h-4 w-4" aria-hidden />,
};

export function DashboardClient({ data }: DashboardClientProps) {
  const reducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const { push } = useToast();
  const [apiSymbol, setApiSymbol] = useState("VIBE");
  const [apiFunction, setApiFunction] = useState("pulse");
  const [task, setTask] = useState("");
  const [prompt, setPrompt] = useState("");

  const cardVariants = useMemo(() => (reducedMotion ? undefined : fadeInUp), [reducedMotion]);
  const containerVariants = useMemo(() => (reducedMotion ? undefined : stagger), [reducedMotion]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    push({ title: "Search engaged", description: `Vector sweep for “${query.trim()}” dispatched.`, variant: "info" });
  };

  const handleApiProbe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    push({
      title: "Probe queued",
      description: `Symbol ${apiSymbol}.${apiFunction} enqueued. Inspect results in API Manager.`,
      variant: "success",
    });
  };

  const handlePrompt = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    push({ title: "LLM probe drafted", description: "Hand-off to API Manager for full run.", variant: "info" });
  };

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 xl:grid-cols-12"
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
      variants={containerVariants}
    >
      <motion.div variants={cardVariants} className="xl:col-span-4">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-highlight" aria-hidden />
              <span>Quick actions</span>
            </div>
          }
          padded
          variant="elevated"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group flex flex-col gap-2 rounded-2xl border border-border/40 bg-surface-muted/70 px-4 py-3 transition hover:border-highlight/60 hover:bg-highlight/10"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  {actionIconMap[action.id] ?? <ArrowRight className="h-4 w-4" aria-hidden />}
                  <span>{action.label}</span>
                </div>
                {action.description && <p className="text-xs text-muted/80">{action.description}</p>}
                <span className="mt-auto flex items-center gap-1 text-xs text-highlight/80 group-hover:text-highlight">
                  Engage
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-5">
        <Card
          title={<span>Historian now</span>}
          toolbar={
            <div className="flex gap-2">
              <Pill tone="info">Live</Pill>
              <Pill tone="neutral">Last {data.historian.length}</Pill>
            </div>
          }
          padded
          variant="default"
        >
          <div className="flex flex-wrap gap-2 pb-2">
            {Array.from(new Set(data.historian.map((event) => event.source))).map((source) => (
              <Pill key={source} tone="neutral" className="bg-surface-muted/50">
                {source}
              </Pill>
            ))}
          </div>
          <ul className="space-y-3">
            {data.historian.map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-border/40 bg-background/40 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground/90">{event.title}</span>
                  <span className="text-xs text-muted/70">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted/80">
                  <span className="uppercase tracking-[0.25em]">{event.source}</span>
                  <span className="text-muted">·</span>
                  <span>{event.kind}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-3">
        <Card title="Ingest status" variant="default" padded>
          <ul className="space-y-3">
            {data.ingest.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 rounded-2xl border border-border/50 px-4 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground/90">
                  <span>{item.slug}</span>
                  <Pill tone={item.storage ? "success" : "neutral"} className="text-[0.65rem]">
                    {item.storage ? "Stored" : "Local"}
                  </Pill>
                </div>
                <div className="flex items-center justify-between text-xs text-muted/80">
                  <span>{item.files} files</span>
                  <time dateTime={item.createdAt} className="font-mono text-[0.7rem]">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-4">
        <Card title="Corpus stats" variant="elevated" padded>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Stat label="Conversations" value={data.corpus.conversations.toLocaleString()} delta={8.2} trend="up" />
            <Stat label="Messages" value={data.corpus.messages.toLocaleString()} delta={3.5} trend="up" />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-5">
        <Card
          title="Knowledge drops"
          toolbar={
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-full border border-highlight/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-highlight transition hover:bg-highlight/10"
            >
              Manage
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
          variant="default"
          padded
        >
          <ul className="space-y-3">
            {data.knowledge.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-2xl border border-border/40 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground/90">{item.slug}</p>
                  <p className="text-xs text-muted/70">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                </div>
                <Link
                  href={`/knowledge?focus=${encodeURIComponent(item.slug)}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted transition hover:border-highlight/60 hover:text-highlight"
                >
                  Index
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-3">
        <Card title="Search the matrix" variant="glass" padded>
          <SearchWidget onSearch={handleSearch} />
          <p className="mt-3 text-xs text-muted/80">Press <kbd className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.65rem]">/</kbd> to focus search anywhere.</p>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-4">
        <Card title="API manager probes" variant="default" padded>
          <Toolbar dense className="mb-3 justify-start gap-3">
            <Pill tone="info" className="uppercase">Alpha</Pill>
            <span className="text-xs text-muted/80">Ping live services straight from the dash.</span>
          </Toolbar>
          <form onSubmit={handleApiProbe} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-muted/80">
              Symbol
              <input
                value={apiSymbol}
                onChange={(event) => setApiSymbol(event.target.value.toUpperCase())}
                className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-highlight/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-muted/80">
              Function
              <input
                value={apiFunction}
                onChange={(event) => setApiFunction(event.target.value)}
                className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-highlight/60 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="col-span-full inline-flex items-center justify-center gap-2 rounded-2xl border border-highlight/60 bg-highlight/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-highlight transition hover:bg-highlight/20"
            >
              Queue probe
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
          <div className="mt-5 rounded-2xl border border-border/60 bg-surface-muted/70 p-4">
            <form onSubmit={handlePrompt} className="space-y-3">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-muted/80">
                Task
                <input
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder="Summarize pipeline health"
                  className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-highlight/60 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-muted/80">
                Prompt
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={3}
                  className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-highlight/60 focus:outline-none"
                  placeholder="Detail the ingestion backlog and highlight anomalies."
                />
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted transition hover:border-highlight/60 hover:text-highlight"
              >
                Stage prompt
                <Bot className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-4">
        <Card title="Playgrounds" variant="default" padded>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/play/map"
              className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-surface-muted/60 px-4 py-4 transition hover:border-highlight/60 hover:bg-highlight/10"
            >
              <Map className="h-5 w-5 text-highlight" aria-hidden />
              <span className="text-sm font-semibold text-foreground">Map intelligence</span>
              <span className="text-xs text-muted/80">Spatial overlays for nodes and influence zones.</span>
            </Link>
            <Link
              href="/play/social"
              className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-surface-muted/60 px-4 py-4 transition hover:border-highlight/60 hover:bg-highlight/10"
            >
              <Share2 className="h-5 w-5 text-highlight" aria-hidden />
              <span className="text-sm font-semibold text-foreground">Social forge</span>
              <span className="text-xs text-muted/80">Spin up viral ready assets with one command.</span>
            </Link>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} className="xl:col-span-4">
        <Card title="Workroom & MVP" variant="glass" padded>
          <div className="flex flex-col gap-3">
            <Link
              href="/workroom"
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-highlight/60 hover:text-highlight"
            >
              <span>Open Workroom lanes</span>
              <PanelRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/mvp"
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-highlight/60 hover:text-highlight"
            >
              <span>Launch MVP generator</span>
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function SearchWidget({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-muted">
        <Search className="h-4 w-4" aria-hidden />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Scan everything…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-highlight/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition hover:bg-highlight/20"
      >
        Search stack
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
