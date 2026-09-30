import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useApp } from '../../context/AppContext';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currency, budgets, createBudget } = useApp();
  const [departmentName, setDepartmentName] = useState('Data Platform & Machine Learning');
  const [allocatedAmount, setAllocatedAmount] = useState('12000000');
  const [fiscalPeriod, setFiscalPeriod] = useState('Q4-2025');
  const [leadManager, setLeadManager] = useState('Dr. Aris Thorne');
  const [hardCapWarning, setHardCapWarning] = useState('85');
  const [hardCapBlock, setHardCapBlock] = useState('100');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocated = parseFloat(allocatedAmount.replace(/[^0-9.]/g, '')) || 0;
    if (allocated > 0) {
      await createBudget({
        departmentName,
        allocated,
        fiscalPeriod,
        leadManager,
        warningThresholdPct: parseFloat(hardCapWarning) || 85,
        hardCapThresholdPct: parseFloat(hardCapBlock) || 100,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Department Budget Envelope"
      subtitle="Establish a new quarterly capital ceiling and deterministic threshold rules."
      badge="NEW ENVELOPE"
      badgeVariant="primary"
      footer={
        <>
          <TactileButton variant="ghost" onClick={onClose}>
            Cancel
          </TactileButton>
          <TactileButton variant="primary" icon="add" onClick={handleSubmit}>
            Establish Budget Envelope
          </TactileButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department / Cost Center Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
          />

          <Select
            label="Fiscal Epoch / Period"
            value={fiscalPeriod}
            onChange={(e) => setFiscalPeriod(e.target.value)}
            options={[
              { value: 'Q3-2025', label: 'Q3-2025 (Current Active)' },
              { value: 'Q4-2025', label: 'Q4-2025 (Upcoming Epoch)' },
              { value: 'FY-2026', label: 'FY-2026 (Annual Pool)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Authorized Allocation"
            prefixSymbol={currency === 'INR' ? '₹' : '$'}
            value={allocatedAmount}
            onChange={(e) => setAllocatedAmount(e.target.value)}
            helperText="Total approved baseline pool for this epoch"
          />

          <Input
            label="Designated Lead Manager"
            value={leadManager}
            onChange={(e) => setLeadManager(e.target.value)}
          />
        </div>

        <div className="p-3.5 rounded bg-[#090D16] border border-[#1E2D4A] space-y-3">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider block">
            Automated Enforcement Guardrails
          </span>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Warning Horizon Threshold (%)"
              value={hardCapWarning}
              onChange={(e) => setHardCapWarning(e.target.value)}
              helperText="Triggers early variance warning to Lead VP"
            />

            <Input
              label="Hard Stop Killswitch (%)"
              value={hardCapBlock}
              onChange={(e) => setHardCapBlock(e.target.value)}
              helperText="Requires Group CFO override to commit beyond this limit"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
