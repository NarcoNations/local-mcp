'use client';

import { useEffect, useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { getTimelineEvents } from '../../src/lib/dataClient';
import { TimelineEvent } from '../../src/types/systems';

const sources = ['all', 'ingest', 'knowledge', 'search', 'api', 'map', 'social'] as const;
const severities = ['all', 'info', 'warn', 'error'] as const;

type SourceFilter = (typeof sources)[number];
type SeverityFilter = (typeof severities)[number];

function relative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function TimelinePage() {
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await getTimelineEvents(page);
      if (!cancelled) {
        setEvents(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = events.filter((event) => {
    const sourceMatch =
      sourceFilter === 'all' || event.source.includes(sourceFilter) || event.kind.includes(sourceFilter);
    const severityMatch = severityFilter === 'all' || event.severity === severityFilter;
    return sourceMatch && severityMatch;
  });

  return (
    <div className="space-y-8">
      <Surface
        title="Historian timeline"
        toolbar={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              {sources.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSourceFilter(item)}
                  className={
                    sourceFilter === item
                      ? 'rounded-full bg-[hsl(var(--color-cyan)/0.2)] px-3 py-1 font-semibold text-foreground'
                      : 'rounded-full border border-[hsl(var(--color-border)/0.5)] px-3 py-1 text-muted hover:text-foreground'
                  }
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {severities.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSeverityFilter(item)}
                  className={
                    severityFilter === item
                      ? 'rounded-full bg-[hsl(var(--color-gold)/0.25)] px-3 py-1 font-semibold text-foreground'
                      : 'rounded-full border border-[hsl(var(--color-border)/0.5)] px-3 py-1 text-muted hover:text-foreground'
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {filtered.map((event) => (
            <div key={event.id} className="rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-foreground">{event.source}</span>
                  <Pill tone={event.severity === 'warn' ? 'warn' : event.severity === 'error' ? 'error' : 'info'}>
                    {event.kind}
                  </Pill>
                </div>
                <time title={new Date(event.ts).toISOString()} className="font-mono text-[10px] text-muted">
                  {relative(event.ts)}
                </time>
              </div>
              <p className="mt-2 text-sm text-foreground">{event.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>Actor: {event.actor}</span>
                {event.tags.map((tag) => (
                  <Pill key={tag} tone="neutral">#{tag}</Pill>
                ))}
              </div>
            </div>
          ))}
          {!filtered.length && !isLoading ? (
            <p className="rounded-xl border border-dashed border-[hsl(var(--color-border)/0.45)] px-4 py-10 text-center text-sm text-muted">
              No events match this filter slice. Try relaxing filters or check another page.
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-[hsl(var(--color-border)/0.45)] px-3 py-2 transition hover:text-foreground"
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span>
            Page {page} {isLoading ? '· updating…' : ''}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-[hsl(var(--color-border)/0.45)] px-3 py-2 transition hover:text-foreground"
          >
            Next →
          </button>
        </div>
      </Surface>
    </div>
  );
}
