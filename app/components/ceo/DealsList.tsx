/**
 * Deals List Component
 * Reusable component for displaying deals in different pipeline stages
 */

interface Deal {
  recordId: string;
  companyName: string;
  stage: string;
  dealValue: number | null;
  daysInStage: number;
  webUrl: string;
}

interface DealsListProps {
  title: string;
  description?: string;
  deals: Deal[];
  emptyMessage?: string;
  highlightThreshold?: number; // Highlight deals older than this many days
  sortBy?: 'newest' | 'oldest' | 'value';
}

export function DealsList({
  title,
  description,
  deals,
  emptyMessage = 'No deals in this stage',
  highlightThreshold,
  sortBy = 'newest',
}: DealsListProps) {
  // Sort deals
  const sortedDeals = [...deals].sort((a, b) => {
    if (sortBy === 'newest') {
      return a.daysInStage - b.daysInStage;
    } else if (sortBy === 'oldest') {
      return b.daysInStage - a.daysInStage;
    } else if (sortBy === 'value') {
      return (b.dealValue || 0) - (a.dealValue || 0);
    }
    return 0;
  });

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
        <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
        </p>
      </div>

      {sortedDeals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedDeals.map((deal) => {
            const isHighlighted =
              highlightThreshold !== undefined && deal.daysInStage >= highlightThreshold;

            return (
              <a
                key={deal.recordId}
                href={deal.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block rounded-lg border p-4 transition-all hover:shadow-md ${
                  isHighlighted
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {deal.companyName}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span
                        className={`${
                          isHighlighted
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {deal.daysInStage} {deal.daysInStage === 1 ? 'day' : 'days'} in stage
                      </span>
                      {deal.dealValue && (
                        <span className="text-zinc-600 dark:text-zinc-400">
                          •{' '}
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(deal.dealValue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                {isHighlighted && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Needs attention
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
