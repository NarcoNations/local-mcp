'use client';

import { FormEvent, useRef, useState } from 'react';

export default function MvpPage() {
  const [brief, setBrief] = useState('Build a VibeOS knowledge console with ingest → embeddings → search.');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('brief', brief);
      const file = fileRef.current?.files?.[0];
      if (file) {
        fd.append('briefJson', file, file.name);
      }
      const res = await fetch('/api/mvp/generate', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vibeos-mvp.zip';
      link.click();
      URL.revokeObjectURL(url);
      setStatus('ZIP generated — check your downloads for vibeos-mvp.zip.');
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>One-Shot MVP Generator</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          Provide a product brief and optional <code>brief.json</code> export from the Workroom. The generator returns a ZIP with
          <code>ARCHITECTURE.md</code>, <code>ROUTES.md</code>, and <code>DATA_MODEL.md</code> scaffolds.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Brief</span>
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={6}
            required
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgb(215, 215, 215)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Attach brief.json (optional)</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)', background: 'rgb(250, 250, 250)' }}
          />
          <span style={{ fontSize: 12, color: 'rgb(119, 119, 119)' }}>Export from the Workroom → “Export brief.json”.</span>
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
            justifySelf: 'flex-start'
          }}
        >
          {isLoading ? 'Generating…' : 'Generate MVP ZIP'}
        </button>
      </form>
      {status ? <p style={{ color: 'rgb(10, 124, 45)', fontWeight: 600 }}>{status}</p> : null}
      {error ? <p role="alert" style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{error}</p> : null}
    </main>
  );
}
