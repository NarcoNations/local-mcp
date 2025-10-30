'use client';

import { FormEvent, useState } from 'react';

const templates = [
  { id: 'thumbnail', label: 'Thumbnail', description: 'Square image with punchy headline + CTA.' },
  { id: 'short', label: 'Short-form', description: '30-second script for social video.' },
  { id: 'post', label: 'Long post', description: 'Thread / LinkedIn-ready outline.' }
];

export default function SocialPlayground() {
  const [template, setTemplate] = useState(templates[0].id);
  const [idea, setIdea] = useState('Announce the ingest → embeddings → search flow for VibeOS.');
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(`Queued ${template} concept for n8n hand-off (stub). Idea: ${idea.slice(0, 80)}${idea.length > 80 ? '…' : ''}`);
  }

  const activeTemplate = templates.find((tpl) => tpl.id === template) ?? templates[0];

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Social Playground</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 640 }}>
          Shape campaign assets before wiring them into automation. Pick a template, outline the idea, and queue it for the future
          n8n workflow.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Template</span>
          <select
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'rgb(119, 119, 119)' }}>{activeTemplate.description}</p>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Concept</span>
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={4}
            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgb(215, 215, 215)', fontFamily: 'inherit' }}
          />
        </label>
        <button
          type="submit"
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
          Queue (stub)
        </button>
      </form>
      {status ? <p style={{ color: 'rgb(10, 124, 45)', fontWeight: 600 }}>{status}</p> : null}
    </main>
  );
}
