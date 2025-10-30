import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

type TimelineProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function TimelinePage({ searchParams = {} }: TimelineProps) {
  const limit = clampNumber(Number(getParam(searchParams, 'limit')) || 20, 5, 100);
  const offset = Math.max(Number(getParam(searchParams, 'offset')) || 0, 0);
  const kindFilter = getParam(searchParams, 'kind');
  const sourceFilter = getParam(searchParams, 'source');
  const qFilter = getParam(searchParams, 'q');

  if (!process.env.SUPABASE_URL) {
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Historian Timeline</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>
          Historian requires Supabase credentials. Add them to your environment to query events.
        </p>
      </div>
    );
  }

  let events: any[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const sb = sbServer();
    let query = sb
      .from('events')
      .select('*', { count: 'exact' })
      .order('ts', { ascending: false })
      .range(offset, offset + limit - 1);
    if (kindFilter) query = query.ilike('kind', `%${escapeLike(kindFilter)}%`);
    if (sourceFilter) query = query.ilike('source', `%${escapeLike(sourceFilter)}%`);
    if (qFilter) {
      const pattern = `%${escapeLike(qFilter)}%`;
      query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`);
    }
    const { data, count, error: queryError } = await query;
    if (queryError) error = queryError.message;
    events = data || [];
    total = count ?? events.length;
  } catch (err: any) {
    error = err?.message || 'Unable to load timeline';
  }

  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;
  const nextQuery = buildQuery({ limit, offset: offset + limit, kind: kindFilter, source: sourceFilter, q: qFilter });
  const prevQuery = buildQuery({ limit, offset: Math.max(offset - limit, 0), kind: kindFilter, source: sourceFilter, q: qFilter });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Historian Timeline</h1>
        <p style={{ margin: 0, maxWidth: 720, color: 'rgba(0,0,0,0.65)' }}>
          Filter by source or kind, search titles/bodies, and paginate through recorded events.
        </p>
      </header>
      <form
        method="get"
        style={{
          display: 'grid',
          gap: '12px',
          padding: 'clamp(16px, 4vw, 24px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <input type="hidden" name="limit" value={limit} />
        <div
          style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
          }}
        >
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Search
            <input
              type="text"
              name="q"
              defaultValue={qFilter || ''}
              placeholder="keywords"
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)'
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Kind
            <input
              type="text"
              name="kind"
              defaultValue={kindFilter || ''}
              placeholder="e.g. ingest.convert"
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)'
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
            Source
            <input
              type="text"
              name="source"
              defaultValue={sourceFilter || ''}
              placeholder="e.g. knowledge"
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.9)'
              }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(0,0,0,0.85)',
              color: 'rgb(255,255,255)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Apply filters
          </button>
          <a
            href="/timeline"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            Reset
          </a>
        </div>
      </form>
      {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
      <section style={{ display: 'grid', gap: '16px' }}>
        {events.map((event) => (
          <article
            key={event.id}
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.96)',
              padding: '20px',
              display: 'grid',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>{event.kind}</strong>
              <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                {new Date(event.ts).toLocaleString()} · {event.source}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.title}</p>
            {event.meta && (
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.05)',
                  fontSize: '0.85rem',
                  overflowX: 'auto'
                }}
              >
                {JSON.stringify(event.meta, null, 2)}
              </pre>
            )}
          </article>
        ))}
        {!events.length && !error && (
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>No events match the selected filters.</p>
        )}
      </section>
      <nav style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }} aria-label="Pagination">
        <a
          href={`?${prevQuery}`}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.2)',
            textDecoration: 'none',
            color: hasPrev ? 'inherit' : 'rgba(0,0,0,0.35)',
            pointerEvents: hasPrev ? 'auto' : 'none'
          }}
        >
          ← Previous
        </a>
        <span style={{ alignSelf: 'center', color: 'rgba(0,0,0,0.6)' }}>
          Showing {events.length} · Offset {offset}
        </span>
        <a
          href={`?${nextQuery}`}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.2)',
            textDecoration: 'none',
            color: hasNext ? 'inherit' : 'rgba(0,0,0,0.35)',
            pointerEvents: hasNext ? 'auto' : 'none'
          }}
        >
          Next →
        </a>
      </nav>
    </div>
  );
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function buildQuery(opts: { limit: number; offset: number; kind?: string; source?: string; q?: string }) {
  const params = new URLSearchParams();
  params.set('limit', String(opts.limit));
  params.set('offset', String(Math.max(opts.offset, 0)));
  if (opts.kind) params.set('kind', opts.kind);
  if (opts.source) params.set('source', opts.source);
  if (opts.q) params.set('q', opts.q);
  return params.toString();
}
