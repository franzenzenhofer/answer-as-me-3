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

  /**
   * Bloom filter for space-efficient set membership testing
   * Used for email deduplication without storing all emails
   * 
   * @complexity 
   * - Insert: O(k) where k is number of hash functions
   * - Contains: O(k)
   * - Space: O(m) where m is bit array size
   */
  export class BloomFilter {
    private bits: Uint8Array;
    private size: number;
    private k: number; // number of hash functions
    private count: number = 0;
    
    constructor(expectedElements: number = 1000, falsePositiveRate: number = 0.01) {
      // Calculate optimal bit array size: m = -n * ln(p) / (ln(2)^2)
      this.size = Math.ceil(-expectedElements * Math.log(falsePositiveRate) / Math.pow(Math.log(2), 2));
      
      // Calculate optimal number of hash functions: k = (m/n) * ln(2)
      this.k = Math.ceil((this.size / expectedElements) * Math.log(2));
      
      // Initialize bit array
      this.bits = new Uint8Array(Math.ceil(this.size / 8));
    }
    
    /**
     * Add element to the filter
     * @param item Element to add
     */
    add(item: string): void {
      for (let i = 0; i < this.k; i++) {
        const hash = this.hash(item, i);
        const index = hash % this.size;
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        this.bits[byteIndex]! |= (1 << bitIndex);
      }
      this.count++;
    }
    
    /**
     * Test if element might be in the set
     * @param item Element to test
     * @returns true if possibly in set, false if definitely not
     */
    contains(item: string): boolean {
      for (let i = 0; i < this.k; i++) {
        const hash = this.hash(item, i);
        const index = hash % this.size;
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        if ((this.bits[byteIndex]! & (1 << bitIndex)) === 0) {
          return false;
        }
      }
      return true;
    }
    
    /**
     * MurmurHash3-inspired hash function
     * @param str String to hash
     * @param seed Seed for multiple hash functions
     */
    private hash(str: string, seed: number): number {
      let h = seed;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
        h ^= h >>> 15;
      }
      return Math.abs(h);
    }
    
    /**
     * Get filter statistics
     */
    getStats(): { size: number; k: number; count: number; expectedFPR: number } {
      const expectedFPR = Math.pow(1 - Math.exp(-this.k * this.count / this.size), this.k);
      return {
        size: this.size,
        k: this.k,
        count: this.count,
        expectedFPR
      };
    }
  }

  /**
   * LRU (Least Recently Used) Cache with O(1) operations
   * Implements using doubly linked list + hash map
   * 
   * @complexity
   * - Get: O(1)
   * - Put: O(1)
   * - Space: O(capacity)
   */
  export class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, Node<K, V>>;
    private head: Node<K, V>;
    private tail: Node<K, V>;
    
    constructor(capacity: number) {
      this.capacity = capacity;
      this.cache = new Map();
      
      // Dummy head and tail for easier manipulation
      this.head = new Node<K, V>(null as unknown as K, null as unknown as V);
      this.tail = new Node<K, V>(null as unknown as K, null as unknown as V);
      this.head.next = this.tail;
      this.tail.prev = this.head;
    }
    
    /**
     * Get value from cache
     * @param key Cache key
     * @returns Value if exists, undefined otherwise
     */
    get(key: K): V | undefined {
      const node = this.cache.get(key);
      if (!node) {
        return undefined;
      }
      
      // Move to front (most recently used)
      this.removeNode(node);
      this.addToFront(node);
      
      return node.value;
    }
    
    /**
     * Put key-value pair in cache
     * @param key Cache key
     * @param value Cache value
     */
    put(key: K, value: V): void {
      let node = this.cache.get(key);
      
      if (node) {
        // Update existing node
        node.value = value;
        this.removeNode(node);
        this.addToFront(node);
      } else {
        // Add new node
        node = new Node(key, value);
        this.cache.set(key, node);
        this.addToFront(node);
        
        // Check capacity
        if (this.cache.size > this.capacity) {
          const lru = this.tail.prev!;
          this.removeNode(lru);
          this.cache.delete(lru.key);
        }
      }
    }
    
    private removeNode(node: Node<K, V>): void {
      node.prev!.next = node.next;
      node.next!.prev = node.prev;
    }
    
    private addToFront(node: Node<K, V>): void {
      node.prev = this.head;
      node.next = this.head.next;
      this.head.next!.prev = node;
      this.head.next = node;
    }
  }
  
  /**
   * Node for LRU Cache's doubly linked list
   */
  class Node<K, V> {
    constructor(
      public key: K,
      public value: V,
      public prev: Node<K, V> | null = null,
      public next: Node<K, V> | null = null
    ) {}
  }

  /**
   * Trie (Prefix Tree) for efficient string operations
   * Used for email autocompletion and validation
   * 
   * @complexity
   * - Insert: O(m) where m is string length
   * - Search: O(m)
   * - StartsWith: O(p) where p is prefix length
   * - Space: O(ALPHABET_SIZE * N * M) worst case
   */
  export class Trie {
    private root: TrieNode;
    
    constructor() {
      this.root = new TrieNode();
    }
    
    /**
     * Insert word into trie
     * @param word Word to insert
     */
    insert(word: string): void {
      let node = this.root;
      for (const char of word) {
        if (!node.children.has(char)) {
          node.children.set(char, new TrieNode());
        }
        node = node.children.get(char)!;
      }
      node.isEndOfWord = true;
    }
    
    /**
     * Search for exact word
     * @param word Word to search
     * @returns true if word exists
     */
    search(word: string): boolean {
      const node = this.searchPrefix(word);
      return node !== null && node.isEndOfWord;
    }
    
    /**
     * Check if any word starts with prefix
     * @param prefix Prefix to check
     * @returns true if any word has this prefix
     */
    startsWith(prefix: string): boolean {
      return this.searchPrefix(prefix) !== null;
    }
    
    /**
     * Get all words with given prefix
     * @param prefix Prefix to search
     * @returns Array of words with prefix
     */
    getWordsWithPrefix(prefix: string): string[] {
      const node = this.searchPrefix(prefix);
      if (!node) {
        return [];
      }
      
      const results: string[] = [];
      this.dfs(node, prefix, results);
      return results;
    }
    
    private searchPrefix(prefix: string): TrieNode | null {
      let node = this.root;
      for (const char of prefix) {
        if (!node.children.has(char)) {
          return null;
        }
        node = node.children.get(char)!;
      }
      return node;
    }
    
    private dfs(node: TrieNode, path: string, results: string[]): void {
      if (node.isEndOfWord) {
        results.push(path);
      }
      
      for (const [char, child] of node.children) {
        this.dfs(child, path + char, results);
      }
    }
  }
  
  /**
   * Node for Trie
   */
  class TrieNode {
    children: Map<string, TrieNode> = new Map();
    isEndOfWord: boolean = false;
  }

  /**
   * Set implementation using hash table for O(1) operations
   * More efficient than array-based isInArray checks
   */
  export class FastSet<T> {
    private items: Set<T>;
    
    constructor(initial?: Iterable<T>) {
      this.items = new Set(initial);
    }
    
    /**
     * Add item to set
     * @complexity O(1) average case
     */
    add(item: T): void {
      this.items.add(item);
    }
    
    /**
     * Check if item exists in set
     * @complexity O(1) average case
     */
    has(item: T): boolean {
      return this.items.has(item);
    }
    
    /**
     * Remove item from set
     * @complexity O(1) average case
     */
    delete(item: T): boolean {
      return this.items.delete(item);
    }
    
    /**
     * Get size of set
     * @complexity O(1)
     */
    get size(): number {
      return this.items.size;
    }
    
    /**
     * Convert to array
     * @complexity O(n)
     */
    toArray(): T[] {
      return Array.from(this.items);
    }
  }
}