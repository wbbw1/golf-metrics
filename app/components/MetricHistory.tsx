'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface MetricHistoryProps {
  metricLabel: string;
  history: Array<{
    date: string;
    value: number;
  }>;
}

export function MetricHistory({ metricLabel, history }: MetricHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length < 2) {
    return null;
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        <span>View {history.length} weeks history</span>
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Chart */}
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {metricLabel} Trend
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#71717a"
                />
                <YAxis
                  tickFormatter={formatNumber}
                  tick={{ fontSize: 12 }}
                  stroke="#71717a"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label) => `Week of ${formatDate(label)}`}
                  formatter={(value: number) => [formatNumber(value), metricLabel]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Weekly Data
            </h4>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50">
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="pb-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      Week
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Value
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const prevValue = index < history.length - 1 ? history[index + 1].value : null;
                    const change = prevValue !== null ? item.value - prevValue : null;
                    const changePercent =
                      prevValue !== null && prevValue !== 0
                        ? ((change || 0) / prevValue) * 100
                        : null;

                    return (
                      <tr
                        key={index}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-700/50"
                      >
                        <td className="py-2 text-zinc-700 dark:text-zinc-300">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {formatNumber(item.value)}
                        </td>
                        <td className="py-2 text-right">
                          {change !== null ? (
                            <span
                              className={`font-medium ${
                                change > 0
                                  ? 'text-emerald-600 dark:text-emerald-500'
                                  : change < 0
                                  ? 'text-red-600 dark:text-red-500'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {change > 0 ? '+' : ''}
                              {formatNumber(change)}
                              {changePercent !== null && (
                                <span className="ml-1 text-xs">
                                  ({change > 0 ? '+' : ''}
                                  {changePercent.toFixed(1)}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
