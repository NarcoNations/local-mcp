export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Adapter Demo — Dashboard</h1>
      <p>UI reflects feature surface. Endpoints are being wired progressively.</p>
      <ul>
        <li>Ingest → <code>/api/ingest/convert</code> and <code>/api/ingest/chatgpt</code></li>
        <li>Historian timeline → <a href="/timeline">/timeline</a></li>
        <li>Workroom (Whiteboard OS) → <a href="/workroom">/workroom</a></li>
        <li>Prompt Library → <a href="/library/prompts">/library/prompts</a></li>
        <li>Research Engine → <a href="/research">/research</a></li>
        <li>Map Playground → <a href="/play/map">/play/map</a></li>
        <li>Social Playground → <a href="/play/social">/play/social</a></li>
        <li>API Manager → <a href="/api-manager">/api-manager</a></li>
        <li>Knowledge & Search → <a href="/knowledge">/knowledge</a>, <a href="/search">/search</a></li>
      </ul>
    </main>
  );
}
