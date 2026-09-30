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
    <section className="tactile-tier-1 rounded-xl p-5 border border-[#3B82F6]/30 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#1E2D4A] gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
            <span className="material-symbols-outlined text-lg" data-icon="terminal">
              terminal
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-[#3B82F6] uppercase">
                Deterministic Rule Simulator
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                ZERO-REGRET SANDBOX
              </span>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white tracking-tight mt-0.5">
              Real-Time Spending Pre-Clearance & Policy Evaluation Simulator
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#8c909f]">
          Simulated on Policy Graph v4.12.8
        </span>
      </div>

      {/* Simulator Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Input Parameters Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 bg-[#090D16] p-4 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono font-semibold text-[#8c909f] uppercase tracking-wider block">
            Requisition Draft Attributes
          </span>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="pt-1.5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#8c909f]">Evaluation Latency: ~14ms</span>
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
        <div className="lg:col-span-7 bg-[#131E36]/40 p-4 rounded-lg border border-[#2A3E66] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2A3E66]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isViolation ? 'bg-[#E11D48] animate-ping' : 'bg-[#10B981]'
                  }`}
                />
                <span
                  className={`text-xs font-mono font-bold ${
                    isViolation ? 'text-[#ff8093]' : 'text-[#10B981]'
                  }`}
                >
                  {isViolation
                    ? 'VERDICT: HARD CEILING POLICY VIOLATION'
                    : 'VERDICT: PRE-CLEARED FOR EXECUTION'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#8c909f]">
                {isViolation ? 'RULE-ENG-08' : 'RULE-ENG-01'}
              </span>
            </div>

            {/* Dynamic Metrics Delta from Stitch */}
            <div className="grid grid-cols-3 gap-2.5 my-3">
              <div className="p-2.5 rounded bg-[#090D16]/80 border border-[#1E2D4A]">
                <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                  CURRENT DEPT UTIL
                </span>
                <span className="text-sm font-mono font-bold text-white block mt-0.5">
                  {currentUtil.toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-[#8c909f] block">
                  {formatCurrency(currentTotal, currency, 'compact')} of{' '}
                  {formatCurrency(targetDept.allocated, currency, 'compact')}
                </span>
              </div>

              <div
                className={`p-2.5 rounded bg-[#090D16]/80 border ${
                  isViolation ? 'border-[#E11D48]/60 bg-[#E11D48]/5' : 'border-[#1E2D4A]'
                }`}
              >
                <span
                  className={`text-[10px] font-mono uppercase block ${
                    isViolation ? 'text-[#ff8093]' : 'text-[#8c909f]'
                  }`}
                >
                  PROJECTED POST-REQ
                </span>
                <span
                  className={`text-sm font-mono font-bold block mt-0.5 ${
                    isViolation ? 'text-[#ff8093]' : 'text-[#10B981]'
                  }`}
                >
                  {postUtil.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-mono block ${
                    isViolation ? 'text-[#ff8093]' : 'text-[#10B981]'
                  }`}
                >
                  {isViolation
                    ? `+${formatCurrency(deficit, currency, 'compact')} Deficit`
                    : `${formatCurrency(targetDept.allocated - postTotal, currency, 'compact')} Buffer`}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#090D16]/80 border border-[#1E2D4A]">
                <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                  ENFORCEMENT PATH
                </span>
                <span className="text-xs font-mono font-bold text-[#F59E0B] block mt-0.5">
                  {isViolation ? 'L3 CFO Required' : 'Automated Release'}
                </span>
                <span className="text-[10px] font-mono text-[#8c909f] block">
                  {isViolation ? 'Auto-Block Active' : 'Pre-Cleared'}
                </span>
              </div>
            </div>

            {/* Policy Log Explanation Box */}
            <div className="p-2.5 rounded bg-[#090D16] border border-[#1E2D4A] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <span
                  className={`material-symbols-outlined text-sm ${
                    isViolation ? 'text-[#E11D48]' : 'text-[#10B981]'
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
              <p className="text-[11px] font-sans text-[#8c909f] leading-relaxed">
                {isViolation
                  ? `Requisition causes ${targetDept.departmentName} quarterly commitment to exceed ${formatCurrency(targetDept.allocated, currency)} baseline ceiling. Automated processing has been halted. Requires explicit Group CFO digital sign-off and formal reallocation offset from Cloud Ops buffer.`
                  : `Requisition is within approved threshold bands and maintains positive liquidity buffer for ${targetDept.departmentName}. Ready for immediate dispatch.`}
              </p>
            </div>
          </div>

          {/* Tactile Action Triggers */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#2A3E66] mt-3">
            {evalSuccess && (
              <span className="text-xs font-mono text-[#10B981] flex items-center gap-1">
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
