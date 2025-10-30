'use client';

import { FormEvent, useState } from 'react';

type CorpusResult = {
  ok: boolean;
  conversations: number;
  messages: number;
};

export default function CorpusIngestPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<CorpusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) {
      setError('Paste a public URL to a ChatGPT export JSON.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ingest/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'grid', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>ChatGPT Corpus Import</h1>
          <p style={{ marginTop: 8, color: 'rgb(85, 85, 85)', maxWidth: 540 }}>
            Stream large <code>conversations.json</code> exports directly from a URL. Messages are batch upserted into Supabase with
            Historian logging.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Export URL</span>
            <input
              type="url"
              name="fileUrl"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/conversations.json"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgb(215, 215, 215)',
                fontSize: 15
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: 999,
              border: 'none',
              background: 'rgb(17, 17, 17)',
              color: 'rgb(255, 255, 255)',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 160,
              justifySelf: 'flex-start'
            }}
          >
            {isLoading ? 'Importing…' : 'Import Export'}
          </button>
        </form>
        {error ? (
          <p role="alert" style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{error}</p>
        ) : null}
      </section>
      {result ? (
        <section
          style={{
            display: 'grid',
            gap: 12,
            background: 'rgb(17, 17, 17)',
            color: 'rgb(246, 246, 246)',
            borderRadius: 16,
            padding: '20px 24px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Ingest summary</h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              margin: 0
            }}
          >
            <div>
              <dt style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Conversations</dt>
              <dd style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>{result.conversations}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Messages</dt>
              <dd style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>{result.messages}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </main>
  );
}
