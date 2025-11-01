'use client';

import { useMemo, useState } from 'react';

type Prompt = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  version: number;
};

type RunResult = {
  model: string;
  output: string;
  latencyMs: number;
  costEstimate: number;
  rating?: number;
  notes?: string;
};

const modelOptions = [
  { value: 'openai:gpt-4o-mini', label: 'OpenAI — GPT-4o mini' },
  { value: 'local:mock', label: 'Local Fallback' },
];

const forbiddenPhrases = ['as an ai language model'];

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: 'welcome-brief',
      title: 'Welcome brief',
      body: 'You are VibeOS. Summarise the supplied context into three vibe-aligned missions.',
      tags: ['briefing', 'ops'],
      version: 1,
    },
  ]);
  const [activeId, setActiveId] = useState<string>('welcome-brief');
  const [selectedModels, setSelectedModels] = useState<string[]>(['openai:gpt-4o-mini']);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});
  const [running, setRunning] = useState(false);

  const activePrompt = prompts.find((p) => p.id === activeId);

  function createPrompt() {
    const id = `prompt-${Date.now()}`;
    const next: Prompt = { id, title: 'Untitled Prompt', body: '', tags: [], version: 1 };
    setPrompts((prev) => [...prev, next]);
    setActiveId(id);
  }

  function updatePrompt(patch: Partial<Prompt>) {
    if (!activePrompt) return;
    setPrompts((prev) =>
      prev.map((item) =>
        item.id === activePrompt.id
          ? { ...item, ...patch, version: patch.body || patch.title ? item.version + 1 : item.version }
          : item
      )
    );
  }

  const lintMessages = useMemo(() => {
    if (!activePrompt) return [];
    const messages: string[] = [];
    if (activePrompt.body.length < 40) messages.push('Prompt is quite short — consider adding context.');
    if (activePrompt.body.length > 3000) messages.push('Prompt exceeds 3k characters. Try trimming.');
    forbiddenPhrases.forEach((phrase) => {
      if (activePrompt.body.toLowerCase().includes(phrase)) {
        messages.push(`Avoid filler phrase: “${phrase}”.`);
      }
    });
    if (!/\{.*\}/.test(activePrompt.body)) {
      messages.push('Add at least one variable placeholder (e.g. {audience}).');
    }
    return messages;
  }, [activePrompt?.body]);

  async function handleRun() {
    if (!activePrompt) return;
    setRunning(true);
    try {
      const responses = await Promise.all(
        selectedModels.map(async (model) => {
          const res = await fetch('/api/llm/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: 'draft_copy', prompt: activePrompt.body, modelHint: model }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'LLM run failed');
          return { model, output: json.output, latencyMs: json.latencyMs, costEstimate: json.costEstimate };
        })
      );
      const asRecord: Record<string, RunResult> = {};
      responses.forEach((item) => {
        asRecord[item.model] = item;
      });
      setRunResults(asRecord);
    } catch (error) {
      console.error(error);
    } finally {
      setRunning(false);
    }
  }

  function updateScore(model: string, rating: number, notes: string) {
    setRunResults((prev) => ({
      ...prev,
      [model]: {
        ...(prev[model] ?? { model, output: '', latencyMs: 0, costEstimate: 0 }),
        rating,
        notes,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-[var(--surface-base,#050607)] text-[var(--text-primary,#f5f5f5)]">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[280px,1fr]">
        <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Prompt Library</h1>
            <button
              className="rounded-full bg-[var(--accent,#22d3ee)] px-3 py-1 text-xs font-semibold text-black hover:bg-[var(--accent-strong,#67e8f9)]"
              onClick={createPrompt}
            >
              New
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setActiveId(prompt.id)}
                className={`rounded-lg px-3 py-2 text-left transition ${
                  prompt.id === activeId ? 'bg-white/15 text-white' : 'text-[var(--text-muted,#a1a1aa)] hover:bg-white/5'
                }`}
              >
                <span className="block text-sm font-medium">{prompt.title}</span>
                <span className="text-xs text-[var(--text-subtle,#d4d4d8)]">v{prompt.version}</span>
              </button>
            ))}
          </nav>
        </aside>

        {activePrompt ? (
          <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <input
                value={activePrompt.title}
                onChange={(e) => updatePrompt({ title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xl font-semibold focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              />
              <input
                value={activePrompt.tags.join(', ')}
                onChange={(e) => updatePrompt({ tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
                placeholder="Tags (comma separated)"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              />
            </header>

            <textarea
              value={activePrompt.body}
              onChange={(e) => updatePrompt({ body: e.target.value })}
              rows={12}
              className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
            />

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted,#a1a1aa)]">Linter</h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-subtle,#d4d4d8)]">
                {lintMessages.length ? lintMessages.map((msg) => <li key={msg}>• {msg}</li>) : <li>Looks good!</li>}
              </ul>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted,#a1a1aa)]">Run models</h2>
              <div className="flex flex-wrap gap-3">
                {modelOptions.map((model) => {
                  const checked = selectedModels.includes(model.value);
                  return (
                    <label
                      key={model.value}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        checked
                          ? 'border-[var(--accent,#22d3ee)] bg-[var(--accent,#22d3ee)]/20 text-white'
                          : 'border-white/10 text-[var(--text-muted,#a1a1aa)] hover:border-white/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedModels((prev) =>
                            checked ? prev.filter((value) => value !== model.value) : [...prev, model.value]
                          )
                        }
                        className="h-4 w-4 accent-[var(--accent,#22d3ee)]"
                      />
                      {model.label}
                    </label>
                  );
                })}
              </div>
              <button
                onClick={handleRun}
                disabled={!selectedModels.length || running}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--accent,#22d3ee)] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong,#67e8f9)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {running ? 'Running…' : 'Run selected models'}
              </button>
            </div>

            {Object.keys(runResults).length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(runResults).map(([model, data]) => (
                  <article key={model} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">{model}</h3>
                      <span className="text-xs text-[var(--text-muted,#a1a1aa)]">
                        {Math.round(data.latencyMs)} ms • ${data.costEstimate.toFixed(3)}
                      </span>
                    </header>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-black/70 p-3 text-xs leading-relaxed text-[var(--text-subtle,#d4d4d8)]">
                      {data.output || 'No output'}
                    </pre>
                    <footer className="flex flex-col gap-2 text-sm">
                      <label className="flex items-center gap-2">
                        <span className="text-[var(--text-muted,#a1a1aa)]">Score</span>
                        <select
                          value={data.rating ?? ''}
                          onChange={(e) => updateScore(model, Number(e.target.value), data.notes ?? '')}
                          className="rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white"
                        >
                          <option value="">—</option>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <textarea
                        value={data.notes ?? ''}
                        onChange={(e) => updateScore(model, data.rating ?? 0, e.target.value)}
                        rows={3}
                        placeholder="Reviewer notes"
                        className="rounded-lg border border-white/10 bg-black/60 p-2 text-xs"
                      />
                    </footer>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
