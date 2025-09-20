export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const LEVEL = process.env.LOG_LEVEL as LogLevel | undefined;
const activeLevel = LEVEL && LEVELS.includes(LEVEL) ? LEVEL : "info";

const levelWeight = new Map<LogLevel, number>([
  ["debug", 10],
  ["info", 20],
  ["warn", 30],
  ["error", 40],
]);

function shouldLog(level: LogLevel) {
  return (levelWeight.get(level) ?? 0) >= (levelWeight.get(activeLevel) ?? 0);
}

export interface LogMeta {
  [key: string]: unknown;
}

export function log(level: LogLevel, msg: string, meta: LogMeta = {}): void {
  if (!shouldLog(level)) return;
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
  debug: (msg: string, meta?: LogMeta) => log("debug", msg, meta),
  info: (msg: string, meta?: LogMeta) => log("info", msg, meta),
  warn: (msg: string, meta?: LogMeta) => log("warn", msg, meta),
  error: (msg: string, meta?: LogMeta) => log("error", msg, meta),
};
