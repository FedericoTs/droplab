/**
 * Structured database operation logging
 *
 * Provides consistent, toggleable logging for all database operations
 * with context-rich information and performance tracking.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DatabaseLogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  table?: string;
  recordId?: string;
  duration?: number;
  error?: string;
  context?: Record<string, any>;
}

class DatabaseLogger {
  private enabled: boolean;

  constructor() {
    // Enable logging in development or when explicitly enabled
    this.enabled = process.env.NODE_ENV !== 'production' ||
                   process.env.DATABASE_LOGGING === 'true';
  }

  private log(entry: DatabaseLogEntry): void {
    if (!this.enabled) return;

    const prefix = `[DB ${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.operation}`;
    const details = {
      table: entry.table,
      id: entry.recordId,
      duration: entry.duration ? `${entry.duration}ms` : undefined,
      ...entry.context,
    };

    // Filter out undefined values for cleaner logs
    const cleanDetails = Object.fromEntries(
      Object.entries(details).filter(([_, v]) => v !== undefined)
    );

    switch (entry.level) {
      case 'error':
        console.error(message, cleanDetails, entry.error);
        break;
      case 'warn':
        console.warn(message, cleanDetails);
        break;
      case 'debug':
        console.log(message, cleanDetails);
        break;
      default:
        console.log(message, cleanDetails);
    }
  }

  /**
   * Log debug-level information
   * Use for detailed operation tracking during development
   */
  debug(operation: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      operation,
      context
    });
  }

  /**
   * Log info-level database operations
   * Use for successful CRUD operations
   */
  info(operation: string, table?: string, recordId?: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation,
      table,
      recordId,
      context
    });
  }

  /**
   * Log warnings (non-fatal issues)
   * Use for validation failures, missing optional data, etc.
   */
  warn(operation: string, message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      operation,
      context: { ...context, warning: message }
    });
  }

  /**
   * Log errors
   * Use for exceptions and failures
   */
  error(operation: string, error: Error | string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      operation,
      error: error instanceof Error ? error.message : error,
      context: {
        ...context,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  /**
   * Measure operation duration
   *
   * Usage:
   * ```typescript
   * const endTimer = dbLogger.time('someOperation');
   * // ... perform operation
   * endTimer(); // Logs operation duration
   * ```
   */
  time(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.log({
        timestamp: new Date().toISOString(),
        level: 'debug',
        operation: `${operation} [completed]`,
        duration,
      });
    };
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable logging (useful for testing)
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable logging (useful for testing)
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const dbLogger = new DatabaseLogger();
