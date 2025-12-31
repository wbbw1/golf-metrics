/**
 * CEO Dashboard Page
 *
 * Internal dashboard for tracking sales metrics and pipeline health.
 * Shows activity metrics, pilot revenue, and deals requiring attention.
 */

import { getLatestMetrics } from '@/lib/db/metrics-queries';
import { ActivityMetrics } from '@/app/components/ceo/ActivityMetrics';
import { PilotRevenue } from '@/app/components/ceo/PilotRevenue';
import { DealsList } from '@/app/components/ceo/DealsList';
import { FetchTrigger } from '@/app/components/FetchTrigger';
import { formatDistanceToNow } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Revalidate every 30 minutes
export const revalidate = 1800;

interface Deal {
  recordId: string;
  companyName: string;
  stage: string;
  dealValue: number | null;
  daysInStage: number;
  webUrl: string;
}

export default async function CEODashboardPage() {
  const metricsData = await getLatestMetrics();

  // Find Attio provider data
  const attioProvider = metricsData.providers.find((p) => p.providerId === 'attio');

  if (!attioProvider) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              CEO Dashboard
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Attio Not Configured
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Add your ATTIO_API_KEY to the .env file to start tracking sales metrics
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Extract metrics
  const introCallsThisWeek = attioProvider.metrics.find((m) => m.key === 'intro_calls_this_week')?.value as number || 0;
  const introCallsThisMonth = attioProvider.metrics.find((m) => m.key === 'intro_calls_this_month')?.value as number || 0;
  const demosThisWeek = attioProvider.metrics.find((m) => m.key === 'demos_this_week')?.value as number || 0;
  const demosThisMonth = attioProvider.metrics.find((m) => m.key === 'demos_this_month')?.value as number || 0;
  const pilotRevenue = attioProvider.metrics.find((m) => m.key === 'pilot_revenue')?.value as number || 0;

  // Extract deals from metadata
  const allDeals: Deal[] = (attioProvider as any).metadata?.deals || [];

  // Filter deals by stage
  const evaluationDeals = allDeals.filter((d) => d.stage === 'Evaluation');
  const schedulingDeals = allDeals.filter((d) => d.stage === 'Scheduling');
  const introCallDeals = allDeals.filter((d) => d.stage === 'Intro call');
  const pilotDeals = allDeals.filter((d) => d.stage === 'Pilot');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                CEO Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Sales metrics and pipeline health for Golf (YC W25)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Last updated
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {attioProvider.lastFetched
                    ? formatDistanceToNow(new Date(attioProvider.lastFetched), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </p>
              </div>
              <FetchTrigger />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Section 1: Activity Metrics */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Activity Metrics
          </h2>
          <ActivityMetrics
            introCallsThisWeek={introCallsThisWeek}
            introCallsThisMonth={introCallsThisMonth}
            demosThisWeek={demosThisWeek}
            demosThisMonth={demosThisMonth}
          />
        </section>

        {/* Section 2: Pilot Revenue */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Pilot Revenue
          </h2>
          <PilotRevenue revenue={pilotRevenue} dealCount={pilotDeals.length} />
        </section>

        {/* Section 3: Active Opportunities (Evaluation Stage) */}
        <section>
          <DealsList
            title="Active Opportunities"
            description="Companies actively evaluating - closest to close"
            deals={evaluationDeals}
            emptyMessage="No companies in evaluation stage"
            sortBy="newest"
          />
        </section>

        {/* Section 4: Need to Schedule (Scheduling Stage) */}
        <section>
          <DealsList
            title="Need to Schedule"
            description="Companies who said yes but haven't booked time"
            deals={schedulingDeals}
            emptyMessage="No companies waiting to schedule"
            highlightThreshold={30}
            sortBy="oldest"
          />
        </section>

        {/* Section 5: Upcoming Intro Calls */}
        <section>
          <DealsList
            title="Upcoming Intro Calls"
            description="First discovery calls scheduled"
            deals={introCallDeals}
            emptyMessage="No intro calls scheduled"
            sortBy="newest"
          />
        </section>
      </main>
    </div>
  );
}
