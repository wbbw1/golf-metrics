/**
 * Core provider types for the metrics dashboard
 */

/**
 * Standardized metric value with type information
 */
export interface MetricValue {
  value: number | string;
  type: 'currency' | 'count' | 'percentage' | 'duration' | 'text';
  label: string;
  change?: number; // Percentage change from previous period
  changeDirection?: 'up' | 'down' | 'neutral';
  unit?: string; // Optional unit for display (e.g., "USD", "ms", "%")
}

/**
 * Standardized metrics output from a provider
 */
export interface ProviderMetrics {
  providerId: string;
  timestamp: Date;
  metrics: Record<string, MetricValue>;
  metadata?: Record<string, unknown>;
}

/**
 * Base interface that all data providers must implement
 */
export interface DataProvider<TConfig = unknown, TRawData = unknown> {
  /** Unique identifier for the provider */
  id: string;

  /** Human-readable name */
  name: string;

  /** How often to fetch data (in minutes) */
  fetchIntervalMinutes: number;

  /**
   * Fetch data from the provider's API
   * @returns Standardized metrics data
   */
  fetch(): Promise<ProviderMetrics>;

  /**
   * Transform raw API response to standardized format
   * @param rawData - Raw data from the provider's API
   * @returns Standardized metrics
   */
  transform(rawData: TRawData): ProviderMetrics;

  /**
   * Validate that the provider's configuration is correct
   * @returns true if config is valid and provider is reachable
   */
  validateConfig(): Promise<boolean>;

  /** Optional webhook support */
  supportsWebhooks?: boolean;

  /**
   * Optional webhook handler
   * @param payload - Webhook payload from the provider
   * @returns Standardized metrics from webhook data
   */
  webhookHandler?(payload: unknown): Promise<ProviderMetrics>;
}

/**
 * Configuration for a provider stored in the database
 */
export interface ProviderConfig {
  id: string;
  providerId: string;
  name: string;
  isEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';
  fetchIntervalMinutes: number;
  apiCredentials?: Record<string, unknown>;
  config?: Record<string, unknown>;
  lastFetchAt?: Date;
  nextFetchAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a provider fetch operation
 */
export interface FetchResult {
  providerId: string;
  status: 'success' | 'failure' | 'partial';
  data?: ProviderMetrics;
  error?: Error | string;
  duration?: number; // in milliseconds
}

/**
 * Options for fetching from providers
 */
export interface FetchOptions {
  /** Force fetch even if data is fresh */
  force?: boolean;

  /** Specific providers to fetch (if not specified, fetches all enabled) */
  providerIds?: string[];

  /** Timeout for the fetch operation (ms) */
  timeout?: number;
}
