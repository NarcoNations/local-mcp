'use client';

import { useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function PolicyClient({
  checks,
}: {
  checks: { id: string; action: string; scope: string; passed: boolean; reasons: string[]; content_preview: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  const rerun = (action: string, content: string) => {
    startTransition(async () => {
      await fetch('/api/policy/run', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ action, content, meta: { scope: action.split(':')[0] } }),
      });
    });
  };

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
        gap: 16,
      }}
    >
      {checks.map((check) => (
        <article
          key={check.id}
          style={{
            border: '1px solid var(--foreground-200,#e5e7eb)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--background-elevated, rgba(255,255,255,0.9))',
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong>{check.action}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground-500,#6b7280)' }}>{check.scope}</span>
          </header>
          <p style={{ fontSize: '0.9rem', color: 'var(--foreground-600,#4b5563)' }}>{check.content_preview}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {check.reasons.length ? (
              check.reasons.map((reason, idx) => (
                <span key={idx} style={{ fontSize: '0.85rem', color: 'var(--danger-600,#dc2626)' }}>
                  {reason}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--success-600,#059669)' }}>Passed</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => rerun(check.action, check.content_preview)}
            disabled={isPending}
            style={{
              marginTop: 'auto',
              padding: '8px 12px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--accent-600,#0ea5e9)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isPending ? 'Re-running…' : 'Re-run checks'}
          </button>
        </article>
      ))}
    </section>
  );
}
