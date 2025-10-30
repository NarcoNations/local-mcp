'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { getSearchResults } from '../../src/lib/dataClient';
import { SearchResult } from '../../src/types/systems';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setSearching] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    if (!query) {
      setResults([]);
      return;
    }
    setSearching(true);
    (async () => {
      const data = await getSearchResults(query);
      if (!cancelled) {
        setResults(data);
        setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (data.get('q') as string | null)?.trim() ?? '';
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  };

  return (
    <div className="space-y-8">
      <Surface title="Search the stack" toolbar={<span className="text-xs text-muted">Historian + Corpus + Knowledge</span>}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Ask across ingest, knowledge, prompts, workroom…"
              className="w-full rounded-2xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 py-4 pl-11 pr-16 text-sm text-foreground outline-none focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-2 text-[11px] text-muted">
              <span className="rounded-md border border-[hsl(var(--color-border)/0.6)] bg-background/70 px-1">⌘</span>
              <span className="rounded-md border border-[hsl(var(--color-border)/0.6)] bg-background/70 px-1">K</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            Tips:
            <Pill tone="info">Use #source filters — e.g. #knowledge</Pill>
            <Pill tone="info">Try natural language, we vector search</Pill>
          </div>
        </form>
      </Surface>
      <Surface title="Results" toolbar={<span className="text-xs text-muted">{isSearching ? 'Scanning…' : `${results.length} matches`}</span>}>
        {query ? (
          <ul className="space-y-4">
            {results.map((result) => (
              <li key={result.id} className="rounded-xl border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">{result.title}</h3>
                  <Pill tone="info">{result.source}</Pill>
                </div>
                <p className="mt-2 text-sm text-muted">{result.snippet}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>Score {Math.round(result.score * 100)}%</span>
                  {result.slug ? <span className="font-mono text-[10px]">{result.slug}</span> : null}
                </div>
              </li>
            ))}
            {!results.length && !isSearching ? (
              <li className="rounded-xl border border-dashed border-[hsl(var(--color-border)/0.45)] px-4 py-10 text-center text-sm text-muted">
                No matches yet. Try broadening the query or re-indexing knowledge.
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-[hsl(var(--color-border)/0.45)] px-4 py-10 text-center text-sm text-muted">
            Start typing to sweep across VibeOS systems.
          </p>
        )}
      </Surface>
    </div>
  );
}
