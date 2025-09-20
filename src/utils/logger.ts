type Level = "debug" | "info" | "warn" | "error";
const DEBUG_ENABLED = Boolean(process.env.DEBUG) || process.env.NODE_ENV === "development";

interface LogEntry {
  level: Level;
  msg: string;
  scope?: string;
  meta?: Record<string, unknown>;
}

function emit(entry: LogEntry) {
  if (!process.stdout.writable) return;
  const payload: Record<string, unknown> = {
    level: entry.level,
    msg: entry.msg,
    ts: new Date().toISOString(),
  };
  if (entry.scope) payload.scope = entry.scope;
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    payload.meta = entry.meta;
  }
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export function createLogger(scope: string) {
  function log(level: Level, msg: string, meta?: Record<string, unknown>) {
    if (level === "debug" && !DEBUG_ENABLED) return;
    emit({ level, msg, scope, meta });
  }

  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
