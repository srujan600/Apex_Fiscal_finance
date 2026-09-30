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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-[#3B82F6] rounded-full" />
          <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
            Tier 1: Capital Liquidity & Global Ceilings
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#8c909f]">
          Continuous reconciliation: active stream
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI Card 1: Total Approved Budget with Layered Breakdown */}
        <div className="tactile-tier-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#8c909f] uppercase tracking-wider">
              Total Approved Budget
            </span>
            <span className="material-symbols-outlined text-[#8c909f] text-lg" data-icon="pie_chart">
              pie_chart
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-mono text-white font-bold tracking-tight leading-none">
              {formatCurrency(totalBudget, currency)}
            </div>
            <div className="text-xs font-mono text-[#10B981] mt-1.5 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-sm leading-none" data-icon="trending_flat">
                trending_flat
              </span>
              <span>100% Capital Pool Locked</span>
            </div>
          </div>

          {/* Multi-segment breakdown bar */}
          <div className="space-y-1.5 pt-2 border-t border-[#1E2D4A]/80">
            <div className="w-full h-2 rounded-full bg-[#181B25] flex overflow-hidden">
              <div className="bg-[#3B82F6] h-full" style={{ width: '58.5%' }} title="Settled: 58.5%" />
              <div className="bg-[#818CF8] h-full" style={{ width: '20.2%' }} title="Committed: 20.2%" />
              <div className="bg-[#10B981] h-full" style={{ width: '21.3%' }} title="Buffer: 21.3%" />
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div>
                <span className="text-[#8c909f] block">Settled</span>
                <span className="text-white font-semibold">{formatCurrency(settledSpend, currency, 'compact')}</span>
              </div>
              <div>
                <span className="text-[#c0c1ff] block">Committed</span>
                <span className="text-white font-semibold">{formatCurrency(committedSpend, currency, 'compact')}</span>
              </div>
              <div className="text-right">
                <span className="text-[#10B981] block">Available</span>
                <span className="text-white font-semibold">{formatCurrency(availableBuffer, currency, 'compact')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Burn Velocity */}
        <div className="tactile-tier-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#8c909f] uppercase tracking-wider">
              Budget Burn Velocity
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/15 text-[#ffb4ab] border border-[#EF4444]/30 uppercase">
              Fast Paced
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-mono text-white font-bold tracking-tight leading-none">
              {formatCurrency(burnRatePerDay, currency, 'compact')}
              <span className="text-xs font-normal text-[#8c909f] ml-1">/day</span>
            </div>
            <div className="text-xs font-mono text-[#ff8093] mt-1.5 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-sm leading-none" data-icon="arrow_upward">
                arrow_upward
              </span>
              <span>8.4% ahead of modeled curve</span>
            </div>
          </div>

          {/* Pace Indicator Bar */}
          <div className="space-y-1.5 pt-2 border-t border-[#1E2D4A]/80">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#8c909f]">Model: {formatCurrency(131200, currency, 'compact')}/d</span>
              <span className="text-[#ff8093] font-medium">+11.2k/day Delta</span>
            </div>
            <div className="w-full bg-[#181B25] h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#3B82F6] to-[#E11D48] h-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>

        {/* KPI Card 3: Projected Q3 Variance Overrun Alert */}
        <div className="tactile-tier-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#E11D48]/60 transition-all border-l-2 border-l-[#E11D48]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#8c909f] uppercase tracking-wider">
              Projected Q3 Variance
            </span>
            <span className="material-symbols-outlined text-[#E11D48] text-lg" data-icon="warning">
              warning
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-mono text-[#ff8093] font-bold tracking-tight leading-none">
              {formatCurrency(projectedVariance, currency)}
            </div>
            <div className="text-xs font-mono text-[#ff8093] mt-1.5 flex items-center gap-1">
              <span>Overrun Risk Without Intervention</span>
            </div>
          </div>

          {/* Intervention Alert Box */}
          <div className="p-2 rounded bg-[#E11D48]/10 border border-[#E11D48]/30 flex items-center justify-between">
            <span className="text-[11px] text-[#ffb4ab] font-sans font-medium">
              Breach Horizon: Sept 18
            </span>
            <button
              onClick={onOpenSimulator || (() => setActiveTab('forecasts'))}
              className="text-[10px] font-mono text-white px-2 py-0.5 rounded bg-[#E11D48] hover:bg-[#be123c] font-semibold transition-colors cursor-pointer"
            >
              Simulate Cuts
            </button>
          </div>
        </div>

        {/* KPI Card 4: Active Exceptions */}
        <div className="tactile-tier-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#8c909f] uppercase tracking-wider">
              Active Exceptions
            </span>
            <span className="material-symbols-outlined text-[#c0c1ff] text-lg" data-icon="hourglass_top">
              hourglass_top
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-mono text-white font-bold tracking-tight leading-none">
              {criticalExceptions.length} Critical
            </div>
            <div className="text-xs font-mono text-[#8c909f] mt-1.5 truncate">
              <span className="text-white font-semibold">
                {formatCurrency(totalBlockedCapital, currency, 'compact')}
              </span>{' '}
              blocked pending CFO
            </div>
          </div>

          {/* Action Trigger with Entity Badges */}
          <div className="pt-2 border-t border-[#1E2D4A]/80 flex items-center justify-between">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0D1526] bg-[#E11D48] text-[9px] font-bold text-center text-white leading-5">
                EX
              </div>
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0D1526] bg-[#3B82F6] text-[9px] font-bold text-center text-white leading-5">
                AWS
              </div>
              <div className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0D1526] bg-[#6366F1] text-[9px] font-bold text-center text-white leading-5">
                AI
              </div>
            </div>

            <button
              onClick={onNavigateExceptions || (() => setActiveTab('exceptions'))}
              className="text-[11px] font-mono text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Review Queue</span>
              <span className="material-symbols-outlined text-sm leading-none" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
