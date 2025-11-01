'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';

type FeedResult = {
  ok?: boolean;
  error?: string;
  data?: any;
  status?: number;
  cached?: boolean;
};

type LLMResult = {
  model?: string;
  output?: string;
  error?: string;
};

export default function ApiManagerPage() {
  const [feedFn, setFeedFn] = useState('TIME_SERIES_DAILY');
  const [symbol, setSymbol] = useState('SPY');
  const [feedResult, setFeedResult] = useState<FeedResult | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [llmTask, setLlmTask] = useState('summarize');
  const [prompt, setPrompt] = useState('Summarize the latest ingest run and highlight next steps.');
  const [modelHint, setModelHint] = useState('local');
  const [llmResult, setLlmResult] = useState<LLMResult | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runFeedProbe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feeds/alpha?fn=${feedFn}&symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      setFeedResult(json);
      if (!res.ok) throw new Error(json.error || 'Feed request failed');
    } catch (err: any) {
      setError(err?.message || 'Feed probe failed');
    } finally {
      setFeedLoading(false);
    }
  }

  async function runLlmProbe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLlmLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: llmTask, prompt, modelHint })
      });
      const json = await res.json();
      setLlmResult(json.result || json);
      if (!res.ok) throw new Error(json.result?.error || json.error || 'LLM probe failed');
    } catch (err: any) {
      setError(err?.message || 'LLM probe failed');
    } finally {
      setLlmLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>API Manager</h1>
        <p style={leadStyle}>
          Route free-tier data feeds and LLM tasks with inline telemetry. Caches Alpha Vantage responses for 60 seconds and
          records Historian events for every probe.
        </p>
        {error && <p style={errorStyle}>{error}</p>}
      </section>

      <section style={cardStyle}>
        <h2 style={subtitleStyle}>Market Data Probe</h2>
        <form onSubmit={runFeedProbe} style={formStyle}>
          <label style={labelStyle}>
            Function
            <select value={feedFn} onChange={(event) => setFeedFn(event.currentTarget.value)} style={selectStyle}>
              <option value="TIME_SERIES_DAILY">TIME_SERIES_DAILY</option>
              <option value="OVERVIEW">OVERVIEW</option>
            </select>
          </label>
          <label style={labelStyle}>
            Symbol
            <input value={symbol} onChange={(event) => setSymbol(event.currentTarget.value)} style={inputStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={feedLoading}>
            {feedLoading ? 'Fetching…' : 'Fetch feed'}
          </button>
        </form>
        {feedResult && (
          <pre style={preStyle}>{JSON.stringify(feedResult, null, 2)}</pre>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={subtitleStyle}>LLM Router Probe</h2>
        <form onSubmit={runLlmProbe} style={formStyle}>
          <label style={labelStyle}>
            Task
            <select value={llmTask} onChange={(event) => setLlmTask(event.currentTarget.value)} style={selectStyle}>
              <option value="summarize">summarize</option>
              <option value="draft_copy">draft_copy</option>
              <option value="classify">classify</option>
            </select>
          </label>
          <label style={labelStyle}>
            Prompt
            <textarea value={prompt} onChange={(event) => setPrompt(event.currentTarget.value)} rows={5} style={textareaStyle} />
          </label>
          <label style={labelStyle}>
            Model hint
            <input value={modelHint} onChange={(event) => setModelHint(event.currentTarget.value)} style={inputStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={llmLoading}>
            {llmLoading ? 'Routing…' : 'Send to LLM router'}
          </button>
        </form>
        {llmResult && (
          <div style={llmResultStyle}>
            <p style={{ margin: 0, fontWeight: 600 }}>Model: {llmResult.model || 'n/a'}</p>
            <pre style={preStyle}>{llmResult.error || llmResult.output || 'No response'}</pre>
          </div>
        )}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  padding: '24px 0'
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem'
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.3rem'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  alignItems: 'start'
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '6px',
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)'
};

const selectStyle: CSSProperties = { ...inputStyle };

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical'
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer'
};

const preStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.07)',
  borderRadius: '12px',
  padding: '16px',
  margin: 0,
  maxHeight: '320px',
  overflow: 'auto',
  fontSize: '0.85rem',
  lineHeight: 1.5
};

const llmResultStyle: CSSProperties = {
  display: 'grid',
  gap: '8px'
};
