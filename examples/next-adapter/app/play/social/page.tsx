'use client';
import { useState, type CSSProperties } from 'react';

type Template = {
  id: string;
  label: string;
  description: string;
};

const templates: Template[] = [
  { id: 'thumbnail', label: 'Thumbnail', description: 'Landscape asset for highlight reels and showcases.' },
  { id: 'short', label: 'Short Clip', description: 'Vertical script for short-form updates.' },
  { id: 'post', label: 'Launch Post', description: 'Written copy for LinkedIn/Twitter rollouts.' }
];

export default function SocialPlayground() {
  const [selected, setSelected] = useState(templates[0].id);
  const [notes, setNotes] = useState('Focus on ingest → embeddings → search loop.');
  const [status, setStatus] = useState<string | null>(null);

  function enqueue() {
    setStatus(`Queued ${selected} concept for future n8n automation.`);
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Social Playground</h1>
        <p style={leadStyle}>
          Experiment with content templates. In the next phase, this will hand off to n8n flows for automated publishing.
        </p>
        <div style={templateGridStyle}>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelected(template.id)}
              style={{
                ...templateButtonStyle,
                background: selected === template.id ? 'rgba(37,99,235,0.12)' : 'rgba(248,250,252,0.9)'
              }}
            >
              <strong>{template.label}</strong>
              <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>{template.description}</span>
            </button>
          ))}
        </div>
        <label style={labelStyle}>
          Notes for creative brief
          <textarea value={notes} onChange={(event) => setNotes(event.currentTarget.value)} rows={4} style={textareaStyle} />
        </label>
        <button type="button" style={buttonStyle} onClick={enqueue}>
          Stub enqueue
        </button>
        {status && <p style={statusStyle}>{status}</p>}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
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

const templateGridStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
};

const templateButtonStyle: CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: '14px',
  padding: '16px',
  display: 'grid',
  gap: '6px',
  textAlign: 'left',
  cursor: 'pointer'
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
