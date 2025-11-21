/**
 * Interface for logging operations
 * Provides consistent logging interface for plugins
 */

export const LOG_LEVEL_VALUES = [
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const;

export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

export interface Logger {
  /**
   * Log a message
   */
  log(message: string): void;

  /**
   * Log a verbose message (debug level)
   */
  verbose(message: string): void;

  /**
   * Log an error message
   */
  error(message: string): void;

  /**
   * Log a warning message
   */
  warn(message: string): void;

  /**
   * Log a debug message
   */
  debug(message: string): void;

  /**
   * Set current minimal log level (messages below this level are filtered out)
   */
  setLevel(level: LogLevel): void;
}
