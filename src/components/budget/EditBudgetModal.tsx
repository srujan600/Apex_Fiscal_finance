import React, { useState, useEffect } from 'react';
import { BudgetEnvelope } from '../../types';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { Input } from '../ui/Input';
import { useApp } from '../../context/AppContext';

interface EditBudgetModalProps {
  budget: BudgetEnvelope | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  budget,
  isOpen,
  onClose,
}) => {
  const { currency, updateBudget } = useApp();
  const [allocationStr, setAllocationStr] = useState('');
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (budget) {
      setAllocationStr(budget.allocated.toString());
      setJustification(`Quarterly re-alignment authorized for ${budget.departmentName}.`);
    }
  }, [budget]);

  if (!budget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budget) {
      const allocated = parseFloat(allocationStr.replace(/[^0-9.]/g, '')) || 0;
      if (allocated > 0) {
        await updateBudget(budget.id, {
          allocated,
          justification: justification || 'Quarterly re-alignment authorized',
        });
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Budget Allocation: ${budget.code}`}
      subtitle={`${budget.departmentName} · Current Pool: $${budget.allocated.toLocaleString()}`}
      badge="ADJUSTMENT"
      badgeVariant="warning"
      footer={
        <>
          <TactileButton variant="ghost" onClick={onClose}>
            Cancel
          </TactileButton>
          <TactileButton variant="primary" icon="check" onClick={handleSubmit}>
            Save & Append to Audit Ledger
          </TactileButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department Name"
            value={budget.departmentName}
            readOnly={true}
          />

          <Input
            label="Fiscal Period"
            value={budget.fiscalPeriod}
            readOnly={true}
          />
        </div>

        <Input
          label="New Approved Allocation Amount"
          prefixSymbol={currency === 'INR' ? '₹' : '$'}
          value={allocationStr}
          onChange={(e) => setAllocationStr(e.target.value)}
          helperText={`Currently committed: $${(budget.actualSettled + budget.committed).toLocaleString()}`}
        />

        <div className="space-y-1.5">
          <label className="text-[11px] font-sans text-slate-500 font-medium block">
            Executive Justification for Budget Revision (Mandatory for Board Audit)
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className="w-full text-xs font-sans bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>
      </form>
    </Modal>
  );
};
