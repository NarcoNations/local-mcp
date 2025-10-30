'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { fadeInUp } from '../../motion/presets';
import type { TimelineEvent } from '../../mocks/timeline';

interface TimelineViewProps {
  events: TimelineEvent[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function TimelineView({ events }: TimelineViewProps) {
  const [source, setSource] = React.useState<string>('all');
  const [kind, setKind] = React.useState<string>('all');
  const [page, setPage] = React.useState(0);
  const pageSize = 6;

  const sources = React.useMemo(() => ['all', ...new Set(events.map((event) => event.source))], [events]);
  const kinds = React.useMemo(() => ['all', ...new Set(events.map((event) => event.kind))], [events]);

  const filtered = React.useMemo(() => {
    return events.filter((event) => {
      const sourceMatch = source === 'all' || event.source === source;
      const kindMatch = kind === 'all' || event.kind === kind;
      return sourceMatch && kindMatch;
    });
  }, [events, source, kind]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  React.useEffect(() => {
    setPage(0);
  }, [source, kind]);

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Historian timeline"
        description="Every system event that hits the historian bus, in arrival order."
        toolbar={
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <label className="flex items-center gap-2">
              <span>Source</span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-0"
              >
                {sources.map((value) => (
                  <option key={value} value={value} className="bg-surface text-foreground">
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>Kind</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-0"
              >
                {kinds.map((value) => (
                  <option key={value} value={value} className="bg-surface text-foreground">
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      >
        <motion.ul initial="hidden" animate="visible" variants={fadeInUp} className="flex flex-col gap-4">
          {slice.map((event) => (
            <li key={event.id} className="rounded-xl border border-border bg-surface-subdued px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <span className="font-medium uppercase tracking-wide text-muted">{event.source}</span>
                <span className="font-mono text-[11px]" title={event.ts}>
                  {timeAgo(event.ts)}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-sm text-foreground">{event.title}</span>
                {event.detail && <span className="text-xs text-muted">{event.detail}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Pill tone={event.severity ?? 'neutral'}>{event.kind}</Pill>
              </div>
            </li>
          ))}
        </motion.ul>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="rounded-full border border-border px-3 py-1 transition-colors duration-interactive hover:text-foreground"
              disabled={currentPage === 0}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
              className="rounded-full border border-border px-3 py-1 transition-colors duration-interactive hover:text-foreground"
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
