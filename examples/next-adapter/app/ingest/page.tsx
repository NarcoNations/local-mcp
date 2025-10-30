'use client';

import { FormEvent, useState } from 'react';

type IngestResult = {
  ok: boolean;
  slug: string;
  files: { path: string; bytes?: number; size?: number }[];
  manifest?: any;
  storage?: any;
};

export default function IngestPage() {
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError('Choose a file to ingest.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/ingest/convert', { method: 'POST', body: fd });
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
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'grid', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Ingest — Markdown Convert</h1>
          <p style={{ marginTop: 8, color: 'rgb(85, 85, 85)', maxWidth: 520 }}>
            Upload PDFs, Markdown, or HTML. The adapter streams the file to <code>md-convert</code>, stores the archive in Supabase,
            and logs the Historian event.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, alignItems: 'flex-start' }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Source file</span>
            <input
              type="file"
              name="file"
              accept=".pdf,.md,.markdown,.html,.txt,.docx,.zip"
              style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid rgb(215, 215, 215)',
                background: 'rgb(250, 250, 250)'
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
              minWidth: 140,
              transition: 'opacity 0.2s ease'
            }}
          >
            {isLoading ? 'Uploading…' : 'Run Convert'}
          </button>
        </form>
        {error ? (
          <p role="alert" style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>
            {error}
          </p>
        ) : null}
      </section>
      {result ? (
        <section style={{ display: 'grid', gap: 16 }}>
          <header style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Result</h2>
            <span style={{ color: 'rgb(85, 85, 85)' }}>slug: {result.slug}</span>
          </header>
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid rgb(229, 229, 229)',
              borderRadius: 12,
              background: 'rgb(252, 252, 252)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: 'rgb(241, 241, 241)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgb(224, 224, 224)' }}>Path</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgb(224, 224, 224)' }}>Bytes</th>
                </tr>
              </thead>
              <tbody>
                {result.files?.map((file) => (
                  <tr key={file.path}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgb(240, 240, 240)', wordBreak: 'break-all' }}>{file.path}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgb(240, 240, 240)' }}>
                      {formatBytes(file.bytes ?? (file as any).size ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details style={{ fontSize: 13 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Manifest preview</summary>
            <pre
              style={{
                marginTop: 12,
                padding: 16,
                borderRadius: 12,
                background: 'rgb(17, 17, 17)',
                color: 'rgb(245, 245, 245)',
                overflowX: 'auto'
              }}
            >
              {JSON.stringify(result.manifest, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}
    </main>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
