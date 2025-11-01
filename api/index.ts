import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHttpServer, type HttpServerInstance } from "../src/http.js";

let serverPromise: Promise<HttpServerInstance> | null = null;

async function getServer() {
  if (!serverPromise) {
    serverPromise = createHttpServer({ serveStatic: false });
  }
  return serverPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await getServer();

  if (
    req.headers.accept?.includes("text/event-stream") ||
    req.url?.startsWith("/mcp/sse") ||
    req.url?.startsWith("/api/logs/stream")
  ) {
    req.socket?.setTimeout?.(0);
    req.socket?.setNoDelay?.(true);
    req.socket?.setKeepAlive?.(true, 60_000);
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const done = (error?: unknown) => {
      if (settled) return;
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    res.once("finish", () => done());
    res.once("close", () => done());
    res.once("error", (error: unknown) => done(error));

    try {
      (server.app as unknown as {
        handle: (req: VercelRequest, res: VercelResponse, next: (error?: unknown) => void) => void;
      }).handle(req, res, done);
    } catch (error) {
      done(error);
    }
  });
}
