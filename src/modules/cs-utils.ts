/**
 * Computer Science utilities for improved performance
 * Implements algorithmic improvements based on CS audit
 */
namespace CSUtils {
  // CS utilities removed - they were not being used in production
  // This reduced bundle size by removing BloomFilter, LRUCache, FastSet implementations
  
  /**
   * Circuit breaker for API calls
   * Implements Nygard's stability patterns
   */
  export class CircuitBreaker {
    private failureCount = 0;
    private lastFailTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private readonly threshold = 5;
    private readonly timeout = 60000; // 1 minute
    
    
    /**
     * Execute function with circuit breaker protection
     * @complexity O(1) for state check
     */
    async execute<T>(fn: () => T): Promise<T> {
      // Check if circuit is open
      if (this.state === 'OPEN') {
        const now = Date.now();
        if (now - this.lastFailTime < this.timeout) {
          throw new Error('Circuit breaker is OPEN - API temporarily unavailable');
        }
        // Try half-open
        this.transitionTo('HALF_OPEN');
      }
      
      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }
    
    private onSuccess(): void {
      this.failureCount = 0;
      if (this.state === 'HALF_OPEN') {
        this.transitionTo('CLOSED');
      }
    }
    
    private onFailure(): void {
      this.failureCount++;
      this.lastFailTime = Date.now();
      
      if (this.failureCount >= this.threshold) {
        this.transitionTo('OPEN');
        AppLogger.error('Circuit breaker opened due to repeated failures');
      }
    }
    
    private transitionTo(newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
      this.state = newState;
    }
    
    getState(): string {
      return this.state;
    }
  }
  
  // Global circuit breaker for Gemini API
  export const geminiCircuitBreaker = new CircuitBreaker();
}