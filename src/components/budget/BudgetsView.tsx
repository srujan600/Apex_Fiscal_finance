import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BudgetEnvelope, RiskLevel } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { ThresholdMeter } from '../ui/ThresholdMeter';
import { TactileButton } from '../ui/TactileButton';
import { BudgetDetailModal } from './BudgetDetailModal';
import { CreateBudgetModal } from './CreateBudgetModal';
import { EditBudgetModal } from './EditBudgetModal';
import { TierBadge, TierAuthorizationBanner, LockedActionIndicator } from '../common/TierRestrictedBadge';

export const BudgetsView: React.FC = () => {
  const { budgets, currency, canAdjustRiskThresholds, isTier2OrHigher, governanceTier } = useApp();

  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBudgetForDetail, setActiveBudgetForDetail] = useState<BudgetEnvelope | null>(null);
  const [activeBudgetForEdit, setActiveBudgetForEdit] = useState<BudgetEnvelope | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Totals calculations
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalSettled = budgets.reduce((acc, b) => acc + b.actualSettled, 0);
  const totalCommitted = budgets.reduce((acc, b) => acc + b.committed, 0);
  const totalAvailable = budgets.reduce((acc, b) => acc + b.available, 0);
  const totalProjectedOverrun = budgets.reduce((acc, b) => acc + b.projectedOverrun, 0);
  const globalUtilRate = ((totalSettled + totalCommitted) / totalAllocated) * 100;

  // Filtered list
  const filteredBudgets = budgets.filter((b) => {
    const matchesRisk =
      selectedRiskFilter === 'ALL' || b.riskLevel === selectedRiskFilter;
    const matchesSearch =
      b.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.leadManager.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
              Department Envelopes
            </span>
            <TierBadge tier={governanceTier} size="sm" />
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Enterprise Budget Allocation & Ceiling Enforcement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of authorized capital pools, committed liabilities, available headroom, and variance forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canAdjustRiskThresholds ? (
            <TactileButton variant="primary" icon="add" onClick={() => setCreateModalOpen(true)}>
              Create Budget Envelope
            </TactileButton>
          ) : (
            <div className="flex items-center gap-2">
              <LockedActionIndicator reason="Requires Tier 2+ Controller authorization" />
              <TactileButton variant="primary" icon="lock" disabled>
                Create Envelope
              </TactileButton>
            </div>
          )}
        </div>
      </div>

      {/* Tier Governance Authorization Banner */}
      <TierAuthorizationBanner />

      {/* Aggregate KPI Summary Quad */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL AUTHORIZED</span>
          <span className="text-xl font-mono font-bold text-slate-900 block mt-1">
            {formatCurrency(totalAllocated, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Master Capital Pool</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">ACTUAL SETTLED</span>
          <span className="text-xl font-mono font-bold text-blue-600 block mt-1">
            {formatCurrency(totalSettled, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Disbursed cash out</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">COMMITTED IN-FLIGHT</span>
          <span className="text-xl font-mono font-bold text-indigo-600 block mt-1">
            {formatCurrency(totalCommitted, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Unbilled purchase orders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">AVAILABLE HEADROOM</span>
          <span className="text-xl font-mono font-bold text-emerald-600 block mt-1">
            {formatCurrency(totalAvailable, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Uncommitted reserve</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">GLOBAL UTILIZATION</span>
          <span className={`text-xl font-mono font-bold block mt-1 ${globalUtilRate >= 90 ? 'text-rose-600' : 'text-amber-600'}`}>
            {globalUtilRate.toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-rose-600 block mt-0.5 font-medium">
            {totalProjectedOverrun > 0 ? `-${formatCurrency(totalProjectedOverrun, currency, 'compact')} Overrun` : 'On track'}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base" data-icon="search">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department, code, or manager..."
            className="w-full h-9 pl-9 pr-3 text-xs font-mono bg-white text-slate-900 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CRITICAL_BREACH', 'ATTENTION', 'HEALTHY'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedRiskFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedRiskFilter === filter
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {filter === 'ALL'
                ? 'All Envelopes'
                : filter === 'CRITICAL_BREACH'
                ? 'Critical Breach'
                : filter === 'ATTENTION'
                ? 'Attention'
                : 'Healthy'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Budget Ledger Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase border-b border-slate-200/80 h-10 select-none">
                <th className="px-4 font-semibold w-32 whitespace-nowrap">Envelope Code</th>
                <th className="px-3 font-semibold min-w-[160px]">Department & Lead</th>
                <th className="px-3 font-semibold text-right w-28 whitespace-nowrap">Allocated</th>
                <th className="px-3 font-semibold text-right w-28 whitespace-nowrap">Settled Spend</th>
                <th className="px-3 font-semibold text-right w-28 whitespace-nowrap">Committed POs</th>
                <th className="px-3 font-semibold text-right w-28 whitespace-nowrap">Available Buffer</th>
                <th className="px-4 font-semibold w-56 min-w-[200px]">Utilization Bar</th>
                <th className="px-3 font-semibold text-right w-32 whitespace-nowrap">Projected Variance</th>
                <th className="px-3 font-semibold w-36 whitespace-nowrap">Risk Posture</th>
                <th className="px-4 font-semibold text-right w-44 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredBudgets.map((b) => {
                const totalInFlight = b.actualSettled + b.committed;
                const isOverrun = b.projectedOverrun > 0;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Code */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{b.code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.fiscalPeriod}</span>
                    </td>

                    {/* Department & Lead */}
                    <td className="px-3 py-3.5">
                      <span className="text-slate-900 font-semibold block">{b.departmentName}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">{b.leadManager}</span>
                    </td>

                    {/* Allocated */}
                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(b.allocated, currency, 'compact')}
                    </td>

                    {/* Settled */}
                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {formatCurrency(b.actualSettled, currency, 'compact')}
                    </td>

                    {/* Committed */}
                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-indigo-600 whitespace-nowrap">
                      {formatCurrency(b.committed, currency, 'compact')}
                    </td>

                    {/* Available */}
                    <td className="px-3 py-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(b.available, currency, 'compact')}
                    </td>

                    {/* Utilization Bar */}
                    <td className="px-4 py-3.5 w-56 min-w-[200px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-900 font-bold">{b.utilizationRate.toFixed(1)}%</span>
                          <span className={`text-[10px] ${b.utilizationRate >= 90 ? 'text-rose-600 font-semibold' : 'text-slate-400 font-medium'}`}>
                            {b.daysToRunOut}d run-out
                          </span>
                        </div>
                        <ThresholdMeter
                          allocated={b.allocated}
                          settled={b.actualSettled}
                          committed={b.committed}
                          height="sm"
                        />
                      </div>
                    </td>

                    {/* Projected Variance */}
                    <td className="px-3 py-3.5 text-right font-mono">
                      <span className={isOverrun ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                        {isOverrun ? `-${formatCurrency(b.projectedOverrun, currency, 'compact')}` : '+₹0 (On Track)'}
                      </span>
                    </td>

                    {/* Risk Posture */}
                    <td className="px-3 py-3.5">
                      <StatusBadge status={b.riskLevel} size="sm" pulse={b.riskLevel === 'CRITICAL_BREACH'} />
                    </td>

                    {/* Actions Rail */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TactileButton
                          variant="surface"
                          size="sm"
                          onClick={() => setActiveBudgetForDetail(b)}
                        >
                          Dossier
                        </TactileButton>

                        {canAdjustRiskThresholds && (
                          <TactileButton
                            variant="ghost"
                            size="sm"
                            icon="edit"
                            onClick={() => setActiveBudgetForEdit(b)}
                          >
                            Edit
                          </TactileButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BudgetDetailModal
        budget={activeBudgetForDetail}
        isOpen={!!activeBudgetForDetail}
        onClose={() => setActiveBudgetForDetail(null)}
        onEdit={(b) => setActiveBudgetForEdit(b)}
        onReallocate={() => setActiveBudgetForDetail(null)}
      />

      <EditBudgetModal
        budget={activeBudgetForEdit}
        isOpen={!!activeBudgetForEdit}
        onClose={() => setActiveBudgetForEdit(null)}
      />

      <CreateBudgetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};
