type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  traceId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private format(level: LogLevel, message: string, extra?: Partial<LogPayload>): string {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    };

    return JSON.stringify(payload);
  }

  info(message: string, extra?: Partial<LogPayload>) {
    console.log(this.format("info", message, extra));
  }

  warn(message: string, extra?: Partial<LogPayload>) {
    console.warn(this.format("warn", message, extra));
  }

  error(message: string, err?: unknown, extra?: Partial<LogPayload>) {
    const errorDetails =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          }
        : undefined;

    console.error(
      this.format("error", message, {
        ...extra,
        error: errorDetails,
      })
    );
  }

  debug(message: string, extra?: Partial<LogPayload>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.format("debug", message, extra));
    }
  }
}

export const logger = new Logger();
