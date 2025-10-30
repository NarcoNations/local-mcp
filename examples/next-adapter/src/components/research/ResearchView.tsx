'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../Card';
import { useToast } from '../Toast';

interface ResearchResult {
  facts: string[];
  insights: string[];
  sources: Array<{ label: string; url: string }>;
}

export function ResearchView() {
  const { push } = useToast();
  const [query, setQuery] = React.useState('');
  const [objectives, setObjectives] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ResearchResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      push({ title: 'Research query required', tone: 'warn' });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult({
      facts: [
        'Historian logged 12 ingest events in the past 24h.',
        'Social forge sentiment up +14% after latest drop.',
      ],
      insights: [
        'Blend historian alerts with alpha probe outputs to pre-empt rival moves.',
        'Use MVP generator to auto-assemble countermeasure briefs within 6 hours.',
      ],
      sources: [
        { label: 'Historian timeline', url: '/timeline' },
        { label: 'Social forge sentiment delta', url: '/play/social' },
      ],
    });
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card title="Research request" description="Ask for intel across ingest, knowledge, corpus, and social sensors.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Research query</span>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What does the Narco Nations AI stack need to win the next drop?"
              className="min-h-[140px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Objectives</span>
            <textarea
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder="1. Identify pipeline gaps\n2. Surface risks\n3. Recommend counter moves"
              className="min-h-[120px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-[color:var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-transform duration-interactive hover:-translate-y-[1px]"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Generate brief'}
          </button>
        </form>
      </Card>
      <div className="flex flex-col gap-4">
        <Card title="Facts" variant="subdued">
          {result ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
              {result.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Your hard facts show up here.</p>
          )}
        </Card>
        <Card title="Insights" variant="subdued">
          {result ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
              {result.insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Strategic recommendations land here.</p>
          )}
        </Card>
        <Card title="Sources" variant="subdued">
          {result ? (
            <ul className="space-y-2 text-sm text-muted">
              {result.sources.map((source) => (
                <li key={source.label}>
                  <a href={source.url} className="underline">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Linked sources for auditability will appear here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
