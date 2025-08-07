/**
 * Utility functions module for Answer As Me 3
 */
namespace Utils {
  /**
   * Get user properties
   */
  export function getProperties(): GoogleAppsScript.Properties.Properties {
    return PropertiesService.getUserProperties();
  }
  
  /**
   * Get property value with default
   */
  export function getProperty(key: string, defaultValue: string = ''): string {
    const value = getProperties().getProperty(key);
    return value !== null ? value : defaultValue;
  }
  
  /**
   * Set property value
   */
  export function setProperty(key: string, value: string): void {
    getProperties().setProperty(key, String(value));
  }
  
  /**
   * Format date in timezone
   */
  export function formatDate(date: Date, format: string = 'yyyy-MM-dd'): string {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), format);
  }
  
  /**
   * Format timestamp in timezone
   */
  export function formatTimestamp(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
  }
  
  /**
   * Safe JSON stringify
   */
  export function jsonStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '{}';
    }
  }
  
  /**
   * Safe JSON parse
   */
  export function jsonParse<T = unknown>(str: string): T | null {
    try {
      return JSON.parse(str) as T;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * HTML escape string
   */
  export function escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /**
   * Throw error with message
   */
  export function throwError(message: string): never {
    throw new Error(message);
  }
  
  /**
   * Check if value is in array
   */
  export function isInArray<T>(array: readonly T[], value: T): boolean {
    return array.indexOf(value) > -1;
  }
  
  /**
   * Cap string length
   */
  export function capString(str: string | null | undefined, maxLength: number): string {
    if (!str) {
return '';
}
    return str.length > maxLength ? str.substring(0, maxLength) : str;
  }
  
  /**
   * Convert boolean to string
   */
  export function boolToString(value: boolean): string {
    return value ? 'true' : 'false';
  }
  
  /**
   * Sleep for milliseconds
   */
  export function sleep(milliseconds: number): void {
    Utilities.sleep(milliseconds);
  }
  
  /**
   * Check if string is empty or whitespace
   */
  export function isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }
  
  /**
   * Get current user email
   */
  export function getCurrentUserEmail(): string {
    return Session.getActiveUser().getEmail();
  }
  
}