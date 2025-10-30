"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";
import { runResearch } from "../../data/research";
import type { ResearchResponse } from "../../types/app";

export function ResearchView() {
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      push({ title: "Query required", description: "Define the research focus.", variant: "info" });
      return;
    }
    setLoading(true);
    try {
      const parsedObjectives = objectives
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const data = await runResearch(query, parsedObjectives);
      setResult(data);
      push({ title: "Research assembled", description: "Review the findings below.", variant: "success" });
    } catch (error) {
      push({ title: "Research failed", description: "Retry with refined query.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Research engine"
        description="Synthesize facts, insights, and citations for operational questions."
        actions={<span className="text-xs text-muted">Outputs stay local until you export.</span>}
      />
      <Card variant="elevated">
        <form className="space-y-4" onSubmit={submit}>
          <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="research-query">
            Query
          </label>
          <input
            id="research-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="How do we harden corridor delta logistics?"
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-2 text-sm text-primary placeholder:text-muted"
          />
          <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="research-objectives">
            Objectives (one per line)
          </label>
          <textarea
            id="research-objectives"
            value={objectives}
            onChange={(event) => setObjectives(event.target.value)}
            rows={4}
            placeholder={"Assess risk\nSurface new actors"}
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-2 text-sm text-primary placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {loading ? "Compiling..." : "Run research"}
          </button>
        </form>
      </Card>
      {result ? (
        <Card title="Findings" variant="elevated">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Facts</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-primary">
                {result.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Insights</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-primary">
                {result.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Sources</h3>
              <ul className="mt-2 space-y-2 text-sm text-primary">
                {result.sources.map((source) => (
                  <li key={source.url} className="flex flex-col">
                    <span>{source.title}</span>
                    <a className="text-xs text-muted underline" href={source.url} target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Card>
      ) : null}
    </div>
  );
}
