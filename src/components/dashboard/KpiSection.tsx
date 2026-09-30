import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

interface KpiSectionProps {
  onOpenSimulator?: () => void;
  onNavigateExceptions?: () => void;
}

export const KpiSection: React.FC<KpiSectionProps> = ({
  onOpenSimulator,
  onNavigateExceptions,
}) => {
  const { currency, exceptions, setActiveTab } = useApp();

  const totalBudget = 48500000;
  const settledSpend = 28400000;
  const committedSpend = 9800000;
  const availableBuffer = 10300000;

  const burnRatePerDay = 142400;
  const projectedVariance = -1850000;

  const criticalExceptions = exceptions.filter(
    (e) => e.status === 'PENDING_DECISION' && e.breachClassification === 'CRITICAL_EXCEPTION'
  );
  const totalBlockedCapital = exceptions
    .filter((e) => e.status === 'PENDING_DECISION')
    .reduce((sum, e) => sum + e.commitmentValue, 0);

  return (
    <section>
      {/* Tier Super-Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
          <h2 className="text-xs font-mono font-semibold text-slate-900 uppercase tracking-wider">
            Tier 1: Capital Liquidity & Global Ceilings
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 font-medium">
          Continuous reconciliation: active stream
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI Card 1: Total Approved Budget with Layered Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Total Approved Budget
            </span>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors text-lg" data-icon="pie_chart">
              pie_chart
            </span>
          </div>

          <div className="my-3">
            <div className="text-2xl font-mono text-slate-900 font-bold tracking-tight leading-none">
              {formatCurrency(totalBudget, currency)}
            </div>
            <div className="text-xs font-mono text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm leading-none" data-icon="trending_flat">
                trending_flat
              </span>
              <span>100% Capital Pool Locked</span>
            </div>
          </div>

          {/* Multi-segment breakdown bar */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: '58.5%' }} title="Settled: 58.5%" />
              <div className="bg-indigo-500 h-full" style={{ width: '20.2%' }} title="Committed: 20.2%" />
              <div className="bg-emerald-500 h-full" style={{ width: '21.3%' }} title="Buffer: 21.3%" />
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div>
                <span className="text-slate-400 block font-medium">Settled</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(settledSpend, currency, 'compact')}</span>
              </div>
              <div>
                <span className="text-indigo-600 block font-medium">Committed</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(committedSpend, currency, 'compact')}</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-600 block font-medium">Available</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(availableBuffer, currency, 'compact')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Burn Velocity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Budget Burn Velocity
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
              Fast Paced
            </span>
          </div>

          <div className="my-3">
            <div className="text-2xl font-mono text-slate-900 font-bold tracking-tight leading-none">
              {formatCurrency(burnRatePerDay, currency, 'compact')}
              <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
            </div>
            <div className="text-xs font-mono text-rose-600 mt-2 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm leading-none" data-icon="arrow_upward">
                arrow_upward
              </span>
              <span>8.4% ahead of modeled curve</span>
            </div>
          </div>

          {/* Pace Indicator Bar */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-400 font-medium">Model: {formatCurrency(131200, currency, 'compact')}/d</span>
              <span className="text-rose-600 font-semibold">+11.2k/day Delta</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-rose-500 h-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>

        {/* KPI Card 3: Projected Q3 Variance Overrun Alert */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-rose-500 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Projected Q3 Variance
            </span>
            <span className="material-symbols-outlined text-rose-500 text-lg" data-icon="warning">
              warning
            </span>
          </div>

          <div className="my-3">
            <div className="text-2xl font-mono text-rose-600 font-bold tracking-tight leading-none">
              {formatCurrency(projectedVariance, currency)}
            </div>
            <div className="text-xs font-mono text-rose-600 mt-2 flex items-center gap-1 font-medium">
              <span>Overrun Risk Without Intervention</span>
            </div>
          </div>

          {/* Intervention Alert Box */}
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
            <span className="text-[11px] text-rose-800 font-sans font-medium">
              Breach Horizon: Sept 18
            </span>
            <button
              onClick={onOpenSimulator || (() => setActiveTab('forecasts'))}
              className="text-[10px] font-mono text-white px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 font-semibold transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              Simulate Cuts
            </button>
          </div>
        </div>

        {/* KPI Card 4: Active Exceptions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Active Exceptions
            </span>
            <span className="material-symbols-outlined text-indigo-500 text-lg" data-icon="hourglass_top">
              hourglass_top
            </span>
          </div>

          <div className="my-3">
            <div className="text-2xl font-mono text-slate-900 font-bold tracking-tight leading-none">
              {criticalExceptions.length} Critical
            </div>
            <div className="text-xs font-mono text-slate-500 mt-2 truncate">
              <span className="text-slate-900 font-semibold">
                {formatCurrency(totalBlockedCapital, currency, 'compact')}
              </span>{' '}
              blocked pending CFO
            </div>
          </div>

          {/* Action Trigger with Entity Badges */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-rose-500 text-[9px] font-bold text-center text-white leading-5">
                EX
              </div>
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-blue-500 text-[9px] font-bold text-center text-white leading-5">
                AWS
              </div>
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-indigo-500 text-[9px] font-bold text-center text-white leading-5">
                AI
              </div>
            </div>

            <button
              onClick={onNavigateExceptions || (() => setActiveTab('exceptions'))}
              className="text-[11px] font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-semibold group/btn"
            >
              <span>Review Queue</span>
              <span className="material-symbols-outlined text-sm leading-none group-hover/btn:translate-x-0.5 transition-transform duration-200" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
