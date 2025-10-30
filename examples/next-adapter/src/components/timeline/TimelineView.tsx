"use client";

import { useMemo, useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { Pill } from "../Pill";
import type { TimelineEvent } from "../../types/app";
import { relativeTime } from "../../utils/time";

interface TimelineViewProps {
  events: TimelineEvent[];
}

const PAGE_SIZE = 8;

export function TimelineView({ events }: TimelineViewProps) {
  const sources = useMemo(() => Array.from(new Set(events.map((event) => event.source))), [events]);
  const kinds = useMemo(() => Array.from(new Set(events.map((event) => event.kind))), [events]);
  const [source, setSource] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (source !== "all" && event.source !== source) return false;
      if (kind !== "all" && event.kind !== kind) return false;
      return true;
    });
  }, [events, source, kind]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const changePage = (direction: number) => {
    setPage((prev) => {
      const next = prev + direction;
      if (next < 0) return 0;
      if (next >= totalPages) return totalPages - 1;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Historian timeline"
        description="Audit trail of ingest, knowledge, MVP, and research signals."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              type="button"
              onClick={() => changePage(-1)}
              className="focus-ring rounded-full border border-border bg-surface px-3 py-1"
            >
              Prev
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => changePage(1)}
              className="focus-ring rounded-full border border-border bg-surface px-3 py-1"
            >
              Next
            </button>
          </div>
        }
      />
      <Card variant="elevated">
        <div className="flex flex-wrap gap-2">
          <FilterButton label="All sources" active={source === "all"} onClick={() => setSource("all")} />
          {sources.map((value) => (
            <FilterButton key={value} label={value} active={source === value} onClick={() => setSource(value)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton label="All kinds" active={kind === "all"} onClick={() => setKind("all")} />
          {kinds.map((value) => (
            <FilterButton key={value} label={value} active={kind === value} onClick={() => setKind(value)} />
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        {pageItems.map((event) => (
          <Card key={event.id} variant="subdued">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Pill variant="info">{event.source}</Pill>
                <Pill variant="neutral">{event.kind}</Pill>
                <span className="text-xs text-muted">{relativeTime(event.occurredAt)}</span>
              </div>
              <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-primary">
                <p className="font-semibold">{event.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted">{event.payload}</p>
                <p className="mt-2 font-mono text-xs text-muted" aria-label="Timestamp">
                  {new Date(event.occurredAt).toISOString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {pageItems.length === 0 ? (
          <Card title="Nothing here" description="Adjust filters to view more historical events." />
        ) : null}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick(): void;
}

function FilterButton({ label, active, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${
        active ? "bg-accent-soft text-primary" : "border-border bg-surface text-muted hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}
