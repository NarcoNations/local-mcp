'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Play } from 'lucide-react';
import { Card } from '../Card';
import { useToast } from '../Toast';
import type { PromptDefinition } from '../../mocks/prompts';

interface PromptsLibraryViewProps {
  prompts: PromptDefinition[];
}

export function PromptsLibraryView({ prompts }: PromptsLibraryViewProps) {
  const { push } = useToast();
  const [selectedId, setSelectedId] = React.useState(prompts[0]?.id ?? '');
  const [output, setOutput] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedId);

  const handleRun = async () => {
    if (!selectedPrompt) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setOutput(`// Prompt executed\nTemplate: ${selectedPrompt.label}\nResult: Synthetic output for Narco Nations stack.`);
    setLoading(false);
    push({ title: 'Prompt executed', description: selectedPrompt.label, tone: 'info' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Card title="Library" variant="subdued">
        <div className="flex flex-col gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => setSelectedId(prompt.id)}
              className={
                selectedId === prompt.id
                  ? 'rounded-xl border border-border bg-[color:var(--color-accent-soft)] px-3 py-2 text-left text-sm text-foreground'
                  : 'rounded-xl border border-transparent px-3 py-2 text-left text-sm text-muted transition-colors duration-interactive hover:text-foreground'
              }
            >
              <div className="flex flex-col">
                <span className="font-semibold">{prompt.label}</span>
                <span className="text-xs text-muted">{prompt.tags.join(' · ')}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        {selectedPrompt ? (
          <Card
            title={selectedPrompt.label}
            description={selectedPrompt.description}
            actions={
              <button
                type="button"
                onClick={handleRun}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                Run
              </button>
            }
          >
            <div className="rounded-xl border border-border bg-surface-subdued px-4 py-3 text-sm text-muted">
              {selectedPrompt.template}
            </div>
          </Card>
        ) : (
          <Card title="Select a prompt" variant="subdued">
            <p className="text-sm text-muted">Choose a prompt from the left to inspect its template and context.</p>
          </Card>
        )}
        <Card title="Linter" variant="subdued">
          <p className="text-sm text-muted">Prompt linting coming soon. Connect this library to your runbook to see live scores.</p>
        </Card>
        <Card title="Last output" variant="subdued">
          {output ? (
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-surface px-4 py-3 text-xs text-foreground">{output}</pre>
          ) : (
            <p className="text-sm text-muted">Execute a prompt to view the synthetic output here.</p>
          )}
        </Card>
        <Card variant="subdued">
          <p className="text-xs text-muted">
            Need more prompts? <Link href="/research" className="underline">Research engine</Link> can fabricate new variants and score them via historian feedback loops.
          </p>
        </Card>
      </div>
    </div>
  );
}
