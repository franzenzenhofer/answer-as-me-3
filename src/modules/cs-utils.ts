/**
 * Computer Science utilities for improved performance
 * Implements algorithmic improvements based on CS audit
 * Enhanced with formal contracts and invariants
 */
namespace CSUtils {
  // Cache for email validation using LRU
  const emailCache = new Algorithms.LRUCache<string, boolean>(1000);
  
  // Bloom filter for seen emails (reduces memory usage)
  const seenEmails = new Algorithms.BloomFilter(10000, 0.001);
  
  // Fast set for valid email modes and tones
  export const VALID_MODES = new Algorithms.FastSet(Config.EMAIL.MODES);
  export const VALID_TONES = new Algorithms.FastSet(Config.EMAIL.TONES);
  
  /**
   * Efficient email validation with caching
   * @complexity O(1) for cached, O(n) for new emails where n is email length
   * @contract ensures consistent validation results
   */
  export function isValidEmail(email: string): boolean {
    // Precondition
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.requires(
        email !== null && email !== undefined,
        'Email must not be null'
      );
    }
    
    // Check cache first
    const cached = emailCache.get(email);
    if (cached !== undefined) {
      return cached;
    }
    
    // Validate email
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    // Cache result
    emailCache.put(email, isValid);
    
    // Postcondition: cache contains the result
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.ensures(
        emailCache.get(email) === isValid,
        'Cache must contain validation result'
      );
    }
    
    return isValid;
  }
  
  /**
   * Efficient email deduplication using Bloom filter
   * @complexity O(k) where k is number of hash functions (typically 3-7)
   */
  export function isNewEmail(email: string): boolean {
    if (seenEmails.contains(email)) {
      return false; // Might be duplicate
    }
    
    // Definitely new, add to filter
    seenEmails.add(email);
    return true;
  }
  
  /**
   * Build email list efficiently without O(n²) concatenation
   * @complexity O(n) where n is number of emails
   */
  export function formatEmailList(emails: string[]): string {
    // Use array join instead of string concatenation
    return emails.join(', ');
  }
  
  /**
   * Extract unique emails efficiently
   * @complexity O(n) average case using Set
   */
  export function extractUniqueEmails(emailLists: string[]): string[] {
    const uniqueEmails = new Set<string>();
    
    for (const list of emailLists) {
      const emails = Email.extractEmailAddresses(list);
      for (const email of emails) {
        if (isValidEmail(email)) {
          uniqueEmails.add(email.toLowerCase());
        }
      }
    }
    
    return Array.from(uniqueEmails);
  }
  
  /**
   * Efficient mode validation
   * @complexity O(1) average case
   */
  export function isValidMode(mode: string): boolean {
    return VALID_MODES.has(mode as Types.EmailMode);
  }
  
  /**
   * Efficient tone validation
   * @complexity O(1) average case
   */
  export function isValidTone(tone: string): boolean {
    return VALID_TONES.has(tone as Types.EmailTone);
  }
  
  /**
   * Circuit breaker for API calls
   * Implements Nygard's stability patterns
   */
  export class CircuitBreaker {
    private failures = 0;
    private lastFailTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private readonly threshold = 5;
    private readonly timeout = 60000; // 1 minute
    
    /**
     * Check class invariants
     */
    private checkInvariants(): void {
      if (Contracts.ENABLE_CONTRACTS) {
        Contracts.CircuitBreakerContracts.checkCircuitBreakerInvariant(this);
      }
    }
    
    /**
     * Execute function with circuit breaker protection
     * @complexity O(1) for state check
     * @contract ensures valid state transitions
     */
    async execute<T>(fn: () => T): Promise<T> {
      this.checkInvariants();
      
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
      } finally {
        this.checkInvariants();
      }
    }
    
    private onSuccess(): void {
      this.failures = 0;
      if (this.state === 'HALF_OPEN') {
        this.transitionTo('CLOSED');
      }
    }
    
    private onFailure(): void {
      this.failures++;
      this.lastFailTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.transitionTo('OPEN');
        AppLogger.error('Circuit breaker opened due to repeated failures');
      }
    }
    
    private transitionTo(newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
      if (Contracts.ENABLE_CONTRACTS) {
        Contracts.CircuitBreakerContracts.requireValidTransition(this.state, newState);
      }
      this.state = newState;
    }
    
    getState(): string {
      return this.state;
    }
  }
  
  // Global circuit breaker for Gemini API
  export const geminiCircuitBreaker = new CircuitBreaker();
}