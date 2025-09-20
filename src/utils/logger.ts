import { performance } from "perf_hooks";

type LogLevel = "debug" | "info" | "warn" | "error";

const DEBUG_ENABLED = process.env.DEBUG === "1" || process.env.NODE_ENV === "development";

function shouldLog(level: LogLevel): boolean {
  if (level === "debug") return DEBUG_ENABLED;
  return true;
}

export interface LogPayload {
  level: LogLevel;
  msg: string;
  meta?: Record<string, unknown>;
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}): void {
  if (!shouldLog(level)) return;
  const payload: Record<string, unknown> = {
    level,
    msg,
    ts: performance.now().toFixed(3)
  };
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    payload[key] = value;
  }
  const serialized = JSON.stringify(payload);
  if (level === "error") {
    process.stderr.write(serialized + "\n");
  } else {
    process.stdout.write(serialized + "\n");
  }
}

export function info(msg: string, meta: Record<string, unknown> = {}): void {
  log("info", msg, meta);
}

export function warn(msg: string, meta: Record<string, unknown> = {}): void {
  log("warn", msg, meta);
}

export function error(msg: string, meta: Record<string, unknown> = {}): void {
  log("error", msg, meta);
}

export function debug(msg: string, meta: Record<string, unknown> = {}): void {
  log("debug", msg, meta);
}
