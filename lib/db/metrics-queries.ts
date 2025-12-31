/**
 * Database Query Utilities for Metrics
 *
 * Helper functions for querying metrics data from the database.
 */

import { prisma } from '@/lib/prisma';
import { DashboardMetrics, ProviderDashboardData, StalenessInfo } from '@/lib/types/metrics.types';
import { MetricValue } from '@/lib/types/provider.types';

/**
 * Get latest metrics for all providers
 */
export async function getLatestMetrics(): Promise<DashboardMetrics> {
  const providers = await prisma.providersConfig.findMany({
    where: { isEnabled: true },
    include: {
      metricsSnapshots: {
        orderBy: { snapshotTime: 'desc' },
        take: 1,
      },
    },
  });

  const providerData: ProviderDashboardData[] = [];
  const now = new Date();
  const staleProviders: string[] = [];
  let oldestDataAge = 0;

  for (const provider of providers) {
    const latestSnapshot = provider.metricsSnapshots[0];

    if (!latestSnapshot) {
      // No data yet
      providerData.push({
        providerId: provider.providerId,
        name: provider.name,
        metrics: [],
        lastFetched: provider.lastFetchAt || new Date(0),
        isStale: true,
        fetchIntervalMinutes: provider.fetchIntervalMinutes,
      });
      staleProviders.push(provider.providerId);
      continue;
    }

    // Calculate staleness
    const lastFetchAt = provider.lastFetchAt || latestSnapshot.snapshotTime;
    const minutesSinceLastFetch = (now.getTime() - lastFetchAt.getTime()) / 1000 / 60;
    const isStale = minutesSinceLastFetch >= provider.fetchIntervalMinutes;

    if (isStale) {
      staleProviders.push(provider.providerId);
    }

    if (minutesSinceLastFetch > oldestDataAge) {
      oldestDataAge = minutesSinceLastFetch;
    }

    // Parse metrics from JSONB and add comparison data
    const metrics: Array<MetricValue & { key: string }> = [];
    const metricsData = latestSnapshot.metrics as Record<string, any>;

    // Get comparison data for this provider (7-day comparison)
    const comparison = await getMetricsComparison(provider.providerId, 7);

    for (const [key, value] of Object.entries(metricsData)) {
      if (value && typeof value === 'object') {
        const comparisonData = comparison?.comparisons[key];
        metrics.push({
          ...value,
          key,
          change: comparisonData?.change ?? undefined,
          changeDirection: comparisonData?.trend === 'up' ? 'up' : comparisonData?.trend === 'down' ? 'down' : 'neutral',
        } as MetricValue & { key: string });
      }
    }

    providerData.push({
      providerId: provider.providerId,
      name: provider.name,
      metrics,
      lastFetched: lastFetchAt,
      isStale,
      fetchIntervalMinutes: provider.fetchIntervalMinutes,
    });
  }

  const staleness: StalenessInfo = {
    hasStaleData: staleProviders.length > 0,
    staleProviders,
    oldestDataAge: Math.round(oldestDataAge),
  };

  return {
    providers: providerData,
    lastUpdated: now,
    staleness,
  };
}

/**
 * Get metrics history for a specific provider
 */
export async function getProviderMetrics(providerId: string, days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const snapshots = await prisma.metricsSnapshot.findMany({
    where: {
      providerId,
      snapshotDate: { gte: cutoffDate },
    },
    orderBy: { snapshotDate: 'asc' },
    select: {
      snapshotDate: true,
      snapshotTime: true,
      metrics: true,
    },
  });

  return snapshots;
}

/**
 * Get provider staleness information
 */
export async function getProviderStaleness(providerId: string): Promise<{
  isStale: boolean;
  minutesOld: number;
}> {
  const config = await prisma.providersConfig.findUnique({
    where: { providerId },
  });

  if (!config?.lastFetchAt) {
    return { isStale: true, minutesOld: Infinity };
  }

  const now = new Date();
  const minutesOld = (now.getTime() - config.lastFetchAt.getTime()) / 1000 / 60;
  const isStale = minutesOld >= config.fetchIntervalMinutes;

  return { isStale, minutesOld: Math.round(minutesOld) };
}

/**
 * Get fetch logs for a provider
 */
export async function getProviderFetchLogs(providerId: string, limit: number = 10) {
  const logs = await prisma.fetchLog.findMany({
    where: { providerId },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return logs;
}

/**
 * Get all provider configurations
 */
export async function getAllProviderConfigs() {
  return await prisma.providersConfig.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a single provider configuration
 */
export async function getProviderConfig(providerId: string) {
  return await prisma.providersConfig.findUnique({
    where: { providerId },
  });
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const [totalSnapshots, totalLogs, activeProviders, lastFetch] = await Promise.all([
    prisma.metricsSnapshot.count(),
    prisma.fetchLog.count(),
    prisma.providersConfig.count({ where: { isEnabled: true } }),
    prisma.fetchLog.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    }),
  ]);

  return {
    totalSnapshots,
    totalLogs,
    activeProviders,
    lastFetch: lastFetch?.startedAt || null,
  };
}

/**
 * Get metrics comparison between the two most recent weeks
 * For weekly data: compares Week N vs Week N-1
 */
export async function getMetricsComparison(
  providerId: string,
  periodDays: number = 7 // Not used for weekly comparison, kept for compatibility
) {
  // Get the 2 most recent snapshots
  const snapshots = await prisma.metricsSnapshot.findMany({
    where: { providerId },
    orderBy: { snapshotTime: 'desc' },
    take: 2,
  });

  if (snapshots.length === 0) {
    return null;
  }

  const currentSnapshot = snapshots[0];
  const previousSnapshot = snapshots.length > 1 ? snapshots[1] : null;

  const currentMetrics = currentSnapshot.metrics as Record<string, any>;
  const previousMetrics = previousSnapshot?.metrics as Record<string, any> || {};

  const comparisons: Record<string, {
    current: number;
    previous: number | null;
    change: number | null;
    changePercent: number | null;
    trend: 'up' | 'down' | 'neutral';
  }> = {};

  // Calculate comparisons for each metric
  for (const [key, value] of Object.entries(currentMetrics)) {
    if (value && typeof value === 'object' && 'value' in value) {
      const currentValue = typeof value.value === 'number' ? value.value : parseFloat(String(value.value));
      const previousValue = previousMetrics[key]?.value;
      const prevNum = previousValue !== undefined && previousValue !== null
        ? (typeof previousValue === 'number' ? previousValue : parseFloat(String(previousValue)))
        : null;

      let change = null;
      let changePercent = null;
      let trend: 'up' | 'down' | 'neutral' = 'neutral';

      if (prevNum !== null && !isNaN(prevNum) && !isNaN(currentValue)) {
        change = currentValue - prevNum;
        changePercent = prevNum !== 0 ? (change / prevNum) * 100 : 0;
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      }

      comparisons[key] = {
        current: currentValue,
        previous: prevNum,
        change,
        changePercent,
        trend,
      };
    }
  }

  return {
    periodDays, // For compatibility
    currentDate: currentSnapshot.snapshotTime,
    previousDate: previousSnapshot?.snapshotTime || null,
    comparisons,
  };
}

/**
 * Get time-series data for charts
 */
export async function getMetricsTimeSeries(
  providerId: string,
  days: number = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const snapshots = await prisma.metricsSnapshot.findMany({
    where: {
      providerId,
      snapshotDate: { gte: cutoffDate },
    },
    orderBy: { snapshotTime: 'asc' },
    select: {
      snapshotDate: true,
      snapshotTime: true,
      metrics: true,
    },
  });

  // Transform into chart-friendly format
  const timeSeriesData: Array<{
    date: string;
    timestamp: Date;
    [key: string]: any;
  }> = [];

  for (const snapshot of snapshots) {
    const metrics = snapshot.metrics as Record<string, any>;
    const dataPoint: any = {
      date: snapshot.snapshotDate.toISOString().split('T')[0],
      timestamp: snapshot.snapshotTime,
    };

    // Extract numeric values for each metric
    for (const [key, value] of Object.entries(metrics)) {
      if (value && typeof value === 'object' && 'value' in value) {
        const numValue = typeof value.value === 'number'
          ? value.value
          : parseFloat(String(value.value));
        if (!isNaN(numValue)) {
          dataPoint[key] = numValue;
        }
      }
    }

    timeSeriesData.push(dataPoint);
  }

  return timeSeriesData;
}
