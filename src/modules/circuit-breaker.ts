/**
 * Circuit Breaker module for Answer As Me 3
 * Synchronous circuit breaker to prevent API quota exhaustion
 */
namespace CircuitBreaker {
  // Configuration
  const FAILURE_THRESHOLD = 5; // Number of failures before opening circuit
  const RESET_TIMEOUT_MS = 60000; // 60 seconds pause when open
  
  // Property keys for state persistence
  const PROPS = {
    FAILURE_COUNT: 'AAM3_CB_FAILURE_COUNT',
    LAST_FAILURE_TIME: 'AAM3_CB_LAST_FAILURE',
    CIRCUIT_STATE: 'AAM3_CB_STATE', // 'closed', 'open', 'half-open'
    LAST_SUCCESS_TIME: 'AAM3_CB_LAST_SUCCESS'
  };
  
  export enum CircuitState {
    CLOSED = 'closed',
    OPEN = 'open',
    HALF_OPEN = 'half-open'
  }
  
  /**
   * Get current circuit state
   */
  export function getState(): CircuitState {
    const state = Utils.getProperty(PROPS.CIRCUIT_STATE, CircuitState.CLOSED);
    
    // Check if we should transition from OPEN to HALF_OPEN
    if (state === CircuitState.OPEN) {
      const lastFailureTime = parseInt(Utils.getProperty(PROPS.LAST_FAILURE_TIME, '0'), 10);
      const now = Date.now();
      
      if (now - lastFailureTime >= RESET_TIMEOUT_MS) {
        // Transition to half-open to test if service is back
        setState(CircuitState.HALF_OPEN);
        return CircuitState.HALF_OPEN;
      }
    }
    
    return state as CircuitState;
  }
  
  /**
   * Set circuit state
   */
  function setState(state: CircuitState): void {
    Utils.setProperty(PROPS.CIRCUIT_STATE, state);
  }
  
  /**
   * Get failure count
   */
  function getFailureCount(): number {
    return parseInt(Utils.getProperty(PROPS.FAILURE_COUNT, '0'), 10);
  }
  
  /**
   * Increment failure count
   */
  function incrementFailureCount(): number {
    const count = getFailureCount() + 1;
    Utils.setProperty(PROPS.FAILURE_COUNT, count.toString());
    Utils.setProperty(PROPS.LAST_FAILURE_TIME, Date.now().toString());
    return count;
  }
  
  /**
   * Reset failure count on success
   */
  function resetFailureCount(): void {
    Utils.setProperty(PROPS.FAILURE_COUNT, '0');
    Utils.setProperty(PROPS.LAST_SUCCESS_TIME, Date.now().toString());
  }
  
  /**
   * Record a successful API call
   */
  export function recordSuccess(): void {
    const currentState = getState();
    
    if (currentState === CircuitState.HALF_OPEN) {
      // Success in half-open state means we can close the circuit
      setState(CircuitState.CLOSED);
      resetFailureCount();
      AppLogger.info('Circuit breaker closed after successful test');
    } else if (currentState === CircuitState.CLOSED) {
      // Reset failure count on success
      resetFailureCount();
    }
  }
  
  /**
   * Record a failed API call
   */
  export function recordFailure(error?: string): void {
    const currentState = getState();
    
    if (currentState === CircuitState.HALF_OPEN) {
      // Failure in half-open state means we go back to open
      setState(CircuitState.OPEN);
      Utils.setProperty(PROPS.LAST_FAILURE_TIME, Date.now().toString());
      AppLogger.warn('Circuit breaker reopened after test failure', { error });
      return;
    }
    
    const failureCount = incrementFailureCount();
    
    if (failureCount >= FAILURE_THRESHOLD) {
      setState(CircuitState.OPEN);
      AppLogger.error('Circuit breaker opened', { 
        failureCount, 
        threshold: FAILURE_THRESHOLD,
        error 
      });
    }
  }
  
  /**
   * Check if circuit allows execution
   */
  export function canExecute(): boolean {
    const state = getState();
    
    if (state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN) {
      return true;
    }
    
    // Circuit is open - check if we should transition to half-open
    const lastFailureTime = parseInt(Utils.getProperty(PROPS.LAST_FAILURE_TIME, '0'), 10);
    const now = Date.now();
    
    if (now - lastFailureTime >= RESET_TIMEOUT_MS) {
      setState(CircuitState.HALF_OPEN);
      AppLogger.info('Circuit breaker transitioning to half-open for testing');
      return true;
    }
    
    return false;
  }
  
  /**
   * Get time until circuit can be tested again (in seconds)
   */
  export function getTimeUntilRetry(): number {
    const state = getState();
    
    if (state !== CircuitState.OPEN) {
      return 0;
    }
    
    const lastFailureTime = parseInt(Utils.getProperty(PROPS.LAST_FAILURE_TIME, '0'), 10);
    const now = Date.now();
    const timeElapsed = now - lastFailureTime;
    const timeRemaining = Math.max(0, RESET_TIMEOUT_MS - timeElapsed);
    
    return Math.ceil(timeRemaining / 1000); // Return seconds
  }
  
  /**
   * Create user-friendly error message when circuit is open
   */
  export function createCircuitOpenError(): string {
    const timeUntilRetry = getTimeUntilRetry();
    
    if (timeUntilRetry > 0) {
      return `API temporarily unavailable due to repeated failures. Please try again in ${timeUntilRetry} seconds.`;
    }
    
    return 'API temporarily unavailable. Retrying now...';
  }
  
  /**
   * Reset circuit breaker (for testing or manual reset)
   */
  export function reset(): void {
    setState(CircuitState.CLOSED);
    resetFailureCount();
    AppLogger.info('Circuit breaker manually reset');
  }
  
  /**
   * Get circuit breaker status for debugging
   */
  export function getStatus(): {
    state: CircuitState;
    failureCount: number;
    timeUntilRetry: number;
    lastFailure: Date | null;
    lastSuccess: Date | null;
  } {
    const lastFailureTime = parseInt(Utils.getProperty(PROPS.LAST_FAILURE_TIME, '0'), 10);
    const lastSuccessTime = parseInt(Utils.getProperty(PROPS.LAST_SUCCESS_TIME, '0'), 10);
    
    return {
      state: getState(),
      failureCount: getFailureCount(),
      timeUntilRetry: getTimeUntilRetry(),
      lastFailure: lastFailureTime > 0 ? new Date(lastFailureTime) : null,
      lastSuccess: lastSuccessTime > 0 ? new Date(lastSuccessTime) : null
    };
  }
}