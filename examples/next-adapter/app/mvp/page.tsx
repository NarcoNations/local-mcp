'use client';
import { useRef, useState, type FormEvent } from 'react';

type Status = { loading: boolean; message: string | null; isError?: boolean };

export default function MvpPage() {
  const [briefText, setBriefText] = useState('');
  const [status, setStatus] = useState<Status>({ loading: false, message: null });
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ loading: true, message: null });
    try {
      const formData = new FormData();
      formData.append('briefText', briefText);
      const file = fileInput.current?.files?.[0];
      if (file) formData.append('briefFile', file);
      const res = await fetch('/api/mvp/generate', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vibeos-mvp.zip';
      link.click();
      URL.revokeObjectURL(url);
      setStatus({ loading: false, message: 'MVP pack generated — check your downloads.', isError: false });
    } catch (err: any) {
      setStatus({ loading: false, message: err?.message || 'Failed to generate MVP pack', isError: true });
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>One-Shot MVP Generator</h1>
        <p style={{ margin: 0, maxWidth: 720, color: 'rgba(0,0,0,0.65)' }}>
          Provide a narrative brief (and optional <code>brief.json</code> from Workroom). We return a stub ZIP containing
          ARCHITECTURE.md, ROUTES.md, and DATA_MODEL.md for quick kick-off.
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
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Brief text
          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={6}
            placeholder="Describe the product, audiences, and success metrics..."
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)',
              resize: 'vertical'
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Optional brief.json
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
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
          disabled={status.loading}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            background: status.loading ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
            color: 'rgb(255,255,255)',
            fontWeight: 600,
            cursor: status.loading ? 'progress' : 'pointer'
          }}
        >
          {status.loading ? 'Generating…' : 'Generate MVP pack'}
        </button>
        {status.message && (
          <p
            style={{
              margin: 0,
              color: status.isError ? 'rgb(180,0,0)' : 'rgba(0,0,0,0.65)'
            }}
          >
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}
