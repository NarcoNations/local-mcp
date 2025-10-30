# VibeOS Ultimate Dashboard — Next.js Adapter

Cinematic VibeOS control center built with **Next.js 14**, **Tailwind CSS**, and **Framer Motion**. The adapter ships a responsive shell (sidebar + command bar), dashboard widgets, operational forms, and stubs for every major Narco Noir surface.

## Quickstart

```bash
cd examples/next-adapter
npm install
npm run dev
# visit http://localhost:3000
```

Environment flags:

- `NEXT_PUBLIC_USE_MOCKS` — defaults to `true`; set to `false` to hit the provided API stubs.
- `VERCEL_URL` / `NEXT_PUBLIC_APP_URL` — optional base URL override for server-side fetches.

## Keyboard + Theme Controls

| Shortcut | Action |
| --- | --- |
| `⌘ + K` / `Ctrl + K` | Open command palette |
| `/` | Focus global search |
| `t` | Toggle Narco Noir ↔ VibeLabz Clean theme |

Theme preference persists in `localStorage` and applies via `<html class="theme-dark|theme-light">`.

## Feature Surfaces

- **Dashboard** — quick actions, Historian stream, ingest status, knowledge, search, API probes, workroom/MVP/Playground tiles.
- **Ingest / Corpus / Knowledge / Search / Timeline / API Manager** — fully wired forms with loading + toast feedback and mock-aware data clients.
- **Workroom** — draggable stickies lanes with JSON export.
- **MVP** — textarea + `brief.json` upload feeding the MVP generator stub.
- **Prompt Library** — browse/run prompts with placeholder linter hook.
- **Research** — structured facts/insights/sources response.
- **Playgrounds** — MapLibre placeholder + Social template enqueuer.

All API routes live under `app/api/*` and return typed mock data so the UI never crashes while real services come online.

## Testing

```bash
npm test
```

Vitest smoke tests ensure the dashboard renders core widgets and the command palette lists actions.

## Screenshots

Screenshots are generated under `public/_checks/`:

- Desktop dashboard: `public/_checks/dashboard-desktop.png`
- Mobile dashboard: `public/_checks/dashboard-mobile.png`
- Desktop timeline: `public/_checks/timeline-desktop.png`
- Mobile timeline: `public/_checks/timeline-mobile.png`

Regenerate them after significant UI adjustments to keep documentation in sync.
