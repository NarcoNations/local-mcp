'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Surface } from '../src/components/Surface';
import { Card } from '../src/components/Card';
import { Pill } from '../src/components/Pill';
import { Stat } from '../src/components/Stat';
import { usePrefersReducedMotion } from '../src/hooks/usePrefersReducedMotion';
import { fadeInUp, fadeInUpReduced, stagger } from '../src/motion/variants';
import { getDashboardData } from '../src/lib/dataClient';
import { DashboardData, HistorianEvent, IngestConversion } from '../src/types/dashboard';
import { useToast } from '../src/components/Toast';

const quickActions = [
  { label: 'Upload file', description: 'Ingest new archives instantly.', href: '/ingest', icon: '⬆️' },
  { label: 'Paste chat export URL', description: 'Drop ChatGPT/Slack transcripts.', href: '/corpus', icon: '🔗' },
  { label: 'Index knowledge', description: 'Push assets into the graph.', href: '/knowledge', icon: '🧠' },
  { label: 'New MVP brief', description: 'Spin up a mission-ready MVP.', href: '/mvp', icon: '🚀' },
];

const historianFilters = [
  { id: 'all', label: 'All' },
  { id: 'ingest', label: 'Ingest' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'search', label: 'Search' },
  { id: 'alerts', label: 'Alerts' },
] as const;

const statusToneMap: Record<IngestConversion['status'], 'success' | 'warn' | 'error' | 'info'> = {
  completed: 'success',
  processing: 'info',
  failed: 'error',
};

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historianFilter, setHistorianFilter] = useState<(typeof historianFilters)[number]['id']>('all');
  const [alphaProbe, setAlphaProbe] = useState({ symbol: '', fn: '' });
  const [llmProbe, setLlmProbe] = useState({ task: '', prompt: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const payload = await getDashboardData();
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Unable to load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (!data) return [] as HistorianEvent[];
    if (historianFilter === 'all') return data.historian;
    if (historianFilter === 'alerts') {
      return data.historian.filter((event) => event.severity === 'warn' || event.severity === 'error');
    }
    return data.historian.filter((event) => event.kind.includes(historianFilter) || event.source.includes(historianFilter));
  }, [data, historianFilter]);

  const motionVariants = prefersReducedMotion ? fadeInUpReduced : fadeInUp;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = (formData.get('dashboard-search') as string | null)?.trim();
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const submitAlphaProbe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!alphaProbe.symbol || !alphaProbe.fn) {
      toast.publish({ title: 'Add symbol & function', description: 'Fill out both fields to launch a probe.' });
      return;
    }
    toast.publish({
      title: 'Alpha probe queued',
      description: `${alphaProbe.symbol}.${alphaProbe.fn} sent to the API manager.`,
    });
    setAlphaProbe({ symbol: '', fn: '' });
  };

  const submitLlmProbe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!llmProbe.task || !llmProbe.prompt) {
      toast.publish({ title: 'Complete the probe details', description: 'Task and prompt power the LLM sweep.' });
      return;
    }
    toast.publish({
      title: 'LLM probe firing',
      description: `Task: ${llmProbe.task.substring(0, 48)}${llmProbe.task.length > 48 ? '…' : ''}`,
    });
    setLlmProbe({ task: '', prompt: '' });
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(prefersReducedMotion ? 0 : 0.12)}
        className="grid gap-6 lg:grid-cols-12"
      >
        <motion.div variants={motionVariants} className="lg:col-span-8">
          <Surface title="Quick actions" toolbar={<span className="text-xs text-muted">// EDIT HERE — adjust copy</span>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-start gap-3 rounded-xl border border-[hsl(var(--color-border)/0.4)] bg-surface-subdued/70 px-4 py-3 text-left transition hover:border-[hsl(var(--color-border)/0.75)] hover:bg-[hsl(var(--color-cyan)/0.1)]"
                >
                  <span className="text-lg" aria-hidden>
                    {action.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{action.label}</span>
                    <span className="text-xs text-muted">{action.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-4">
          <Surface title="Ingest status" toolbar={<span className="text-xs text-muted">Last 5 conversions</span>}>
            <div className="flex flex-col gap-3">
              {(data?.ingest ?? []).map((conversion) => (
                <div
                  key={conversion.id}
                  className="rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{conversion.slug}</span>
                    <Pill tone={statusToneMap[conversion.status]}>{conversion.status}</Pill>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>{conversion.files} files · {conversion.storage === 'cold' ? 'Cold storage' : 'Hot storage'}</span>
                    <span>{formatRelativeTime(conversion.updatedAt)}</span>
                  </div>
                </div>
              ))}
              {loading ? <p className="text-xs text-muted">Syncing ingest activity…</p> : null}
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-8">
          <Surface
            title="Historian now"
            toolbar={
              <div className="flex flex-wrap gap-2">
                {historianFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setHistorianFilter(filter.id)}
                    className={
                      historianFilter === filter.id
                        ? 'rounded-full bg-[hsl(var(--color-cyan)/0.2)] px-3 py-1 text-xs font-medium text-foreground'
                        : 'rounded-full border border-[hsl(var(--color-border)/0.5)] px-3 py-1 text-xs text-muted transition hover:text-foreground'
                    }
                    aria-pressed={historianFilter === filter.id}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              {filteredEvents.slice(0, 10).map((event) => (
                <Card
                  key={event.id}
                  subtle
                  title={<span className="text-xs font-semibold text-muted">{event.source}</span>}
                  actions={<span className="text-xs text-muted">{formatRelativeTime(event.ts)}</span>}
                >
                  <div className="flex items-center gap-3 text-sm">
                    <Pill tone={event.severity === 'warn' ? 'warn' : event.severity === 'error' ? 'error' : 'info'}>
                      {event.kind}
                    </Pill>
                    <span className="text-muted group-hover:text-foreground">{event.summary}</span>
                  </div>
                </Card>
              ))}
              {filteredEvents.length === 0 && !loading ? (
                <p className="rounded-lg border border-dashed border-[hsl(var(--color-border)/0.5)] px-4 py-6 text-center text-sm text-muted">
                  No historian events match this filter yet.
                </p>
              ) : null}
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-4">
          <Surface title="Corpus stats" toolbar={<span className="text-xs text-muted">Updated {formatRelativeTime(data?.corpus.lastIndexedAt ?? new Date().toISOString())}</span>}>
            <div className="grid gap-3">
              <Stat label="Conversations" value={data?.corpus.conversations ?? '—'} hint="Across ingest + sync" />
              <Stat label="Messages" value={data?.corpus.messages ?? '—'} hint="Semantic indexed" />
            </div>
            <Link href="/corpus" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--color-cyan))]">
              Dive into corpus →
            </Link>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-6">
          <Surface
            title="Knowledge graph"
            toolbar={<Link href="/knowledge" className="text-xs font-semibold text-[hsl(var(--color-cyan))]">Index now →</Link>}
          >
            <div className="space-y-3">
              {(data?.knowledge ?? []).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/70 px-3 py-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-foreground">{entry.slug}</span>
                    <span className="text-xs text-muted">{entry.files} files · indexed {formatRelativeTime(entry.createdAt)}</span>
                  </div>
                </div>
              ))}
              {loading ? <p className="text-xs text-muted">Loading knowledge…</p> : null}
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-6">
          <Surface title="Search the stack" toolbar={<span className="text-xs text-muted">⌘K opens global palette</span>}>
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔎</span>
                <input
                  type="search"
                  name="dashboard-search"
                  placeholder="What insight are you chasing?"
                  className="w-full rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 py-3 pl-10 pr-3 text-sm text-foreground outline-none focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                Recent:
                {(data?.searchRecent ?? []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
                    className="rounded-full border border-[hsl(var(--color-border)/0.5)] px-2 py-1 text-xs transition hover:text-foreground"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </form>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-7">
          <Surface title="API manager probes" toolbar={<span className="text-xs text-muted">Alpha + LLM</span>}>
            <div className="grid gap-4 lg:grid-cols-2">
              <form onSubmit={submitAlphaProbe} className="space-y-3 rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Alpha function probe</h3>
                <div className="space-y-2 text-xs text-muted">
                  <label className="flex flex-col gap-1 text-left text-xs font-semibold text-muted">
                    Symbol
                    <input
                      value={alphaProbe.symbol}
                      onChange={(event) => setAlphaProbe((prev) => ({ ...prev, symbol: event.target.value }))}
                      placeholder="eg. operator-signal"
                      className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-3 py-2 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-left text-xs font-semibold text-muted">
                    Function
                    <input
                      value={alphaProbe.fn}
                      onChange={(event) => setAlphaProbe((prev) => ({ ...prev, fn: event.target.value }))}
                      placeholder="eg. analyze"
                      className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-3 py-2 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[hsl(var(--color-primary)/0.9)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--color-primary))]"
                >
                  Launch alpha probe
                </button>
              </form>
              <form onSubmit={submitLlmProbe} className="space-y-3 rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">LLM sweep</h3>
                <label className="flex flex-col gap-1 text-left text-xs font-semibold text-muted">
                  Task
                  <input
                    value={llmProbe.task}
                    onChange={(event) => setLlmProbe((prev) => ({ ...prev, task: event.target.value }))}
                    placeholder="eg. Summarize mission drop"
                    className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-3 py-2 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-left text-xs font-semibold text-muted">
                  Prompt
                  <textarea
                    value={llmProbe.prompt}
                    onChange={(event) => setLlmProbe((prev) => ({ ...prev, prompt: event.target.value }))}
                    placeholder="Add instructions or examples"
                    rows={4}
                    className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-3 py-2 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[hsl(var(--color-cyan)/0.85)] px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-[hsl(var(--color-cyan))]"
                >
                  Fire LLM probe
                </button>
              </form>
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-5">
          <Surface title="Workroom & MVP" toolbar={<span className="text-xs text-muted">Collaborative flow</span>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/workroom"
                className="group flex flex-col gap-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 px-4 py-6 transition hover:border-[hsl(var(--color-border)/0.8)] hover:bg-[hsl(var(--color-gold)/0.12)]"
              >
                <span className="text-lg" aria-hidden>
                  🧩
                </span>
                <span className="text-sm font-semibold text-foreground">Open workroom</span>
                <span className="text-xs text-muted">Kanban + stickies lanes.</span>
              </Link>
              <Link
                href="/mvp"
                className="group flex flex-col gap-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 px-4 py-6 transition hover:border-[hsl(var(--color-border)/0.8)] hover:bg-[hsl(var(--color-primary)/0.1)]"
              >
                <span className="text-lg" aria-hidden>
                  🚀
                </span>
                <span className="text-sm font-semibold text-foreground">Craft MVP</span>
                <span className="text-xs text-muted">Generate briefs, auto scope.</span>
              </Link>
            </div>
          </Surface>
        </motion.div>
        <motion.div variants={motionVariants} className="lg:col-span-6">
          <Surface title="Playgrounds" toolbar={<span className="text-xs text-muted">Spatial + narrative</span>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/play/map"
                className="group flex flex-col gap-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 px-4 py-6 transition hover:border-[hsl(var(--color-border)/0.8)] hover:bg-[hsl(var(--color-cyan)/0.12)]"
              >
                <span className="text-lg" aria-hidden>
                  🗺️
                </span>
                <span className="text-sm font-semibold text-foreground">Map lab</span>
                <span className="text-xs text-muted">MapLibre overlays & mission views.</span>
              </Link>
              <Link
                href="/play/social"
                className="group flex flex-col gap-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 px-4 py-6 transition hover:border-[hsl(var(--color-border)/0.8)] hover:bg-[hsl(var(--color-primary)/0.12)]"
              >
                <span className="text-lg" aria-hidden>
                  🪩
                </span>
                <span className="text-sm font-semibold text-foreground">Social studio</span>
                <span className="text-xs text-muted">Spin posts, thumbnails, micro-campaigns.</span>
              </Link>
            </div>
          </Surface>
        </motion.div>
      </motion.div>
      {error ? (
        <div className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-[hsl(var(--color-danger)/0.12)] px-4 py-3 text-sm text-[hsl(var(--color-danger))]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
