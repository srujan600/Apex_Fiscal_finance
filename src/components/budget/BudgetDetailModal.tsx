import React from 'react';
import { BudgetEnvelope } from '../../types';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { ThresholdMeter } from '../ui/ThresholdMeter';
import { formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

interface BudgetDetailModalProps {
  budget: BudgetEnvelope | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (budget: BudgetEnvelope) => void;
  onReallocate: (budget: BudgetEnvelope) => void;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budget,
  isOpen,
  onClose,
  onEdit,
  onReallocate,
}) => {
  const { currency } = useApp();

  if (!budget) return null;

  const isCritical = budget.utilizationRate >= 90;
  const isWarning = budget.utilizationRate >= 80 && budget.utilizationRate < 90;
  const totalInFlight = budget.actualSettled + budget.committed;
  const variance = budget.available - budget.projectedOverrun;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Budget Allocation Dossier: ${budget.code}`}
      subtitle={`${budget.departmentName} · Fiscal Period: ${budget.fiscalPeriod} · Lead Manager: ${budget.leadManager}`}
      badge={budget.riskLevel}
      badgeVariant={isCritical ? 'destructive' : isWarning ? 'warning' : 'primary'}
      maxWidth="xl"
      footer={
        <>
          <TactileButton variant="ghost" onClick={onClose}>
            Close Dossier
          </TactileButton>
          <TactileButton
            variant="surface"
            icon="swap_horiz"
            onClick={() => {
              onClose();
              onReallocate(budget);
            }}
          >
            Rebalance Envelope
          </TactileButton>
          <TactileButton
            variant="primary"
            icon="edit"
            onClick={() => {
              onClose();
              onEdit(budget);
            }}
          >
            Adjust Allocation
          </TactileButton>
        </>
      }
    >
      <div className="space-y-5 text-xs">
        {/* KPI Metrics Quad */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              TOTAL ALLOCATED
            </span>
            <span className="text-base font-mono font-bold text-slate-900 block mt-0.5">
              {formatCurrency(budget.allocated, currency)}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">Baseline Ceiling</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              SETTLED + COMMITTED
            </span>
            <span className="text-base font-mono font-bold text-blue-600 block mt-0.5">
              {formatCurrency(totalInFlight, currency)}
            </span>
            <span className="text-[10px] font-mono text-indigo-600 block font-medium">
              {budget.utilizationRate.toFixed(1)}% Consumed
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              AVAILABLE BUFFER
            </span>
            <span className={`text-base font-mono font-bold block mt-0.5 ${budget.available > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(budget.available, currency)}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              {budget.daysToRunOut} Days Remaining
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              PROJECTED OVERRUN
            </span>
            <span className={`text-base font-mono font-bold block mt-0.5 ${budget.projectedOverrun > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {budget.projectedOverrun > 0 ? `-${formatCurrency(budget.projectedOverrun, currency)}` : '$0 (Compliant)'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">Run-rate variance</span>
          </div>
        </div>

        {/* Multi-Segment Threshold Meter */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-slate-900 uppercase">
              Current Capital Burn vs. Hard Ceiling
            </span>
            <StatusBadge status={budget.riskLevel} />
          </div>
          <ThresholdMeter
            allocated={budget.allocated}
            settled={budget.actualSettled}
            committed={budget.committed}
            height="lg"
            showLabels={true}
          />
        </div>

        {/* Sub-Category Allocations within this department */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold text-slate-900 uppercase tracking-wider block">
            Sub-Category Commitments Breakdown
          </span>
          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-mono uppercase border-b border-slate-200/80 h-8">
                  <th className="px-3 font-semibold">Sub-Allocation</th>
                  <th className="px-3 font-semibold text-right">Settled</th>
                  <th className="px-3 font-semibold text-right">Committed</th>
                  <th className="px-3 font-semibold text-right">Utilization</th>
                  <th className="px-3 font-semibold text-right">Policy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">Compute & Cluster Licensing</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.actualSettled * 0.65, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.committed * 0.7, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-rose-600">95.4%</td>
                  <td className="px-3 py-2.5 text-right"><span className="text-[10px] font-mono font-semibold text-rose-600">Sub-Cap Alert</span></td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">Engineering Tooling & SaaS</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.actualSettled * 0.25, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.committed * 0.2, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600">82.1%</td>
                  <td className="px-3 py-2.5 text-right"><span className="text-[10px] font-mono font-semibold text-emerald-600">On Model</span></td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">Specialized Contractor Advisory</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.actualSettled * 0.1, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(budget.committed * 0.1, currency, 'compact')}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600">61.5%</td>
                  <td className="px-3 py-2.5 text-right"><span className="text-[10px] font-mono font-semibold text-emerald-600">Surplus</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Reference */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">Cryptographic Hash: 0x8a94b2e106c014fa231</span>
          <span className="text-emerald-700 font-semibold">Enforcement Engine: 12/12 Nodes Verified</span>
        </div>
      </div>
    </Modal>
  );
};
