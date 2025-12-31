import { getLatestMetrics, getDashboardStats, getMetricsTimeSeries } from '@/lib/db/metrics-queries';
import { MetricCard } from '@/app/components/MetricCard';
import { ProviderStatus } from '@/app/components/ProviderStatus';
import { FetchTrigger } from '@/app/components/FetchTrigger';
import { PipelineSnapshot } from '@/app/components/ceo/PipelineSnapshot';
import { TrafficMetrics } from '@/app/components/ceo/TrafficMetrics';
import { formatDistanceToNow } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [metricsData, stats] = await Promise.all([
    getLatestMetrics(),
    getDashboardStats(),
  ]);

  // Fetch historical data for sparklines
  const providerHistory = await Promise.all(
    metricsData.providers.map(async (provider) => ({
      providerId: provider.providerId,
      history: await getMetricsTimeSeries(provider.providerId, 90),
    }))
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Golf Metrics Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Business metrics aggregation
              </p>
            </div>
            <FetchTrigger />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Snapshots
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.totalSnapshots}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Active Providers
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.activeProviders}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Logs
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.totalLogs}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Last Fetch
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {stats.lastFetch
                ? formatDistanceToNow(new Date(stats.lastFetch), {
                    addSuffix: true,
                  })
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Marketing Metrics Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Marketing Metrics
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              LinkedIn performance and engagement from Notion
            </p>
          </div>

          {metricsData.providers
            .filter((provider) => provider.providerId !== 'attio' && provider.providerId !== 'ga4')
            .map((provider) => {
              const history = providerHistory.find((h) => h.providerId === provider.providerId);

              return (
                <div key={provider.providerId} className="mb-8">
                  <ProviderStatus provider={provider} />

                  {/* Metrics Grid */}
                  {provider.metrics.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {provider.metrics.map((metric) => {
                        // Format historical data for MetricHistory component
                        const historyData = history?.history
                          .map((h) => ({
                            date: h.date,
                            value: h[metric.key]
                          }))
                          .filter((item) => item.value !== undefined && typeof item.value === 'number') || [];

                        return (
                          <MetricCard
                            key={metric.key}
                            metric={metric}
                            historyData={historyData}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        No metrics available yet
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </section>

        {metricsData.providers.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No providers configured
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Configure your API keys in the .env file to start tracking metrics
            </p>
          </div>
        )}

        {/* Website Traffic from GA4 */}
        {(async () => {
          const ga4Provider = metricsData.providers.find((p) => p.providerId === 'ga4');
          if (!ga4Provider) return null;

          // Fetch historical data for charts (90 days of daily data)
          const ga4History = await getMetricsTimeSeries('ga4', 90);

          const ga4Metrics = {
            todayUsers: ga4Provider.metrics.find((m) => m.key === 'today_users')?.value as number || 0,
            todaySessions: ga4Provider.metrics.find((m) => m.key === 'today_sessions')?.value as number || 0,
            todayUsersChange: ga4Provider.metrics.find((m) => m.key === 'today_users')?.change,
            todaySessionsChange: ga4Provider.metrics.find((m) => m.key === 'today_sessions')?.change,
            weekUsers: ga4Provider.metrics.find((m) => m.key === 'week_users')?.value as number || 0,
            weekSessions: ga4Provider.metrics.find((m) => m.key === 'week_sessions')?.value as number || 0,
            weekUsersChange: ga4Provider.metrics.find((m) => m.key === 'week_users')?.change,
            weekSessionsChange: ga4Provider.metrics.find((m) => m.key === 'week_sessions')?.change,
            monthUsers: ga4Provider.metrics.find((m) => m.key === 'month_users')?.value as number || 0,
            monthSessions: ga4Provider.metrics.find((m) => m.key === 'month_sessions')?.value as number || 0,
            monthUsersChange: ga4Provider.metrics.find((m) => m.key === 'month_users')?.change,
            monthSessionsChange: ga4Provider.metrics.find((m) => m.key === 'month_sessions')?.change,
          };

          // Helper to aggregate daily data into weekly
          const aggregateWeekly = (data: Array<{ date: string; value: number }>) => {
            const weeks = new Map<string, { sum: number; count: number }>();

            data.forEach((item) => {
              const date = new Date(item.date);
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
              const weekKey = weekStart.toISOString().split('T')[0];

              const existing = weeks.get(weekKey) || { sum: 0, count: 0 };
              weeks.set(weekKey, { sum: existing.sum + item.value, count: existing.count + 1 });
            });

            return Array.from(weeks.entries())
              .map(([date, { sum }]) => ({ date, value: sum }))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-12); // Last 12 weeks
          };

          // Helper to aggregate daily data into monthly
          const aggregateMonthly = (data: Array<{ date: string; value: number }>) => {
            const months = new Map<string, { sum: number; count: number }>();

            data.forEach((item) => {
              const date = new Date(item.date);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

              const existing = months.get(monthKey) || { sum: 0, count: 0 };
              months.set(monthKey, { sum: existing.sum + item.value, count: existing.count + 1 });
            });

            return Array.from(months.entries())
              .map(([date, { sum }]) => ({ date, value: sum }))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-12); // Last 12 months
          };

          // Format historical data for charts
          const dailyData = ga4History
            .map((h) => ({
              date: h.date,
              users: h.users as number,
              sessions: h.sessions as number,
            }))
            .filter((item) => item.users !== undefined);

          // Daily history (last 14 days for "Today" card)
          const dailyUsers = dailyData.map(d => ({ date: d.date, value: d.users })).slice(-14);
          const dailySessions = dailyData.map(d => ({ date: d.date, value: d.sessions })).slice(-14);

          // Weekly history (last 12 weeks for "This Week" card)
          const weeklyUsers = aggregateWeekly(dailyData.map(d => ({ date: d.date, value: d.users })));
          const weeklySessions = aggregateWeekly(dailyData.map(d => ({ date: d.date, value: d.sessions })));

          // Monthly history (last 12 months for "This Month" card)
          const monthlyUsers = aggregateMonthly(dailyData.map(d => ({ date: d.date, value: d.users })));
          const monthlySessions = aggregateMonthly(dailyData.map(d => ({ date: d.date, value: d.sessions })));

          return (
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Website Traffic
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Visitor and session data from Google Analytics
                </p>
              </div>

              <ProviderStatus provider={ga4Provider} />

              <div className="mt-6">
                <TrafficMetrics
                  {...ga4Metrics}
                  dailyUsersHistory={dailyUsers}
                  dailySessionsHistory={dailySessions}
                  weeklyUsersHistory={weeklyUsers}
                  weeklySessionsHistory={weeklySessions}
                  monthlyUsersHistory={monthlyUsers}
                  monthlySessionsHistory={monthlySessions}
                />
              </div>
            </section>
          );
        })()}

        {/* Sales Metrics from Attio */}
        {(() => {
          const attioProvider = metricsData.providers.find((p) => p.providerId === 'attio');
          if (!attioProvider) return null;

          // Extract deals from metadata and calculate pilot revenue
          const allDeals = attioProvider.metadata?.deals || [];
          const pilotDeals = allDeals.filter((d: any) => d.stage === 'Pilot');
          const pilotRevenue = pilotDeals.reduce((sum: number, deal: any) =>
            sum + (deal.dealValue || 0), 0
          );

          return (
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Sales Pipeline
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Current deals and what needs attention
                </p>
              </div>

              <ProviderStatus provider={attioProvider} />

              <div className="mt-6">
                <PipelineSnapshot deals={allDeals} pilotRevenue={pilotRevenue} />
              </div>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
