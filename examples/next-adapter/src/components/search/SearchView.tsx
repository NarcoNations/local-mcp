"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import type { SearchResultItem } from "../../types/app";
import { runSearch } from "../../data/search";

interface SearchViewProps {
  initialQuery: string;
  initialResults: SearchResultItem[];
}

export function SearchView({ initialQuery, initialResults }: SearchViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>(initialResults);
  const [pending, startTransition] = useTransition();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    startTransition(async () => {
      if (q) {
        router.replace(`/search?q=${encodeURIComponent(q)}`);
        const data = await runSearch(q);
        setResults(data);
      } else {
        router.replace(`/search`);
        setResults([]);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Search intelligence"
        description="Sweep across knowledge, corpus, prompts, and operational outputs."
        actions={<span className="text-xs text-muted">Use Cmd+K for palette or / to focus the header search.</span>}
      />
      <Card variant="elevated">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="global-search">
            Query
          </label>
          <input
            id="global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex: logistics vulnerabilities in corridor delta"
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-primary placeholder:text-muted"
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{pending ? "Scanning indexes..." : `${results.length} results`}</span>
            <button
              type="submit"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary"
            >
              Search
            </button>
          </div>
        </form>
      </Card>
      <div className="space-y-4">
        {results.length === 0 && !pending ? (
          <Card title="No results" description="Refine the query or index new sources via Knowledge." />
        ) : (
          results.map((result) => (
            <Card key={result.id} variant="subdued">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary">{result.title}</p>
                <p className="text-sm text-muted">{result.snippet}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="rounded-full border border-border bg-surface px-3 py-1 uppercase tracking-[0.18em]">
                    score {result.score.toFixed(2)}
                  </span>
                  <span>{result.source}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
