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

          <div className="space-y-1.5">
            <label className="text-[11px] font-sans text-slate-500 font-medium block">
              Attachment (Signed Quote / SOW)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="w-full h-9 text-xs font-mono bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <Input
          label="Business Purpose & Non-Negotiable Procurement Rationale"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* LIVE BUDGET CONTEXT & POLICY VERDICT BOX */}
        <div
          className={`p-4 rounded-xl border space-y-3 shadow-sm ${
            isOverBudget
              ? 'bg-rose-50/70 border-rose-200 text-rose-800'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOverBudget ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className={isOverBudget ? 'text-rose-700' : 'text-emerald-700'}>
                Decision: {isOverBudget ? 'BLOCKED' : 'PRE-CLEARED'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-medium">
              {selectedDept.departmentName} Ceiling Check
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Requested:</span>
              <span className="text-slate-900 font-bold text-sm block mt-0.5">
                {formatCurrency(numAmount, currency)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Available:</span>
              <span className={`font-bold text-sm block mt-0.5 ${currentAvailable < numAmount ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatCurrency(currentAvailable, currency)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Projected Utilization:</span>
              <span className={`font-bold text-sm block mt-0.5 ${projectedUtil > 100 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {projectedUtil.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 text-xs">
            <span className="font-semibold block mb-0.5 text-slate-900">Reason:</span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
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
