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

    // Parse metrics from JSONB
    const metrics: MetricValue[] = [];
    const metricsData = latestSnapshot.metrics as Record<string, any>;

    for (const [key, value] of Object.entries(metricsData)) {
      if (value && typeof value === 'object') {
        metrics.push(value as MetricValue);
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
