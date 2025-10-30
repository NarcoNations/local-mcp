'use client';
import { useState, type CSSProperties } from 'react';

export type PromptRecord = {
  id: string;
  title: string;
  body: string;
  description?: string | null;
};

type Props = {
  prompts: PromptRecord[];
};

type TestStatus = { state: 'idle' | 'running' | 'done' | 'error'; output?: string };

export function PromptLibrary({ prompts }: Props) {
  const [selected, setSelected] = useState(prompts[0]?.id ?? '');
  const [status, setStatus] = useState<TestStatus>({ state: 'idle' });

  const activePrompt = prompts.find((p) => p.id === selected) ?? prompts[0];

  async function runPrompt() {
    if (!activePrompt) return;
    setStatus({ state: 'running' });
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'draft_copy', prompt: activePrompt.body })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const output = json?.result?.output || 'No output received.';
      setStatus({ state: 'done', output });
    } catch (err: any) {
      setStatus({ state: 'error', output: err?.message || 'Prompt failed' });
    }
  }

  return (
    <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(240px, 280px) 1fr' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Library</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {prompts.map((prompt) => (
            <li key={prompt.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(prompt.id);
                  setStatus({ state: 'idle' });
                }}
                style={{
                  ...listButton,
                  background: prompt.id === activePrompt?.id ? 'rgba(30,40,60,0.12)' : 'transparent'
                }}
              >
                <span style={{ fontWeight: 600 }}>{prompt.title}</span>
                {prompt.description && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{prompt.description}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activePrompt ? (
          <article style={promptCard}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ margin: 0 }}>{activePrompt.title}</h2>
              {activePrompt.description && <p style={{ margin: 0, opacity: 0.7 }}>{activePrompt.description}</p>}
            </header>
            <pre style={promptBody}>{activePrompt.body}</pre>
            <button type="button" onClick={runPrompt} disabled={status.state === 'running'} style={testButton}>
              {status.state === 'running' ? 'Testing…' : 'Test via LLM router'}
            </button>
            {status.state !== 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong>Result</strong>
                <pre style={promptBody}>{status.output}</pre>
              </div>
            )}
          </article>
        ) : (
          <p style={{ opacity: 0.7 }}>No prompts available.</p>
        )}
      </div>
    </section>
  );
}

const listButton: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  textAlign: 'left',
  cursor: 'pointer'
};

const promptCard: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(20,20,30,0.04)',
  padding: '18px 20px'
};

const promptBody: CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(0,0,0,0.05)',
  whiteSpace: 'pre-wrap'
};

const testButton: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(70,90,120,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};
