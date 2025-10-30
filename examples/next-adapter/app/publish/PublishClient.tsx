'use client';

import { useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function PublishClient({
  packages,
}: {
  packages: { id: string; content_md: string; assets: any[]; meta: any; approved: boolean; created_at: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  const approve = (id: string) => {
    startTransition(async () => {
      await fetch('/api/publish/approve', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ id }),
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
      {packages.map((pkg) => (
        <article
          key={pkg.id}
          style={{
            border: '1px solid var(--foreground-200,#e5e7eb)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--background-elevated, rgba(255,255,255,0.9))',
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong>{pkg.id}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground-500,#6b7280)' }}>
              {new Date(pkg.created_at).toLocaleString()}
            </span>
          </header>
          <pre
            style={{
              background: 'var(--foreground-50,#f9fafb)',
              padding: 12,
              borderRadius: 10,
              fontSize: '0.85rem',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {pkg.content_md}
          </pre>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Assets: {pkg.assets?.length ?? 0}</span>
            <span>Status: {pkg.approved ? 'Approved' : 'Pending'}</span>
          </div>
          {!pkg.approved && (
            <button
              type="button"
              onClick={() => approve(pkg.id)}
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
              {isPending ? 'Approving…' : 'Approve'}
            </button>
          )}
        </article>
      ))}
      {!packages.length && <p>No packages staged yet.</p>}
    </section>
  );
}
