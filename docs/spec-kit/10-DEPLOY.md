# 10 — Deploy & Ops

## Local
- `npm i && npm run dev` (stdio)
- `npm run http` (if split entry)

## Docker (optional)
- Small alpine image; mount `./data` for index.

## Vercel/Server
- Not primary target; only if HTTP bridge is needed.

## Observability
- Structured logs; minimal metrics; SSE heartbeat.
