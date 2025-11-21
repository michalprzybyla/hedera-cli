import { LogLevel, Logger } from './logger-service.interface';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
};

export class LoggerService implements Logger {
  private currentLevel: LogLevel = 'log';

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.currentLevel];
  }

  private formatPrefix(level: LogLevel): string {
    switch (level) {
      case 'error':
        return '[ERROR]';
      case 'warn':
        return '[WARN]';
      case 'log':
        return '[LOG]';
      case 'debug':
        return '[DEBUG]';
      case 'verbose':
        return '[VERBOSE]';
      default:
        return '';
    }
  }

  private output(level: LogLevel, message: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const prefix = this.formatPrefix(level);
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'log':
      case 'debug':
      case 'verbose':
        console.error(fullMessage);
        break;
      default:
        console.error(fullMessage);
    }
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  log(message: string): void {
    this.output('log', message);
  }

  verbose(message: string): void {
    this.output('verbose', message);
  }

  error(message: string): void {
    this.output('error', message);
  }

  warn(message: string): void {
    this.output('warn', message);
  }

  debug(message: string): void {
    this.output('debug', message);
  }
}
