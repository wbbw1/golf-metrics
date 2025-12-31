/**
 * Pilot Revenue Component
 * Shows total revenue from deals in Pilot stage
 */

interface PilotRevenueProps {
  revenue: number;
  dealCount: number;
}

export function PilotRevenue({ revenue, dealCount }: PilotRevenueProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg">
      <p className="text-sm font-medium text-emerald-100">
        Pilot Revenue
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-5xl font-bold tracking-tight text-white">
          {formatCurrency(revenue)}
        </p>
      </div>
      <p className="mt-2 text-sm text-emerald-100">
        {dealCount} {dealCount === 1 ? 'deal' : 'deals'} in pilot stage
      </p>
    </div>
  );
}
