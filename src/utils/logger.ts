interface LogMeta {
  [key: string]: unknown;
}

const levelOrder: Record<string, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel = (() => {
  const env = process.env.LOG_LEVEL || "info";
  return levelOrder[env] ?? 20;
})();

function write(level: keyof typeof levelOrder, msg: string, meta: LogMeta = {}): void {
  if (levelOrder[level] < minLevel) return;
  const payload = { level, msg, time: new Date().toISOString(), ...meta };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  debug(msg: string, meta?: LogMeta) {
    write("debug", msg, meta);
  },
  info(msg: string, meta?: LogMeta) {
    write("info", msg, meta);
  },
  warn(msg: string, meta?: LogMeta) {
    write("warn", msg, meta);
  },
  error(msg: string, meta?: LogMeta) {
    write("error", msg, meta);
  },
};
