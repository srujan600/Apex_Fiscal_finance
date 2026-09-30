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
          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              TOTAL ALLOCATED
            </span>
            <span className="text-base font-mono font-bold text-white block mt-0.5">
              {formatCurrency(budget.allocated, currency)}
            </span>
            <span className="text-[10px] font-mono text-[#8c909f] block">Baseline Ceiling</span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              SETTLED + COMMITTED
            </span>
            <span className="text-base font-mono font-bold text-[#3B82F6] block mt-0.5">
              {formatCurrency(totalInFlight, currency)}
            </span>
            <span className="text-[10px] font-mono text-[#818CF8] block">
              {budget.utilizationRate.toFixed(1)}% Consumed
            </span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              AVAILABLE BUFFER
            </span>
            <span className={`text-base font-mono font-bold block mt-0.5 ${budget.available > 0 ? 'text-[#10B981]' : 'text-[#ff8093]'}`}>
              {formatCurrency(budget.available, currency)}
            </span>
            <span className="text-[10px] font-mono text-[#8c909f] block">
              {budget.daysToRunOut} Days Remaining
            </span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              PROJECTED OVERRUN
            </span>
            <span className={`text-base font-mono font-bold block mt-0.5 ${budget.projectedOverrun > 0 ? 'text-[#ff8093]' : 'text-[#10B981]'}`}>
              {budget.projectedOverrun > 0 ? `-${formatCurrency(budget.projectedOverrun, currency)}` : '$0 (Compliant)'}
            </span>
            <span className="text-[10px] font-mono text-[#8c909f] block">Run-rate variance</span>
          </div>
        </div>

        {/* Multi-Segment Threshold Meter */}
        <div className="p-4 rounded-lg bg-[#090D16] border border-[#1E2D4A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-white uppercase">
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
          <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider block">
            Sub-Category Commitments Breakdown
          </span>
          <div className="tactile-tier-1 rounded-lg border border-[#1E2D4A] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#090D16] text-[#64748B] text-[10px] font-mono uppercase border-b border-[#1E2D4A] h-8">
                  <th className="px-3 font-semibold">Sub-Allocation</th>
                  <th className="px-3 font-semibold text-right">Settled</th>
                  <th className="px-3 font-semibold text-right">Committed</th>
                  <th className="px-3 font-semibold text-right">Utilization</th>
                  <th className="px-3 font-semibold text-right">Policy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131E36]">
                <tr className="hover:bg-[#131E36]/40">
                  <td className="px-3 py-2 font-medium text-white">Compute & Cluster Licensing</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.actualSettled * 0.65, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.committed * 0.7, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-[#ff8093]">95.4%</td>
                  <td className="px-3 py-2 text-right"><span className="text-[10px] font-mono text-[#ff8093]">Sub-Cap Alert</span></td>
                </tr>
                <tr className="hover:bg-[#131E36]/40">
                  <td className="px-3 py-2 font-medium text-white">Engineering Tooling & SaaS</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.actualSettled * 0.25, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.committed * 0.2, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-[#3B82F6]">82.1%</td>
                  <td className="px-3 py-2 text-right"><span className="text-[10px] font-mono text-[#10B981]">On Model</span></td>
                </tr>
                <tr className="hover:bg-[#131E36]/40">
                  <td className="px-3 py-2 font-medium text-white">Specialized Contractor Advisory</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.actualSettled * 0.1, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(budget.committed * 0.1, currency, 'compact')}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-[#10B981]">61.5%</td>
                  <td className="px-3 py-2 text-right"><span className="text-[10px] font-mono text-[#10B981]">Surplus</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Reference */}
        <div className="p-3 rounded bg-[#131E36]/40 border border-[#2A3E66] flex items-center justify-between text-xs font-mono">
          <span className="text-[#8c909f]">Cryptographic Hash: 0x8a94b2e106c014fa231</span>
          <span className="text-[#10B981]">Enforcement Engine: 12/12 Nodes Verified</span>
        </div>
      </div>
    </Modal>
  );
};
