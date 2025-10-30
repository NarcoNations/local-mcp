'use client';
import { useState, type FormEvent } from 'react';

type ConvertResponse = {
  ok: boolean;
  slug: string;
  files: { path: string; bytes: number; contentType: string | null }[];
  storage?: { bucket: string; archivePath: string; manifestPath: string; knowledgeId: string } | null;
};

export default function IngestPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || !file.size) {
      setError('Choose a file to ingest.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ingest/convert', { method: 'POST', body: data });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as ConvertResponse;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Unable to ingest file');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Ingest — Markdown Convert</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', maxWidth: 640 }}>
          Stream a PDF or Markdown bundle to the md-convert service. We create a manifest, upload to Supabase
          (optional), and log Historian events.
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
          Upload file
          <input
            type="file"
            name="file"
            accept=".pdf,.md,.zip,.html,.txt"
            required
            style={{
              padding: '10px',
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
          {busy ? 'Converting…' : 'Convert & Ingest'}
        </button>
        {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
      </form>
      {result && (
        <section
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.96)',
            padding: 'clamp(16px, 4vw, 24px)',
            display: 'grid',
            gap: '12px'
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Result for slug “{result.slug}”</h2>
            <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>
              {result.files.length} files captured. Storage: {result.storage ? 'Supabase' : 'local only'}.
            </p>
          </header>
          <div
            style={{
              display: 'grid',
              gap: '8px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}
          >
            {result.files.map((file) => (
              <div
                key={file.path}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.02)'
                }}
              >
                <strong style={{ display: 'block', wordBreak: 'break-word' }}>{file.path}</strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                  {(file.bytes / 1024).toFixed(1)} KB · {file.contentType || 'unknown'}
                </span>
              </div>
            ))}
          </div>
          {result.storage && (
            <pre
              style={{
                margin: 0,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.05)',
                overflowX: 'auto',
                fontSize: '0.85rem'
              }}
            >
              {JSON.stringify(result.storage, null, 2)}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
