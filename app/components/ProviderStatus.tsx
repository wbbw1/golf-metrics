import { formatDistanceToNow } from 'date-fns';

interface ProviderStatusProps {
  provider: {
    providerId: string;
    name: string;
    lastFetched: Date | null;
    isStale: boolean;
    metrics: unknown[];
  };
}

export function ProviderStatus({ provider }: ProviderStatusProps) {
  const statusColor = provider.isStale
    ? 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-500 dark:ring-amber-500/20'
    : 'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-500 dark:ring-emerald-500/20';

  const statusText = provider.isStale ? 'Stale' : 'Fresh';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {provider.name}
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusColor}`}
        >
          {statusText}
        </span>
      </div>
      <div className="text-right">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {provider.lastFetched
            ? `Updated ${formatDistanceToNow(new Date(provider.lastFetched), {
                addSuffix: true,
              })}`
            : 'Never fetched'}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {provider.metrics.length} metrics
        </p>
      </div>
    </div>
  );
}
