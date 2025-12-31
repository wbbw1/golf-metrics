/**
 * Activity Metrics Component
 * Shows intro calls and demos counts for this week/month
 */

interface ActivityMetricsProps {
  introCallsThisWeek: number;
  introCallsThisMonth: number;
  demosThisWeek: number;
  demosThisMonth: number;
}

export function ActivityMetrics({
  introCallsThisWeek,
  introCallsThisMonth,
  demosThisWeek,
  demosThisMonth,
}: ActivityMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Intro Calls This Week */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Intro Calls
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {introCallsThisWeek}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">this week</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {introCallsThisMonth} this month
        </p>
      </div>

      {/* Demos This Week */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Demos
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {demosThisWeek}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">this week</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {demosThisMonth} this month
        </p>
      </div>

      {/* Total Activity This Week */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Total Activity
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {introCallsThisWeek + demosThisWeek}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">this week</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {introCallsThisMonth + demosThisMonth} this month
        </p>
      </div>

      {/* Conversion Rate */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Conversion Rate
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {introCallsThisMonth > 0
              ? Math.round((demosThisMonth / introCallsThisMonth) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">this month</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Intro → Demo
        </p>
      </div>
    </div>
  );
}
