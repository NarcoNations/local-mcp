'use client';
import { useState, type CSSProperties } from 'react';

type IngestResult = {
  ok: boolean;
  slug: string;
  files: { path: string; size: number; content_type?: string | null }[];
  storage?: { bucket: string; zipKey: string; manKey: string; knowledgeId?: string } | null;
};

export default function IngestPage() {
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement | null;
    if (!fileInput?.files?.length) {
      setError('Please choose a file to ingest.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    try {
      const res = await fetch('/api/ingest/convert', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as IngestResult;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to ingest file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Document Ingest</h1>
        <p style={{ maxWidth: 640, lineHeight: 1.5 }}>
          Upload PDFs or Markdown to stream through md-convert. Outputs are zipped, archived, and stored as manifests ready for
          indexing.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
          Source file
          <input
            name="file"
            type="file"
            accept=".pdf,.md,.markdown,.txt,.docx"
            required
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)', width: '100%' }}
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
            background: 'linear-gradient(120deg, rgba(30,30,40,0.9), rgba(70,70,90,0.85))',
            color: 'white',
            cursor: busy ? 'wait' : 'pointer',
            minWidth: 160,
            fontWeight: 600
          }}
        >
          {busy ? 'Uploading…' : 'Convert & Archive'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      {result && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Conversion complete</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>
              <strong>Slug:</strong> {result.slug}
            </div>
            {result.storage && (
              <div style={{ display: 'grid', gap: 6, maxWidth: 480 }}>
                <strong>Storage</strong>
                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(result.storage, null, 2)}</code>
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
              <thead>
                <tr>
                  <th style={cellStyle}>File</th>
                  <th style={cellStyle}>Size</th>
                  <th style={cellStyle}>Type</th>
                </tr>
              </thead>
              <tbody>
                {result.files.map((file) => (
                  <tr key={file.path}>
                    <td style={cellStyle}>{file.path}</td>
                    <td style={cellStyle}>{formatBytes(file.size)}</td>
                    <td style={cellStyle}>{file.content_type || 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

const cellStyle: CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  borderBottom: '1px solid rgba(0,0,0,0.08)'
};

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = units.shift()!;
  while (size >= 1024 && units.length) {
    size /= 1024;
    unit = units.shift()!;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${unit}`;
}
