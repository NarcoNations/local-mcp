import { sbMaybe } from '@/examples/next-adapter/lib/supabase/maybeServer';

export default async function TimelinePage() {
  const sb = sbMaybe();
  const data = sb
    ? (
        await sb
          .from('events')
          .select('*')
          .order('ts', { ascending: false })
          .limit(50)
      ).data
    : [];
  return (
    <main className="min-h-screen bg-[var(--surface-base,#050607)] text-[var(--text-primary,#f5f5f5)]">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Historian — Recent Events</h1>
          {!sb && (
            <p className="text-sm text-yellow-200/80">
              Supabase credentials missing. Showing empty timeline.
            </p>
          )}
        </header>
        <ul className="flex flex-col gap-3 text-sm text-[var(--text-subtle,#d4d4d8)]">
          {(data || []).map((event) => (
            <li key={event.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="text-xs text-[var(--text-muted,#a1a1aa)]">{event.ts}</p>
              <p className="text-sm font-semibold text-white">{event.kind}</p>
              <p className="text-sm">{event.title}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
