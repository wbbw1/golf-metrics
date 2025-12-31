/**
 * Dashboard and metrics display types
 */

import { MetricValue } from './provider.types';

/**
 * Complete dashboard data structure
 */
export interface DashboardMetrics {
  providers: ProviderDashboardData[];
  lastUpdated: Date;
  staleness: StalenessInfo;
}

/**
 * Dashboard data for a single provider
 */
export interface ProviderDashboardData {
  providerId: string;
  name: string;
  metrics: MetricValue[];
  lastFetched: Date;
  isStale: boolean;
  isFetching?: boolean;
  error?: string;
  fetchIntervalMinutes: number;
}

/**
 * Information about data staleness across all providers
 */
export interface StalenessInfo {
  hasStaleData: boolean;
  staleProviders: string[];
  oldestDataAge: number; // Age in minutes of the oldest data
}

/**
 * Historical metrics for trend analysis
 */
export interface MetricsHistory {
  providerId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  dataPoints: MetricsDataPoint[];
}

/**
 * Single data point in historical metrics
 */
export interface MetricsDataPoint {
  timestamp: Date;
  metrics: Record<string, number | string>;
}

/**
 * Trend analysis for a specific metric
 */
export interface MetricTrend {
  metricKey: string;
  label: string;
  currentValue: number | string;
  previousValue?: number | string;
  change?: number; // Percentage change
  changeDirection: 'up' | 'down' | 'neutral';
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * API response wrapper for dashboard data
 */
export interface DashboardResponse {
  success: boolean;
  data?: DashboardMetrics;
  error?: string;
  timestamp: Date;
}

/**
 * API response for provider-specific actions
 */
export interface ProviderActionResponse {
  success: boolean;
  providerId: string;
  message?: string;
  data?: unknown;
  error?: string;
}
