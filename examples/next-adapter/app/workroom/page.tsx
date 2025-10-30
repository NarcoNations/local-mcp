'use client';
import { useMemo, useState } from 'react';

type Lane = { id: string; title: string };
type Sticky = { id: string; lane: string; text: string };

const LANES: Lane[] = [
  { id: 'SB', title: 'Strategy Board' },
  { id: 'IL', title: 'Ideas Lab' },
  { id: 'PM', title: 'Product Management' },
  { id: 'FE', title: 'Front-End' },
  { id: 'BE', title: 'Back-End' },
  { id: 'DevOps', title: 'DevOps' },
  { id: 'Research', title: 'Research' },
  { id: 'Copy', title: 'Copy & Narrative' },
  { id: 'Ethics', title: 'Ethics & Review' }
];

export default function WorkroomPage() {
  const [stickies, setStickies] = useState<Record<string, Sticky[]>>(() => ({}));
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const lane of LANES) initial[lane.id] = '';
    return initial;
  });

  const totalNotes = useMemo(
    () => Object.values(stickies).reduce((sum, list) => sum + (list?.length || 0), 0),
    [stickies]
  );

  function addSticky(laneId: string) {
    const text = drafts[laneId]?.trim();
    if (!text) return;
    setStickies((prev) => {
      const next = { ...prev };
      const laneNotes = next[laneId] ? [...next[laneId]] : [];
      laneNotes.push({ id: `${laneId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, lane: laneId, text });
      next[laneId] = laneNotes;
      return next;
    });
    setDrafts((prev) => ({ ...prev, [laneId]: '' }));
  }

  function removeSticky(laneId: string, stickyId: string) {
    setStickies((prev) => {
      const next = { ...prev };
      next[laneId] = (next[laneId] || []).filter((s) => s.id !== stickyId);
      return next;
    });
  }

  function exportBoard() {
    const payload = {
      generatedAt: new Date().toISOString(),
      lanes: LANES.map((lane) => ({
        id: lane.id,
        title: lane.title,
        notes: (stickies[lane.id] || []).map((note) => note.text)
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brief.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Workroom — Whiteboard OS</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', maxWidth: 720 }}>
          Capture stickies across lanes (Strategy Board → Ethics) then export as <code>brief.json</code> for the MVP generator.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={exportBoard}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(0,0,0,0.85)',
              color: 'rgb(255,255,255)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Export board ({totalNotes} notes)
          </button>
          <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>Download and feed into /mvp.</span>
        </div>
      </header>
      <section
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}
      >
        {LANES.map((lane) => (
          <div
            key={lane.id}
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.96)',
              padding: '16px',
              display: 'grid',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>{lane.title}</strong>
              <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>{lane.id}</span>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <textarea
                value={drafts[lane.id]}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [lane.id]: e.target.value }))}
                rows={3}
                placeholder={`Add note for ${lane.title}`}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  background: 'rgba(255,255,255,0.9)',
                  resize: 'vertical'
                }}
              />
              <button
                type="button"
                onClick={() => addSticky(lane.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'rgb(255,255,255)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add sticky
              </button>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {(stickies[lane.id] || []).map((note) => (
                <div
                  key={note.id}
                  style={{
                    borderRadius: '10px',
                    padding: '10px',
                    background: 'rgba(255,240,200,0.8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{note.text}</span>
                  <button
                    type="button"
                    onClick={() => removeSticky(lane.id, note.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'rgba(0,0,0,0.6)',
                      cursor: 'pointer'
                    }}
                    aria-label="Remove sticky"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
