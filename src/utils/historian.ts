import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface HistorianEvent {
  source: string;
  kind: string;
  title: string;
  status?: 'ok' | 'error' | 'warn';
  meta?: Record<string, unknown>;
}

const DEFAULT_PATH = path.resolve(process.cwd(), '.mcp-nn/historian-events.jsonl');

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function recordHistorianEvent(event: HistorianEvent) {
  try {
    const payload = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      source: event.source,
      kind: event.kind,
      title: event.title,
      status: event.status ?? 'ok',
      meta: event.meta ?? {},
    };
    const filePath = process.env.HISTORIAN_LOG_PATH ?? DEFAULT_PATH;
    await ensureDir(filePath);
    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (error) {
    console.warn('historian: failed to write event', error);
  }
}

