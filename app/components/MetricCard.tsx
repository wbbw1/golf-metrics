interface MetricCardProps {
  metric: {
    key: string;
    label: string;
    value: string | number;
    type: 'currency' | 'count' | 'percentage' | 'duration' | 'text';
  };
}

export function MetricCard({ metric }: MetricCardProps) {
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

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 transition-all hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {metric.label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {formatValue(metric.value, metric.type)}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        {metric.type}
      </p>
    </div>
  );
}
