'use client';
import { useState, type FormEvent } from 'react';

const feedFns = [
  { label: 'Time Series Daily', value: 'TIME_SERIES_DAILY' },
  { label: 'Company Overview', value: 'OVERVIEW' }
] as const;

type FeedResponse = { ok: boolean; cached?: boolean; data?: unknown; error?: string };
type LLMResponse = { ok: boolean; model?: string; output?: string; error?: string };

export default function ApiManagerPage() {
  const [symbol, setSymbol] = useState('MSFT');
  const [fn, setFn] = useState<(typeof feedFns)[number]['value']>('TIME_SERIES_DAILY');
  const [feedState, setFeedState] = useState<{ loading: boolean; result: FeedResponse | null; error: string | null }>({
    loading: false,
    result: null,
    error: null
  });

  const [task, setTask] = useState('summarize');
  const [prompt, setPrompt] = useState('Summarise today’s market open for MSFT.');
  const [modelHint, setModelHint] = useState('local');
  const [llmState, setLlmState] = useState<{ loading: boolean; result: LLMResponse | null; error: string | null }>({
    loading: false,
    result: null,
    error: null
  });

  async function handleFeed(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedState({ loading: true, result: null, error: null });
    try {
      const params = new URLSearchParams({ fn, symbol: symbol.trim().toUpperCase() });
      const res = await fetch(`/api/feeds/alpha?${params.toString()}`);
      const json = (await res.json()) as FeedResponse;
      if (!res.ok) throw new Error(json.error || 'Feed request failed');
      setFeedState({ loading: false, result: json, error: null });
    } catch (err: any) {
      setFeedState({ loading: false, result: null, error: err?.message || 'Feed request failed' });
    }
  }

  async function handleLlm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLlmState({ loading: true, result: null, error: null });
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, prompt, modelHint })
      });
      const json = (await res.json()) as LLMResponse;
      if (!res.ok) throw new Error(json.error || 'LLM routing failed');
      setLlmState({ loading: false, result: json, error: null });
    } catch (err: any) {
      setLlmState({ loading: false, result: null, error: err?.message || 'LLM routing failed' });
    }
  }

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>API Manager</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', maxWidth: 720 }}>
          Probe Alpha Vantage feeds with caching and route LLM tasks via local mocks or OpenAI depending on hints.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: '16px',
          padding: 'clamp(16px, 4vw, 28px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <h2 style={{ margin: 0 }}>Alpha Vantage feed probe</h2>
        <form
          onSubmit={handleFeed}
          style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
          }}
        >
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Function
            <select
              value={fn}
              onChange={(e) => setFn(e.target.value as (typeof feedFns)[number]['value'])}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)'
              }}
            >
              {feedFns.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Symbol
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="MSFT"
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)'
              }}
            />
          </label>
          <button
            type="submit"
            disabled={feedState.loading}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: feedState.loading ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
              color: 'rgb(255,255,255)',
              fontWeight: 600,
              cursor: feedState.loading ? 'progress' : 'pointer'
            }}
          >
            {feedState.loading ? 'Loading…' : 'Fetch feed'}
          </button>
        </form>
        {feedState.error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{feedState.error}</p>}
        {feedState.result && (
          <pre
            style={{
              margin: 0,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.05)',
              fontSize: '0.85rem',
              overflowX: 'auto'
            }}
          >
            {JSON.stringify(feedState.result, null, 2)}
          </pre>
        )}
      </section>
      <section
        style={{
          display: 'grid',
          gap: '16px',
          padding: 'clamp(16px, 4vw, 28px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <h2 style={{ margin: 0 }}>LLM routing probe</h2>
        <form onSubmit={handleLlm} style={{ display: 'grid', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}
          >
            <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
              Task
              <select
                value={task}
                onChange={(e) => setTask(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  background: 'rgba(255,255,255,0.9)'
                }}
              >
                <option value="summarize">summarize</option>
                <option value="draft_copy">draft_copy</option>
                <option value="classify">classify</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
              Model hint
              <input
                value={modelHint}
                onChange={(e) => setModelHint(e.target.value)}
                placeholder="local | openai"
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  background: 'rgba(255,255,255,0.9)'
                }}
              />
            </label>
          </div>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Prompt
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)',
                resize: 'vertical'
              }}
            />
          </label>
          <button
            type="submit"
            disabled={llmState.loading}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: llmState.loading ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
              color: 'rgb(255,255,255)',
              fontWeight: 600,
              cursor: llmState.loading ? 'progress' : 'pointer'
            }}
          >
            {llmState.loading ? 'Routing…' : 'Run task'}
          </button>
        </form>
        {llmState.error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{llmState.error}</p>}
        {llmState.result && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)' }}>Model: {llmState.result.model}</span>
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(0,0,0,0.04)'
              }}
            >
              {llmState.result.output}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
