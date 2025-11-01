'use client';

import { useState } from 'react';

type PublishPackage = {
  id: string;
  slug: string;
  content_md: string | null;
  status: string;
  assets: any[];
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

interface Props {
  packages: PublishPackage[];
}

export default function PublishDashboard({ packages }: Props) {
  const [items, setItems] = useState(packages);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function approve(id: string) {
    setLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch('/api/mcp/narconations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to approve');
      }
      setItems((prev) => prev.map((pkg) => (pkg.id === id ? json.package : pkg)));
      setMessage('Package approved — ready for CMS fetch.');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Publish Packages</h1>
        <p style={{ color: '#4a5568' }}>
          Stage site-ready bundles for NarcoNations.com/.org. Approved bundles expose signed URLs for downstream CMS pulls.
        </p>
        {message && <span>{message}</span>}
      </header>

      <section style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {items.map((pkg) => (
            <article
              key={pkg.id}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: 12,
                padding: 16,
                background: pkg.status === 'approved' ? '#0f2418' : '#f8fafc',
                color: pkg.status === 'approved' ? '#c6f6d5' : '#1a202c',
                display: 'grid',
                gap: 8,
              }}
            >
              <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                <strong>{pkg.slug}</strong>
                <span style={{ fontSize: '0.85rem' }}>Status: {pkg.status}</span>
              </header>
              <span>Created: {new Date(pkg.created_at).toLocaleString()}</span>
              {pkg.approved_at && <span>Approved: {new Date(pkg.approved_at).toLocaleString()}</span>}
              {pkg.content_md && (
                <details>
                  <summary style={{ cursor: 'pointer' }}>Preview content</summary>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.85rem',
                      background: 'rgba(0,0,0,0.15)',
                      padding: 12,
                      borderRadius: 10,
                    }}
                  >
                    {pkg.content_md}
                  </pre>
                </details>
              )}
              {pkg.assets?.length > 0 && (
                <details>
                  <summary style={{ cursor: 'pointer' }}>Assets ({pkg.assets.length})</summary>
                  <ul style={{ paddingLeft: 18 }}>
                    {pkg.assets.map((asset, idx) => (
                      <li key={idx}>{asset}</li>
                    ))}
                  </ul>
                </details>
              )}
              {pkg.status !== 'approved' && (
                <button
                  onClick={() => approve(pkg.id)}
                  disabled={loadingId === pkg.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#101820',
                    color: '#f8fafc',
                    cursor: loadingId === pkg.id ? 'wait' : 'pointer',
                  }}
                >
                  {loadingId === pkg.id ? 'Approving…' : 'Approve'}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
