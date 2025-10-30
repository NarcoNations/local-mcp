"use client";

import { useMemo, useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import type { WorkroomSticky } from "../../types/app";
import { useToast } from "../Toast";

interface WorkroomViewProps {
  initialStickies: WorkroomSticky[];
}

const LANES = ["Discover", "Define", "Deliver"];

export function WorkroomView({ initialStickies }: WorkroomViewProps) {
  const { push } = useToast();
  const [stickies, setStickies] = useState(initialStickies);
  const [dragging, setDragging] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return LANES.map((lane) => ({
      lane,
      items: stickies.filter((sticky) => sticky.lane === lane),
    }));
  }, [stickies]);

  const onDrop = (lane: string) => {
    if (!dragging) return;
    setStickies((current) =>
      current.map((sticky) => (sticky.id === dragging ? { ...sticky, lane } : sticky))
    );
    setDragging(null);
  };

  const addSticky = () => {
    const id = `sticky-${Date.now()}`;
    setStickies((current) => [
      ...current,
      { id, lane: LANES[0], content: "// EDIT HERE" },
    ]);
  };

  const exportJson = () => {
    const payload = JSON.stringify(stickies, null, 2);
    navigator.clipboard
      .writeText(payload)
      .then(() => push({ title: "Workroom exported", description: "JSON copied to clipboard.", variant: "success" }))
      .catch(() => push({ title: "Copy failed", description: "Select and copy manually.", variant: "danger" }));
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Workroom lanes"
        description="Drag stickies across the cinematic discover/define/deliver flow."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addSticky}
              className="focus-ring rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
            >
              Add sticky
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="focus-ring rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
            >
              Export JSON
            </button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {grouped.map(({ lane, items }) => (
          <Card key={lane} title={lane} variant="elevated">
            <div
              className="flex min-h-[320px] flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(lane)}
            >
              {items.map((item) => (
                <article
                  key={item.id}
                  draggable
                  onDragStart={() => setDragging(item.id)}
                  onDragEnd={() => setDragging(null)}
                  className="cursor-grab rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-primary shadow-subtle"
                >
                  {item.content}
                </article>
              ))}
              {items.length === 0 ? (
                <p className="text-xs text-muted">Drop stickies here.</p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
