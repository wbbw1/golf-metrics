import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { BaseProvider } from '@/lib/providers/base-provider';
import { ProviderMetrics, MetricValue } from '@/lib/types/provider.types';
import { GA4ConfigSchema } from '@/lib/validation/provider.schemas';
import { getRateLimiter } from '@/lib/utils/rate-limiter';
import { GA4Config, GA4TrafficData } from './ga4-types';

export class GA4Provider extends BaseProvider<GA4Config, any> {
  id = 'ga4';
  name = 'Google Analytics 4';
  fetchIntervalMinutes = 240; // 4 hours (intraday data refresh)

  private client: BetaAnalyticsDataClient;
  private propertyId: string;
  private rateLimiter = getRateLimiter('ga4');

  constructor(config: GA4Config) {
    super();

    // Validate configuration
    const validated = GA4ConfigSchema.parse(config);

    // Initialize GA4 client with service account
    const credentials = JSON.parse(validated.serviceAccountKey);
    this.client = new BetaAnalyticsDataClient({ credentials });

    this.propertyId = validated.propertyId;

    this.log('Initialized GA4 provider');
  }

  /**
   * Fetch multiple days of historical data (for charts)
   */
  async fetchMultiple(): Promise<ProviderMetrics[]> {
    return this.fetchWithRetry(async () => {
      this.log('Fetching 90 days of historical GA4 data');

      // Fetch daily data for last 90 days
      const [response] = await this.rateLimiter.execute(async () => {
        return await this.client.runReport({
          property: `properties/${this.propertyId}`,
          dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        });
      });

      return this.transformMultiple(response);
    });
  }

  /**
   * Fetch traffic data from GA4
   */
  async fetch(): Promise<ProviderMetrics> {
    return this.fetchWithRetry(async () => {
      this.log('Fetching GA4 traffic data');

      // Use batch request to get all periods efficiently
      const [response] = await this.rateLimiter.execute(async () => {
        return await this.client.batchRunReports({
          property: `properties/${this.propertyId}`,
          requests: [
            // Today vs Yesterday
            {
              dateRanges: [
                { startDate: 'today', endDate: 'today' },
                { startDate: 'yesterday', endDate: 'yesterday' },
              ],
              metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
              ],
            },
            // This week vs Last week
            {
              dateRanges: [
                { startDate: '7daysAgo', endDate: 'today' },
                { startDate: '14daysAgo', endDate: '8daysAgo' },
              ],
              metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
              ],
            },
            // This month vs Last month
            {
              dateRanges: [
                { startDate: '30daysAgo', endDate: 'today' },
                { startDate: '60daysAgo', endDate: '31daysAgo' },
              ],
              metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
              ],
            },
          ],
        });
      });

      return this.transform(response);
    });
  }

  /**
   * Transform GA4 batch response to standardized metrics
   */
  transform(batchResponse: any): ProviderMetrics {
    this.log('Transforming GA4 batch response');

    const [todayReport, weekReport, monthReport] = batchResponse.reports;

    const metrics: Record<string, MetricValue> = {};

    // Parse Today
    const today = this.parseReport(todayReport);
    metrics['today_users'] = {
      value: today.current.users,
      type: 'count',
      label: 'Users Today',
      change: today.change.users,
      changeDirection: this.getChangeDirection(today.change.users),
    };
    metrics['today_sessions'] = {
      value: today.current.sessions,
      type: 'count',
      label: 'Sessions Today',
      change: today.change.sessions,
      changeDirection: this.getChangeDirection(today.change.sessions),
    };

    // Parse This Week
    const week = this.parseReport(weekReport);
    metrics['week_users'] = {
      value: week.current.users,
      type: 'count',
      label: 'Users This Week',
      change: week.change.users,
      changeDirection: this.getChangeDirection(week.change.users),
    };
    metrics['week_sessions'] = {
      value: week.current.sessions,
      type: 'count',
      label: 'Sessions This Week',
      change: week.change.sessions,
      changeDirection: this.getChangeDirection(week.change.sessions),
    };

    // Parse This Month
    const month = this.parseReport(monthReport);
    metrics['month_users'] = {
      value: month.current.users,
      type: 'count',
      label: 'Users This Month',
      change: month.change.users,
      changeDirection: this.getChangeDirection(month.change.users),
    };
    metrics['month_sessions'] = {
      value: month.current.sessions,
      type: 'count',
      label: 'Sessions This Month',
      change: month.change.sessions,
      changeDirection: this.getChangeDirection(month.change.sessions),
    };

    return {
      providerId: this.id,
      timestamp: this.now(),
      metrics,
      metadata: {
        today: today.current,
        thisWeek: week.current,
        thisMonth: month.current,
      },
    };
  }

  /**
   * Transform daily historical data into multiple snapshots
   */
  transformMultiple(response: any): ProviderMetrics[] {
    this.log('Transforming GA4 daily historical data');

    const rows = response.rows || [];
    const snapshots: ProviderMetrics[] = [];

    for (const row of rows) {
      const date = row.dimensionValues[0].value; // Format: YYYYMMDD
      const users = parseInt(row.metricValues[0].value || '0');
      const sessions = parseInt(row.metricValues[1].value || '0');

      // Format date as YYYY-MM-DD for consistency
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

      snapshots.push({
        providerId: this.id,
        timestamp: new Date(formattedDate),
        metrics: {
          users: {
            value: users,
            type: 'count',
            label: 'Users',
          },
          sessions: {
            value: sessions,
            type: 'count',
            label: 'Sessions',
          },
        },
        metadata: {
          date: formattedDate,
        },
      });
    }

    this.log(`Created ${snapshots.length} daily snapshots`);
    return snapshots;
  }

  /**
   * Parse a single report with two date ranges (current vs previous)
   */
  private parseReport(report: any): {
    current: { users: number; sessions: number };
    previous: { users: number; sessions: number };
    change: { users: number; sessions: number };
  } {
    // GA4 returns data with multiple date ranges in rows, not totals
    // Each row has a dimension 'date_range_0' (current) and 'date_range_1' (previous)
    const rows = report.rows || [];

    if (rows.length === 0) {
      return {
        current: { users: 0, sessions: 0 },
        previous: { users: 0, sessions: 0 },
        change: { users: 0, sessions: 0 },
      };
    }

    // Find rows for each date range
    let currentUsers = 0;
    let currentSessions = 0;
    let previousUsers = 0;
    let previousSessions = 0;

    for (const row of rows) {
      const dateRangeValue = row.dimensionValues?.[0]?.value;
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');

      if (dateRangeValue === 'date_range_0') {
        // Current period
        currentUsers = users;
        currentSessions = sessions;
      } else if (dateRangeValue === 'date_range_1') {
        // Previous period
        previousUsers = users;
        previousSessions = sessions;
      }
    }

    return {
      current: { users: currentUsers, sessions: currentSessions },
      previous: { users: previousUsers, sessions: previousSessions },
      change: {
        users: this.calculateChange(currentUsers, previousUsers),
        sessions: this.calculateChange(currentSessions, previousSessions),
      },
    };
  }

  /**
   * Validate GA4 configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      this.log('Validating GA4 configuration');

      // Try a simple query to test authentication
      await this.rateLimiter.execute(async () => {
        return await this.client.runReport({
          property: `properties/${this.propertyId}`,
          dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
          metrics: [{ name: 'sessions' }],
        });
      });

      this.log('✓ GA4 configuration is valid');
      return true;
    } catch (error) {
      this.error('✗ GA4 configuration is invalid', error);
      return false;
    }
  }
}
