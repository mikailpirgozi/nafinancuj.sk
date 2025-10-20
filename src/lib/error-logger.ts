enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: Error | unknown;
  context?: Record<string, unknown>;
  stack?: string;
  userId?: string;
  organizationId?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private minLevel = LogLevel.INFO;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    return {
      message: "Unknown error",
      stack: JSON.stringify(error),
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      const { timestamp, level, message, error } = entry;
      const errorStr = error
        ? ` - ${typeof error === "string" ? error : JSON.stringify(error)}`
        : "";
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}${errorStr}`);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
    });
  }

  warn(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const errorInfo = error ? this.formatError(error) : undefined;

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      error: errorInfo?.message,
      stack: errorInfo?.stack,
      context,
    });
  }

  error(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
    userId?: string,
    organizationId?: string
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorInfo = error ? this.formatError(error) : undefined;

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error: errorInfo?.message,
      stack: errorInfo?.stack,
      context,
      userId,
      organizationId,
    });
  }

  getLogs(
    level?: LogLevel,
    limit: number = 100
  ): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered.slice(-limit);
  }

  getErrorLogs(limit: number = 100): LogEntry[] {
    return this.getLogs(LogLevel.ERROR, limit);
  }

  clear(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new ErrorLogger(
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);

// Export convenience functions
export function logDebug(message: string, context?: Record<string, unknown>): void {
  logger.debug(message, context);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  logger.info(message, context);
}

export function logWarn(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  logger.warn(message, error, context);
}

export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
  userId?: string,
  organizationId?: string
): void {
  logger.error(message, error, context, userId, organizationId);
}

export function getErrorLogs(limit?: number): LogEntry[] {
  return logger.getErrorLogs(limit);
}

