/**
 * Provider Registry
 *
 * Central registry for managing all data providers.
 * Provides methods to register, retrieve, and manage providers.
 */

import { DataProvider } from '@/lib/types/provider.types';
import { prisma } from '@/lib/prisma';

/**
 * Provider Registry Class
 */
class ProviderRegistry {
  private providers = new Map<string, DataProvider>();

  /**
   * Register a new provider
   *
   * @param provider - The provider instance to register
   * @throws Error if provider with same ID already exists
   */
  register(provider: DataProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(
        `Provider with ID "${provider.id}" is already registered`
      );
    }

    this.providers.set(provider.id, provider);
    console.log(`[Registry] Registered provider: ${provider.name} (${provider.id})`);
  }

  /**
   * Register multiple providers at once
   *
   * @param providers - Array of provider instances
   */
  registerAll(providers: DataProvider[]): void {
    providers.forEach((provider) => this.register(provider));
  }

  /**
   * Get a provider by ID
   *
   * @param providerId - The provider's unique identifier
   * @returns The provider instance or undefined if not found
   */
  get(providerId: string): DataProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get a provider by ID, throw error if not found
   *
   * @param providerId - The provider's unique identifier
   * @returns The provider instance
   * @throws Error if provider not found
   */
  getOrThrow(providerId: string): DataProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found in registry`);
    }
    return provider;
  }

  /**
   * Get all registered providers
   *
   * @returns Array of all provider instances
   */
  getAll(): DataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all enabled providers from the database
   *
   * @returns Array of enabled provider instances
   */
  async getEnabled(): Promise<DataProvider[]> {
    const configs = await prisma.providersConfig.findMany({
      where: { isEnabled: true },
      select: { providerId: true },
    });

    const enabledProviders: DataProvider[] = [];

    for (const config of configs) {
      const provider = this.providers.get(config.providerId);
      if (provider) {
        enabledProviders.push(provider);
      }
    }

    return enabledProviders;
  }

  /**
   * Check if a provider is registered
   *
   * @param providerId - The provider's unique identifier
   * @returns true if provider is registered
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Get count of registered providers
   *
   * @returns Number of registered providers
   */
  count(): number {
    return this.providers.size;
  }

  /**
   * Get all provider IDs
   *
   * @returns Array of provider IDs
   */
  getIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Unregister a provider
   *
   * @param providerId - The provider's unique identifier
   * @returns true if provider was unregistered, false if not found
   */
  unregister(providerId: string): boolean {
    const result = this.providers.delete(providerId);
    if (result) {
      console.log(`[Registry] Unregistered provider: ${providerId}`);
    }
    return result;
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
    console.log('[Registry] Cleared all providers');
  }

  /**
   * Validate all registered providers
   *
   * @returns Map of provider IDs to validation results
   */
  async validateAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [id, provider] of this.providers) {
      try {
        const isValid = await provider.validateConfig();
        results.set(id, isValid);
      } catch (error) {
        console.error(`[Registry] Validation failed for ${id}:`, error);
        results.set(id, false);
      }
    }

    return results;
  }
}

/**
 * Singleton instance of the provider registry
 */
export const providerRegistry = new ProviderRegistry();
