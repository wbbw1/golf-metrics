/**
 * Server Actions for Metrics
 *
 * Next.js Server Actions for fetching and managing metrics data.
 * These are called directly from Client Components without API routes.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { FetchOrchestrator } from '@/lib/orchestration/fetch-orchestrator';
import { providerRegistry } from '@/lib/providers/registry';
import { NotionProvider } from '@/lib/providers/notion/notion-provider';
import { AttioProvider } from '@/lib/providers/attio/attio-provider';
import { GA4Provider } from '@/lib/providers/ga4/ga4-provider';

/**
 * Initialize all configured providers
 */
function initializeProviders() {
  // Clear existing registrations
  providerRegistry.clear();

  // Register Notion provider if configured
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_DATABASE_ID,
    });
    providerRegistry.register(notionProvider);
  }

  // Register Attio provider if configured
  if (process.env.ATTIO_API_KEY) {
    const attioProvider = new AttioProvider({
      apiKey: process.env.ATTIO_API_KEY,
      objectSlug: 'deals', // Default to "deals" object
    });
    providerRegistry.register(attioProvider);
  }

  // Register GA4 provider if configured
  if (process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_KEY) {
    const ga4Provider = new GA4Provider({
      propertyId: process.env.GA4_PROPERTY_ID,
      serviceAccountKey: process.env.GA4_SERVICE_ACCOUNT_KEY,
    });
    providerRegistry.register(ga4Provider);
  }
}

/**
 * Fetch metrics from all configured providers
 */
export async function fetchAllMetrics() {
  try {
    initializeProviders();

    const orchestrator = new FetchOrchestrator(prisma);
    const providers = providerRegistry.getAll();

    if (providers.length === 0) {
      return {
        success: false,
        error: 'No providers configured',
        results: [],
      };
    }

    const results = await orchestrator.fetchAll(providers);

    // Revalidate the dashboard page
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/ceo');

    const successCount = results.filter((r) => r.status === 'success').length;

    return {
      success: successCount > 0,
      message: `Successfully fetched ${successCount}/${providers.length} providers`,
      results: results.map((r) => ({
        providerId: r.providerId,
        status: r.status,
        error: r.error instanceof Error ? r.error.message : r.error,
      })),
    };
  } catch (error) {
    console.error('[Action] fetchAllMetrics failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
    };
  }
}

/**
 * Fetch metrics from a specific provider
 */
export async function fetchProviderMetrics(providerId: string) {
  try {
    initializeProviders();

    const provider = providerRegistry.get(providerId);

    if (!provider) {
      return {
        success: false,
        error: `Provider "${providerId}" not found or not configured`,
      };
    }

    const orchestrator = new FetchOrchestrator(prisma);
    const result = await orchestrator.fetchProvider(provider);

    // Revalidate the dashboard page
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/ceo');

    return {
      success: true,
      message: `Successfully fetched metrics from ${provider.name}`,
      data: {
        providerId: result.providerId,
        timestamp: result.timestamp,
        metricsCount: Object.keys(result.metrics).length,
      },
    };
  } catch (error) {
    console.error(`[Action] fetchProviderMetrics(${providerId}) failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch only stale providers (those that need refreshing)
 */
export async function fetchStaleMetrics() {
  try {
    initializeProviders();

    const orchestrator = new FetchOrchestrator(prisma);
    const providers = providerRegistry.getAll();

    if (providers.length === 0) {
      return {
        success: false,
        error: 'No providers configured',
        results: [],
      };
    }

    const results = await orchestrator.fetchStale(providers);

    if (results.length === 0) {
      return {
        success: true,
        message: 'All providers are up to date',
        results: [],
      };
    }

    // Revalidate the dashboard page
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/ceo');

    const successCount = results.filter((r) => r.status === 'success').length;

    return {
      success: successCount > 0,
      message: `Refreshed ${successCount}/${results.length} stale providers`,
      results: results.map((r) => ({
        providerId: r.providerId,
        status: r.status,
        error: r.error instanceof Error ? r.error.message : r.error,
      })),
    };
  } catch (error) {
    console.error('[Action] fetchStaleMetrics failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
    };
  }
}

/**
 * Validate a provider's configuration
 */
export async function validateProvider(providerId: string) {
  try {
    initializeProviders();

    const provider = providerRegistry.get(providerId);

    if (!provider) {
      return {
        success: false,
        error: `Provider "${providerId}" not found`,
      };
    }

    const isValid = await provider.validateConfig();

    return {
      success: isValid,
      message: isValid
        ? `${provider.name} configuration is valid`
        : `${provider.name} configuration is invalid`,
    };
  } catch (error) {
    console.error(`[Action] validateProvider(${providerId}) failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
