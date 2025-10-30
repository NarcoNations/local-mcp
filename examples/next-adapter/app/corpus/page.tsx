'use client';
import { useState, type FormEvent } from 'react';

type ChatIngestResult = { ok: boolean; conversations: number; messages: number };

export default function CorpusPage() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChatIngestResult | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) {
      setError('Paste a valid URL to your ChatGPT export JSON.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ingest/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as ChatIngestResult;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Unable to ingest export');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>ChatGPT Corpus Ingest</h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'rgba(0,0,0,0.65)' }}>
          Supply a download URL to a ChatGPT export JSON (up to ~500 MB). We stream, parse, and batch upsert conversations and
          messages while logging Historian events.
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '16px',
          padding: 'clamp(16px, 4vw, 28px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <label style={{ display: 'grid', gap: '8px', fontWeight: 600 }}>
          Export URL
          <input
            type="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://.../chatgpt-export.json"
            required
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)'
            }}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            background: busy ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
            color: 'rgb(255,255,255)',
            fontWeight: 600,
            cursor: busy ? 'progress' : 'pointer'
          }}
        >
          {busy ? 'Importing…' : 'Ingest Export'}
        </button>
        {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
      </form>
      {result && (
        <section
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.96)',
            padding: 'clamp(16px, 4vw, 24px)',
            display: 'grid',
            gap: '12px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Ingest complete</h2>
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)' }}>
            Conversations: {result.conversations} · Messages: {result.messages}
          </p>
        </section>
      )}
    </div>
  );
}
