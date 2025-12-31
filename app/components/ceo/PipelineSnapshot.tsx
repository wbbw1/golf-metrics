'use client';

/**
 * Clean CEO-friendly pipeline snapshot
 * Shows what matters: what's happening now and what needs attention
 */

import { useState } from 'react';

interface Deal {
  recordId: string;
  companyName: string;
  stage: string;
  daysInStage: number;
  webUrl: string;
  nextStepDate: Date | null;
}

interface PipelineSnapshotProps {
  deals: Deal[];
  pilotRevenue: number;
}

export function PipelineSnapshot({ deals, pilotRevenue }: PipelineSnapshotProps) {
  // State for selected month (format: "YYYY-MM")
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  // Group deals by stage
  const evaluationDeals = deals.filter((d) => d.stage === 'Evaluation');
  const demoDeals = deals.filter((d) => d.stage === 'Demo');
  const introCallDeals = deals.filter((d) => d.stage === 'Intro call');
  const schedulingDeals = deals.filter((d) => d.stage === 'Scheduling');

  // Date filtering logic - Based on selected month
  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7); // Next 7 days

  const startOfMonth = new Date(selectedYear, selectedMonthNum - 1, 1);
  const endOfMonth = new Date(selectedYear, selectedMonthNum, 0); // Last day of selected month

  // Generate month options (current month + next 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ value, label });
  }

  // Filter deals by next step date
  const isInThisWeek = (deal: Deal) => {
    if (!deal.nextStepDate) return false;
    const nextDate = new Date(deal.nextStepDate);
    return nextDate >= now && nextDate <= endOfWeek;
  };

  const isInThisMonth = (deal: Deal) => {
    if (!deal.nextStepDate) return false;
    const nextDate = new Date(deal.nextStepDate);
    return nextDate >= startOfMonth && nextDate <= endOfMonth;
  };

  // THIS WEEK counts
  const thisWeekIntros = introCallDeals.filter(isInThisWeek).length;
  const thisWeekDemos = demoDeals.filter(isInThisWeek).length;
  const thisWeekMovedToEval = evaluationDeals.filter(
    (d) => isInThisWeek(d) && d.daysInStage <= 7
  ).length;

  // THIS MONTH counts
  const thisMonthIntros = introCallDeals.filter(isInThisMonth).length;
  const thisMonthDemos = demoDeals.filter(isInThisMonth).length;

  // Current snapshot counts (total in each stage)
  const introCalls = introCallDeals.length;
  const demos = demoDeals.length;
  const movedToEval = evaluationDeals.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date labels
  const selectedMonthDate = new Date(selectedYear, selectedMonthNum - 1, 1);
  const monthName = selectedMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          View Month:
        </span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* THIS WEEK Stats - Individual Boxes */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          This Week (Next 7 Days)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Intro Calls
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {thisWeekIntros}
              </p>
              <p className="text-xs text-zinc-500">scheduled</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Demos
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {thisWeekDemos}
              </p>
              <p className="text-xs text-zinc-500">scheduled</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Moved to Eval
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {thisWeekMovedToEval}
              </p>
              <p className="text-xs text-zinc-500">this week</p>
            </div>
          </div>
        </div>
      </div>

      {/* THIS MONTH Stats - Individual Boxes */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          This Month ({monthName})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Intro Calls
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {thisMonthIntros}
              </p>
              <p className="text-xs text-zinc-500">scheduled</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Demos
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {thisMonthDemos}
              </p>
              <p className="text-xs text-zinc-500">scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot Revenue */}
      <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
          Pilot Revenue
        </div>
        <div className="mt-1 text-3xl font-bold text-white">
          {formatCurrency(pilotRevenue)}
        </div>
      </div>

      {/* Pipeline Stages - Horizontal Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* EVALUATION */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm text-zinc-600 dark:text-zinc-400">
            Evaluation
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {evaluationDeals.length}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Push to Close
            </p>
          </div>
          {evaluationDeals.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              {evaluationDeals.map((deal) => (
                <a
                  key={deal.recordId}
                  href={deal.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {deal.companyName}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 whitespace-nowrap">
                    {deal.daysInStage}d
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* DEMO */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm text-zinc-600 dark:text-zinc-400">
            Demo
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {demoDeals.length}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Show Platform
            </p>
          </div>
          {demoDeals.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              {demoDeals.map((deal) => (
                <a
                  key={deal.recordId}
                  href={deal.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {deal.companyName}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 whitespace-nowrap">
                    {deal.daysInStage}d
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* INTRO CALL */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm text-zinc-600 dark:text-zinc-400">
            Intro Call
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {introCallDeals.length}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Discovery
            </p>
          </div>
          {introCallDeals.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              {introCallDeals.map((deal) => (
                <a
                  key={deal.recordId}
                  href={deal.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {deal.companyName}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 whitespace-nowrap">
                    {deal.daysInStage}d
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* SCHEDULING */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm text-zinc-600 dark:text-zinc-400">
            Scheduling
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {schedulingDeals.length}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Need to Book
            </p>
          </div>
          {schedulingDeals.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              {schedulingDeals.map((deal) => {
                const needsAttention = deal.daysInStage >= 15;
                return (
                  <a
                    key={deal.recordId}
                    href={deal.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {deal.companyName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 ml-2 whitespace-nowrap">
                      {deal.daysInStage}d
                      {needsAttention && <span className="text-amber-600">⚠️</span>}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
