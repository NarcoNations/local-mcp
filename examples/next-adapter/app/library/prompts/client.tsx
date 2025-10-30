'use client';
import { useState } from 'react';

export type PromptRecord = {
  id: string;
  title: string;
  body: string;
  description?: string | null;
  tags?: string[] | null;
  task?: string;
};

export function PromptsClient({ prompts }: { prompts: PromptRecord[] }) {
  const [selectedId, setSelectedId] = useState(prompts[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const selected = prompts.find((p) => p.id === selectedId) || prompts[0];

  async function runPrompt() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: selected.task || 'draft_copy', prompt: selected.body, modelHint: 'local' })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'LLM test failed');
      setResult(json.output || '');
    } catch (err: any) {
      setError(err?.message || 'LLM test failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <aside
        style={{
          flex: '1 1 220px',
          maxWidth: '280px',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)',
          padding: '16px',
          display: 'grid',
          gap: '8px',
          height: 'fit-content'
        }}
      >
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => setSelectedId(prompt.id)}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.12)',
              background: prompt.id === selected?.id ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.9)',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>{prompt.title}</strong>
            {prompt.description && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)' }}>{prompt.description}</span>
            )}
          </button>
        ))}
      </aside>
      {selected && (
        <section
          style={{
            flex: '3 1 320px',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.96)',
            padding: '20px',
            display: 'grid',
            gap: '12px'
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0 }}>{selected.title}</h2>
            {selected.tags && selected.tags.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)' }}>Tags: {selected.tags.join(', ')}</span>
            )}
          </header>
          <pre
            style={{
              margin: 0,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.04)',
              overflowX: 'auto',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}
          >
            {selected.body}
          </pre>
          <button
            type="button"
            onClick={runPrompt}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
              color: 'rgb(255,255,255)',
              fontWeight: 600,
              cursor: loading ? 'progress' : 'pointer',
              justifySelf: 'flex-start'
            }}
          >
            {loading ? 'Testing…' : 'Test prompt'}
          </button>
          {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
          {result && (
            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>LLM Output</span>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(0,0,0,0.03)' 
                }}
              >
                {result}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
