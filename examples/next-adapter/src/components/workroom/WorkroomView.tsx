'use client';

import * as React from 'react';
import { Card } from '../Card';
import { useToast } from '../Toast';
import { cn } from '../../utils/cn';

interface Sticky {
  id: string;
  text: string;
}

interface Lane {
  id: string;
  title: string;
  items: Sticky[];
}

const initialLanes: Lane[] = [
  {
    id: 'discover',
    title: 'Discover',
    items: [
      { id: 'st-1', text: 'Interview field operatives for current friction' },
      { id: 'st-2', text: 'Pull sentiment deltas from social forge' },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    items: [
      { id: 'st-3', text: 'Sketch data pipeline for ingest → knowledge' },
      { id: 'st-4', text: 'Storyboard drop ritual & fallback loops' },
    ],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    items: [
      { id: 'st-5', text: 'Prep MVP generator brief' },
      { id: 'st-6', text: 'Schedule alpha probe + historian monitor' },
    ],
  },
];

export function WorkroomView() {
  const { push } = useToast();
  const [lanes, setLanes] = React.useState<Lane[]>(initialLanes);
  const [dragging, setDragging] = React.useState<{ laneId: string; stickyId: string } | null>(null);
  const [activeLane, setActiveLane] = React.useState<string | null>(null);

  const handleDragStart = (laneId: string, stickyId: string) => {
    setDragging({ laneId, stickyId });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, laneId: string) => {
    event.preventDefault();
    setActiveLane(laneId);
  };

  const handleDrop = (laneId: string) => {
    if (!dragging) return;
    setLanes((current) => {
      const next = current.map((lane) => ({ ...lane, items: [...lane.items] }));
      const originLane = next.find((lane) => lane.id === dragging.laneId);
      const targetLane = next.find((lane) => lane.id === laneId);
      if (!originLane || !targetLane) return current;
      const index = originLane.items.findIndex((sticky) => sticky.id === dragging.stickyId);
      if (index === -1) return current;
      const [item] = originLane.items.splice(index, 1);
      targetLane.items.push(item);
      return next;
    });
    setDragging(null);
    setActiveLane(null);
  };

  const handleAddSticky = () => {
    const text = window.prompt('Add sticky note');
    if (!text) return;
    setLanes((current) => {
      const [first, ...rest] = current;
      return [{ ...first, items: [...first.items, { id: `st-${Date.now()}`, text }] }, ...rest];
    });
  };

  const handleExport = async () => {
    const payload = JSON.stringify(lanes, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      push({ title: 'Workroom exported', description: 'JSON copied to clipboard.', tone: 'success' });
    } catch (error) {
      push({ title: 'Export ready', description: 'Copy the JSON below manually.', tone: 'info' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <button
          type="button"
          onClick={handleAddSticky}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-interactive hover:text-foreground"
        >
          Add sticky
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-interactive hover:text-foreground"
        >
          Export JSON
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            onDragOver={(event) => handleDragOver(event, lane.id)}
            onDrop={() => handleDrop(lane.id)}
            className={cn(
              'flex flex-col gap-3 rounded-2xl border border-border bg-surface-subdued p-4 transition-colors duration-interactive',
              activeLane === lane.id && 'border-[color:var(--color-accent)]',
            )}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{lane.title}</h2>
              <span className="text-xs text-muted">{lane.items.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {lane.items.map((sticky) => (
                <div
                  key={sticky.id}
                  draggable
                  onDragStart={() => handleDragStart(lane.id, sticky.id)}
                  className="cursor-grab rounded-xl border border-border bg-[color:var(--color-surface-elevated)] p-3 text-sm text-foreground shadow-sm active:cursor-grabbing"
                >
                  {sticky.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card title="Board JSON" variant="subdued">
        <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground">
          {JSON.stringify(lanes, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
