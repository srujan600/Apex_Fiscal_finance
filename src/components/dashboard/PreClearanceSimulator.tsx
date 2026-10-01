import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { TactileButton } from '../ui/TactileButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface PreClearanceSimulatorProps {
  onRequestMemo?: () => void;
  onSimulateRebalance?: () => void;
}

export const PreClearanceSimulator: React.FC<PreClearanceSimulatorProps> = ({
  onRequestMemo,
  onSimulateRebalance,
}) => {
  const { budgets, currency, addRequest, user } = useApp();

  const [category, setCategory] = useState('Cloud Infra / AWS Reserved');
  const [amountStr, setAmountStr] = useState('240000');
  const [departmentId, setDepartmentId] = useState('dept-eng');
  const [vendor, setVendor] = useState('Amazon Web Services');
  const [purpose, setPurpose] = useState('Data pipeline expansion Q3 · Cross-region failover cluster');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  const targetDept = budgets.find((b) => b.id === departmentId) || budgets[0];
  const numAmount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;

  // Real-time deterministic calculation
  const currentUtil = targetDept.utilizationRate;
  const currentTotal = targetDept.actualSettled + targetDept.committed;
  const postTotal = currentTotal + numAmount;
  const postUtil = (postTotal / targetDept.allocated) * 100;
  const isViolation = postUtil > 100;
  const deficit = Math.max(0, postTotal - targetDept.allocated);

  const handleReevaluate = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
    }, 250);
  };

  const handleRequestMemo = () => {
    addRequest({
      category,
      categoryId: 'cat-cld',
      departmentId: targetDept.departmentId,
      departmentName: targetDept.departmentName,
      amount: numAmount,
      vendor,
      businessPurpose: purpose,
      requestedBy: user.name,
      requestorRole: user.title,
      status: isViolation ? 'BLOCKED' : 'PRE_CLEARED',
      riskLevel: isViolation ? 'CRITICAL_BREACH' : 'HEALTHY',
      ruleTriggered: isViolation ? 'RULE-ENG-08 (Hard Stop)' : 'RULE-ENG-01 (Pre-Cleared)',
      policyReason: isViolation
        ? `Requisition causes ${targetDept.departmentName} to exceed approved ceiling (${postUtil.toFixed(1)}%). Requires Group CFO override.`
        : 'Approved within allocated headroom.',
      preCommitmentUtil: currentUtil,
      postCommitmentUtil: postUtil,
      hasAttachment: true,
    });
    setEvalSuccess(true);
    setTimeout(() => setEvalSuccess(false), 3000);
    if (onRequestMemo) onRequestMemo();
  };

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-lg" data-icon="terminal">
              terminal
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-blue-600 uppercase">
                Deterministic Rule Simulator
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ZERO-REGRET SANDBOX
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Real-Time Spending Pre-Clearance & Policy Evaluation Simulator
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400 font-medium">
          Simulated on Policy Graph v4.12.8
        </span>
      </div>

      {/* Simulator Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left Input Parameters Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
            Requisition Draft Attributes
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Requisition Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Cloud Infra / AWS Reserved', label: 'Cloud Infra / AWS Reserved' },
                { value: 'SaaS Licensing & Compute', label: 'SaaS Licensing & Compute' },
                { value: 'Executive Professional Services', label: 'Executive Professional Services' },
              ]}
            />

            <Input
              label="Proposed Amount"
              prefixSymbol={currency === 'INR' ? '₹' : '$'}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={budgets.map((b) => ({
                value: b.id,
                label: b.departmentName,
              }))}
            />

            <Input
              label="Designated Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <Input
            label="Business Purpose & Legal Justification"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Evaluation Latency: ~14ms</span>
            <TactileButton
              variant="surface"
              size="sm"
              icon="refresh"
              onClick={handleReevaluate}
              isLoading={isEvaluating}
            >
              Re-evaluate Policy
            </TactileButton>
          </div>
        </div>

        {/* Right Live Engine Readout (7 Cols) */}
        <div className={`lg:col-span-7 p-5 rounded-xl border flex flex-col justify-between ${
          isViolation
            ? 'bg-rose-50/30 border-rose-200/80'
            : 'bg-emerald-50/30 border-emerald-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isViolation ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`text-xs font-mono font-bold ${
                    isViolation ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {isViolation
                    ? 'VERDICT: HARD CEILING POLICY VIOLATION'
                    : 'VERDICT: PRE-CLEARED FOR EXECUTION'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-medium">
                {isViolation ? 'RULE-ENG-08' : 'RULE-ENG-01'}
              </span>
            </div>

            {/* Dynamic Metrics Delta */}
            <div className="grid grid-cols-3 gap-2.5 my-3.5">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-medium">
                  CURRENT DEPT UTIL
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                  {currentUtil.toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {formatCurrency(currentTotal, currency, 'compact')} of{' '}
                  {formatCurrency(targetDept.allocated, currency, 'compact')}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl bg-white border shadow-sm ${
                  isViolation ? 'border-rose-300' : 'border-emerald-300'
                }`}
              >
                <span
                  className={`text-[10px] font-mono uppercase block font-medium ${
                    isViolation ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  PROJECTED POST-REQ
                </span>
                <span
                  className={`text-sm font-mono font-bold block mt-0.5 ${
                    isViolation ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {postUtil.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-mono block font-semibold ${
                    isViolation ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isViolation
                    ? `+${formatCurrency(deficit, currency, 'compact')} Deficit`
                    : `${formatCurrency(targetDept.allocated - postTotal, currency, 'compact')} Buffer`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-medium">
                  ENFORCEMENT PATH
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 block mt-0.5">
                  {isViolation ? 'L3 CFO Required' : 'Automated Release'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {isViolation ? 'Auto-Block Active' : 'Pre-Cleared'}
                </span>
              </div>
            </div>

            {/* Policy Log Explanation Box */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <span
                  className={`material-symbols-outlined text-sm ${
                    isViolation ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                  data-icon={isViolation ? 'block' : 'check_circle'}
                >
                  {isViolation ? 'block' : 'check_circle'}
                </span>
                <span>
                  {isViolation
                    ? 'Triggered Guardrail: Hard Stop (Ceiling Breach)'
                    : 'Guardrail Passed: Standard Quota Compliant'}
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
                {isViolation
                  ? `Requisition causes ${targetDept.departmentName} quarterly commitment to exceed ${formatCurrency(targetDept.allocated, currency)} baseline ceiling. Automated processing has been halted. Requires explicit Group CFO digital sign-off and formal reallocation offset from Cloud Ops buffer.`
                  : `Requisition is within approved threshold bands and maintains positive liquidity buffer for ${targetDept.departmentName}. Ready for immediate dispatch.`}
              </p>
            </div>
          </div>

          {/* Tactile Action Triggers */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-200/60 mt-4">
            {evalSuccess && (
              <span className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1 mr-auto">
                <span className="material-symbols-outlined text-sm" data-icon="check">check</span>
                Requisition Submitted to Queue!
              </span>
            )}

            <TactileButton
              variant="surface"
              size="sm"
              icon="swap_horiz"
              onClick={onSimulateRebalance}
            >
              Simulate Reallocation
            </TactileButton>

            <TactileButton
              variant="primary"
              size="sm"
              icon="verified"
              onClick={handleRequestMemo}
            >
              Request Executive Exception Memo
            </TactileButton>
          </div>
        </div>
      </div>
    </section>
  );
};
