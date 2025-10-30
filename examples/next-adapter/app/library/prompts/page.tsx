'use client';

import { useEffect, useState } from 'react';
import { Surface } from '../../../src/components/Surface';
import { Pill } from '../../../src/components/Pill';
import { useToast } from '../../../src/components/Toast';
import { getPromptLibrary, runPrompt } from '../../../src/lib/dataClient';
import { PromptDefinition } from '../../../src/types/systems';

export default function PromptLibraryPage() {
  const toast = useToast();
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [active, setActive] = useState<PromptDefinition | null>(null);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getPromptLibrary();
      setPrompts(data);
      setActive(data[0] ?? null);
    })();
  }, []);

  const handleRun = async () => {
    if (!active) return;
    setRunning(true);
    try {
      const response = await runPrompt(active.id);
      setOutput(response.output);
      toast.publish({ title: 'Prompt executed', description: active.name });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Prompt failed', description: 'LLM endpoint unavailable.' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Prompt library" toolbar={<span className="text-xs text-muted">Narco Noir curated</span>}>
        <div className="grid gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <ul className="space-y-2">
              {prompts.map((prompt) => (
                <li key={prompt.id}>
                  <button
                    type="button"
                    onClick={() => setActive(prompt)}
                    className={`w-full rounded-xl border border-[hsl(var(--color-border)/0.45)] px-3 py-3 text-left text-sm transition hover:border-[hsl(var(--color-border)/0.8)] ${
                      active?.id === prompt.id ? 'bg-[hsl(var(--color-cyan)/0.15)] text-foreground' : 'text-muted'
                    }`}
                  >
                    <span className="block font-semibold">{prompt.name}</span>
                    <span className="text-xs text-muted">{prompt.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="lg:col-span-8 space-y-4">
            {active ? (
              <div className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{active.name}</h3>
                  <Pill tone="info">{active.id}</Pill>
                </div>
                <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">{active.body}</pre>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="rounded-xl bg-[hsl(var(--color-cyan)/0.9)] px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[hsl(var(--color-cyan))] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunning ? 'Running…' : 'Run prompt'}
                  </button>
                  <span className="text-xs text-muted">// EDIT HERE to lint prompts before runtime.</span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[hsl(var(--color-border)/0.45)] px-4 py-8 text-center text-sm text-muted">
                Select a prompt to inspect its body.
              </p>
            )}
            {output ? (
              <div className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">LLM output</h4>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground">{output}</pre>
              </div>
            ) : null}
          </section>
        </div>
      </Surface>
    </div>
  );
}
