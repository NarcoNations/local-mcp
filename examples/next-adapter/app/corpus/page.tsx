'use client';
import { useState, type CSSProperties } from 'react';

type CorpusResult = {
  ok: boolean;
  conversations: number;
  messages: number;
};

export default function CorpusPage() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorpusResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) {
      setError('Provide a public URL to your conversations.json export.');
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
      const json = (await res.json()) as CorpusResult;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to ingest export.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>ChatGPT Corpus Import</h1>
        <p style={{ maxWidth: 640, lineHeight: 1.5 }}>
          Paste a signed URL (Supabase Storage, S3, or localhost) pointing to <code>conversations.json</code>. The adapter streams
          the file, upserts conversations and messages, and logs a Historian event.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
          Export URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/conversations.json"
            required
            inputMode="url"
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, rgba(50,50,70,0.9), rgba(90,90,120,0.85))',
            color: 'white',
            cursor: busy ? 'wait' : 'pointer',
            minWidth: 160,
            fontWeight: 600
          }}
        >
          {busy ? 'Streaming…' : 'Ingest Export'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      {result && (
        <section style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Corpus imported</h2>
          <div style={statStyle}>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Conversations</span>
            <strong style={{ fontSize: '1.75rem' }}>{result.conversations.toLocaleString()}</strong>
          </div>
          <div style={statStyle}>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Messages</span>
            <strong style={{ fontSize: '1.75rem' }}>{result.messages.toLocaleString()}</strong>
          </div>
        </section>
      )}
    </main>
  );
}

const statStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(20,20,30,0.05)',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)'
};
