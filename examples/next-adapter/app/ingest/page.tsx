'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';

interface ConvertResponse {
  ok: boolean;
  slug: string;
  files: { path: string; bytes?: number; contentType?: string }[];
  manifest?: { totalBytes?: number; fileCount?: number };
  storage?: { bucket: string; zipKey: string; manifestKey: string; knowledgeId?: string } | null;
}

export default function IngestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ConvertResponse | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError('Select a PDF or ZIP export to ingest.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setStatus('Uploading to md-convert …');
    setResponse(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/ingest/convert', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const json = (await res.json()) as ConvertResponse;
      setResponse(json);
      setStatus(`Processed ${json.files.length} files.`);
    } catch (err: any) {
      setError(err?.message || 'Ingest failed');
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Markdown Convert Ingest</h1>
        <p style={leadStyle}>
          Upload a PDF or document bundle. We stream it through the md-convert service, archive the ZIP, and optionally stage it
          in Supabase for indexing.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            <span>Choose file</span>
            <input
              type="file"
              name="file"
              onChange={(event) => {
                const nextFile = event.currentTarget.files?.[0] || null;
                setFile(nextFile);
                setResponse(null);
                setStatus(null);
                setError(null);
              }}
              style={inputStyle}
              accept=".pdf,.zip,.doc,.docx,.md,.txt"
            />
          </label>
          <button type="submit" disabled={!file || isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Processing…' : 'Convert & Stage'}
          </button>
        </form>
        {status && <p style={statusStyle}>{status}</p>}
        {error && <p style={errorStyle}>{error}</p>}
      </section>

      {response && (
        <section style={cardStyle}>
          <h2 style={subtitleStyle}>Ingest Summary</h2>
          <dl style={definitionListStyle}>
            <div style={definitionRowStyle}>
              <dt>Slug</dt>
              <dd>{response.slug}</dd>
            </div>
            {response.manifest?.totalBytes ? (
              <div style={definitionRowStyle}>
                <dt>Archive Size</dt>
                <dd>{formatBytes(response.manifest.totalBytes)}</dd>
              </div>
            ) : null}
            {response.storage?.knowledgeId ? (
              <div style={definitionRowStyle}>
                <dt>Knowledge ID</dt>
                <dd>{response.storage.knowledgeId}</dd>
              </div>
            ) : null}
          </dl>
          <h3 style={subtitleStyle}>Files</h3>
          <ul style={fileListStyle}>
            {response.files.map((file) => (
              <li key={file.path} style={fileItemStyle}>
                <span style={{ fontWeight: 600 }}>{file.path}</span>
                <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                  {file.contentType || 'unknown'} · {file.bytes ? formatBytes(file.bytes) : 'size pending'}
                </span>
              </li>
            ))}
          </ul>
          {response.storage && (
            <div style={storageBoxStyle}>
              <p style={{ margin: 0 }}>Stored in bucket <strong>{response.storage.bucket}</strong></p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(0,0,0,0.65)' }}>
                Archive: {response.storage.zipKey}
                <br />
                Manifest: {response.storage.manifestKey}
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  alignItems: 'start',
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
  margin: '0 0 8px 0',
  fontSize: '1.1rem',
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
  alignItems: 'flex-start',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(15,23,42,0.9)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(15,118,110,0.9)',
  fontWeight: 600,
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600,
};

const definitionListStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
  margin: 0,
};

const definitionRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(15,23,42,0.04)',
};

const fileListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const fileItemStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(15,23,42,0.05)',
};

const storageBoxStyle: CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  background: 'rgba(59,130,246,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
