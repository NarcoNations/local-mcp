import { logger } from "../utils/logger.js";

export interface HistorianEvent {
  source: string;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  severity?: "debug" | "info" | "warn" | "error";
  sessionId?: string;
  meta?: Record<string, unknown>;
  ts?: string;
}

export interface HistorianClientOptions {
  endpoint: string;
  token?: string;
  defaultSource?: string;
}

export class HistorianClient {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly defaultSource?: string;

  constructor(options: HistorianClientOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, "");
    this.token = options.token;
    this.defaultSource = options.defaultSource;
  }

  async capture(event: HistorianEvent): Promise<void> {
    const payload = {
      ...event,
      source: event.source || this.defaultSource || "mcp",
      severity: event.severity ?? "info",
      session_id: event.sessionId ?? null,
      meta: event.meta ?? {},
    };

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        logger.warn("historian-post-failed", {
          status: res.status,
          body: text.slice(0, 256),
        });
      }
    } catch (err) {
      logger.warn("historian-post-error", { err: String(err) });
    }
  }
}

export function createHistorianFromEnv(): HistorianClient | null {
  const endpoint =
    process.env.HISTORIAN_EVENT_URL || process.env.MCP_HISTORIAN_URL || "";
  if (!endpoint) return null;
  const token = process.env.HISTORIAN_EVENT_TOKEN || process.env.MCP_HISTORIAN_TOKEN;
  const defaultSource = process.env.HISTORIAN_DEFAULT_SOURCE;
  return new HistorianClient({ endpoint, token: token || undefined, defaultSource: defaultSource || undefined });
}
