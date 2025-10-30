'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { searchEverything } from '../../data/search';
import type { SearchResult } from '../../mocks/search';

interface SearchViewProps {
  initialQuery: string;
  initialResults: SearchResult[];
}

export function SearchView({ initialQuery, initialResults }: SearchViewProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<SearchResult[]>(initialResults);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(Boolean(initialQuery));
  const initialLoad = React.useRef(true);

  React.useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      const data = await searchEverything(query.trim());
      if (!cancelled) {
        setResults(data);
        setHasSearched(true);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get('q') ?? '').trim();
    setQuery(nextQuery);
    if (nextQuery) {
      router.replace(`/search?q=${encodeURIComponent(nextQuery)}`);
    } else {
      router.replace('/search');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Search" description="Sweep knowledge, historian, corpus, and prompt libraries in a single query.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex items-center gap-3 rounded-full border border-border bg-surface-subdued px-4 py-2 shadow-sm focus-within:border-[color:var(--color-accent)]">
            <Search className="h-4 w-4 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={initialQuery}
              placeholder="narco nations go-to-market"
              className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
            >
              Search
            </button>
          </label>
        </form>
      </Card>
      <div className="grid gap-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching the vaults…
          </div>
        )}
        {!loading && results.length === 0 && hasSearched && (
          <Card variant="subdued" title="No matches">
            <p className="text-sm text-muted">Try a different phrase or scope down to a specific system.</p>
          </Card>
        )}
        {!loading && !hasSearched && (
          <Card variant="subdued" title="Pro tip">
            <p className="text-sm text-muted">
              Use filters like <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">source:knowledge</code> or <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">kind:timeline</code> to narrow the blast radius.
            </p>
          </Card>
        )}
        {results.map((result) => (
          <Card key={result.id} variant="subdued">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={result.link} className="text-base font-semibold text-foreground hover:underline">
                  {result.title}
                </Link>
                <Pill tone="info">score {result.score.toFixed(2)}</Pill>
              </div>
              <p className="text-sm text-muted">{result.snippet}</p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {result.source}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
