/**
 * Attio Provider
 *
 * Fetches deals and pipeline data from Attio CRM and transforms them
 * into standardized metrics for the CEO dashboard.
 */

import { BaseProvider } from '@/lib/providers/base-provider';
import { ProviderMetrics, MetricValue } from '@/lib/types/provider.types';
import { AttioConfigSchema } from '@/lib/validation/provider.schemas';
import { getRateLimiter } from '@/lib/utils/rate-limiter';
import {
  AttioConfig,
  AttioRawData,
  AttioRecord,
  AttioDeal,
  PipelineStage,
} from './attio-types';

export class AttioProvider extends BaseProvider<AttioConfig, AttioRawData> {
  id = 'attio';
  name = 'Attio CRM';
  fetchIntervalMinutes = 30; // Auto-refresh every 30 minutes

  private apiKey: string;
  private objectSlug: string;
  private baseUrl = 'https://api.attio.com/v2';
  private rateLimiter = getRateLimiter('attio');

  constructor(config: AttioConfig) {
    super();

    // Validate configuration
    const validated = AttioConfigSchema.parse(config);

    this.apiKey = validated.apiKey;
    this.objectSlug = validated.objectSlug;

    this.log('Initialized Attio provider');
  }

  /**
   * Fetch all deals from Attio
   */
  async fetch(): Promise<ProviderMetrics> {
    return this.fetchWithRetry(async () => {
      this.log('Fetching deals from Attio CRM');

      // Fetch all deals without filtering by stage
      const response = await this.rateLimiter.execute(async () => {
        return await this.queryRecords({});
      });

      return this.transform(response);
    });
  }

  /**
   * Query Attio records with optional filter
   */
  private async queryRecords(filter: Record<string, any>): Promise<AttioRawData> {
    const url = `${this.baseUrl}/objects/${this.objectSlug}/records/query`;

    const requestBody = {
      filter,
      limit: 500, // Max records per request
      offset: 0,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Attio API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Transform Attio deals to standardized metrics
   */
  transform(rawData: AttioRawData): ProviderMetrics {
    this.log(`Transforming ${rawData.data.length} Attio records`);

    const deals = this.parseDeals(rawData.data);
    const metrics: Record<string, MetricValue> = {};

    // Calculate Activity Metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const introCallsThisWeek = deals.filter(
      (d) => d.stage === PipelineStage.INTRO_CALL && d.createdAt >= oneWeekAgo
    ).length;

    const introCallsThisMonth = deals.filter(
      (d) => d.stage === PipelineStage.INTRO_CALL && d.createdAt >= oneMonthAgo
    ).length;

    const demosThisWeek = deals.filter(
      (d) => d.stage === PipelineStage.DEMO && d.stageChangedAt >= oneWeekAgo
    ).length;

    const demosThisMonth = deals.filter(
      (d) => d.stage === PipelineStage.DEMO && d.stageChangedAt >= oneMonthAgo
    ).length;

    metrics['intro_calls_this_week'] = {
      value: introCallsThisWeek,
      type: 'count',
      label: 'Intro Calls This Week',
    };

    metrics['intro_calls_this_month'] = {
      value: introCallsThisMonth,
      type: 'count',
      label: 'Intro Calls This Month',
    };

    metrics['demos_this_week'] = {
      value: demosThisWeek,
      type: 'count',
      label: 'Demos This Week',
    };

    metrics['demos_this_month'] = {
      value: demosThisMonth,
      type: 'count',
      label: 'Demos This Month',
    };

    // Calculate Pilot Revenue
    const pilotDeals = deals.filter((d) => d.stage === PipelineStage.PILOT);
    const pilotRevenue = pilotDeals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0);

    metrics['pilot_revenue'] = {
      value: pilotRevenue,
      type: 'currency',
      label: 'Pilot Revenue',
    };

    // Count deals in each stage
    const evaluationDeals = deals.filter((d) => d.stage === PipelineStage.EVALUATION);
    const schedulingDeals = deals.filter((d) => d.stage === PipelineStage.SCHEDULING);
    const upcomingCalls = deals.filter((d) => d.stage === PipelineStage.INTRO_CALL);

    metrics['evaluation_count'] = {
      value: evaluationDeals.length,
      type: 'count',
      label: 'Active Opportunities',
    };

    metrics['scheduling_count'] = {
      value: schedulingDeals.length,
      type: 'count',
      label: 'Need to Schedule',
    };

    metrics['intro_calls_count'] = {
      value: upcomingCalls.length,
      type: 'count',
      label: 'Upcoming Intro Calls',
    };

    return {
      providerId: this.id,
      timestamp: this.now(),
      metrics,
      metadata: {
        totalDeals: deals.length,
        deals: deals.map((d) => ({
          recordId: d.recordId,
          companyName: d.companyName,
          stage: d.stage,
          dealValue: d.dealValue,
          daysInStage: d.daysInStage,
          webUrl: d.webUrl,
        })),
      },
    };
  }

  /**
   * Parse Attio records into deal objects
   */
  private parseDeals(records: AttioRecord[]): AttioDeal[] {
    const deals: AttioDeal[] = [];

    for (const record of records) {
      try {
        const deal = this.parseDeal(record);
        if (deal) {
          deals.push(deal);
        }
      } catch (error) {
        this.warn('Failed to parse Attio record', error);
      }
    }

    return deals;
  }

  /**
   * Parse a single Attio record into a deal
   */
  private parseDeal(record: AttioRecord): AttioDeal | null {
    const { values } = record;

    // Extract company name (try multiple possible attribute names)
    const companyName =
      this.extractValue(values, 'company_name') ||
      this.extractValue(values, 'name') ||
      this.extractValue(values, 'company') ||
      'Unknown Company';

    // Extract stage
    const stageValue = this.extractValue(values, 'stage') || this.extractValue(values, 'status');
    if (!stageValue) {
      this.warn(`No stage found for record ${record.id.record_id}`);
      return null;
    }

    const stage = stageValue as PipelineStage;

    // Extract deal value
    const dealValue =
      this.extractValue(values, 'deal_value') ||
      this.extractValue(values, 'value') ||
      this.extractValue(values, 'amount') ||
      null;

    // Extract timestamps
    const createdAt = new Date(record.created_at);

    // Get stage change timestamp (use the most recent value's active_from)
    const stageAttribute = values['stage'] || values['status'];
    const stageChangedAt = stageAttribute?.[0]?.active_from
      ? new Date(stageAttribute[0].active_from)
      : createdAt;

    // Calculate days in current stage
    const now = new Date();
    const daysInStage = Math.floor((now.getTime() - stageChangedAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      recordId: record.id.record_id,
      companyName,
      stage,
      dealValue: typeof dealValue === 'number' ? dealValue : null,
      createdAt,
      stageChangedAt,
      daysInStage,
      webUrl: record.web_url,
    };
  }

  /**
   * Extract value from Attio attribute values array
   */
  private extractValue(values: Record<string, any[]>, attributeSlug: string): any {
    const attributeValues = values[attributeSlug];
    if (!attributeValues || attributeValues.length === 0) {
      return null;
    }

    // Return the most recent value (first in array)
    return attributeValues[0].value;
  }

  /**
   * Validate that the Attio configuration works
   */
  async validateConfig(): Promise<boolean> {
    try {
      this.log('Validating Attio configuration');

      // Try to query with limit 1 to test authentication
      await this.queryRecords({ limit: 1 });

      this.log('✓ Attio configuration is valid');
      return true;
    } catch (error) {
      this.error('✗ Attio configuration is invalid', error);
      return false;
    }
  }
}
