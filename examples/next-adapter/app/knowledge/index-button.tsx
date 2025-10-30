'use client';
import { useState } from 'react';

type Props = { slug: string; knowledgeId: string };

export function KnowledgeIndexButton({ slug, knowledgeId }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleClick() {
    try {
      setStatus('running');
      setMessage('');
      const res = await fetch('/api/knowledge/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, knowledge_id: knowledgeId })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setStatus('done');
      setMessage(`Indexed ${json.chunks} chunks`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Failed to index');
    }
  }

  const busy = status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        style={{
          padding: '10px 16px',
          borderRadius: '12px',
          border: 'none',
          background: busy ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
          color: 'rgb(255,255,255)',
          fontWeight: 600,
          cursor: busy ? 'progress' : 'pointer'
        }}
      >
        {busy ? 'Indexing…' : 'Index embeddings'}
      </button>
      {status !== 'idle' && message && (
        <span
          style={{
            fontSize: '0.85rem',
            color: status === 'error' ? 'rgb(180,0,0)' : 'rgba(0,0,0,0.65)'
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
