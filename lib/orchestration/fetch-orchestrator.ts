/**
 * Fetch Orchestrator
 *
 * Manages parallel fetching from multiple providers, handles errors,
 * logs fetch attempts, and persists metrics to the database.
 */

import { PrismaClient } from '@prisma/client';
import { DataProvider, ProviderMetrics, FetchResult } from '@/lib/types/provider.types';

export class FetchOrchestrator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Fetch data from all providers in parallel
   *
   * @param providers - Array of providers to fetch from
   * @returns Array of fetch results
   */
  async fetchAll(providers: DataProvider[]): Promise<FetchResult[]> {
    console.log(`[Orchestrator] Starting parallel fetch for ${providers.length} providers`);

    const startTime = Date.now();

    // Fetch from all providers in parallel using Promise.allSettled
    const results = await Promise.allSettled(
      providers.map((provider) => this.fetchProvider(provider))
    );

    const duration = Date.now() - startTime;
    console.log(`[Orchestrator] Completed all fetches in ${duration}ms`);

    // Transform results to FetchResult format
    return results.map((result, idx) => {
      const provider = providers[idx];

      if (result.status === 'fulfilled') {
        return {
          providerId: provider.id,
          status: 'success' as const,
          data: result.value,
        };
      } else {
        return {
          providerId: provider.id,
          status: 'failure' as const,
          error: result.reason,
        };
      }
    });
  }

  /**
   * Fetch data from a single provider
   *
   * @param provider - The provider to fetch from
   * @returns The fetched metrics (latest one if multiple)
   */
  async fetchProvider(provider: DataProvider): Promise<ProviderMetrics> {
    const logId = await this.startFetchLog(provider.id);
    const startTime = Date.now();

    try {
      console.log(`[Orchestrator] Fetching from ${provider.name}...`);

      // Check if provider supports multiple snapshots (e.g., weekly data)
      if (provider.fetchMultiple) {
        const dataArray = await provider.fetchMultiple();
        const duration = Date.now() - startTime;

        if (dataArray.length === 0) {
          throw new Error('No data returned from provider');
        }

        console.log(`[Orchestrator] Fetched ${dataArray.length} snapshots from ${provider.name}`);

        // Save each snapshot separately
        for (const data of dataArray) {
          await this.saveMetricsSnapshot(data);
        }

        // Save success log
        await this.saveFetchSuccess(logId, duration, dataArray[0]);

        // Update provider's last fetch time
        await this.updateProviderFetchTime(provider.id);

        console.log(`[Orchestrator] ✓ ${provider.name} fetched ${dataArray.length} snapshots in ${duration}ms`);

        // Return the latest snapshot
        return dataArray[0];
      } else {
        // Standard single-snapshot fetch
        const data = await provider.fetch();
        const duration = Date.now() - startTime;

        // Save success
        await this.saveFetchSuccess(logId, duration, data);

        // Save metrics snapshot
        await this.saveMetricsSnapshot(data);

        // Update provider's last fetch time
        await this.updateProviderFetchTime(provider.id);

        console.log(`[Orchestrator] ✓ ${provider.name} fetched successfully in ${duration}ms`);

        return data;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Save failure
      await this.saveFetchFailure(logId, duration, error);

      console.error(`[Orchestrator] ✗ ${provider.name} fetch failed:`, error);

      throw error;
    }
  }

  /**
   * Check if a provider should be refreshed based on its fetch interval
   *
   * @param providerId - The provider's ID
   * @returns true if provider should be refreshed
   */
  async shouldRefresh(providerId: string): Promise<boolean> {
    const config = await this.prisma.providersConfig.findUnique({
      where: { providerId },
    });

    if (!config) {
      console.warn(`[Orchestrator] Provider config not found: ${providerId}`);
      return true; // Fetch if no config exists
    }

    if (!config.isEnabled) {
      return false; // Don't fetch disabled providers
    }

    if (!config.lastFetchAt) {
      return true; // Never fetched before
    }

    const now = new Date();
    const minutesSinceLastFetch = (now.getTime() - config.lastFetchAt.getTime()) / 1000 / 60;

    return minutesSinceLastFetch >= config.fetchIntervalMinutes;
  }

  /**
   * Start a fetch log entry
   *
   * @param providerId - The provider's ID
   * @returns The log entry ID
   */
  private async startFetchLog(providerId: string): Promise<string> {
    const log = await this.prisma.fetchLog.create({
      data: {
        providerId,
        startedAt: new Date(),
        status: 'SUCCESS', // Will be updated on completion
      },
    });

    return log.id;
  }

  /**
   * Save successful fetch log
   */
  private async saveFetchSuccess(
    logId: string,
    duration: number,
    data: ProviderMetrics
  ): Promise<void> {
    await this.prisma.fetchLog.update({
      where: { id: logId },
      data: {
        completedAt: new Date(),
        status: 'SUCCESS',
        durationMs: duration,
        recordsFetched: Object.keys(data.metrics).length,
      },
    });
  }

  /**
   * Save failed fetch log
   */
  private async saveFetchFailure(
    logId: string,
    duration: number,
    error: unknown
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await this.prisma.fetchLog.update({
      where: { id: logId },
      data: {
        completedAt: new Date(),
        status: 'FAILURE',
        durationMs: duration,
        errorMessage,
      },
    });
  }

  /**
   * Save metrics snapshot to database
   */
  private async saveMetricsSnapshot(data: ProviderMetrics): Promise<void> {
    // Check if a snapshot for this exact date already exists
    const existing = await this.prisma.metricsSnapshot.findFirst({
      where: {
        providerId: data.providerId,
        snapshotTime: data.timestamp,
      },
    });

    if (existing) {
      // Update existing snapshot
      await this.prisma.metricsSnapshot.update({
        where: { id: existing.id },
        data: {
          metrics: data.metrics as any,
          rawData: data.metadata as any,
          recordsCount: Object.keys(data.metrics).length,
        },
      });
    } else {
      // Create new snapshot
      await this.prisma.metricsSnapshot.create({
        data: {
          providerId: data.providerId,
          snapshotDate: data.timestamp, // Use the timestamp as the date
          snapshotTime: data.timestamp,
          metrics: data.metrics as any, // Prisma Json type
          rawData: data.metadata as any,
          recordsCount: Object.keys(data.metrics).length,
        },
      });
    }
  }

  /**
   * Update provider's last fetch time
   */
  private async updateProviderFetchTime(providerId: string): Promise<void> {
    const now = new Date();

    // Get the provider's fetch interval
    const config = await this.prisma.providersConfig.findUnique({
      where: { providerId },
      select: { fetchIntervalMinutes: true },
    });

    if (!config) return;

    // Calculate next fetch time
    const nextFetchAt = new Date(now.getTime() + config.fetchIntervalMinutes * 60 * 1000);

    await this.prisma.providersConfig.update({
      where: { providerId },
      data: {
        lastFetchAt: now,
        nextFetchAt,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get providers that need refreshing
   *
   * @param providers - Array of providers to check
   * @returns Array of providers that should be fetched
   */
  async getProvidersToRefresh(providers: DataProvider[]): Promise<DataProvider[]> {
    const toRefresh: DataProvider[] = [];

    for (const provider of providers) {
      const should = await this.shouldRefresh(provider.id);
      if (should) {
        toRefresh.push(provider);
      }
    }

    return toRefresh;
  }

  /**
   * Fetch only providers that need refreshing
   *
   * @param providers - Array of all providers
   * @returns Array of fetch results
   */
  async fetchStale(providers: DataProvider[]): Promise<FetchResult[]> {
    const providersToFetch = await this.getProvidersToRefresh(providers);

    if (providersToFetch.length === 0) {
      console.log('[Orchestrator] No providers need refreshing');
      return [];
    }

    console.log(
      `[Orchestrator] ${providersToFetch.length} provider(s) need refreshing:`,
      providersToFetch.map((p) => p.name).join(', ')
    );

    return this.fetchAll(providersToFetch);
  }
}
