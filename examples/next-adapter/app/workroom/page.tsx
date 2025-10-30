'use client';

import { useMemo, useState } from 'react';

type LaneKey = 'SB' | 'IL' | 'PM' | 'FE' | 'BE' | 'DevOps' | 'Research' | 'Copy' | 'Ethics';

type Note = {
  id: string;
  text: string;
  lane: LaneKey;
  createdAt: string;
};

const laneLabels: Record<LaneKey, string> = {
  SB: 'Strategy Board',
  IL: 'Ideas Lab',
  PM: 'Product Management',
  FE: 'Frontend',
  BE: 'Backend',
  DevOps: 'DevOps',
  Research: 'Research',
  Copy: 'Copy/Brand',
  Ethics: 'Ethics'
};

const laneOrder: LaneKey[] = ['SB', 'IL', 'PM', 'FE', 'BE', 'DevOps', 'Research', 'Copy', 'Ethics'];

export default function WorkroomPage() {
  const [drafts, setDrafts] = useState<Record<LaneKey, string>>(() => {
    const base: Partial<Record<LaneKey, string>> = {};
    laneOrder.forEach((lane) => (base[lane] = ''));
    return base as Record<LaneKey, string>;
  });
  const [notes, setNotes] = useState<Note[]>([]);

  function addNote(lane: LaneKey) {
    const value = drafts[lane].trim();
    if (!value) return;
    setNotes((prev) => [
      ...prev,
      {
        id: `${lane}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lane,
        text: value,
        createdAt: new Date().toISOString()
      }
    ]);
    setDrafts((prev) => ({ ...prev, [lane]: '' }));
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  function exportBoard() {
    const payload = {
      generatedAt: new Date().toISOString(),
      notes: notes.map((note) => ({
        id: note.id,
        lane: note.lane,
        text: note.text,
        createdAt: note.createdAt
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

  const grouped = useMemo(() => {
    const map: Record<LaneKey, Note[]> = {
      SB: [],
      IL: [],
      PM: [],
      FE: [],
      BE: [],
      DevOps: [],
      Research: [],
      Copy: [],
      Ethics: []
    };
    for (const note of notes) {
      map[note.lane].push(note);
    }
    return map;
  }, [notes]);

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Workroom — Whiteboard OS</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          Organise stickies across the studio lanes. Export the board as <code>brief.json</code> and feed it into the One-Shot
          MVP generator.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={exportBoard}
            disabled={!notes.length}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'rgb(17, 17, 17)',
              color: 'rgb(255, 255, 255)',
              fontWeight: 600
            }}
          >
            Export brief.json
          </button>
          <span style={{ fontSize: 13, color: 'rgb(119, 119, 119)', alignSelf: 'center' }}>{notes.length} stickies</span>
        </div>
      </header>
      <section
        style={{
          display: 'grid',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 8
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: `repeat(${laneOrder.length}, minmax(220px, 1fr))`
          }}
        >
          {laneOrder.map((lane) => (
            <article
              key={lane}
              style={{
                display: 'grid',
                gap: 12,
                background: 'rgb(252, 252, 252)',
                border: '1px solid rgb(229, 229, 229)',
                borderRadius: 16,
                padding: '18px 20px',
                minHeight: 260
              }}
            >
              <header>
                <h2 style={{ margin: 0, fontSize: 18 }}>{laneLabels[lane]}</h2>
                <span style={{ fontSize: 12, color: 'rgb(119, 119, 119)' }}>{lane}</span>
              </header>
              <div style={{ display: 'grid', gap: 10 }}>
                {grouped[lane].map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'rgb(255, 251, 230)',
                      border: '1px solid rgb(247, 210, 106)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={() => removeNote(note.id)}
                      aria-label="Remove note"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'rgb(176, 0, 32)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{note.text}</p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addNote(lane);
                }}
                style={{ display: 'grid', gap: 8 }}
              >
                <textarea
                  value={drafts[lane]}
                  onChange={(event) => setDrafts((prev) => ({ ...prev, [lane]: event.target.value }))}
                  placeholder="Add sticky"
                  rows={3}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgb(215, 215, 215)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'rgb(10, 124, 45)',
                    color: 'rgb(255, 255, 255)',
                    fontWeight: 600,
                    justifySelf: 'flex-start'
                  }}
                >
                  Add sticky
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
