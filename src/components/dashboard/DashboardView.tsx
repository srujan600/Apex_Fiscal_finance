import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KpiSection } from './KpiSection';
import { SpendTrajectoryChart } from './SpendTrajectoryChart';
import { DepartmentRiskMatrix } from './DepartmentRiskMatrix';
import { PreClearanceSimulator } from './PreClearanceSimulator';
import { CategorySpendBar } from './CategorySpendBar';
import { CriticalExceptionLedger } from './CriticalExceptionLedger';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const { isEmergencyFreezeActive, budgets, reallocateBudget, currency, setActiveTab } = useApp();
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [sourceDept, setSourceDept] = useState('dept-cld');
  const [targetDept, setTargetDept] = useState('dept-eng');
  const [transferAmount, setTransferAmount] = useState('500000');

  const handleExecuteRebalance = () => {
    const amt = parseFloat(transferAmount) || 0;
    if (amt > 0 && sourceDept !== targetDept) {
      reallocateBudget(sourceDept, targetDept, amt);
      setRebalanceModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen Header & Execution Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
              L4 Sovereign Control
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">NODE ID: APX-GLOBAL-US-01</span>
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Executive Financial Control & Risk Intelligence Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous algorithmic verification of enterprise spending thresholds, automated liquidity buffers, and sovereign override triage.
          </p>
        </div>

        {/* Action Protocol Status */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-medium">Active Epoch</span>
            <span className="text-xs font-mono text-slate-900 font-semibold">Q3-2025 · DAY 92/92 (SEPT 30)</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <TactileButton
            variant="surface"
            icon="file_download"
            onClick={() => setActiveTab('reports')}
          >
            Export Audit
          </TactileButton>
        </div>
      </div>

      {/* Emergency Lockdown Notice Banner if active */}
      {isEmergencyFreezeActive && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-rose-600" data-icon="warning">
              warning
            </span>
            <div>
              <span className="text-xs font-bold text-rose-950 font-mono uppercase tracking-wider block">
                TOTAL CAPITAL OUTFLOW FREEZE ACTIVE
              </span>
              <p className="text-xs text-rose-700 font-medium">
                All automated disbursements, purchase requisitions, and secondary delegations are halted by CFO order.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-800 px-3 py-1 bg-white border border-rose-300 rounded-lg shadow-sm">
            L4 LOCKDOWN
          </span>
        </div>
      )}

      {/* 1. VISUAL NARRATIVE TIER 1: CAPITAL LIQUIDITY & GLOBAL CEILINGS */}
      <KpiSection
        onNavigateExceptions={() => {
          const el = document.getElementById('exceptions-ledger');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. VISUAL NARRATIVE TIER 2: CONTINUOUS SPEND LINEAGE & RISK MATRIX (8 / 4 COLS) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SpendTrajectoryChart />
        </div>
        <div className="lg:col-span-4">
          <DepartmentRiskMatrix onRebalance={() => setRebalanceModalOpen(true)} />
        </div>
      </section>

      {/* 3. VISUAL NARRATIVE TIER 3: DETERMINISTIC RULE SIMULATOR */}
      <PreClearanceSimulator
        onSimulateRebalance={() => setRebalanceModalOpen(true)}
      />

      {/* 4. RESOURCE ALLOCATION & PENDING QUEUE */}
      <CategorySpendBar />

      {/* 5. VISUAL NARRATIVE TIER 4: CRITICAL EXCEPTION & OVERRIDE LEDGER */}
      <CriticalExceptionLedger />

      {/* Department Rebalance Modal */}
      <Modal
        isOpen={rebalanceModalOpen}
        onClose={() => setRebalanceModalOpen(false)}
        title="Rebalance Cost Center Allocations"
        subtitle="Transfer available liquidity buffer between departments to eliminate breach risk."
        badge="REALLOCATION"
        badgeVariant="primary"
        footer={
          <>
            <TactileButton variant="ghost" onClick={() => setRebalanceModalOpen(false)}>
              Cancel
            </TactileButton>
            <TactileButton variant="primary" icon="swap_horiz" onClick={handleExecuteRebalance}>
              Confirm Reallocation
            </TactileButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Source Department (Surplus Buffer)"
              value={sourceDept}
              onChange={(e) => setSourceDept(e.target.value)}
              options={budgets.map((b) => ({
                value: b.id,
                label: `${b.departmentName} (${formatCurrency(b.available, currency, 'compact')} Avail)`,
              }))}
            />

            <Select
              label="Recipient Department (Deficit Risk)"
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              options={budgets.map((b) => ({
                value: b.id,
                label: `${b.departmentName} (${b.utilizationRate.toFixed(1)}% Util)`,
              }))}
            />
          </div>

          <Input
            label="Transfer Amount"
            prefixSymbol={currency === 'INR' ? '₹' : '$'}
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            helperText="Transfers are executed immediately and appended to the cryptographic audit trail."
          />

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              Projected Post-Transfer Posture
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-medium">Engineering Headroom:</span>
              <span className="font-mono text-emerald-600 font-semibold">
                Expands from $870k to $1.37M (Breach mitigated +18 days)
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
