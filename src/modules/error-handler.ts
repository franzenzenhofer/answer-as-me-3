/**
 * Error handling module for Answer As Me 3
 * Comprehensive error management for Gmail add-on
 */
namespace ErrorHandler {
  export enum ErrorType {
    VALIDATION = 'VALIDATION',
    NETWORK = 'NETWORK',
    PERMISSION = 'PERMISSION',
    CONFIGURATION = 'CONFIGURATION',
    API_ERROR = 'API_ERROR',
    GMAIL_ERROR = 'GMAIL_ERROR',
    UNKNOWN = 'UNKNOWN'
  }
  
  export interface AppError {
    type: ErrorType;
    message: string;
    details?: unknown;
    timestamp: Date;
    stack?: string;
  }
  
  /**
   * Handle error and classify type
   */
  export function handleError(error: unknown, context: string): AppError {
    const appError: AppError = {
      type: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred',
      timestamp: new Date()
    };
    
    if (error instanceof Error) {
      appError.message = error.message;
      if (error.stack) {
        appError.stack = error.stack;
      }
      
      // Classify error type
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('missing')) {
        appError.type = ErrorType.VALIDATION;
      } else if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('HTTP')) {
        appError.type = ErrorType.NETWORK;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized') || error.message.includes('access')) {
        appError.type = ErrorType.PERMISSION;
      } else if (error.message.includes('config') || error.message.includes('Settings') || error.message.includes('Open Settings')) {
        appError.type = ErrorType.CONFIGURATION;
      } else if (error.message.includes('API') || error.message.includes('Gemini')) {
        appError.type = ErrorType.API_ERROR;
      } else if (error.message.includes('Gmail') || error.message.includes('thread') || error.message.includes('message')) {
        appError.type = ErrorType.GMAIL_ERROR;
      }
    } else if (typeof error === 'string') {
      appError.message = error;
      
      // Classify string errors
      if (error.includes('missing') || error.includes('required')) {
        appError.type = ErrorType.CONFIGURATION;
      }
    } else {
      appError.details = error;
    }
    
    AppLogger.error(`Error in ${context}: ${appError.message}`, appError);
    
    return appError;
  }
  
  /**
   * Create user-friendly error message
   */
  export function createUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return error.message; // Validation errors are already user-friendly
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.PERMISSION:
        return 'Permission denied. Please check your access rights and Gmail permissions.';
      case ErrorType.CONFIGURATION:
        return error.message; // Configuration errors have specific messages
      case ErrorType.API_ERROR:
        return `API error: ${error.message}`;
      case ErrorType.GMAIL_ERROR:
        return 'Gmail error. Please ensure you have an email thread open.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }
  
  /**
   * Wrap function with error handling
   */
  export function wrapWithErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    context: string
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      try {
        return fn(...args);
      } catch (error) {
        const appError = handleError(error, context);
        throw new Error(createUserMessage(appError));
      }
    }) as T;
  }
  
  /**
   * Create error notification response
   */
  export function createErrorResponse(message: string): GoogleAppsScript.Card_Service.ActionResponse {
    return UI.createActionResponse(
      UI.createNotification(`❌ ${message}`)
    );
  }
  
  /**
   * Safe execute with fallback
   */
  export function safeExecute<T>(
    fn: () => T,
    fallback: T,
    context: string
  ): T {
    try {
      return fn();
    } catch (error) {
      handleError(error, context);
      return fallback;
    }
  }
}