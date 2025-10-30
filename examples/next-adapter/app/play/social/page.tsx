'use client';
import { useState, type FormEvent } from 'react';

const templates = [
  { id: 'thumbnail', label: 'Thumbnail concept' },
  { id: 'short', label: 'Short-form script' },
  { id: 'post', label: 'Long-form post' }
];

export default function SocialPlayground() {
  const [template, setTemplate] = useState('thumbnail');
  const [prompt, setPrompt] = useState('Highlight VibeOS ingest → search in a punchy social drop.');
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(`Queued ${template} concept for future n8n workflow: ${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}`);
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Social Playground</h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'rgba(0,0,0,0.65)' }}>
          Choose a template, craft a brief, and we&apos;ll hook into n8n automation next. For now it echoes the queued payload.
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '12px',
          padding: 'clamp(16px, 4vw, 24px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Template
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)'
            }}
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Creative brief
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)',
              resize: 'vertical'
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(0,0,0,0.85)',
            color: 'rgb(255,255,255)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Simulate enqueue
        </button>
        {message && <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)' }}>{message}</p>}
      </form>
    </div>
  );
}
