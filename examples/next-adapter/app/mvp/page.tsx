'use client';
import { useState, type CSSProperties } from 'react';

export default function MvpPage() {
  const [brief, setBrief] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!brief.trim() && !file) {
      setError('Provide a written brief or upload brief.json.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('brief', brief.trim());
      if (file) form.append('briefJson', file);
      const res = await fetch('/api/mvp/generate', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mvp-stub.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage('Generated MVP stub archive.');
    } catch (err: any) {
      setError(err?.message || 'Unable to generate MVP package.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>One-Shot MVP Generator</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.5 }}>
          Feed the generator a narrative brief and optional <code>brief.json</code> from the Workroom. The API responds with a ZIP
          containing architecture, routes, and data model stubs.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
        <label style={labelStyle}>
          Brief notes
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={6}
            placeholder="What should this MVP accomplish? Include guardrails and target personas."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <label style={labelStyle}>
          Attach brief.json (optional)
          <input
            type="file"
            accept="application/json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? 'Generating…' : 'Generate MVP ZIP'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      {message && <p style={{ color: 'rgba(20,120,40,0.8)' }}>{message}</p>}
    </main>
  );
}

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 };
const inputStyle: CSSProperties = { padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.15)' };
const buttonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(70,90,120,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};
