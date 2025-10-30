"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";

interface FeedProbeState {
  symbol: string;
  fn: string;
  payload?: Record<string, unknown>;
}

interface LlmProbeState {
  task: string;
  prompt: string;
  output?: string;
}

export function ApiManagerView() {
  const { push } = useToast();
  const [feedResult, setFeedResult] = useState<FeedProbeState | null>(null);
  const [llmResult, setLlmResult] = useState<LlmProbeState | null>(null);
  const [loading, setLoading] = useState(false);

  const submitFeed = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const symbol = String(data.get("symbol") ?? "").trim();
    const fn = String(data.get("fn") ?? "").trim();
    const payload = String(data.get("payload") ?? "").trim();
    setLoading(true);
    try {
      // placeholder call
      await new Promise((resolve) => setTimeout(resolve, 600));
      const parsed = payload ? JSON.parse(payload) : {};
      setFeedResult({ symbol, fn, payload: parsed });
      push({
        title: "Feed probe sent",
        description: `${symbol}.${fn} dispatched`,
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Feed probe failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitLlm = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const task = String(data.get("task") ?? "").trim();
    const prompt = String(data.get("prompt") ?? "").trim();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLlmResult({ task, prompt, output: `Stubbed response for ${task}` });
      push({
        title: "LLM probe queued",
        description: `Synthesizing response for ${task}`,
        variant: "info",
      });
    } catch (error) {
      push({
        title: "LLM probe failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="API control room"
        description="Run low-level feed probes and conversational tests against live adapters."
        actions={<span className="text-xs text-muted">Results render locally — wire actual responses via adapters.</span>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Feed alpha probe" description="Trigger a feed symbol and function with optional payload." variant="elevated">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitFeed(event.currentTarget);
            }}
          >
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="feed-symbol">
                Symbol
              </label>
              <input
                id="feed-symbol"
                name="symbol"
                placeholder="api.alpha"
                className="focus-ring mt-1 w-full rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="feed-fn">
                Function
              </label>
              <input
                id="feed-fn"
                name="fn"
                placeholder="probe"
                className="focus-ring mt-1 w-full rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="feed-payload">
                Payload (JSON)
              </label>
              <textarea
                id="feed-payload"
                name="payload"
                rows={4}
                placeholder="{ \"region\": \"latam\", \"limit\": 10 }"
                className="focus-ring mt-1 w-full rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {loading ? "Dispatching..." : "Dispatch"}
            </button>
          </form>
          {feedResult ? (
            <pre className="mt-4 max-h-60 overflow-auto rounded-2xl border border-border bg-surface p-4 text-xs text-primary">
              {JSON.stringify(feedResult, null, 2)}
            </pre>
          ) : null}
        </Card>
        <Card title="LLM probe" description="Send structured prompts against the conversational interface." variant="elevated">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitLlm(event.currentTarget);
            }}
          >
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="llm-task">
                Task
              </label>
              <input
                id="llm-task"
                name="task"
                placeholder="Summarize perimeter drones"
                className="focus-ring mt-1 w-full rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted" htmlFor="llm-prompt">
                Prompt
              </label>
              <textarea
                id="llm-prompt"
                name="prompt"
                rows={6}
                placeholder="Provide a tactical briefing using the latest knowledge nodes."
                className="focus-ring mt-1 w-full rounded-2xl border border-border bg-surface-elevated px-3 py-2 text-sm text-primary placeholder:text-muted"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {loading ? "Synthesizing..." : "Generate"}
            </button>
          </form>
          {llmResult ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm text-primary">
              <p className="font-semibold">Output</p>
              <p className="whitespace-pre-wrap text-muted">{llmResult.output}</p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
