import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { budgets, categories, currency, addRequest, user } = useApp();

  const [category, setCategory] = useState(categories[0]?.name || 'Cloud Infrastructure & Compute');
  const [departmentId, setDepartmentId] = useState(budgets[0]?.id || 'dept-eng');
  const [amountStr, setAmountStr] = useState('250000');
  const [vendor, setVendor] = useState('Amazon Web Services');
  const [purpose, setPurpose] = useState('Cross-region container replication & reserved instance pre-commit');
  const [date, setDate] = useState('2026-09-30');
  const [attachmentName, setAttachmentName] = useState('SOW_AWS_Q3_Reserved_Addendum.pdf');

  const selectedDept = budgets.find((b) => b.id === departmentId) || budgets[0];
  const numAmount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;

  // Live Budget Context & Policy Engine Simulation
  const currentAvailable = selectedDept.available;
  const currentUtil = selectedDept.utilizationRate;
  const inFlightBefore = selectedDept.actualSettled + selectedDept.committed;
  const inFlightAfter = inFlightBefore + numAmount;
  const projectedUtil = (inFlightAfter / selectedDept.allocated) * 100;
  const isOverBudget = numAmount > currentAvailable || projectedUtil > 100;
  const deficit = Math.max(0, inFlightAfter - selectedDept.allocated);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addRequest({
      category,
      categoryId: 'cat-cld',
      departmentId: selectedDept.departmentId,
      departmentName: selectedDept.departmentName,
      amount: numAmount,
      vendor,
      businessPurpose: purpose,
      requestedBy: user.name,
      requestorRole: user.title,
      status: isOverBudget ? 'BLOCKED' : 'PRE_CLEARED',
      riskLevel: isOverBudget ? 'CRITICAL_BREACH' : 'HEALTHY',
      ruleTriggered: isOverBudget ? 'RULE-ENG-08 (Hard Stop)' : 'RULE-ENG-01 (Pre-Cleared)',
      policyReason: isOverBudget
        ? 'This request would exceed the available budget.'
        : 'Approved within available departmental headroom.',
      preCommitmentUtil: currentUtil,
      postCommitmentUtil: projectedUtil,
      hasAttachment: !!attachmentName,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Draft Spend Requisition & Live Pre-Clearance"
      subtitle="Deterministic policy engine evaluates budget impact in real-time before submission."
      badge="SPEND PRE-CLEARANCE"
      badgeVariant={isOverBudget ? 'destructive' : 'primary'}
      maxWidth="xl"
      footer={
        <>
          <TactileButton variant="ghost" onClick={onClose}>
            Cancel
          </TactileButton>

          <TactileButton
            variant={isOverBudget ? 'destructive' : 'primary'}
            icon={isOverBudget ? 'priority_high' : 'check'}
            onClick={handleSubmit}
          >
            {isOverBudget ? 'Submit Requisition for CFO Override' : 'Submit & Pre-Clear Requisition'}
          </TactileButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Select
            label="Department / Cost Center"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={budgets.map((b) => ({
              value: b.id,
              label: `${b.departmentName} (${formatCurrency(b.available, currency, 'compact')} Avail)`,
            }))}
          />

          <Select
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((c) => ({
              value: c.name,
              label: c.name,
            }))}
          />

          <Input
            label="Requested Amount"
            prefixSymbol={currency === 'INR' ? '₹' : '$'}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            helperText="Live policy evaluation runs dynamically as you type"
          />

          <Input
            label="Designated Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />

          <Input
            label="Submission Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-[11px] font-sans text-[#8c909f] font-medium block">
              Attachment (Signed Quote / SOW)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="w-full h-8 text-xs font-mono bg-[#0D1526] text-[#dfe2ef] border border-[#1E2D4A] rounded px-2.5"
              />
            </div>
          </div>
        </div>

        <Input
          label="Business Purpose & Non-Negotiable Procurement Rationale"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* LIVE BUDGET CONTEXT & POLICY VERDICT BOX (Exact match to prompt example) */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isOverBudget
              ? 'bg-[#E11D48]/10 border-[#E11D48]/50 text-[#ffb4ab]'
              : 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#1E2D4A]/50 pb-2">
            <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOverBudget ? 'bg-[#E11D48] animate-ping' : 'bg-[#10B981]'
                }`}
              />
              <span>Decision: {isOverBudget ? 'BLOCKED' : 'PRE-CLEARED'}</span>
            </div>
            <span className="text-[10px] font-mono text-[#8c909f]">
              {selectedDept.departmentName} Ceiling Check
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#8c909f] uppercase block">Requested:</span>
              <span className="text-white font-bold text-sm">
                {formatCurrency(numAmount, currency)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#8c909f] uppercase block">Available:</span>
              <span className={`font-bold text-sm ${currentAvailable < numAmount ? 'text-[#ff8093]' : 'text-[#10B981]'}`}>
                {formatCurrency(currentAvailable, currency)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#8c909f] uppercase block">Projected Utilization:</span>
              <span className={`font-bold text-sm ${projectedUtil > 100 ? 'text-[#ff8093]' : 'text-[#10B981]'}`}>
                {projectedUtil.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2D4A]/50 text-xs">
            <span className="font-semibold block mb-0.5 text-white">Reason:</span>
            <p className="text-[#dfe2ef] text-[11px] leading-relaxed">
              {isOverBudget
                ? `"This request would exceed the available budget (causes a ${formatCurrency(deficit, currency)} deficit beyond the ${formatCurrency(selectedDept.allocated, currency)} quarterly cap). Automated stop active. Routing to Exception Queue for mandatory Group CFO sign-off."`
                : `"This request is within the approved departmental envelope ($${formatCurrency(currentAvailable - numAmount, currency)} remaining buffer). Automated pre-clearance granted."`}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
