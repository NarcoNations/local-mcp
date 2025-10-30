'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { useToast } from '../../src/components/Toast';
import {
  getApiProbeResults,
  submitAlphaProbe,
  submitLlmProbe,
} from '../../src/lib/dataClient';
import { ApiProbeResult } from '../../src/types/systems';

export default function ApiManagerPage() {
  const toast = useToast();
  const [alpha, setAlpha] = useState({ symbol: '', fn: '' });
  const [llm, setLlm] = useState({ task: '', prompt: '' });
  const [isAlphaSubmitting, setAlphaSubmitting] = useState(false);
  const [isLlmSubmitting, setLlmSubmitting] = useState(false);
  const [results, setResults] = useState<ApiProbeResult[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getApiProbeResults();
      setResults(data);
    })();
  }, []);

  const submitAlpha = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!alpha.symbol || !alpha.fn) {
      toast.publish({ title: 'Fill in symbol + function', description: 'Both fields are required to run the probe.' });
      return;
    }
    setAlphaSubmitting(true);
    try {
      const result = await submitAlphaProbe(alpha);
      setResults((prev) => [result, ...prev]);
      toast.publish({ title: 'Alpha probe queued', description: `Probe ${result.id} acknowledged.` });
      setAlpha({ symbol: '', fn: '' });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Probe failed', description: 'Check API manager configuration.' });
    } finally {
      setAlphaSubmitting(false);
    }
  };

  const submitLlm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!llm.task || !llm.prompt) {
      toast.publish({ title: 'Task + prompt required', description: 'Give the LLM context before firing.' });
      return;
    }
    setLlmSubmitting(true);
    try {
      const result = await submitLlmProbe(llm);
      setResults((prev) => [result, ...prev]);
      toast.publish({ title: 'LLM probe queued', description: `Probe ${result.id} acknowledged.` });
      setLlm({ task: '', prompt: '' });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'LLM probe failed', description: 'Check the API key or provider status.' });
    } finally {
      setLlmSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Alpha function probe" toolbar={<span className="text-xs text-muted">Symbol.fn signature</span>}>
        <form onSubmit={submitAlpha} className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Symbol
            <input
              value={alpha.symbol}
              onChange={(event) => setAlpha((prev) => ({ ...prev, symbol: event.target.value }))}
              placeholder="operator-signal"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Function
            <input
              value={alpha.fn}
              onChange={(event) => setAlpha((prev) => ({ ...prev, fn: event.target.value }))}
              placeholder="analyze"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isAlphaSubmitting}
              className="rounded-xl bg-[hsl(var(--color-primary)/0.9)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(var(--color-primary))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAlphaSubmitting ? 'Launching…' : 'Launch alpha probe'}
            </button>
          </div>
        </form>
      </Surface>
      <Surface title="LLM probe" toolbar={<span className="text-xs text-muted">Task + prompt</span>}>
        <form onSubmit={submitLlm} className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Task
            <input
              value={llm.task}
              onChange={(event) => setLlm((prev) => ({ ...prev, task: event.target.value }))}
              placeholder="Summarize drop 17 outcomes"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Prompt
            <textarea
              value={llm.prompt}
              onChange={(event) => setLlm((prev) => ({ ...prev, prompt: event.target.value }))}
              rows={6}
              placeholder="Context, steps, output format…"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isLlmSubmitting}
              className="rounded-xl bg-[hsl(var(--color-cyan)/0.9)] px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-[hsl(var(--color-cyan))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLlmSubmitting ? 'Sending…' : 'Fire LLM probe'}
            </button>
          </div>
        </form>
      </Surface>
      <Surface title="Probe results" toolbar={<span className="text-xs text-muted">Most recent first</span>}>
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <span>
                  <strong className="text-foreground">{result.id}</strong> · {new Date(result.createdAt).toLocaleString()}
                </span>
                <Pill tone={result.type === 'alpha' ? 'info' : 'success'}>{result.type}</Pill>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-background/80 p-3 text-xs text-foreground">
{result.response}
              </pre>
            </div>
          ))}
          {!results.length ? (
            <p className="rounded-xl border border-dashed border-[hsl(var(--color-border)/0.45)] px-4 py-10 text-center text-sm text-muted">
              Launch a probe to see live responses.
            </p>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
