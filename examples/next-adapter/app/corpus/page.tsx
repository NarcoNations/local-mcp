'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';

interface CorpusResponse {
  ok: boolean;
  conversations: number;
  messages: number;
  durationMs?: number;
}

export default function CorpusIngestPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<CorpusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url) {
      setError('Provide a signed URL to your ChatGPT export JSON.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ingest/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as CorpusResponse;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Corpus ingest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>ChatGPT Corpus Ingest</h1>
        <p style={leadStyle}>
          Paste a presigned URL (local file server or Supabase storage) to your ChatGPT export JSON. We stream the download,
          upsert conversations + messages, and log Historian telemetry.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            <span>Export URL</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              placeholder="https://example.com/export.json"
              style={inputStyle}
              required
            />
          </label>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Importing…' : 'Import conversations'}
          </button>
        </form>
        {error && <p style={errorStyle}>{error}</p>}
      </section>

      {result && (
        <section style={cardStyle}>
          <h2 style={subtitleStyle}>Ingest Metrics</h2>
          <ul style={metricListStyle}>
            <li>
              <strong>{result.conversations.toLocaleString()}</strong>
              <span>Conversations stored</span>
            </li>
            <li>
              <strong>{result.messages.toLocaleString()}</strong>
              <span>Messages processed</span>
            </li>
            <li>
              <strong>{result.durationMs ? `${Math.round(result.durationMs / 1000)}s` : '—'}</strong>
              <span>Streaming time</span>
            </li>
          </ul>
        </section>
      )}
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  padding: '24px 0',
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
  lineHeight: 1.2,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6,
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(67,56,202,0.9)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600,
};

const metricListStyle: CSSProperties = {
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '16px',
  margin: 0,
  padding: 0,
};
