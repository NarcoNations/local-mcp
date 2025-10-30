"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";
import type { PromptTemplate } from "../../types/app";

interface PromptLibraryViewProps {
  prompts: PromptTemplate[];
}

export function PromptLibraryView({ prompts }: PromptLibraryViewProps) {
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState(prompts[0]?.id ?? "");
  const selected = prompts.find((prompt) => prompt.id === selectedId);

  const runPrompt = () => {
    if (!selected) return;
    push({
      title: "Prompt dispatched",
      description: `${selected.title} enqueued via /api/llm`,
      variant: "info",
    });
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Prompt library"
        description="Versioned prompt blueprints with linter insights and quick runs."
        actions={<span className="text-xs text-muted">Linter integration coming soon.</span>}
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card title="Library" variant="elevated">
          <ul className="space-y-2">
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(prompt.id)}
                  className={`focus-ring w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                    selectedId === prompt.id
                      ? "border-border bg-accent-soft text-primary"
                      : "border-border bg-surface text-muted hover:text-primary"
                  }`}
                >
                  {prompt.title}
                  <span className="mt-1 block text-xs text-muted">{prompt.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {selected ? (
          <Card title={selected.title} description={selected.summary} variant="elevated">
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-primary">
              <pre className="whitespace-pre-wrap font-mono text-xs text-primary">{selected.body}</pre>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {selected.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-surface px-3 py-1 uppercase tracking-[0.18em]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">Linter: awaiting analyzer.</span>
              <button
                type="button"
                onClick={runPrompt}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
              >
                Run prompt
              </button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
