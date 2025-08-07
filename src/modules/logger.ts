/**
 * Logger module for structured logging
 */
namespace Logger {
  export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
  }
  
  export const currentLevel = LogLevel.INFO;
  
  export function debug(message: string, data?: any): void {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
  
  export function info(message: string, data?: any): void {
    if (currentLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
  
  export function warn(message: string, data?: any): void {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
  
  export function error(message: string, error?: any): void {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
  }
}