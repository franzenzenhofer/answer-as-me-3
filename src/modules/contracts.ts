/**
 * Design-by-Contract module implementing formal contracts and invariants
 * Based on Meyer's work on reliable software and Hoare logic
 */
namespace Contracts {
  /**
   * Contract violation error - using function instead of class to avoid __extends
   */
  export function ContractViolation(message: string, contractType: 'precondition' | 'postcondition' | 'invariant'): Error {
    const error = new Error(`Contract violation (${contractType}): ${message}`);
    error.name = 'ContractViolation';
    return error;
  }

  /**
   * Assert a precondition
   * @param condition The condition that must be true
   * @param message Error message if condition fails
   * @throws ContractViolation if condition is false
   */
  export function requires(condition: boolean, message: string): void {
    if (!condition) {
      throw ContractViolation(message, 'precondition');
    }
  }

  /**
   * Assert a postcondition
   * @param condition The condition that must be true
   * @param message Error message if condition fails
   * @throws ContractViolation if condition is false
   */
  export function ensures(condition: boolean, message: string): void {
    if (!condition) {
      throw ContractViolation(message, 'postcondition');
    }
  }

  /**
   * Assert an invariant
   * @param condition The invariant that must always be true
   * @param message Error message if invariant is violated
   * @throws ContractViolation if invariant is false
   */
  export function invariant(condition: boolean, message: string): void {
    if (!condition) {
      throw ContractViolation(message, 'invariant');
    }
  }

  /**
   * Email contract validators
   */
  export namespace EmailContracts {
    /**
     * Validate email format precondition
     */
    export function requireValidEmail(email: string): void {
      requires(
        email.length > 0 && email.length <= 254,
        'Email must be between 1 and 254 characters'
      );
      requires(
        email.includes('@'),
        'Email must contain @ symbol'
      );
      requires(
        !email.startsWith('@') && !email.endsWith('@'),
        'Email cannot start or end with @'
      );
    }

    /**
     * Validate email list postcondition
     */
    export function ensureUniqueEmails(emails: string[]): void {
      const uniqueEmails = new Set(emails);
      ensures(
        uniqueEmails.size === emails.length,
        'Email list must not contain duplicates'
      );
    }

    /**
     * Validate recipient computation postcondition
     */
    export function ensureRecipientsValid(to: string[], cc: string[]): void {
      ensures(
        to.length > 0,
        'To field must contain at least one recipient'
      );
      ensures(
        new Set([...to, ...cc]).size === to.length + cc.length,
        'To and Cc must not have overlapping recipients'
      );
    }
  }

  /**
   * API contract validators
   */
  export namespace APIContracts {
    /**
     * Validate API key precondition
     */
    export function requireAPIKey(apiKey: string | null): void {
      requires(
        apiKey !== null && apiKey.length > 0,
        'API key must be provided'
      );
      if (apiKey !== null) {
        requires(
          apiKey.startsWith('AIza'),
          'API key must be valid Gemini API key format'
        );
      }
    }

    /**
     * Validate prompt precondition
     */
    export function requireValidPrompt(prompt: string): void {
      requires(
        prompt.length > 0,
        'Prompt must not be empty'
      );
      requires(
        prompt.length <= 30000,
        'Prompt must not exceed 30000 characters'
      );
    }

    /**
     * Validate API response postcondition
     */
    export function ensureValidResponse(response: unknown): void {
      ensures(
        response !== null && typeof response === 'object',
        'API response must be an object'
      );
      ensures(
        'candidates' in response && Array.isArray(response.candidates),
        'API response must contain candidates array'
      );
    }
  }

  /**
   * State contract validators
   */
  export namespace StateContracts {
    /**
     * Validate state consistency invariant
     */
    export function checkStateInvariant(state: unknown): void {
      invariant(
        state === null || typeof state === 'object',
        'State must be null or object'
      );
      
      if (state !== null) {
        invariant(
          !('apiKey' in state) || typeof state.apiKey === 'string',
          'API key in state must be string'
        );
        invariant(
          !('userEmail' in state) || typeof state.userEmail === 'string',
          'User email in state must be string'
        );
      }
    }

    /**
     * Validate settings precondition
     */
    export function requireValidSettings(settings: unknown): void {
      requires(
        settings !== null && typeof settings === 'object',
        'Settings must be an object'
      );
      requires(
        'mode' in settings && typeof settings.mode === 'string',
        'Settings must contain mode string'
      );
      requires(
        'tone' in settings && typeof settings.tone === 'string',
        'Settings must contain tone string'
      );
    }
  }

  /**
   * Data structure contract validators
   */
  export namespace DataStructureContracts {
    /**
     * Validate Bloom filter invariants
     */
    export function checkBloomFilterInvariant(filter: { k: number; size: number; count: number }): void {
      invariant(
        filter.k > 0 && filter.k <= 20,
        'Number of hash functions must be between 1 and 20'
      );
      invariant(
        filter.size > 0 && filter.size <= 1000000,
        'Bloom filter size must be between 1 and 1M bits'
      );
      invariant(
        filter.count >= 0 && filter.count <= filter.size,
        'Element count cannot exceed filter size'
      );
    }

    /**
     * Validate LRU cache invariants
     */
    export function checkLRUCacheInvariant(cache: { capacity: number; size: number }): void {
      invariant(
        cache.capacity > 0,
        'Cache capacity must be positive'
      );
      invariant(
        cache.cache.size <= cache.capacity,
        'Cache size cannot exceed capacity'
      );
    }

    /**
     * Validate Trie invariants
     */
    export function checkTrieInvariant(node: { children: Map<string, unknown>; isEndOfWord: boolean }): void {
      invariant(
        node.children instanceof Map,
        'Trie node children must be a Map'
      );
      invariant(
        typeof node.isEndOfWord === 'boolean',
        'isEndOfWord must be boolean'
      );
    }
  }

  /**
   * Circuit breaker contract validators
   */
  export namespace CircuitBreakerContracts {
    /**
     * Validate circuit breaker state transitions
     */
    export function requireValidTransition(currentState: string, newState: string): void {
      const validTransitions: Record<string, string[]> = {
        'CLOSED': ['OPEN'],
        'OPEN': ['HALF_OPEN'],
        'HALF_OPEN': ['CLOSED', 'OPEN']
      };

      requires(
        validTransitions[currentState]?.includes(newState) || currentState === newState,
        `Invalid state transition from ${currentState} to ${newState}`
      );
    }

    /**
     * Validate circuit breaker invariants
     */
    export function checkCircuitBreakerInvariant(breaker: { state: string; failureCount: number; threshold: number }): void {
      invariant(
        ['CLOSED', 'OPEN', 'HALF_OPEN'].includes(breaker.state),
        'Circuit breaker must be in valid state'
      );
      invariant(
        breaker.failureCount >= 0,
        'Failure count must be non-negative'
      );
      invariant(
        breaker.threshold > 0,
        'Failure threshold must be positive'
      );
    }
  }

  /**
   * Contract-enabled function wrapper
   * Automatically checks preconditions, postconditions, and invariants
   */
  export function withContract<T extends (...args: never[]) => unknown>(
    fn: T,
    options: {
      pre?: (args: Parameters<T>) => void;
      post?: (result: ReturnType<T>, args: Parameters<T>) => void;
      invariant?: () => void;
    } = {}
  ): T {
    return function contractWrapper(...args: Parameters<T>): ReturnType<T> {
      // Check invariant before
      if (options.invariant) {
        options.invariant();
      }

      // Check preconditions
      if (options.pre) {
        options.pre(args);
      }

      // Execute function
      const result = fn(...args);

      // Check postconditions
      if (options.post) {
        options.post(result, args);
      }

      // Check invariant after
      if (options.invariant) {
        options.invariant();
      }

      return result;
    } as T;
  }

  /**
   * Development mode flag (disable in production for performance)
   */
  export const ENABLE_CONTRACTS = false;

  /**
   * No-op versions for production (when contracts are disabled)
   */
  export const requiresNoop = (_condition: boolean, _message: string): void => {};
  export const ensuresNoop = (_condition: boolean, _message: string): void => {};
  export const invariantNoop = (_condition: boolean, _message: string): void => {};
}