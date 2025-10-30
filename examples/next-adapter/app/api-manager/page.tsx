'use client';
import { useState, type CSSProperties } from 'react';

type FeedResponse = {
  ok: boolean;
  cached: boolean;
  data: unknown;
};

type LLMResponse = {
  ok: boolean;
  result: { model: string; output: string };
};

const feedOptions = [
  { value: 'TIME_SERIES_DAILY', label: 'Daily Time Series' },
  { value: 'OVERVIEW', label: 'Company Overview' }
];

type FeedFn = (typeof feedOptions)[number]['value'];

type LLMTask = 'draft_copy' | 'summarize' | 'classify';

export default function ApiManagerPage() {
  const [symbol, setSymbol] = useState('MSFT');
  const [feedFn, setFeedFn] = useState<FeedFn>('OVERVIEW');
  const [feedResult, setFeedResult] = useState<FeedResponse | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedBusy, setFeedBusy] = useState(false);

  const [task, setTask] = useState<LLMTask>('summarize');
  const [prompt, setPrompt] = useState('Summarize today’s market sentiment in 3 bullet points.');
  const [modelHint, setModelHint] = useState('');
  const [llmResult, setLlmResult] = useState<LLMResponse | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmBusy, setLlmBusy] = useState(false);

  async function runFeed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!symbol.trim()) {
      setFeedError('Ticker symbol required');
      return;
    }
    setFeedBusy(true);
    setFeedError(null);
    setFeedResult(null);
    try {
      const params = new URLSearchParams({ fn: feedFn, symbol: symbol.trim().toUpperCase() });
      const res = await fetch(`/api/feeds/alpha?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as FeedResponse;
      setFeedResult(json);
    } catch (err: any) {
      setFeedError(err?.message || 'Feed request failed');
    } finally {
      setFeedBusy(false);
    }
  }

  async function runLLM(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!prompt.trim()) {
      setLlmError('Provide a prompt to run.');
      return;
    }
    setLlmBusy(true);
    setLlmError(null);
    setLlmResult(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, prompt: prompt.trim(), modelHint: modelHint.trim() || undefined })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as LLMResponse;
      setLlmResult(json);
    } catch (err: any) {
      setLlmError(err?.message || 'LLM run failed');
    } finally {
      setLlmBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>API Manager</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.5 }}>
          Probe external feeds and LLM routes through a single surface. Responses stream through Historian for telemetry.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        <div style={panelStyle}>
          <h2 style={panelHeading}>Alpha Vantage Feed</h2>
          <form onSubmit={runFeed} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={labelStyle}>
              Symbol
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={inputStyle}
                placeholder="MSFT"
                required
              />
            </label>
            <label style={labelStyle}>
              Function
              <select value={feedFn} onChange={(e) => setFeedFn(e.target.value as FeedFn)} style={inputStyle}>
                {feedOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={feedBusy} style={buttonStyle}>
              {feedBusy ? 'Fetching…' : 'Fetch feed'}
            </button>
          </form>
          {feedError && (
            <p role="alert" style={{ color: 'crimson', margin: 0 }}>
              {feedError}
            </p>
          )}
          {feedResult && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', opacity: 0.7 }}>
                {feedResult.cached ? 'Cached response' : 'Fresh response'}
              </p>
              <pre style={preStyle}>{JSON.stringify(feedResult.data, null, 2)}</pre>
            </div>
          )}
        </div>
        <div style={panelStyle}>
          <h2 style={panelHeading}>LLM Router</h2>
          <form onSubmit={runLLM} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={labelStyle}>
              Task
              <select value={task} onChange={(e) => setTask(e.target.value as LLMTask)} style={inputStyle}>
                <option value="summarize">Summarize</option>
                <option value="draft_copy">Draft copy</option>
                <option value="classify">Classify</option>
              </select>
            </label>
            <label style={labelStyle}>
              Prompt
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </label>
            <label style={labelStyle}>
              Model hint (local / gpt-4o-mini / etc)
              <input value={modelHint} onChange={(e) => setModelHint(e.target.value)} style={inputStyle} />
            </label>
            <button type="submit" disabled={llmBusy} style={buttonStyle}>
              {llmBusy ? 'Routing…' : 'Run LLM'}
            </button>
          </form>
          {llmError && (
            <p role="alert" style={{ color: 'crimson', margin: 0 }}>
              {llmError}
            </p>
          )}
          {llmResult && (
            <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Model: {llmResult.result.model}</p>
              <pre style={preStyle}>{llmResult.result.output}</pre>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(20,20,30,0.04)',
  padding: '18px 20px'
};

const panelHeading: CSSProperties = { margin: 0, fontSize: '1.2rem' };

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.95rem' };

const inputStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.15)',
  background: 'rgba(255,255,255,0.9)'
};

const buttonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(70,90,120,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};

const preStyle: CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(0,0,0,0.05)',
  overflowX: 'auto'
};
