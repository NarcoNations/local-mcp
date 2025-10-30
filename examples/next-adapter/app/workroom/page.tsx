'use client';

import { useEffect, useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { useToast } from '../../src/components/Toast';
import { getWorkroomLanes } from '../../src/lib/dataClient';
import { WorkroomLane, WorkroomSticky } from '../../src/types/systems';

export default function WorkroomPage() {
  const toast = useToast();
  const [lanes, setLanes] = useState<WorkroomLane[]>([]);
  const [dragged, setDragged] = useState<WorkroomSticky | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getWorkroomLanes();
      setLanes(data);
    })();
  }, []);

  const onDragStart = (sticky: WorkroomSticky) => () => {
    setDragged(sticky);
  };

  const onDrop = (laneId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragged) return;
    setLanes((prev) => {
      return prev.map((lane) => {
        if (lane.id === dragged.laneId) {
          return { ...lane, stickies: lane.stickies.filter((item) => item.id !== dragged.id) };
        }
        return lane;
      }).map((lane) => {
        if (lane.id === laneId) {
          return { ...lane, stickies: [...lane.stickies, { ...dragged, laneId }] };
        }
        return lane;
      });
    });
    setDragged(null);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const exportJson = async () => {
    const payload = JSON.stringify(lanes, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      toast.publish({ title: 'Workroom exported', description: 'JSON copied to clipboard.' });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Clipboard blocked', description: 'Unable to copy JSON. Try manual export.' });
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Workroom lanes" toolbar={<span className="text-xs text-muted">Drag stickies between lanes</span>}>
        <div className="grid gap-4 lg:grid-cols-3">
          {lanes.map((lane) => (
            <div
              key={lane.id}
              onDrop={onDrop(lane.id)}
              onDragOver={onDragOver}
              className="flex min-h-[280px] flex-col gap-3 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{lane.title}</h3>
                <Pill tone="neutral">{lane.stickies.length}</Pill>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {lane.stickies.map((sticky) => (
                  <div
                    key={sticky.id}
                    draggable
                    onDragStart={onDragStart(sticky)}
                    className={`cursor-grab rounded-xl border border-[hsl(var(--color-border)/0.35)] px-3 py-3 text-sm text-foreground shadow-subtle transition hover:-translate-y-1 ${
                      sticky.color === 'cyan'
                        ? 'bg-[hsl(var(--color-cyan)/0.18)]'
                        : sticky.color === 'gold'
                        ? 'bg-[hsl(var(--color-gold)/0.22)]'
                        : 'bg-[hsl(var(--color-primary)/0.25)]'
                    }`}
                  >
                    {sticky.text}
                  </div>
                ))}
                {!lane.stickies.length ? (
                  <p className="rounded-lg border border-dashed border-[hsl(var(--color-border)/0.45)] p-4 text-xs text-muted text-center">
                    Drop a sticky here.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Surface>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 px-4 py-2 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
