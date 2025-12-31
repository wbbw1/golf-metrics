import { MetricHistory } from './MetricHistory';

interface MetricCardProps {
  metric: {
    key: string;
    label: string;
    value: string | number;
    type: 'currency' | 'count' | 'percentage' | 'duration' | 'text';
    change?: number;
    changeDirection?: 'up' | 'down' | 'neutral';
  };
  historyData?: Array<{ date: string; value: number }>;
}

export function MetricCard({ metric, historyData = [] }: MetricCardProps) {
  const formatValue = (value: string | number, type: string) => {
    if (typeof value === 'string') return value;

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'count':
        return new Intl.NumberFormat('en-US').format(value);
      case 'percentage':
        return `${value}%`;
      case 'duration':
        return `${value}h`;
      default:
        return value;
    }
  };

  const formatChange = (change: number, currentValue: number | string) => {
    const current = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue));
    const previous = current - change;
    const percentChange = previous !== 0 ? (change / previous) * 100 : 0;

    const changeStr = new Intl.NumberFormat('en-US', {
      signDisplay: 'always',
      maximumFractionDigits: 0,
    }).format(change);

    const percentStr = new Intl.NumberFormat('en-US', {
      signDisplay: 'always',
      maximumFractionDigits: 1,
    }).format(percentChange);

    return `${changeStr} (${percentStr}%)`;
  };

  const getTrendColor = () => {
    if (!metric.changeDirection || metric.changeDirection === 'neutral') {
      return 'text-zinc-500';
    }
    return metric.changeDirection === 'up'
      ? 'text-emerald-600 dark:text-emerald-500'
      : 'text-red-600 dark:text-red-500';
  };

  const getTrendIcon = () => {
    if (!metric.changeDirection || metric.changeDirection === 'neutral') {
      return '→';
    }
    return metric.changeDirection === 'up' ? '↑' : '↓';
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 transition-all hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {metric.label}
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatValue(metric.value, metric.type)}
        </p>
        {metric.change !== undefined && metric.change !== null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            <span className="text-lg">{getTrendIcon()}</span>
            <span>{formatChange(metric.change, metric.value)}</span>
          </div>
        )}
      </div>
      {metric.change !== undefined && metric.change !== null ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          vs last week
        </p>
      ) : (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          No comparison data yet
        </p>
      )}
      <MetricHistory metricLabel={metric.label} history={historyData} />
    </div>
  );
}
