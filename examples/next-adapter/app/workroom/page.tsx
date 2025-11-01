'use client';
import { useMemo, useState, type CSSProperties } from 'react';

type Lane = {
  id: string;
  title: string;
};

type Sticky = {
  id: string;
  lane: string;
  text: string;
};

const lanes: Lane[] = [
  { id: 'sb', title: 'Strategy Board' },
  { id: 'il', title: 'Ideas Lab' },
  { id: 'pm', title: 'Product / PM' },
  { id: 'fe', title: 'Frontend' },
  { id: 'be', title: 'Backend' },
  { id: 'devops', title: 'DevOps' },
  { id: 'research', title: 'Research' },
  { id: 'copy', title: 'Copy' },
  { id: 'ethics', title: 'Ethics' }
];

export default function WorkroomPage() {
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [selection, setSelection] = useState<string | null>(lanes[0]?.id ?? null);
  const [status, setStatus] = useState<string | null>(null);

  function addSticky(laneId: string) {
    setStickies((prev) => [
      ...prev,
      { id: `${laneId}-${Date.now()}`, lane: laneId, text: '' }
    ]);
    setSelection(laneId);
    setStatus(null);
  }

  function updateSticky(id: string, text: string) {
    setStickies((prev) => prev.map((sticky) => (sticky.id === id ? { ...sticky, text } : sticky)));
  }

  function removeSticky(id: string) {
    setStickies((prev) => prev.filter((sticky) => sticky.id !== id));
  }

  function exportBrief() {
    const payload = { generatedAt: new Date().toISOString(), stickies };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brief.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Exported brief.json');
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Sticky[]>();
    lanes.forEach((lane) => map.set(lane.id, []));
    for (const sticky of stickies) {
      if (!map.has(sticky.lane)) map.set(sticky.lane, []);
      map.get(sticky.lane)!.push(sticky);
    }
    return map;
  }, [stickies]);

  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0 }}>Workroom — Whiteboard OS</h1>
        <p style={leadStyle}>
          Capture cross-functional stickies, align briefs across departments, and export a snapshot for the One-Shot MVP
          generator.
        </p>
        <div style={actionRowStyle}>
          <select
            value={selection || ''}
            onChange={(event) => setSelection(event.currentTarget.value)}
            style={selectStyle}
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>
                {lane.title}
              </option>
            ))}
          </select>
          <button type="button" style={buttonStyle} onClick={() => selection && addSticky(selection)}>
            Add sticky to lane
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={exportBrief}>
            Export brief.json
          </button>
        </div>
        {status && <p style={statusStyle}>{status}</p>}
      </header>

      <section style={boardStyle}>
        {lanes.map((lane) => (
          <div key={lane.id} style={laneStyle}>
            <div style={laneHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{lane.title}</h2>
              <span style={laneCountStyle}>{grouped.get(lane.id)?.length || 0}</span>
            </div>
            <div style={stickyColumnStyle}>
              {(grouped.get(lane.id) || []).map((sticky) => (
                <div key={sticky.id} style={stickyCardStyle}>
                  <textarea
                    value={sticky.text}
                    onChange={(event) => updateSticky(sticky.id, event.currentTarget.value)}
                    placeholder="Add notes, tasks, or blockers"
                    rows={4}
                    style={textareaStyle}
                  />
                  <button type="button" onClick={() => removeSticky(sticky.id)} style={removeButtonStyle}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  padding: '24px 0'
};

const headerStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
};

const selectStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)'
};

const buttonStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'rgba(15,118,110,0.85)'
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(22,101,52,0.9)',
  fontWeight: 600
};

const boardStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  background: 'rgb(255,255,255)',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
  overflowX: 'auto'
};

const laneStyle: CSSProperties = {
  borderRadius: '16px',
  background: 'rgba(15,23,42,0.05)',
  padding: '16px',
  display: 'grid',
  gap: '12px'
};

const laneHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const laneCountStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.12)',
  borderRadius: '999px',
  padding: '2px 10px',
  fontSize: '0.75rem'
};

const stickyColumnStyle: CSSProperties = {
  display: 'grid',
  gap: '12px'
};

const stickyCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.9)',
  borderRadius: '12px',
  padding: '12px',
  boxShadow: '0 6px 16px rgba(15,23,42,0.1)',
  display: 'grid',
  gap: '8px'
};

const textareaStyle: CSSProperties = {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  padding: '10px',
  background: 'rgba(248,250,252,0.9)',
  resize: 'vertical'
};

const removeButtonStyle: CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: '8px',
  background: 'rgba(190,18,60,0.85)',
  color: 'white',
  cursor: 'pointer',
  justifySelf: 'flex-start'
};
