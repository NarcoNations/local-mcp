import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import Link from 'next/link';

const PAGE_SIZE = 20;

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function TimelinePage({ searchParams }: { searchParams: SearchParams }) {
  try {
    const { events, total } = await loadEvents(searchParams);
    return (
      <main style={{ display: 'grid', gap: 24 }}>
        <header style={{ display: 'grid', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 30 }}>Historian Timeline</h1>
          <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
            Filter by source, kind, or search term. Paginated at {PAGE_SIZE} events per page. Events are stored in Supabase via
            the <code>events</code> table.
          </p>
        </header>
        <Filters searchParams={searchParams} total={total} />
        <TimelineList events={events} />
        <Pagination searchParams={searchParams} total={total} />
      </main>
    );
  } catch (err: any) {
    return (
      <main style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Historian Timeline</h1>
        <p style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>Unable to load events — configure Supabase credentials to continue.</p>
      </main>
    );
  }
}

async function loadEvents(searchParams: SearchParams) {
  const sb = sbServer();
  const sourceFilter = getParam(searchParams, 'source');
  const kindFilter = getParam(searchParams, 'kind');
  const queryFilter = getParam(searchParams, 'q');
  const page = Math.max(parseInt(getParam(searchParams, 'page') || '1', 10) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = sb
    .from('events')
    .select('*', { count: 'exact' })
    .order('ts', { ascending: false })
    .range(from, to);
  if (sourceFilter) query = query.ilike('source', `%${sourceFilter}%`);
  if (kindFilter) query = query.ilike('kind', `%${kindFilter}%`);
  if (queryFilter) query = query.ilike('title', `%${queryFilter}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { events: data || [], total: count || 0 };
}

function getParam(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function Filters({ searchParams, total }: { searchParams: SearchParams; total: number }) {
  const source = getParam(searchParams, 'source');
  const kind = getParam(searchParams, 'kind');
  const q = getParam(searchParams, 'q');
  return (
    <form method="get" style={{ display: 'grid', gap: 12, border: '1px solid rgb(229, 229, 229)', borderRadius: 16, padding: '20px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Source</span>
          <input
            type="text"
            name="source"
            defaultValue={source}
            placeholder="ingest"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Kind contains</span>
          <input
            type="text"
            name="kind"
            defaultValue={kind}
            placeholder="search.query"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4, flex: '1 1 220px' }}>
          <span style={{ fontWeight: 600 }}>Search title</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="convert"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
          />
        </label>
        <div style={{ alignSelf: 'end', display: 'flex', gap: 12 }}>
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'rgb(17, 17, 17)',
              color: 'rgb(255, 255, 255)',
              fontWeight: 600
            }}
          >
            Apply filters
          </button>
          <Link
            href="/timeline"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgb(215, 215, 215)',
              textDecoration: 'none',
              color: 'rgb(51, 51, 51)'
            }}
          >
            Reset
          </Link>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'rgb(119, 119, 119)' }}>{total} events recorded</p>
    </form>
  );
}

function TimelineList({ events }: { events: any[] }) {
  if (!events.length) {
    return <p style={{ color: 'rgb(119, 119, 119)' }}>No events match the current filters.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
      {events.map((event) => (
        <li
          key={event.id}
          style={{
            border: '1px solid rgb(229, 229, 229)',
            borderRadius: 16,
            padding: '16px 18px',
            display: 'grid',
            gap: 6,
            background: 'rgb(252, 252, 252)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
            <strong style={{ fontSize: 14, color: 'rgb(10, 124, 45)' }}>{event.kind}</strong>
            <span style={{ fontSize: 12, color: 'rgb(119, 119, 119)' }}>{event.source}</span>
            <span style={{ fontSize: 12, color: 'rgb(153, 153, 153)' }}>{new Date(event.ts).toLocaleString()}</span>
          </div>
          <p style={{ margin: 0, fontSize: 15 }}>{event.title}</p>
          {event.body ? <p style={{ margin: 0, fontSize: 13, color: 'rgb(85, 85, 85)' }}>{event.body}</p> : null}
          {event.meta ? (
            <pre
              style={{
                margin: 0,
                marginTop: 8,
                background: 'rgb(17, 17, 17)',
                color: 'rgb(245, 245, 245)',
                padding: 12,
                borderRadius: 12,
                fontSize: 12,
                overflowX: 'auto'
              }}
            >
              {JSON.stringify(event.meta, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Pagination({ searchParams, total }: { searchParams: SearchParams; total: number }) {
  const current = Math.max(parseInt(getParam(searchParams, 'page') || '1', 10) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const params = new URLSearchParams();
  for (const key of ['source', 'kind', 'q']) {
    const value = getParam(searchParams, key);
    if (value) params.set(key, value);
  }

  return (
    <nav style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-start' }} aria-label="Pagination">
      <span style={{ fontSize: 13, color: 'rgb(85, 85, 85)' }}>
        Page {current} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <PaginationLink params={params} page={current - 1} disabled={current <= 1}>
          Previous
        </PaginationLink>
        <PaginationLink params={params} page={current + 1} disabled={current >= totalPages}>
          Next
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({ params, page, disabled, children }: { params: URLSearchParams; page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span
        style={{
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px solid rgb(229, 229, 229)',
          color: 'rgb(153, 153, 153)'
        }}
      >
        {children}
      </span>
    );
  }
  const nextParams = new URLSearchParams(params);
  nextParams.set('page', String(page));
  return (
    <Link
      href={`/timeline?${nextParams.toString()}`}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid rgb(215, 215, 215)',
        textDecoration: 'none',
        color: 'rgb(51, 51, 51)'
      }}
    >
      {children}
    </Link>
  );
}
