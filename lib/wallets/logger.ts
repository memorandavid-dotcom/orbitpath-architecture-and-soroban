/**
 * OrbitPath Wallet Logger
 * 
 * Centralized logging for all wallet operations
 * Stores logs in localStorage and console with timestamps
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface WalletLog {
  timestamp: number;
  level: LogLevel;
  wallet?: string;
  operation: string;
  message: string;
  data?: any;
  error?: string;
}

class WalletLogger {
  private logs: WalletLog[] = [];
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'orbitpath_wallet_logs';
  private isDev = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isDev = process.env.NODE_ENV === 'development';
      this.loadLogsFromStorage();
    }
  }

  /**
   * Log a wallet operation
   */
  log(
    level: LogLevel,
    operation: string,
    message: string,
    data?: any,
    wallet?: string,
    error?: string
  ): void {
    const log: WalletLog = {
      timestamp: Date.now(),
      level,
      wallet,
      operation,
      message,
      data,
      error,
    };

    this.logs.push(log);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Save to localStorage
    this.saveToStorage();

    // Always log to console in development
    if (this.isDev) {
      this.logToConsole(log);
    }
  }

  /**
   * Log to console with proper formatting
   */
  private logToConsole(log: WalletLog): void {
    const timestamp = new Date(log.timestamp).toISOString();
    const prefix = `[OrbitPath Wallet] [${timestamp}] [${log.level.toUpperCase()}]`;
    const fullMessage = `${prefix} ${log.operation}: ${log.message}`;

    const consoleMethod = {
      info: console.info,
      success: console.log,
      warning: console.warn,
      error: console.error,
      debug: console.debug,
    }[log.level];

    const style = {
      info: 'color: #3b82f6; font-weight: bold;',
      success: 'color: #10b981; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      debug: 'color: #8b5cf6; font-weight: bold;',
    }[log.level];

    if (typeof window !== 'undefined' && window.console) {
      consoleMethod(`%c${fullMessage}`, style);
      if (log.data) console.log('Data:', log.data);
      if (log.error) console.log('Error:', log.error);
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
      } catch (e) {
        // localStorage might be full or disabled
        console.warn('[OrbitPath] Failed to save logs to storage');
      }
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogsFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('[OrbitPath] Failed to load logs from storage');
      }
    }
  }

  /**
   * Get all logs
   */
  getLogs(): WalletLog[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): WalletLog[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by wallet
   */
  getLogsByWallet(wallet: string): WalletLog[] {
    return this.logs.filter((log) => log.wallet === wallet);
  }

  /**
   * Get logs filtered by operation
   */
  getLogsByOperation(operation: string): WalletLog[] {
    return this.logs.filter((log) => log.operation === operation);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 20): WalletLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Convenience methods
   */
  info(operation: string, message: string, data?: any, wallet?: string): void {
    this.log('info', operation, message, data, wallet);
  }

  success(operation: string, message: string, data?: any, wallet?: string): void {
    this.log('success', operation, message, data, wallet);
  }

  warning(operation: string, message: string, data?: any, wallet?: string): void {
    this.log('warning', operation, message, data, wallet);
  }

  error(operation: string, message: string, error?: any, wallet?: string): void {
    const errorString = error instanceof Error ? error.message : String(error);
    this.log('error', operation, message, undefined, wallet, errorString);
  }

  debug(operation: string, message: string, data?: any, wallet?: string): void {
    this.log('debug', operation, message, data, wallet);
  }
}

// Create singleton instance
export const walletLogger = new WalletLogger();
