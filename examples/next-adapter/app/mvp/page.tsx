'use client';
import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';

type GeneratorResponse = {
  ok?: boolean;
  durationMs?: number;
};

export default function MvpPage() {
  const [brief, setBrief] = useState('Build a local-first research assistant that stitches ingest → embeddings → insights.');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const form = new FormData();
      form.append('brief', brief);
      if (file) form.append('briefJson', file);
      const res = await fetch('/api/mvp/generate', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mvp-blueprint.zip';
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Blueprint downloaded. Check your downloads folder.');
    } catch (err: any) {
      setError(err?.message || 'MVP generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.currentTarget.files?.[0] || null;
    setFile(next);
    if (next) {
      try {
        const text = await next.text();
        const json = JSON.parse(text);
        if (Array.isArray(json?.stickies) && json.stickies.length > 0) {
          setStatus(`Imported ${json.stickies.length} stickies from brief.json`);
        }
      } catch (err) {
        setStatus('Attached brief.json (unable to parse preview)');
      }
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>One-Shot MVP Generator</h1>
        <p style={leadStyle}>
          Provide a written brief and optional Workroom export. We return a zip containing ARCHITECTURE.md, ROUTES.md, and
          DATA_MODEL.md ready for iteration.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Brief
            <textarea value={brief} onChange={(event) => setBrief(event.currentTarget.value)} rows={6} style={textareaStyle} />
          </label>
          <label style={labelStyle}>
            Attach brief.json (optional)
            <input type="file" accept="application/json" onChange={handleFile} style={inputStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Generating…' : 'Generate blueprint'}
          </button>
        </form>
        {status && <p style={statusStyle}>{status}</p>}
        {error && <p style={errorStyle}>{error}</p>}
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
  display: 'grid',
  gap: '16px'
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '16px'
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  fontWeight: 600
};

const textareaStyle: CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  padding: '12px',
  background: 'rgba(248,250,252,0.9)',
  resize: 'vertical'
};

const inputStyle: CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  padding: '10px',
  background: 'rgba(248,250,252,0.9)'
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

const statusStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(22,101,52,0.9)',
  fontWeight: 600
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};
