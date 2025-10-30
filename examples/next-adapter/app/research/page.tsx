'use client';

import { FormEvent, useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { useToast } from '../../src/components/Toast';
import { requestResearch } from '../../src/lib/dataClient';
import { ResearchResult } from '../../src/types/systems';

export default function ResearchPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [objectives, setObjectives] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      toast.publish({ title: 'Add a research query', description: 'Set the target before generating insights.' });
      return;
    }
    setLoading(true);
    try {
      const payload = await requestResearch({ query, objectives });
      setResult(payload);
      toast.publish({ title: 'Research synthesized', description: 'Facts and insights ready.' });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Research failed', description: 'Check the research service availability.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Research console" toolbar={<span className="text-xs text-muted">Query + objectives</span>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What question are we answering?"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Objectives
            <textarea
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              rows={4}
              placeholder="What insight or deliverable do you want?"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[hsl(var(--color-cyan)/0.9)] px-6 py-2 text-sm font-semibold text-foreground transition hover:bg-[hsl(var(--color-cyan))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Synthesizing…' : 'Generate research brief'}
          </button>
        </form>
      </Surface>
      {result ? (
        <Surface title="Structured response" toolbar={<span className="text-xs text-muted">{result.query}</span>}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Facts</h3>
              <ul className="space-y-2 text-sm text-foreground">
                {result.facts.map((fact) => (
                  <li key={fact} className="rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/70 px-3 py-2">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Insights</h3>
              <ul className="space-y-2 text-sm text-foreground">
                {result.insights.map((insight) => (
                  <li key={insight} className="rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/70 px-3 py-2">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h3>
              <ul className="space-y-2 text-xs text-muted">
                {result.sources.map((source) => (
                  <li key={source.url} className="flex items-center justify-between gap-2 rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-background/70 px-3 py-2">
                    <span className="truncate">{source.title}</span>
                    <a href={source.url} className="text-[hsl(var(--color-cyan))]" target="_blank" rel="noreferrer">
                      Visit
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Surface>
      ) : null}
    </div>
  );
}
