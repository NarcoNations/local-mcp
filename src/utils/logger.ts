export type LogLevel = "debug" | "info" | "warn" | "error";

const debugEnabled = process.env.DEBUG === "1" || process.env.NODE_ENV === "development";

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}): void {
  if (level === "debug" && !debugEnabled) return;
  const payload = {
    level,
    msg,
    time: new Date().toISOString(),
    pid: process.pid,
    ...meta,
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
