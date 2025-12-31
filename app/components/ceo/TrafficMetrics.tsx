/**
 * Traffic Metrics Component
 * Shows website traffic (users + sessions) for today, this week, and this month
 */

import { MetricHistory } from '../MetricHistory';

interface TrafficMetricsProps {
  todayUsers: number;
  todaySessions: number;
  todayUsersChange?: number;
  todaySessionsChange?: number;
  weekUsers: number;
  weekSessions: number;
  weekUsersChange?: number;
  weekSessionsChange?: number;
  monthUsers: number;
  monthSessions: number;
  monthUsersChange?: number;
  monthSessionsChange?: number;
  dailyUsersHistory?: Array<{ date: string; value: number }>;
  dailySessionsHistory?: Array<{ date: string; value: number }>;
  weeklyUsersHistory?: Array<{ date: string; value: number }>;
  weeklySessionsHistory?: Array<{ date: string; value: number }>;
  monthlyUsersHistory?: Array<{ date: string; value: number }>;
  monthlySessionsHistory?: Array<{ date: string; value: number }>;
}

export function TrafficMetrics({
  todayUsers,
  todaySessions,
  todayUsersChange,
  todaySessionsChange,
  weekUsers,
  weekSessions,
  weekUsersChange,
  weekSessionsChange,
  monthUsers,
  monthSessions,
  monthUsersChange,
  monthSessionsChange,
  dailyUsersHistory = [],
  dailySessionsHistory = [],
  weeklyUsersHistory = [],
  weeklySessionsHistory = [],
  monthlyUsersHistory = [],
  monthlySessionsHistory = [],
}: TrafficMetricsProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined || change === null) return null;
    if (Math.abs(change) < 0.1) return '→';
    return change > 0 ? '↑' : '↓';
  };

  const getTrendColor = (change?: number) => {
    if (change === undefined || change === null || Math.abs(change) < 0.1) {
      return 'text-zinc-500';
    }
    return change > 0
      ? 'text-emerald-600 dark:text-emerald-500'
      : 'text-red-600 dark:text-red-500';
  };

  const formatPercent = (change?: number) => {
    if (change === undefined || change === null) return '';
    return new Intl.NumberFormat('en-US', {
      signDisplay: 'always',
      maximumFractionDigits: 0,
    }).format(change) + '%';
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Today */}
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Today
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(todayUsers)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">users</p>
              {todayUsersChange !== undefined && (
                <span className={`text-sm ${getTrendColor(todayUsersChange)}`}>
                  {getTrendIcon(todayUsersChange)} {formatPercent(todayUsersChange)}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(todaySessions)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">sessions</p>
              {todaySessionsChange !== undefined && (
                <span className={`text-sm ${getTrendColor(todaySessionsChange)}`}>
                  {getTrendIcon(todaySessionsChange)} {formatPercent(todaySessionsChange)}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          vs yesterday
        </p>
        <MetricHistory metricLabel="Users" history={dailyUsersHistory} periodLabel="14 days" />
      </div>

      {/* This Week */}
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          This Week
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(weekUsers)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">users</p>
              {weekUsersChange !== undefined && (
                <span className={`text-sm ${getTrendColor(weekUsersChange)}`}>
                  {getTrendIcon(weekUsersChange)} {formatPercent(weekUsersChange)}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(weekSessions)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">sessions</p>
              {weekSessionsChange !== undefined && (
                <span className={`text-sm ${getTrendColor(weekSessionsChange)}`}>
                  {getTrendIcon(weekSessionsChange)} {formatPercent(weekSessionsChange)}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          vs last week
        </p>
        <MetricHistory metricLabel="Users" history={weeklyUsersHistory} periodLabel="12 weeks" />
      </div>

      {/* This Month */}
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          This Month
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(monthUsers)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">users</p>
              {monthUsersChange !== undefined && (
                <span className={`text-sm ${getTrendColor(monthUsersChange)}`}>
                  {getTrendIcon(monthUsersChange)} {formatPercent(monthUsersChange)}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(monthSessions)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">sessions</p>
              {monthSessionsChange !== undefined && (
                <span className={`text-sm ${getTrendColor(monthSessionsChange)}`}>
                  {getTrendIcon(monthSessionsChange)} {formatPercent(monthSessionsChange)}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          vs last month
        </p>
        <MetricHistory metricLabel="Users" history={monthlyUsersHistory} periodLabel="3 months" />
      </div>
    </div>
  );
}
