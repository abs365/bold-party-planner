type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogMeta {
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  err?: unknown;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV !== "production";

function formatErr(err: unknown): { error: string; stack?: string } {
  if (err instanceof Error) {
    return {
      error: err.message,
      stack: isDev ? err.stack : undefined,
    };
  }
  return { error: String(err) };
}

function emit(level: LogLevel, event: string, meta?: LogMeta): void {
  const { err, ...rest } = (meta ?? {}) as LogMeta;
  const errFields: { error?: string; stack?: string } = err ? formatErr(err) : {};

  const entry = {
    level,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "unknown",
    event,
    ...rest,
    ...errFields,
  };

  if (isDev) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    const tag = `[${level.toUpperCase()}] ${event}`;
    const parts: string[] = [];
    if (rest.requestId) parts.push(`rid=${rest.requestId}`);
    if (rest.userId) parts.push(`uid=${String(rest.userId).slice(0, 8)}`);
    if (rest.route) parts.push(`route=${rest.route}`);
    if (rest.durationMs !== undefined) parts.push(`${rest.durationMs}ms`);
    if (errFields.error) parts.push(`err=${errFields.error}`);
    fn(parts.length ? `${tag} | ${parts.join(" ")}` : tag);
  } else {
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }
}

export const logger = {
  debug: (event: string, meta?: LogMeta) => {
    if (isDev) emit("debug", event, meta);
  },
  info:  (event: string, meta?: LogMeta) => emit("info",  event, meta),
  warn:  (event: string, meta?: LogMeta) => emit("warn",  event, meta),
  error: (event: string, meta?: LogMeta) => emit("error", event, meta),
};
