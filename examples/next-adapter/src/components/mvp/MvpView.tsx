"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";

interface MvpResult {
  summary: string;
  highlights: string[];
}

export function MvpView() {
  const { push } = useToast();
  const [objective, setObjective] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MvpResult | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!objective.trim()) {
      push({ title: "Objective required", description: "Describe the MVP mission.", variant: "info" });
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResult({
        summary: "Stubbed MVP blueprint outlining scope, crew, and launch cadence.",
        highlights: [
          "Mission scope aligned with corridor Delta.",
          "Crewed by Workroom pods with 48h sprint.",
          "Output includes cinematic brief + ops checklist.",
        ],
      });
      push({ title: "Brief generated", description: "Review the summary below.", variant: "success" });
    } catch (error) {
      push({ title: "Generation failed", description: "Retry once data is refreshed.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="One-shot MVP"
        description="Assemble cinematic mission briefs from operational inputs."
        actions={<span className="text-xs text-muted">Drop optional brief.json for additional context.</span>}
      />
      <Card variant="elevated">
        <form className="space-y-4" onSubmit={submit}>
          <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="mvp-objective">
            Objective
          </label>
          <textarea
            id="mvp-objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            rows={6}
            placeholder="Outline the mission goals, timelines, and stakeholders."
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-primary placeholder:text-muted"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Upload brief.json
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {file ? <span className="text-xs text-muted">{file.name}</span> : <span className="text-xs text-muted">Optional supporting context.</span>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {loading ? "Synthesizing..." : "Generate brief"}
          </button>
        </form>
      </Card>
      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(0,0,0,0.5)] px-4">
          <Card variant="elevated" className="max-w-xl">
            <h2 className="text-lg font-semibold text-primary">MVP summary</h2>
            <p className="text-sm text-muted">{result.summary}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-primary">
              {result.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
