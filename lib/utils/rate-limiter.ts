/**
 * Rate Limiter
 *
 * Implements token bucket algorithm for rate limiting API requests.
 * Prevents exceeding provider-specific rate limits.
 */

export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private lastRequestTime = 0;

  constructor(
    private maxConcurrent: number,
    private minDelayMs: number
  ) {}

  /**
   * Execute a function with rate limiting
   *
   * @param fn - The function to execute
   * @returns Promise resolving to the function's result
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait until we can run (under concurrent limit and min delay passed)
    await this.waitForSlot();

    this.running++;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Ensure minimum delay between requests
    if (timeSinceLastRequest < this.minDelayMs) {
      await this.delay(this.minDelayMs - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await fn();
      return result;
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Wait for an available slot
   */
  private waitForSlot(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get number of running requests
   */
  getRunningCount(): number {
    return this.running;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Provider-specific rate limiters
 *
 * Each provider gets its own rate limiter instance with appropriate limits
 */
export const rateLimiters = {
  /**
   * Notion rate limiter: ~3 requests per second
   */
  notion: new RateLimiter(3, 334),

  /**
   * Attio rate limiter: 100 requests per second for reads
   */
  attio: new RateLimiter(50, 20), // Conservative: 50 concurrent, 20ms delay

  /**
   * GA4 rate limiter: Conservative limits
   */
  ga4: new RateLimiter(10, 100), // 10 concurrent, 100ms delay

  /**
   * Phantombuster rate limiter: Conservative due to platform limits
   */
  phantombuster: new RateLimiter(5, 200), // 5 concurrent, 200ms delay

  /**
   * Default rate limiter for unknown providers
   */
  default: new RateLimiter(5, 200),
};

/**
 * Get rate limiter for a specific provider
 *
 * @param providerId - The provider's ID
 * @returns The appropriate rate limiter instance
 */
export function getRateLimiter(providerId: string): RateLimiter {
  const limiter = rateLimiters[providerId as keyof typeof rateLimiters];
  return limiter || rateLimiters.default;
}
