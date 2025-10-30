'use client';
import { useMemo, useState, type CSSProperties } from 'react';

type LaneKey =
  | 'Strategy Board'
  | 'Ideas Lab'
  | 'Product Management'
  | 'Front-End'
  | 'Back-End'
  | 'DevOps'
  | 'Research'
  | 'Copy'
  | 'Ethics';

type Sticky = { id: string; text: string; created_at: string };

type LaneState = Record<LaneKey, Sticky[]>;

const laneOrder: LaneKey[] = [
  'Strategy Board',
  'Ideas Lab',
  'Product Management',
  'Front-End',
  'Back-End',
  'DevOps',
  'Research',
  'Copy',
  'Ethics'
];

export default function WorkroomPage() {
  const initial = useMemo(() => {
    const lanes: Partial<LaneState> = {};
    for (const lane of laneOrder) lanes[lane] = [];
    return lanes as LaneState;
  }, []);
  const [lanes, setLanes] = useState<LaneState>(initial);
  const [drafts, setDrafts] = useState<Record<LaneKey, string>>(() => {
    const map: Partial<Record<LaneKey, string>> = {};
    for (const lane of laneOrder) map[lane] = '';
    return map as Record<LaneKey, string>;
  });

  function addSticky(lane: LaneKey) {
    const text = drafts[lane]?.trim();
    if (!text) return;
    setLanes((prev) => ({
      ...prev,
      [lane]: [...prev[lane], { id: crypto.randomUUID(), text, created_at: new Date().toISOString() }]
    }));
    setDrafts((prev) => ({ ...prev, [lane]: '' }));
  }

  function removeSticky(lane: LaneKey, id: string) {
    setLanes((prev) => ({
      ...prev,
      [lane]: prev[lane].filter((sticky) => sticky.id !== id)
    }));
  }

  function exportJson() {
    const payload = {
      generated_at: new Date().toISOString(),
      lanes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brief.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Workroom — Whiteboard OS</h1>
        <p style={{ maxWidth: 780, lineHeight: 1.5 }}>
          Draft briefs collaboratively across studio lanes. Export stickies as <code>brief.json</code> to feed the One-Shot MVP
          generator.
        </p>
        <button type="button" onClick={exportJson} style={exportButton}>
          Export stickies → brief.json
        </button>
      </header>
      <section style={{ overflowX: 'auto', paddingBottom: 12 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(240px, 1fr)',
            minHeight: 420
          }}
        >
          {laneOrder.map((lane) => (
            <article key={lane} style={laneStyle}>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ fontSize: '1rem' }}>{lane}</strong>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{lanes[lane].length} stickies</span>
              </header>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                {lanes[lane].map((sticky) => (
                  <div key={sticky.id} style={stickyStyle}>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>{sticky.text}</p>
                    <button
                      type="button"
                      onClick={() => removeSticky(lane, sticky.id)}
                      style={{
                        alignSelf: 'flex-end',
                        border: 'none',
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: 999,
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  value={drafts[lane]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [lane]: e.target.value }))}
                  placeholder="Add sticky"
                  rows={3}
                  style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.15)', resize: 'vertical' }}
                />
                <button type="button" onClick={() => addSticky(lane)} style={addButton}>
                  Add sticky
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const laneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px',
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(255,255,255,0.75)',
  minHeight: 360
};

const stickyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(255,230,150,0.55)',
  border: '1px solid rgba(0,0,0,0.08)'
};

const addButton: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '8px 14px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(40,40,60,0.9), rgba(90,90,130,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};

const exportButton: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(50,50,70,0.9), rgba(100,100,140,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};
