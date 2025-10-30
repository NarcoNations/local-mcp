"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card } from "../Card";
import { Stat } from "../Stat";
import { Pill } from "../Pill";
import { Toolbar } from "../Toolbar";
import { Icon } from "../icons";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useToast } from "../Toast";
import { relativeTime } from "../../utils/time";
import type {
  CorpusStats,
  HistorianEvent,
  IngestConversion,
  KnowledgeEntry,
} from "../../types/app";

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const quickActions = [
  {
    id: "upload",
    label: "Upload file",
    description: "Convert docs, audio, or archives into structured corpus entries.",
    href: "/ingest",
    icon: "ingest" as const,
  },
  {
    id: "chat-export",
    label: "Paste chat export URL",
    description: "Stream ChatGPT exports directly into the corpus.",
    href: "/corpus",
    icon: "corpus" as const,
  },
  {
    id: "knowledge-index",
    label: "Index knowledge",
    description: "Promote curated intel into the knowledge layer.",
    href: "/knowledge",
    icon: "knowledge" as const,
  },
  {
    id: "new-mvp",
    label: "New MVP brief",
    description: "Spin up a new one-shot MVP mission brief.",
    href: "/mvp",
    icon: "mvp" as const,
  },
];

const ingestStatusCopy: Record<IngestConversion["status"], { label: string; variant: "success" | "warn" | "error" | "info" | "neutral" }> = {
  complete: { label: "Complete", variant: "success" },
  processing: { label: "Processing", variant: "info" },
  queued: { label: "Queued", variant: "warn" },
  error: { label: "Error", variant: "error" },
};

interface DashboardViewProps {
  historianEvents: HistorianEvent[];
  ingestConversions: IngestConversion[];
  corpusStats: CorpusStats;
  knowledgeEntries: KnowledgeEntry[];
}

export function DashboardView({ historianEvents, ingestConversions, corpusStats, knowledgeEntries }: DashboardViewProps) {
  const router = useRouter();
  const { push } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const sources = useMemo(() => {
    const unique = new Set(historianEvents.map((event) => event.source));
    return ["all", ...Array.from(unique)];
  }, [historianEvents]);

  const filteredEvents = useMemo(() => {
    if (sourceFilter === "all") return historianEvents;
    return historianEvents.filter((event) => event.source === sourceFilter);
  }, [historianEvents, sourceFilter]);

  const variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : fadeInUp;

  const handleAction = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-8">
      <Toolbar
        title="Ultimate Systems Dashboard"
        description="Cinematic mission control across ingest, corpus, knowledge, search, and operations."
        actions={
          <Link
            href="/timeline"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-primary"
          >
            Live timeline
          </Link>
        }
      />

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
      >
        <Stat
          label="Conversations"
          value={corpusStats.conversations.toLocaleString()}
          helper="Across synced channels"
          delta={{ value: "+12 today", trend: "up" }}
        />
        <Stat
          label="Messages"
          value={corpusStats.messages.toLocaleString()}
          helper="Index coverage"
          delta={{ value: "+338", trend: "up" }}
        />
        <Stat
          label="Sources"
          value={corpusStats.sources?.toLocaleString() ?? "—"}
          helper="Active pipelines"
          delta={{ value: "Stable", trend: "flat" }}
        />
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            key: "quick-actions",
            className: "md:col-span-1",
            content: (
              <Card title="Quick actions" description="Drop straight into high-frequency operations." variant="elevated">
                <div className="grid gap-3 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleAction(action.href)}
                      className="focus-ring flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition hover:bg-accent-soft"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Icon name={action.icon} className="h-4 w-4" />
                        {action.label}
                      </span>
                      <span className="text-xs text-muted">{action.description}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ),
          },
          {
            key: "historian",
            className: "md:col-span-2",
            content: (
              <Card
                title="Historian now"
                description="Pulse of the last 10 system events. Filter by originating system."
                actions={
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setSourceFilter(source)}
                        className={`focus-ring rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                          sourceFilter === source
                            ? "bg-accent-soft text-primary"
                            : "border-border bg-surface text-muted hover:text-primary"
                        }`}
                      >
                        {source === "all" ? "All" : source}
                      </button>
                    ))}
                  </div>
                }
              >
                <ul className="space-y-3">
                  {filteredEvents.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{event.title}</p>
                        <p className="text-xs text-muted">
                          {event.source} • {event.kind}
                        </p>
                      </div>
                      <span className="text-xs text-muted">{relativeTime(event.occurredAt)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ),
          },
          {
            key: "ingest",
            className: "md:col-span-1",
            content: (
              <Card
                title="Ingest status"
                description="Latest conversions flowing through the pipeline."
              >
                <ul className="space-y-3">
                  {ingestConversions.map((conversion) => {
                    const status = ingestStatusCopy[conversion.status];
                    return (
                      <li key={conversion.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-primary">{conversion.slug}</p>
                            <p className="text-xs text-muted">{conversion.files} files • {conversion.stored ? "Stored" : "Temp"}</p>
                          </div>
                          <Pill variant={status.variant}>{status.label}</Pill>
                        </div>
                        <p className="mt-2 text-xs text-muted">{relativeTime(conversion.updatedAt)}</p>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ),
          },
          {
            key: "knowledge",
            className: "md:col-span-1",
            content: (
              <Card
                title="Knowledge nodes"
                description="Latest curated slugs staged for deep reasoning."
                actions={
                  <button
                    type="button"
                    onClick={() => handleAction("/knowledge")}
                    className="focus-ring rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted hover:text-primary"
                  >
                    Manage
                  </button>
                }
              >
                <ul className="space-y-3">
                  {knowledgeEntries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{entry.slug}</p>
                        <p className="text-xs text-muted">{entry.files} files • {relativeTime(entry.createdAt)}</p>
                      </div>
                      <Pill variant={entry.status === "ready" ? "success" : entry.status === "indexing" ? "info" : "warn"}>
                        {entry.status}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            ),
          },
          {
            key: "search",
            className: "md:col-span-1",
            content: (
              <Card
                title="Search corpus"
                description="Cross interrogate conversations, knowledge, and prompts."
              >
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const query = String(formData.get("query") ?? "").trim();
                    if (!query) return;
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                >
                  <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="dashboard-search">
                    Query
                  </label>
                  <input
                    id="dashboard-search"
                    name="query"
                    type="search"
                    required
                    placeholder="e.g. supply chain vulnerabilities"
                    className="focus-ring rounded-2xl border border-border bg-surface-elevated px-4 py-2 text-sm text-primary placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
                  >
                    Launch search
                  </button>
                </form>
              </Card>
            ),
          },
          {
            key: "api-manager",
            className: "md:col-span-2",
            content: (
              <Card
                title="API probes"
                description="Kick off feed alpha calls or ad-hoc LLM probes without leaving command."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <form
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      const symbol = String(data.get("symbol") ?? "").trim();
                      const fn = String(data.get("fn") ?? "").trim();
                      if (!symbol || !fn) return;
                      push({
                        title: "Feed probe queued",
                        description: `${symbol}.${fn} scheduled. Track in API Manager.`,
                        variant: "info",
                      });
                      event.currentTarget.reset();
                    }}
                  >
                    <p className="text-sm font-semibold text-primary">Feed alpha probe</p>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="symbol-input">
                      Symbol
                    </label>
                    <input
                      id="symbol-input"
                      name="symbol"
                      placeholder="api.alpha"
                      className="focus-ring rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                    />
                    <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="fn-input">
                      Function
                    </label>
                    <input
                      id="fn-input"
                      name="fn"
                      placeholder="probe"
                      className="focus-ring rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                    />
                    <button
                      type="submit"
                      className="focus-ring mt-2 inline-flex items-center justify-center rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Enqueue
                    </button>
                  </form>
                  <form
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      const task = String(data.get("task") ?? "").trim();
                      const prompt = String(data.get("prompt") ?? "").trim();
                      if (!task) return;
                      push({
                        title: "LLM probe sent",
                        description: `Task: ${task}`,
                        variant: "success",
                      });
                      event.currentTarget.reset();
                    }}
                  >
                    <p className="text-sm font-semibold text-primary">LLM probe</p>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="task-input">
                      Task
                    </label>
                    <input
                      id="task-input"
                      name="task"
                      placeholder="Classify risk exposure"
                      className="focus-ring rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                    />
                    <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="prompt-input">
                      Prompt
                    </label>
                    <textarea
                      id="prompt-input"
                      name="prompt"
                      rows={4}
                      placeholder="Outline the posture required for tonight's corridor run..."
                      className="focus-ring rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                    />
                    <button
                      type="submit"
                      className="focus-ring mt-2 inline-flex items-center justify-center rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Execute
                    </button>
                  </form>
                </div>
              </Card>
            ),
          },
          {
            key: "playgrounds",
            className: "md:col-span-1",
            content: (
              <Card title="Playgrounds" description="Drop into spatial and social sandboxes." variant="glass">
                <div className="grid gap-3">
                  <Link
                    href="/play/map"
                    className="focus-ring flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary transition hover:bg-accent-soft"
                  >
                    Map Lab
                    <span className="text-xs text-muted">Spatial feeds</span>
                  </Link>
                  <Link
                    href="/play/social"
                    className="focus-ring flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary transition hover:bg-accent-soft"
                  >
                    Social Synth
                    <span className="text-xs text-muted">Narrative pilots</span>
                  </Link>
                </div>
              </Card>
            ),
          },
          {
            key: "workroom",
            className: "md:col-span-2",
            content: (
              <Card title="Workroom & MVP" description="Jump back into the collaborative lanes or spin up new briefs." variant="elevated">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h3 className="text-sm font-semibold text-primary">Workroom lanes</h3>
                    <p className="mt-2 text-sm text-muted">
                      Whiteboard OS for rapid alignment and export.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAction("/workroom")}
                      className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Enter workroom
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h3 className="text-sm font-semibold text-primary">One-shot MVP</h3>
                    <p className="mt-2 text-sm text-muted">
                      Generate cinematic briefings from mission objectives.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAction("/mvp")}
                      className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Launch generator
                    </button>
                  </div>
                </div>
              </Card>
            ),
          },
        ].map((item, index) => (
          <motion.div
            key={item.key}
            className={item.className}
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : index * 0.08,
            }}
          >
            {item.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
