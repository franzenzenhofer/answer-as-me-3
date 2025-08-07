/**
 * High-performance algorithms module
 * Implements CS best practices for computational efficiency
 */
namespace Algorithms {
  /**
   * Exponential backoff with jitter for distributed systems
   * Based on AWS best practices and Lamport's distributed systems principles
   * 
   * @complexity Time: O(1), Space: O(1)
   * @param attempt The retry attempt number (0-based)
   * @param baseDelay Base delay in milliseconds
   * @param maxDelay Maximum delay cap in milliseconds
   * @returns Delay in milliseconds with jitter applied
   */
  export function calculateBackoffWithJitter(
    attempt: number, 
    baseDelay: number = 100,
    maxDelay: number = 30000
  ): number {
    // Exponential component: delay = base * 2^attempt
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter: 0-30% of exponential delay to prevent thundering herd
    const jitter = Math.random() * exponentialDelay * 0.3;
    
    return Math.floor(exponentialDelay + jitter);
  }
  
  // Heavy algorithms (BloomFilter, LRUCache, Trie, FastSet) removed to reduce bundle size
  // They were not being used in production code
}