/**
 * Notion-specific type definitions
 */

import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

/**
 * Notion provider configuration
 */
export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

/**
 * Notion database property types we care about
 */
export interface NotionDatabaseRow {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

/**
 * Parsed metric from Notion database
 */
export interface NotionMetric {
  name: string;
  value: number | string;
  type: 'currency' | 'count' | 'percentage' | 'duration' | 'text';
  category?: string;
  notes?: string;
  date?: Date;
}

/**
 * Raw Notion API response type
 */
export type NotionRawData = QueryDatabaseResponse;
