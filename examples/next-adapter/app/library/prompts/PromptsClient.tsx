'use client';

import { useMemo, useState } from 'react';
import type { PromptRecord } from './page';

export default function PromptsClient({ prompts }: { prompts: PromptRecord[] }) {
  const [selectedId, setSelectedId] = useState(prompts[0]?.id ?? '');
  const [llmResult, setLlmResult] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const selected = useMemo(() => prompts.find((p) => p.id === selectedId) ?? prompts[0], [selectedId, prompts]);

  async function testPrompt() {
    if (!selected) return;
    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: selected.task, prompt: selected.body, modelHint: 'local' })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setLlmResult(json.response?.output || JSON.stringify(json.response));
    } catch (err: any) {
      setLlmError(err?.message || 'Prompt test failed');
    } finally {
      setLlmLoading(false);
    }
  }

  if (!selected) {
    return (
      <main style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Prompt Library</h1>
        <p style={{ color: 'rgb(85, 85, 85)' }}>No prompts available — add records to the `prompts` table or use the fallback stubs.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Prompt Library</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          Curated prompts for the studio. Select a prompt to review the copy and test it via the local LLM router.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        <aside
          style={{
            display: 'grid',
            gap: 12,
            padding: '16px 18px',
            borderRadius: 16,
            border: '1px solid rgb(229, 229, 229)',
            background: 'rgb(252, 252, 252)'
          }}
        >
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => setSelectedId(prompt.id)}
              style={{
                textAlign: 'left',
                border: '1px solid ' + (prompt.id === selected.id ? 'rgb(10, 124, 45)' : 'rgb(215, 215, 215)'),
                background: prompt.id === selected.id ? 'rgb(233, 248, 240)' : 'rgb(255, 255, 255)',
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              <strong style={{ display: 'block', fontSize: 15 }}>{prompt.title}</strong>
              <span style={{ display: 'block', fontSize: 12, color: 'rgb(119, 119, 119)', marginTop: 4 }}>
                {prompt.tags.join(', ') || 'untagged'}
              </span>
            </button>
          ))}
        </aside>
        <article
          style={{
            display: 'grid',
            gap: 16,
            border: '1px solid rgb(229, 229, 229)',
            borderRadius: 16,
            padding: '20px 24px'
          }}
        >
          <header style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{selected.title}</h2>
            <span style={{ fontSize: 13, color: 'rgb(119, 119, 119)' }}>Task: {selected.task}</span>
          </header>
          <pre
            style={{
              background: 'rgb(17, 17, 17)',
              color: 'rgb(245, 245, 245)',
              padding: 16,
              borderRadius: 12,
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}
          >
            {selected.body}
          </pre>
          <button
            onClick={testPrompt}
            disabled={llmLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'rgb(17, 17, 17)',
              color: 'rgb(255, 255, 255)',
              fontWeight: 600,
              justifySelf: 'flex-start'
            }}
          >
            {llmLoading ? 'Testing…' : 'Test prompt'}
          </button>
          {llmError ? <p style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{llmError}</p> : null}
          {llmResult ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <strong style={{ fontSize: 13, color: 'rgb(10, 124, 45)' }}>LLM response</strong>
              <p style={{ margin: 0, background: 'rgb(255, 255, 255)', padding: 14, borderRadius: 12, lineHeight: 1.6 }}>{llmResult}</p>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
