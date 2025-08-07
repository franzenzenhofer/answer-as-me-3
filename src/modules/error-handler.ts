/**
 * Error handling module with comprehensive error management
 */
namespace ErrorHandler {
  export enum ErrorType {
    VALIDATION = 'VALIDATION',
    NETWORK = 'NETWORK',
    PERMISSION = 'PERMISSION',
    CONFIGURATION = 'CONFIGURATION',
    UNKNOWN = 'UNKNOWN'
  }
  
  export interface AppError {
    type: ErrorType;
    message: string;
    details?: unknown;
    timestamp: Date;
    stack?: string;
  }
  
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
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        appError.type = ErrorType.VALIDATION;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        appError.type = ErrorType.NETWORK;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        appError.type = ErrorType.PERMISSION;
      } else if (error.message.includes('config') || error.message.includes('missing')) {
        appError.type = ErrorType.CONFIGURATION;
      }
    } else if (typeof error === 'string') {
      appError.message = error;
    } else {
      appError.details = error;
    }
    
    AppLogger.error(`Error in ${context}: ${appError.message}`, appError);
    State.setLastError(appError.message);
    
    return appError;
  }
  
  export function createUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return `Validation error: ${error.message}`;
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.PERMISSION:
        return 'Permission denied. Please check your access rights.';
      case ErrorType.CONFIGURATION:
        return 'Configuration error. Please check your settings.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }
  
  export function wrapAsync<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context: string
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            const appError = handleError(error, context);
            throw new Error(createUserMessage(appError));
          });
        }
        return result;
      } catch (error) {
        const appError = handleError(error, context);
        throw new Error(createUserMessage(appError));
      }
    }) as T;
  }
}