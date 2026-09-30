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

export const BudgetsView: React.FC = () => {
  const { budgets, currency } = useApp();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2D4A]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/30">
              Department Envelopes
            </span>
            <span className="text-[11px] font-mono text-[#8c909f]">EPOCH: Q3-2025 ACTIVE</span>
          </div>
          <h1 className="text-xl md:text-2xl text-white font-semibold tracking-tight mt-1">
            Enterprise Budget Allocation & Ceiling Enforcement
          </h1>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Real-time tracking of authorized capital pools, committed liabilities, available headroom, and variance forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TactileButton variant="primary" icon="add" onClick={() => setCreateModalOpen(true)}>
            Create Budget Envelope
          </TactileButton>
        </div>
      </div>

      {/* Aggregate KPI Summary Quad */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">TOTAL AUTHORIZED</span>
          <span className="text-xl font-mono font-bold text-white block mt-1">
            {formatCurrency(totalAllocated, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Master Capital Pool</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">ACTUAL SETTLED</span>
          <span className="text-xl font-mono font-bold text-[#3B82F6] block mt-1">
            {formatCurrency(totalSettled, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Disbursed cash out</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">COMMITTED IN-FLIGHT</span>
          <span className="text-xl font-mono font-bold text-[#818CF8] block mt-1">
            {formatCurrency(totalCommitted, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Unbilled purchase orders</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">AVAILABLE HEADROOM</span>
          <span className="text-xl font-mono font-bold text-[#10B981] block mt-1">
            {formatCurrency(totalAvailable, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Uncommitted reserve</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A] col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">GLOBAL UTILIZATION</span>
          <span className={`text-xl font-mono font-bold block mt-1 ${globalUtilRate >= 90 ? 'text-[#ff8093]' : 'text-[#F59E0B]'}`}>
            {globalUtilRate.toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-[#ff8093] block mt-0.5">
            {totalProjectedOverrun > 0 ? `-${formatCurrency(totalProjectedOverrun, currency, 'compact')} Overrun` : 'On track'}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-[#0D1526] border border-[#1E2D4A]">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#8c909f] text-base" data-icon="search">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department, code, or manager..."
            className="w-full h-8 pl-8 pr-3 text-xs font-mono bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded focus:border-[#3B82F6] focus:outline-none placeholder-[#424754]"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CRITICAL_BREACH', 'ATTENTION', 'HEALTHY'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedRiskFilter(filter)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                selectedRiskFilter === filter
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-bold'
                  : 'text-[#8c909f] hover:text-white bg-[#090D16] border border-[#1E2D4A]'
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
      <div className="tactile-tier-1 rounded-xl overflow-hidden border border-[#1E2D4A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090D16] text-[#64748B] text-[11px] font-mono uppercase border-b border-[#1E2D4A] h-9 select-none">
                <th className="px-4 font-semibold">Envelope Code</th>
                <th className="px-3 font-semibold">Department & Lead</th>
                <th className="px-3 font-semibold text-right">Allocated</th>
                <th className="px-3 font-semibold text-right">Settled Spend</th>
                <th className="px-3 font-semibold text-right">Committed POs</th>
                <th className="px-3 font-semibold text-right">Available Buffer</th>
                <th className="px-4 font-semibold">Utilization Bar</th>
                <th className="px-3 font-semibold text-right">Projected Variance</th>
                <th className="px-3 font-semibold">Risk Posture</th>
                <th className="px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131E36] text-xs">
              {filteredBudgets.map((b) => {
                const totalInFlight = b.actualSettled + b.committed;
                const isOverrun = b.projectedOverrun > 0;

                return (
                  <tr key={b.id} className="hover:bg-[#131E36]/60 transition-colors group">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-white block">{b.code}</span>
                      <span className="text-[10px] text-[#8c909f] font-mono">{b.fiscalPeriod}</span>
                    </td>

                    {/* Department & Lead */}
                    <td className="px-3 py-3">
                      <span className="text-white font-semibold block">{b.departmentName}</span>
                      <span className="text-[10px] text-[#8c909f] block">{b.leadManager}</span>
                    </td>

                    {/* Allocated */}
                    <td className="px-3 py-3 text-right font-mono font-semibold text-white">
                      {formatCurrency(b.allocated, currency, 'compact')}
                    </td>

                    {/* Settled */}
                    <td className="px-3 py-3 text-right font-mono text-[#3B82F6]">
                      {formatCurrency(b.actualSettled, currency, 'compact')}
                    </td>

                    {/* Committed */}
                    <td className="px-3 py-3 text-right font-mono text-[#818CF8]">
                      {formatCurrency(b.committed, currency, 'compact')}
                    </td>

                    {/* Available */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-[#10B981]">
                      {formatCurrency(b.available, currency, 'compact')}
                    </td>

                    {/* Utilization Bar */}
                    <td className="px-4 py-3 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-white font-medium">{b.utilizationRate.toFixed(1)}%</span>
                          <span className={b.utilizationRate >= 90 ? 'text-[#ff8093]' : 'text-[#8c909f]'}>
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
                    <td className="px-3 py-3 text-right font-mono">
                      <span className={isOverrun ? 'text-[#ff8093] font-bold' : 'text-[#10B981]'}>
                        {isOverrun ? `-${formatCurrency(b.projectedOverrun, currency, 'compact')}` : '+$0 (On Track)'}
                      </span>
                    </td>

                    {/* Risk Posture */}
                    <td className="px-3 py-3">
                      <StatusBadge status={b.riskLevel} size="sm" pulse={b.riskLevel === 'CRITICAL_BREACH'} />
                    </td>

                    {/* Actions Rail */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TactileButton
                          variant="surface"
                          size="sm"
                          onClick={() => setActiveBudgetForDetail(b)}
                        >
                          Dossier
                        </TactileButton>

                        <TactileButton
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          onClick={() => setActiveBudgetForEdit(b)}
                        >
                          Edit
                        </TactileButton>
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
