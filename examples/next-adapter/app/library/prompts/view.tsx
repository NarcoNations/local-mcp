'use client';
import { useMemo, useState, type CSSProperties } from 'react';
import type { PromptEntry } from '@/examples/next-adapter/data/prompts';

type Props = {
  prompts: PromptEntry[];
};

export default function PromptLibraryClient({ prompts }: Props) {
  const [selectedId, setSelectedId] = useState(prompts[0]?.id ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = useMemo(() => prompts.find((p) => p.id === selectedId), [prompts, selectedId]);

  async function testPrompt() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'draft_copy', prompt: selected.template, modelHint: 'local' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.result?.error || json.error || 'LLM probe failed');
      setPreview(json.result?.output || 'No output returned.');
    } catch (err: any) {
      setError(err?.message || 'Prompt test failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={libraryStyle}>
        <aside style={listStyle}>
          <h1 style={{ margin: '0 0 12px 0' }}>Prompt Library</h1>
          <ul style={listInnerStyle}>
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(prompt.id)}
                  style={{
                    ...listButtonStyle,
                    background: selectedId === prompt.id ? 'rgba(37,99,235,0.12)' : 'transparent'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{prompt.title}</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>{prompt.persona}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <article style={detailStyle}>
          {selected ? (
            <div style={detailContentStyle}>
              <header>
                <h2 style={{ margin: '0 0 8px 0' }}>{selected.title}</h2>
                <p style={metaStyle}>
                  Persona: {selected.persona} · Goal: {selected.goal}
                </p>
                <p style={metaStyle}>Tags: {selected.tags.join(', ')}</p>
              </header>
              <pre style={promptStyle}>{selected.template}</pre>
              <button type="button" style={buttonStyle} onClick={testPrompt} disabled={loading}>
                {loading ? 'Testing…' : 'Test with LLM router'}
              </button>
              {error && <p style={errorStyle}>{error}</p>}
              {preview && (
                <div style={previewStyle}>
                  <h3 style={{ margin: '0 0 8px 0' }}>Preview output</h3>
                  <pre style={promptStyle}>{preview}</pre>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0 }}>Select a prompt to view details.</p>
          )}
        </article>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  padding: '24px 0'
};

const libraryStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  gridTemplateColumns: 'minmax(220px, 320px) 1fr',
  background: 'rgb(255,255,255)',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)'
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  borderRight: '1px solid rgba(15,23,42,0.1)',
  paddingRight: '16px'
};

const listInnerStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '8px'
};

const listButtonStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: '12px',
  padding: '12px',
  textAlign: 'left',
  display: 'grid',
  gap: '4px',
  cursor: 'pointer',
  background: 'transparent'
};

const detailStyle: CSSProperties = {
  display: 'grid'
};

const detailContentStyle: CSSProperties = {
  display: 'grid',
  gap: '16px'
};

const promptStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.07)',
  borderRadius: '12px',
  padding: '16px',
  margin: 0,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5
};

const buttonStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  width: 'fit-content'
};

const metaStyle: CSSProperties = {
  margin: '0 0 4px 0',
  color: 'rgba(0,0,0,0.6)',
  fontSize: '0.9rem'
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};

const previewStyle: CSSProperties = {
  display: 'grid',
  gap: '8px'
};
