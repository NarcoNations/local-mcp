import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../public");

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

const statsPayload = {
  files: {
    "reports/counter-narcotics.md": { chunkIds: ["chunk-1"], type: "markdown" },
  },
  chunks: 3,
  embeddingsCached: 3,
  byType: { pdf: 0, markdown: 3, text: 0, word: 0, pages: 0 },
  lastIndexedAt: Date.now() - 10_000,
};

const baseLog = {
  id: randomUUID(),
  level: "info",
  message: "control-room-ready",
  time: new Date().toISOString(),
  details: { sessions: 0 },
};

app.get("/api/stats", (_req, res) => {
  res.json({ ok: true, data: statsPayload });
});

app.post("/api/search", (req, res) => {
  res.json({
    ok: true,
    data: {
      results: [
        {
          id: "chunk-1",
          score: 0.92,
          text: "Detailed findings about Antwerp operations and Rotterdam interdictions.",
          citation: {
            filePath: "reports/counter-narcotics.md",
            page: 2,
            snippet: "Task force intercepted maritime shipments entering Antwerp.",
          },
        },
      ],
    },
  });
});

app.post("/api/doc", (req, res) => {
  res.json({
    ok: true,
    data: {
      text: `Full dossier for ${req.body?.path ?? "unknown file"}. Detailed timeline and evidence tables included.`,
    },
  });
});

app.post("/api/reindex", (req, res) => {
  const paths = Array.isArray(req.body?.paths) ? req.body.paths : [];
  res.json({ ok: true, data: { indexed: 12, updated: paths.length || 1, skipped: 0 } });
});

app.post("/api/watch", (req, res) => {
  const paths = Array.isArray(req.body?.paths) && req.body.paths.length ? req.body.paths : ["./docs"];
  res.json({ ok: true, data: { watching: paths } });
});

app.post("/api/import", (_req, res) => {
  res.json({ ok: true, data: { filesWritten: 4, indexed: 9 } });
});

app.get("/api/logs", (_req, res) => {
  res.json({ ok: true, data: [baseLog] });
});

app.get("/api/logs/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  let counter = 0;
  const send = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };
  send(baseLog);
  const interval = setInterval(() => {
    counter += 1;
    send({
      id: randomUUID(),
      level: counter % 2 === 0 ? "info" : "warn",
      message: counter % 2 === 0 ? "watch-event" : "reindex-complete",
      time: new Date().toISOString(),
      details: { counter },
    });
  }, 500);
  req.on("close", () => {
    clearInterval(interval);
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, sessions: 0 });
});

const port = Number(process.env.PORT ?? 4173);
const server = app.listen(port, () => {
  console.log(`Mock control room server listening on ${port}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
