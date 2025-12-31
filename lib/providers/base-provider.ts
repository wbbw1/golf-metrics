/**
 * Base Provider Class
 *
 * Abstract base class that all data providers extend.
 * Provides common functionality like retry logic, error handling, and logging.
 */

import { DataProvider, ProviderMetrics } from '@/lib/types/provider.types';

export abstract class BaseProvider<TConfig = unknown, TRawData = unknown>
  implements DataProvider<TConfig, TRawData>
{
  abstract id: string;
  abstract name: string;
  abstract fetchIntervalMinutes: number;

  // Retry configuration
  protected maxRetries = 3;
  protected retryDelayMs = 1000;
  protected retryMultiplier = 2; // Exponential backoff multiplier

  // Timeout configuration
  protected defaultTimeoutMs = 30000; // 30 seconds

  /**
   * Fetch data from the provider
   * Must be implemented by subclasses
   */
  abstract fetch(): Promise<ProviderMetrics>;

  /**
   * Transform raw data to standardized format
   * Must be implemented by subclasses
   */
  abstract transform(rawData: TRawData): ProviderMetrics;

  /**
   * Validate provider configuration
   * Must be implemented by subclasses
   */
  abstract validateConfig(): Promise<boolean>;

  /**
   * Fetch with automatic retry logic and exponential backoff
   *
   * @param fetchFn - The function to execute with retries
   * @param retries - Number of retries remaining
   * @returns The result of the fetch function
   */
  protected async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await fetchFn();
    } catch (error) {
      if (retries > 0) {
        const delay = this.retryDelayMs * Math.pow(this.retryMultiplier, this.maxRetries - retries);

        console.warn(
          `[${this.id}] Fetch failed, retrying in ${delay}ms... (${retries} retries remaining)`,
          this.getErrorMessage(error)
        );

        await this.delay(delay);
        return this.fetchWithRetry(fetchFn, retries - 1);
      }

      // No more retries, throw the error
      throw this.enhanceError(error, 'Max retries exceeded');
    }
  }

  /**
   * Delay execution for specified milliseconds
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhanced error handling with context
   */
  protected handleError(error: unknown, context: string): never {
    const enhancedError = this.enhanceError(error, context);
    throw enhancedError;
  }

  /**
   * Enhance error with provider context
   */
  protected enhanceError(error: unknown, context: string): Error {
    const message = this.getErrorMessage(error);
    const enhancedMessage = `[${this.id}] ${context}: ${message}`;

    if (error instanceof Error) {
      const enhanced = new Error(enhancedMessage);
      enhanced.stack = error.stack;
      enhanced.cause = error;
      return enhanced;
    }

    return new Error(enhancedMessage);
  }

  /**
   * Extract error message from unknown error type
   */
  protected getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Log information message
   */
  protected log(message: string, data?: unknown): void {
    console.log(`[${this.id}] ${message}`, data || '');
  }

  /**
   * Log warning message
   */
  protected warn(message: string, data?: unknown): void {
    console.warn(`[${this.id}] ${message}`, data || '');
  }

  /**
   * Log error message
   */
  protected error(message: string, error?: unknown): void {
    console.error(`[${this.id}] ${message}`, error || '');
  }

  /**
   * Fetch with timeout
   */
  protected async fetchWithTimeout<T>(
    fetchFn: () => Promise<T>,
    timeoutMs: number = this.defaultTimeoutMs
  ): Promise<T> {
    return Promise.race([
      fetchFn(),
      this.createTimeout<T>(timeoutMs),
    ]);
  }

  /**
   * Create a timeout promise that rejects
   */
  private createTimeout<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Calculate percentage change between two values
   */
  protected calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Determine change direction
   */
  protected getChangeDirection(change: number): 'up' | 'down' | 'neutral' {
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'neutral';
  }

  /**
   * Format current timestamp
   */
  protected now(): Date {
    return new Date();
  }
}
