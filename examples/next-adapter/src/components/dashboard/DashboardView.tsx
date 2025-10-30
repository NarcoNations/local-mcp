'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CloudCog,
  Layers,
  Link2,
  Search,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Stat } from '../Stat';
import { Toolbar } from '../Toolbar';
import { cn } from '../../utils/cn';
import { fadeInUp, scaleIn, stagger } from '../../motion/presets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useToast } from '../Toast';
import type { DashboardState, HistorianEvent, QuickAction } from '../../mocks/dashboard';

interface DashboardViewProps {
  data: DashboardState;
}

const quickActionIcons: Record<QuickAction['icon'], React.ReactNode> = {
  upload: <UploadCloud className="h-5 w-5" aria-hidden="true" />, 
  link: <Link2 className="h-5 w-5" aria-hidden="true" />, 
  index: <Layers className="h-5 w-5" aria-hidden="true" />, 
  spark: <Sparkles className="h-5 w-5" aria-hidden="true" />, 
};

const badgeToneMap: Record<NonNullable<HistorianEvent['meta']>['badge'], 'success' | 'warn' | 'error' | 'info'> = {
  success: 'success',
  warn: 'warn',
  error: 'error',
  info: 'info',
};

function formatTimeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  const delta = Date.now() - ts;
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function DashboardView({ data }: DashboardViewProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { push } = useToast();
  const [historianFilter, setHistorianFilter] = React.useState<string>('all');

  const containerVariants = React.useMemo(() => (prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : stagger), [prefersReducedMotion]);
  const itemVariants = React.useMemo(() => (prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeInUp), [prefersReducedMotion]);
  const scaleVariants = React.useMemo(() => (prefersReducedMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : scaleIn), [prefersReducedMotion]);

  const sources = React.useMemo(() => ['all', ...Array.from(new Set(data.historian.map((event) => event.source)))], [data.historian]);

  const filteredEvents = React.useMemo(() => {
    if (historianFilter === 'all') return data.historian;
    return data.historian.filter((event) => event.source === historianFilter);
  }, [data.historian, historianFilter]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') ?? '').trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleAlphaSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const symbol = String(formData.get('symbol') ?? '').trim().toUpperCase();
    const fn = String(formData.get('fn') ?? '').trim();
    push({
      title: 'Alpha probe queued',
      description: symbol && fn ? `${symbol} → ${fn}` : 'Probe request staged.',
      tone: 'info',
    });
    event.currentTarget.reset();
  };

  const handleLLMSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const task = String(formData.get('task') ?? '').trim();
    push({
      title: 'LLM probe queued',
      description: task ? `Task: ${task}` : 'Prompt accepted.',
      tone: 'success',
    });
    event.currentTarget.reset();
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6">
      <motion.div variants={itemVariants}>
        <Toolbar
          density="comfortable"
          leading={
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {data.isMock ? 'Mock telemetry' : 'Live systems'}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CloudCog className="h-4 w-4" aria-hidden="true" />
                {data.errors.length ? data.errors[0] : 'Signal cortex is green across ingest, search, and workroom.'}
              </div>
            </div>
          }
          trailing={
            <div className="flex items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-success-soft)]" aria-hidden="true" />
                Historian
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent-soft)]" aria-hidden="true" />
                Search
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-info-soft)]" aria-hidden="true" />
                API
              </div>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Quick actions" description="Deploy ingest and knowledge tasks without leaving the deck.">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface-subdued px-4 py-4 text-sm transition-colors duration-interactive hover:border-[color:var(--color-accent)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-accent">
                    {quickActionIcons[action.icon]}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">{action.title}</span>
                    <span className="text-xs text-muted">{action.description}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted transition-transform duration-interactive group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Corpus stats" description="Conversations and messages synced in the last 24h" className="lg:col-span-1">
          <div className="flex flex-col gap-4">
            <Stat
              label="Conversations"
              value={data.corpus.conversations.toLocaleString()}
              delta={{ value: '+36 new', tone: 'success', trend: 'up' }}
            />
            <Stat
              label="Messages"
              value={data.corpus.messages.toLocaleString()}
              delta={{ value: '+412', tone: 'info', trend: 'up' }}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Historian now"
          description="Recent cross-system events streaming into the historian."
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              {sources.map((source) => (
                <button
                  key={source}
                  type="button"
                  className={cn(
                    'rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors duration-interactive',
                    historianFilter === source ? 'bg-[color:var(--color-accent-soft)] text-foreground' : 'text-muted hover:text-foreground',
                  )}
                  onClick={() => setHistorianFilter(source)}
                >
                  {source === 'all' ? 'All systems' : source}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {filteredEvents.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-subdued px-4 py-3"
              >
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                    <span>{event.source}</span>
                    <span>•</span>
                    <span>{event.kind}</span>
                  </div>
                  <span className="text-foreground">{event.title}</span>
                  <span className="text-xs text-muted">{formatTimeAgo(event.timestamp)}</span>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs">
                  {event.meta?.badge && (
                    <Pill tone={badgeToneMap[event.meta.badge]}>{event.meta.badge}</Pill>
                  )}
                  {event.meta?.note && <span className="text-muted">{event.meta.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ingest status" description="Last 5 conversions queued through MD + Chat export">
          <div className="flex flex-col gap-3">
            {data.conversions.map((conversion) => (
              <div key={conversion.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-subdued px-3 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{conversion.slug}</span>
                  <span className="text-xs text-muted">{formatTimeAgo(conversion.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{conversion.files} files</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {conversion.storage ? (
                      <>
                        <Check className="h-3 w-3 text-success" aria-hidden="true" /> cloud
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-warn" aria-hidden="true" /> local
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Knowledge index"
          description="Latest knowledge packs staged for semantic search."
          toolbar={
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
            >
              Manage
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {data.knowledge.map((item) => (
              <div key={item.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-subdued px-4 py-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs text-muted">{item.files} files · {formatTimeAgo(item.indexedAt)}</span>
                </div>
                <Link
                  href={`/knowledge?slug=${encodeURIComponent(item.slug)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
                >
                  Index
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Search cortex" description="Run a scoped search across knowledge + corpus." padding="md">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-full border border-border bg-surface-subdued px-4 py-2 text-sm shadow-sm focus-within:border-[color:var(--color-accent)]">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <input
                name="q"
                placeholder="Ask across all indexed systems"
                className="flex-1 bg-transparent placeholder:text-muted focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-transform duration-interactive hover:translate-y-[-1px]"
            >
              Launch search
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </Card>
      </motion.div>

      <motion.div variants={scaleVariants} className="grid gap-6 lg:grid-cols-2">
        <Card title="API manager probes" description="Fire alpha feed checks and LLM probes without leaving mission control.">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleAlphaSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-subdued px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Alpha feed</span>
              <div className="flex gap-2 text-sm">
                <input
                  name="symbol"
                  placeholder="Symbol"
                  className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
                <input
                  name="fn"
                  placeholder="Function"
                  className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="self-start rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
              >
                Queue probe
              </button>
            </form>
            <form onSubmit={handleLLMSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-subdued px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">LLM task</span>
              <input
                name="task"
                placeholder="Task label"
                className="rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
                autoComplete="off"
              />
              <textarea
                name="prompt"
                placeholder="Prompt context"
                className="min-h-[120px] rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="self-start rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
              >
                Fire prompt
              </button>
            </form>
          </div>
        </Card>
        <Card title="Playgrounds & ops" description="Launch creative sandboxes straight from the OS.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/play/map"
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subdued px-4 py-4 transition-transform duration-interactive hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-accent">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-foreground">Map lab</span>
                <span className="text-xs text-muted">Geo-spatial intelligence + overlays.</span>
              </div>
            </Link>
            <Link
              href="/play/social"
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subdued px-4 py-4 transition-transform duration-interactive hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-accent">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-foreground">Social forge</span>
                <span className="text-xs text-muted">Spin content payloads + queue drops.</span>
              </div>
            </Link>
            <Link
              href="/workroom"
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subdued px-4 py-4 transition-transform duration-interactive hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-accent">
                <CloudCog className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-foreground">Workroom</span>
                <span className="text-xs text-muted">Orchestrate boards and export JSON snapshots.</span>
              </div>
            </Link>
            <Link
              href="/mvp"
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subdued px-4 py-4 transition-transform duration-interactive hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-accent">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-foreground">MVP generator</span>
                <span className="text-xs text-muted">Summon fresh one-shot briefs.</span>
              </div>
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
