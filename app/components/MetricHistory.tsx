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
  periodLabel?: string;
}

export function MetricHistory({ metricLabel, history, periodLabel }: MetricHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length < 2) {
    return null;
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Assuming date is the Monday of the week, calculate Sunday
      const monday = new Date(date);
      const sunday = new Date(date);
      sunday.setDate(monday.getDate() + 6);

      const currentYear = new Date().getFullYear();
      const showYear = monday.getFullYear() !== currentYear || sunday.getFullYear() !== currentYear;

      // Format as "Dec 23-29" or "Dec 23-29, 2025" if different year
      const mondayStr = format(monday, 'MMM d');
      const sundayDay = sunday.getDate();
      const yearStr = showYear ? `, ${monday.getFullYear()}` : '';

      return `${mondayStr}-${sundayDay}${yearStr}`;
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
        <span>View {periodLabel || `${history.length} weeks`} history</span>
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
        <div className="mt-4">
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
        </div>
      )}
    </div>
  );
}
