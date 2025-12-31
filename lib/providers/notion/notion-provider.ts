/**
 * Notion Provider
 *
 * Fetches metrics from a Notion database and transforms them
 * into standardized format.
 */

import { Client } from '@notionhq/client';
import { BaseProvider } from '@/lib/providers/base-provider';
import { ProviderMetrics, MetricValue } from '@/lib/types/provider.types';
import { NotionConfigSchema } from '@/lib/validation/provider.schemas';
import { getRateLimiter } from '@/lib/utils/rate-limiter';
import { NotionConfig, NotionRawData, NotionMetric } from './notion-types';

export class NotionProvider extends BaseProvider<NotionConfig, NotionRawData> {
  id = 'notion';
  name = 'Notion';
  fetchIntervalMinutes = 1440; // Daily (24 hours)

  private client: Client;
  private databaseId: string;
  private rateLimiter = getRateLimiter('notion');

  constructor(config: NotionConfig) {
    super();

    // Validate configuration
    const validated = NotionConfigSchema.parse(config);

    this.client = new Client({ auth: validated.apiKey });
    this.databaseId = validated.databaseId;

    this.log('Initialized Notion provider');
  }

  /**
   * Fetch data from Notion database (latest week only)
   */
  async fetch(): Promise<ProviderMetrics> {
    return this.fetchWithRetry(async () => {
      this.log('Fetching from Notion database');

      // Use rate limiter to respect API limits
      const response = await this.rateLimiter.execute(async () => {
        return await this.client.databases.query({
          database_id: this.databaseId,
          sorts: [
            {
              timestamp: 'created_time',
              direction: 'descending',
            },
          ],
          page_size: 100, // Fetch last 100 entries
        });
      });

      return this.transform(response as NotionRawData);
    });
  }

  /**
   * Fetch multiple weeks of data from Notion database
   * Each row in Notion represents one week of statistics
   */
  async fetchMultiple(): Promise<ProviderMetrics[]> {
    return this.fetchWithRetry(async () => {
      this.log('Fetching multiple weeks from Notion database');

      // Use rate limiter to respect API limits
      const response = await this.rateLimiter.execute(async () => {
        return await this.client.databases.query({
          database_id: this.databaseId,
          sorts: [
            {
              timestamp: 'created_time',
              direction: 'descending',
            },
          ],
          page_size: 100, // Fetch last 100 weeks
        });
      });

      return this.transformMultiple(response as NotionRawData);
    });
  }

  /**
   * Transform Notion database response to standardized format (latest week only)
   */
  transform(rawData: NotionRawData): ProviderMetrics {
    this.log(`Transforming ${rawData.results.length} Notion entries`);

    const metrics: Record<string, MetricValue> = {};
    const parsedMetrics = this.parseNotionRows(rawData.results);

    // Group metrics by name and aggregate/get latest
    const metricMap = new Map<string, NotionMetric>();

    for (const metric of parsedMetrics) {
      const key = this.normalizeMetricKey(metric.name);

      // Use latest metric for each key
      if (!metricMap.has(key) || (metric.date && metric.date > (metricMap.get(key)?.date || new Date(0)))) {
        metricMap.set(key, metric);
      }
    }

    // Convert to standardized format
    for (const [key, metric] of metricMap) {
      metrics[key] = {
        value: metric.value,
        type: metric.type,
        label: metric.name,
      };
    }

    return {
      providerId: this.id,
      timestamp: this.now(),
      metrics,
      metadata: {
        totalEntries: rawData.results.length,
        hasMore: rawData.has_more,
      },
    };
  }

  /**
   * Transform Notion database response into multiple ProviderMetrics (one per week)
   * Each row in Notion represents a complete week of statistics
   */
  transformMultiple(rawData: NotionRawData): ProviderMetrics[] {
    this.log(`Transforming ${rawData.results.length} Notion weeks`);

    const weeklySnapshots: ProviderMetrics[] = [];

    // Group rows by week (by Date field)
    for (const row of rawData.results) {
      try {
        // Type guard: only process PageObjectResponse which has properties
        if (!('properties' in row)) continue;

        const rowMetrics = this.parseNotionRow(row);
        if (!rowMetrics) continue;

        // Get the date for this week
        const props = row.properties;
        const dateProperty = props['Date'];
        const weekDate =
          dateProperty && 'date' in dateProperty && dateProperty.date?.start
            ? new Date(dateProperty.date.start)
            : 'created_time' in row
            ? new Date(row.created_time)
            : new Date();

        // Parse all metrics from this row into a single snapshot
        const metrics: Record<string, MetricValue> = {};
        const metricsArray = Array.isArray(rowMetrics) ? rowMetrics : [rowMetrics];

        for (const metric of metricsArray) {
          const key = this.normalizeMetricKey(metric.name);
          metrics[key] = {
            value: metric.value,
            type: metric.type,
            label: metric.name,
          };
        }

        // Create a snapshot for this week
        weeklySnapshots.push({
          providerId: this.id,
          timestamp: weekDate,
          metrics,
          metadata: {
            weekDate: weekDate.toISOString(),
          },
        });
      } catch (error) {
        this.warn('Failed to parse Notion row for weekly snapshot', error);
      }
    }

    this.log(`Created ${weeklySnapshots.length} weekly snapshots`);
    return weeklySnapshots;
  }

  /**
   * Parse Notion database rows into metrics
   */
  private parseNotionRows(rows: any[]): NotionMetric[] {
    const metrics: NotionMetric[] = [];

    for (const row of rows) {
      try {
        const rowMetrics = this.parseNotionRow(row);
        if (rowMetrics) {
          // parseNotionRow now returns an array for LinkedIn rows
          if (Array.isArray(rowMetrics)) {
            metrics.push(...rowMetrics);
          } else {
            metrics.push(rowMetrics);
          }
        }
      } catch (error) {
        this.warn('Failed to parse Notion row', error);
      }
    }

    return metrics;
  }

  /**
   * Parse a single Notion row into metric(s)
   */
  private parseNotionRow(row: any): NotionMetric | NotionMetric[] | null {
    const props = row.properties;

    // Auto-detect structure: check if this is LinkedIn metrics or generic metrics
    const hasLinkedInColumns = props['Linkedin_content_engagement'] ||
                                props['Linkedin_impressions'] ||
                                props['Linkedin_followers_stats'];

    if (hasLinkedInColumns) {
      return this.parseLinkedInRow(row);
    }

    // Original generic parser for standard metric databases
    return this.parseGenericRow(row);
  }

  /**
   * Parse LinkedIn-specific database row - returns array of all metrics
   */
  private parseLinkedInRow(row: any): NotionMetric[] {
    const props = row.properties;
    const metrics: NotionMetric[] = [];

    // Get date from Date property
    const dateProperty = props['Date'];
    const date = dateProperty?.date?.start ? new Date(dateProperty.date.start) : new Date(row.created_time);

    // Parse each LinkedIn metric column
    const linkedInMetrics = [
      { key: 'Linkedin_content_engagement', name: 'LinkedIn Content Engagement', type: 'count' as const },
      { key: 'Linkedin_impressions', name: 'LinkedIn Impressions', type: 'count' as const },
      { key: 'Linkedin_followers_stats', name: 'LinkedIn Followers', type: 'count' as const },
    ];

    // Extract ALL metrics from the row
    for (const metric of linkedInMetrics) {
      const prop = props[metric.key];
      if (prop && prop.number !== null && prop.number !== undefined) {
        metrics.push({
          name: metric.name,
          value: prop.number,
          type: metric.type,
          date,
        });
      }
    }

    return metrics;
  }

  /**
   * Parse generic metric database row
   */
  private parseGenericRow(row: any): NotionMetric | null {
    const props = row.properties;

    // Get metric name
    const nameProperty = this.findPropertyByType(props, 'title');
    if (!nameProperty) return null;

    const name = this.extractTitle(nameProperty);
    if (!name) return null;

    // Get value (try number first, then text)
    let value: number | string = 0;
    const numberProperty = this.findPropertyByType(props, 'number');
    const textProperty = props['Value'] || this.findPropertyByType(props, 'rich_text');

    if (numberProperty && numberProperty.number !== null) {
      value = numberProperty.number;
    } else if (textProperty) {
      value = this.extractRichText(textProperty) || '0';
    }

    // Get type (default to 'count')
    const typeProperty = props['Type'];
    let type: 'currency' | 'count' | 'percentage' | 'duration' | 'text' = 'count';

    if (typeProperty && typeProperty.select) {
      const typeValue = typeProperty.select.name.toLowerCase();
      if (['currency', 'count', 'percentage', 'duration', 'text'].includes(typeValue)) {
        type = typeValue as any;
      }
    }

    // Get optional fields
    const categoryProperty = props['Category'];
    const category = categoryProperty?.select?.name;

    const notesProperty = props['Notes'];
    const notes = notesProperty ? this.extractRichText(notesProperty) : undefined;

    const dateProperty = props['Date'];
    const date = dateProperty?.date?.start ? new Date(dateProperty.date.start) : undefined;

    return {
      name,
      value,
      type,
      category,
      notes,
      date: date || new Date(row.created_time),
    };
  }

  /**
   * Find a property by its type
   */
  private findPropertyByType(properties: any, type: string): any {
    for (const key in properties) {
      if (properties[key].type === type) {
        return properties[key];
      }
    }
    return null;
  }

  /**
   * Extract text from title property
   */
  private extractTitle(property: any): string {
    if (property.title && property.title.length > 0) {
      return property.title[0].plain_text;
    }
    return '';
  }

  /**
   * Extract text from rich_text property
   */
  private extractRichText(property: any): string {
    if (property.rich_text && property.rich_text.length > 0) {
      return property.rich_text.map((t: any) => t.plain_text).join('');
    }
    return '';
  }

  /**
   * Normalize metric key for storage
   */
  private normalizeMetricKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Validate that the Notion configuration works
   */
  async validateConfig(): Promise<boolean> {
    try {
      this.log('Validating Notion configuration');

      // Try to retrieve the database
      const response = await this.rateLimiter.execute(async () => {
        return await this.client.databases.retrieve({
          database_id: this.databaseId,
        });
      });

      this.log('✓ Notion configuration is valid');
      return true;
    } catch (error) {
      this.error('✗ Notion configuration is invalid', error);
      return false;
    }
  }
}
