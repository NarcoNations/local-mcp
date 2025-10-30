"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";
import { Pill } from "../Pill";

const templates = [
  {
    id: "thumbnail",
    name: "Neon thumbnail",
    description: "Generate a bold visual for mission updates.",
  },
  {
    id: "short",
    name: "60s short script",
    description: "Draft short-form social copy with action beats.",
  },
  {
    id: "post",
    name: "Signal drop",
    description: "Long-form encrypted drop for allies.",
  },
];

export function SocialPlayground() {
  const { push } = useToast();
  const [selected, setSelected] = useState(templates[0].id);
  const [notes, setNotes] = useState("");

  const enqueue = () => {
    const template = templates.find((item) => item.id === selected);
    if (!template) return;
    push({
      title: "Template enqueued",
      description: `${template.name} queued for synthesis.`,
      variant: "success",
    });
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Social playground"
        description="Experiment with templates for thumbnails, shorts, and signal drops."
        actions={<span className="text-xs text-muted">Queue pushes to automation via n8n.</span>}
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card title="Templates" variant="elevated">
          <ul className="space-y-2">
            {templates.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => setSelected(template.id)}
                  className={`focus-ring w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                    selected === template.id
                      ? "border-border bg-accent-soft text-primary"
                      : "border-border bg-surface text-muted hover:text-primary"
                  }`}
                >
                  {template.name}
                  <span className="mt-1 block text-xs text-muted">{template.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card variant="elevated" title="Configuration">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Pill variant="info">{selected}</Pill>
            <span>Adjust notes before dispatch.</span>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            placeholder="Tone, calls to action, embargo info..."
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-primary placeholder:text-muted"
          />
          <button
            type="button"
            onClick={enqueue}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
          >
            Enqueue
          </button>
        </Card>
      </div>
    </div>
  );
}
