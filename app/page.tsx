import { getLatestMetrics, getDashboardStats, getMetricsTimeSeries } from '@/lib/db/metrics-queries';
import { MetricCard } from '@/app/components/MetricCard';
import { ProviderStatus } from '@/app/components/ProviderStatus';
import { FetchTrigger } from '@/app/components/FetchTrigger';
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

        {/* Providers Section */}
        {metricsData.providers.map((provider) => {
          const history = providerHistory.find((h) => h.providerId === provider.providerId);

          return (
            <section key={provider.providerId} className="mb-12">
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
            </section>
          );
        })}

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
      </main>
    </div>
  );
}
