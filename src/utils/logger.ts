export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogRecord extends Record<string, unknown> {
  level: LogLevel;
  msg: string;
  time: string;
  pid: number;
}

export type LogSubscriber = (record: LogRecord) => void;

const debugEnabled = process.env.DEBUG === "1" || process.env.NODE_ENV === "development";
const subscribers = new Set<LogSubscriber>();

function emit(record: LogRecord): void {
  for (const listener of subscribers) {
    try {
      listener(record);
    } catch (err) {
      // Swallow listener errors to avoid breaking logging.
      if (debugEnabled) {
        process.stderr.write(`Failed to notify log subscriber: ${String(err)}\n`);
      }
    }
  }
}

export function subscribeToLogs(listener: LogSubscriber): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}): void {
  if (level === "debug" && !debugEnabled) return;
  const payload: LogRecord = {
    level,
    msg,
    time: new Date().toISOString(),
    pid: process.pid,
    ...meta,
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  emit(payload);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
