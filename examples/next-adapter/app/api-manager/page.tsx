'use client';

import { FormEvent, useState } from 'react';

type FeedPayload = { ok: boolean; data: any; durationMs?: number; cached?: boolean } | null;

type LLMRunResult = {
  ok: boolean;
  response: { model?: string; output?: string; mock?: boolean; warning?: string; error?: string };
  durationMs?: number;
} | null;

export default function ApiManagerPage() {
  const [feedFn, setFeedFn] = useState<'TIME_SERIES_DAILY' | 'OVERVIEW'>('TIME_SERIES_DAILY');
  const [symbol, setSymbol] = useState('VIBE');
  const [feedResult, setFeedResult] = useState<FeedPayload>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

  const [task, setTask] = useState<'draft_copy' | 'summarize' | 'classify'>('summarize');
  const [prompt, setPrompt] = useState('Summarize the VibeOS ingest pipeline.');
  const [modelHint, setModelHint] = useState('local');
  const [llmResult, setLlmResult] = useState<LLMRunResult>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  async function handleFeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedLoading(true);
    setFeedError(null);
    setFeedResult(null);
    try {
      const params = new URLSearchParams({ fn: feedFn, symbol: symbol.trim() });
      const res = await fetch(`/api/feeds/alpha?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setFeedResult(json);
    } catch (err: any) {
      setFeedError(err?.message || 'Feed request failed');
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleLLM(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, prompt, modelHint })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setLlmResult(json);
    } catch (err: any) {
      setLlmError(err?.message || 'LLM request failed');
    } finally {
      setLlmLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 32 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>API Manager Probes</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 640 }}>
          Exercise free-tier integrations without leaving the adapter. Alpha Vantage responses are cached for 60 seconds and the
          LLM router can fall back to local heuristics when cloud keys are missing.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        <article
          style={{
            border: '1px solid rgb(229, 229, 229)',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'grid',
            gap: 16,
            background: 'rgb(252, 252, 252)'
          }}
        >
          <header style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Alpha Vantage Feed</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'rgb(102, 102, 102)' }}>60s cache · TIME_SERIES_DAILY or OVERVIEW functions.</p>
          </header>
          <form onSubmit={handleFeed} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Function</span>
              <select
                value={feedFn}
                onChange={(event) => setFeedFn(event.target.value as typeof feedFn)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
              >
                <option value="TIME_SERIES_DAILY">TIME_SERIES_DAILY</option>
                <option value="OVERVIEW">OVERVIEW</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Symbol</span>
              <input
                type="text"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)', letterSpacing: 1 }}
              />
            </label>
            <button
              type="submit"
              disabled={feedLoading}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: 'rgb(17, 17, 17)',
                color: 'rgb(255, 255, 255)',
                fontWeight: 600,
                justifySelf: 'flex-start'
              }}
            >
              {feedLoading ? 'Fetching…' : 'Fetch feed'}
            </button>
          </form>
          {feedError ? <p style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{feedError}</p> : null}
          {feedResult ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <strong style={{ fontSize: 13, color: 'rgb(10, 124, 45)' }}>
                {feedResult.ok ? 'Success' : 'Check response'} · {Math.round(feedResult.durationMs ?? 0)} ms
              </strong>
              <pre
                style={{
                  background: 'rgb(17, 17, 17)',
                  color: 'rgb(245, 245, 245)',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 12,
                  maxHeight: 260,
                  overflow: 'auto'
                }}
              >
                {JSON.stringify(feedResult.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </article>
        <article
          style={{
            border: '1px solid rgb(229, 229, 229)',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'grid',
            gap: 16,
            background: 'rgb(252, 252, 252)'
          }}
        >
          <header style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>LLM Router</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'rgb(102, 102, 102)' }}>Hint <code>local</code> for offline mock output.</p>
          </header>
          <form onSubmit={handleLLM} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Task</span>
              <select
                value={task}
                onChange={(event) => setTask(event.target.value as typeof task)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
              >
                <option value="draft_copy">draft_copy</option>
                <option value="summarize">summarize</option>
                <option value="classify">classify</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Prompt</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgb(215, 215, 215)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Model hint</span>
              <input
                type="text"
                value={modelHint}
                onChange={(event) => setModelHint(event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
              />
            </label>
            <button
              type="submit"
              disabled={llmLoading}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: 'rgb(17, 17, 17)',
                color: 'rgb(255, 255, 255)',
                fontWeight: 600,
                justifySelf: 'flex-start'
              }}
            >
              {llmLoading ? 'Routing…' : 'Run LLM'}
            </button>
          </form>
          {llmError ? <p style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{llmError}</p> : null}
          {llmResult ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <strong style={{ fontSize: 13, color: 'rgb(10, 124, 45)' }}>
                {llmResult.ok ? llmResult.response.model || 'response' : 'Check response'} ·{' '}
                {Math.round(llmResult.durationMs ?? 0)} ms
              </strong>
              {llmResult.response?.output ? (
                <p style={{ margin: 0, background: 'rgb(255, 255, 255)', padding: 14, borderRadius: 12, lineHeight: 1.5 }}>
                  {llmResult.response.output}
                </p>
              ) : null}
              <pre
                style={{
                  background: 'rgb(17, 17, 17)',
                  color: 'rgb(245, 245, 245)',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 12,
                  maxHeight: 220,
                  overflow: 'auto'
                }}
              >
                {JSON.stringify(llmResult.response, null, 2)}
              </pre>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
