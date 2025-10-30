import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export default async function TimelinePage() {
  const sb = sbServer();
  const { data } = await sb.from('events').select('*').order('ts', { ascending: false }).limit(50);
  return (
    <main style={{ padding: 24 }}>
      <h1>Historian — Recent Events</h1>
      <ul>
        {(data || []).map((e) => (
          <li key={e.id}>[{e.ts}] <strong>{e.kind}</strong> — {e.title}</li>
        ))}
      </ul>
    </main>
  );
}
