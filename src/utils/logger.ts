import pino from "pino";

const redactPaths = [
  "req.headers.authorization",
  "req.body",
  "res.body",
  "payload.text",
  "payload.snippet",
  "payload.content",
  "snippet",
  "text",
];

const destination = pino.destination({ sync: true });

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: redactPaths,
    remove: true,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
}, destination);

function log(level: "debug" | "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  if (meta) {
    baseLogger[level](meta, msg);
  } else {
    baseLogger[level](msg);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
  child: baseLogger.child.bind(baseLogger),
  flush: baseLogger.flush?.bind(baseLogger),
  base: baseLogger,
};

export type Logger = typeof logger;
