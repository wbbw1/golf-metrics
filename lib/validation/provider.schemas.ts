/**
 * Zod schemas for runtime validation
 */

import { z } from 'zod';

/**
 * Metric value schema
 */
export const MetricValueSchema = z.object({
  value: z.union([z.number(), z.string()]),
  type: z.enum(['currency', 'count', 'percentage', 'duration', 'text']),
  label: z.string().min(1),
  change: z.number().optional(),
  changeDirection: z.enum(['up', 'down', 'neutral']).optional(),
  unit: z.string().optional(),
});

/**
 * Provider metrics schema
 */
export const ProviderMetricsSchema = z.object({
  providerId: z.string().min(1),
  timestamp: z.date(),
  metrics: z.record(z.string(), MetricValueSchema),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Notion provider configuration schema
 */
export const NotionConfigSchema = z.object({
  apiKey: z.string().min(1, 'Notion API key is required'),
  databaseId: z.string().min(1, 'Notion database ID is required'),
});

/**
 * Attio provider configuration schema
 */
export const AttioConfigSchema = z.object({
  apiKey: z.string().min(1, 'Attio API key is required'),
  workspaceId: z.string().optional(),
});

/**
 * Google Analytics 4 provider configuration schema
 */
export const GA4ConfigSchema = z.object({
  propertyId: z.string().min(1, 'GA4 property ID is required'),
  serviceAccountKey: z.string().min(1, 'GA4 service account key (JSON) is required'),
});

/**
 * Phantombuster provider configuration schema
 */
export const PhantombusterConfigSchema = z.object({
  apiKey: z.string().min(1, 'Phantombuster API key is required'),
  agentIds: z.array(z.string()).min(1, 'At least one agent ID is required'),
});

/**
 * Generic provider config validation
 */
export const ProviderConfigSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1),
  isEnabled: z.boolean().default(true),
  fetchIntervalMinutes: z.number().int().positive(),
  apiCredentials: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
});

/**
 * Fetch options schema
 */
export const FetchOptionsSchema = z.object({
  force: z.boolean().optional(),
  providerIds: z.array(z.string()).optional(),
  timeout: z.number().int().positive().optional(),
});

/**
 * Type inference from Zod schemas
 */
export type MetricValue = z.infer<typeof MetricValueSchema>;
export type ProviderMetrics = z.infer<typeof ProviderMetricsSchema>;
export type NotionConfig = z.infer<typeof NotionConfigSchema>;
export type AttioConfig = z.infer<typeof AttioConfigSchema>;
export type GA4Config = z.infer<typeof GA4ConfigSchema>;
export type PhantombusterConfig = z.infer<typeof PhantombusterConfigSchema>;
export type ProviderConfigInput = z.infer<typeof ProviderConfigSchema>;
export type FetchOptions = z.infer<typeof FetchOptionsSchema>;
