'use client';
import { useState, type CSSProperties } from 'react';

const templates = [
  { id: 'thumbnail', label: 'YouTube Thumbnail' },
  { id: 'short', label: 'Vertical Short' },
  { id: 'post', label: 'Long-form Post' }
];

type TemplateId = (typeof templates)[number]['id'];

export default function SocialPlayground() {
  const [template, setTemplate] = useState<TemplateId>('thumbnail');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'queued'>('idle');

  function submit() {
    setStatus('queued');
    setTimeout(() => setStatus('idle'), 800);
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Social Playground</h1>
        <p style={{ maxWidth: 720, lineHeight: 1.5 }}>
          Select a content template and prep copy/notes. Submission will eventually enqueue an automation via n8n.
        </p>
      </header>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        <label style={labelStyle}>
          Template
          <select value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)} style={inputStyle}>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Notes for creative
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key messages, CTA, tone, platform tweaks."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <button type="button" onClick={submit} style={buttonStyle}>
          {status === 'queued' ? 'Queued for automation…' : 'Prep asset brief'}
        </button>
      </section>
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
