import { createWriteStream } from "fs";
import { Writable } from "stream";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  time: string;
  pid: number;
  meta?: Record<string, unknown>;
}

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

const envLevel = (process.env.MCP_NN_LOG_LEVEL ?? "info").toLowerCase();
const levelIndex = Math.max(0, LOG_LEVELS.indexOf(envLevel as LogLevel));

const stream: Writable = process.stdout instanceof Writable ? process.stdout : createWriteStream("/dev/stdout");

function shouldLog(level: LogLevel): boolean {
  if (level === "debug" && process.env.NODE_ENV !== "development" && process.env.DEBUG !== "1") {
    return false;
  }
  return LOG_LEVELS.indexOf(level) >= levelIndex;
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}): void {
  if (!shouldLog(level)) {
    return;
  }
  const entry: LogEntry = {
    level,
    msg,
    time: new Date().toISOString(),
    pid: process.pid,
    ...(Object.keys(meta).length ? { meta } : {}),
  };
  stream.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (msg: string, meta: Record<string, unknown> = {}) => log("debug", msg, meta),
  info: (msg: string, meta: Record<string, unknown> = {}) => log("info", msg, meta),
  warn: (msg: string, meta: Record<string, unknown> = {}) => log("warn", msg, meta),
  error: (msg: string, meta: Record<string, unknown> = {}) => log("error", msg, meta),
};
