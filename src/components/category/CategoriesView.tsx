import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { ThresholdMeter } from '../ui/ThresholdMeter';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { SpendCategory } from '../../types';

export const CategoriesView: React.FC = () => {
  const { categories, currency, addCategory } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<SpendCategory | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAlloc, setNewCatAlloc] = useState('5000000');
  const [newCatThreshold, setNewCatThreshold] = useState('85');

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const allocated = parseFloat(newCatAlloc.replace(/[^0-9.]/g, '')) || 0;
    const threshold = parseFloat(newCatThreshold) || 85;
    await addCategory({
      name: newCatName.trim(),
      allocated,
      thresholdPercent: threshold,
    });
    setNewCatName('');
    setCreateCategoryOpen(false);
  };

  const totalAllocated = categories.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalCommitted = categories.reduce((sum, c) => sum + c.committed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
              Taxonomy & Sub-Caps
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">EXPENSE CATEGORIES</span>
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Spend Category Budgets & Policy Thresholds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Category-level capital limits, vendor concentration sub-caps, and escalation triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TactileButton variant="primary" icon="add" onClick={() => setCreateCategoryOpen(true)}>
            Add Category Sub-Cap
          </TactileButton>
        </div>
      </div>

      {/* Aggregate Overview Quad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">ACTIVE CATEGORIES</span>
          <span className="text-xl font-mono font-bold text-slate-900 block mt-1">
            {categories.length} Taxonomy Classes
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">100% Monitored</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL CATEGORY POOL</span>
          <span className="text-xl font-mono font-bold text-slate-900 block mt-1">
            {formatCurrency(totalAllocated, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Approved Ceilings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL IN-FLIGHT</span>
          <span className="text-xl font-mono font-bold text-blue-600 block mt-1">
            {formatCurrency(totalSpent + totalCommitted, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Settled + Committed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">HIGHEST CONCENTRATION</span>
          <span className="text-xl font-mono font-bold text-rose-600 block mt-1">Cloud Infrastructure</span>
          <span className="text-[10px] font-mono text-rose-600 block mt-0.5 font-medium">92.4% Sub-cap hit</span>
        </div>
      </div>

      {/* Category List Ledger Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase border-b border-slate-200/80 h-10 select-none">
                <th className="px-4 font-semibold">Category Code</th>
                <th className="px-3 font-semibold">Category Name</th>
                <th className="px-3 font-semibold text-right">Allocated Sub-Cap</th>
                <th className="px-3 font-semibold text-right">Settled</th>
                <th className="px-3 font-semibold text-right">Committed</th>
                <th className="px-3 font-semibold text-right">Available</th>
                <th className="px-4 font-semibold">Utilization Meter</th>
                <th className="px-3 font-semibold text-right">Threshold Policy</th>
                <th className="px-3 font-semibold">Risk State</th>
                <th className="px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {categories.map((cat) => {
                const inFlight = cat.spent + cat.committed;
                const utilPercent = (inFlight / cat.allocated) * 100;
                const available = cat.allocated - inFlight;
                const isOverThreshold = utilPercent >= cat.thresholdPercent;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {cat.code}
                    </td>

                    <td className="px-3 py-3.5">
                      <span className="font-semibold text-slate-900 block">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Approval Gate: Single-item &gt; $50k requires CFO signoff
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(cat.allocated, currency, 'compact')}
                    </td>

                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-blue-600">
                      {formatCurrency(cat.spent, currency, 'compact')}
                    </td>

                    <td className="px-3 py-3.5 text-right font-mono font-semibold text-indigo-600">
                      {formatCurrency(cat.committed, currency, 'compact')}
                    </td>

                    <td className="px-3 py-3.5 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(available, currency, 'compact')}
                    </td>

                    {/* Utilization Meter */}
                    <td className="px-4 py-3.5 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-900 font-semibold">{utilPercent.toFixed(1)}%</span>
                          <span className={isOverThreshold ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                            Cap: {cat.thresholdPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/60">
                          <div
                            className={isOverThreshold ? 'bg-rose-500' : 'bg-blue-600'}
                            style={{ width: `${Math.min(100, utilPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right font-mono text-[11px]">
                      <span className={isOverThreshold ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                        {isOverThreshold ? 'Auto-Block Triggered' : 'Standard Pre-Clearance'}
                      </span>
                    </td>

                    <td className="px-3 py-3.5">
                      <StatusBadge status={cat.riskLevel} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <TactileButton variant="surface" size="sm" onClick={() => setSelectedCategory(cat)}>
                        Config
                      </TactileButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <Modal
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          title={`Category Governance: ${selectedCategory.name}`}
          subtitle={`${selectedCategory.code} · Hard Ceiling: ${formatCurrency(selectedCategory.allocated, currency)}`}
          badge={selectedCategory.riskLevel}
          badgeVariant={selectedCategory.riskLevel === 'HIGH_RISK' ? 'destructive' : 'primary'}
          footer={
            <TactileButton variant="surface" onClick={() => setSelectedCategory(null)}>
              Close Config
            </TactileButton>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                Deterministic Policy & Approval Gate
              </span>
              <p className="text-slate-700 text-xs leading-relaxed">
                Requisitions categorized under <strong>{selectedCategory.name}</strong> trigger automated
                multi-sig review if single disbursement exceeds $50,000 USD or if cumulative run-rate breaches{' '}
                {selectedCategory.thresholdPercent}%.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">CURRENT BURN RATE</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedCategory.spent + selectedCategory.committed, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">REMAINING HEADROOM</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatCurrency(selectedCategory.allocated - (selectedCategory.spent + selectedCategory.committed), currency)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        title="Establish Spend Category Sub-Cap"
        subtitle="Define a new expense classification and configure multi-sig thresholds."
        badge="NEW CATEGORY"
        badgeVariant="primary"
        footer={
          <>
            <TactileButton variant="ghost" onClick={() => setCreateCategoryOpen(false)}>
              Cancel
            </TactileButton>
            <TactileButton variant="primary" icon="add" onClick={handleCreateCategory}>
              Establish Sub-Cap
            </TactileButton>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <Input
            label="Category Name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Cyber Insurance & Risk Retainers"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Allocated Sub-Cap"
              prefixSymbol={currency === 'INR' ? '₹' : '$'}
              value={newCatAlloc}
              onChange={(e) => setNewCatAlloc(e.target.value)}
            />

            <Input
              label="Enforcement Threshold (%)"
              value={newCatThreshold}
              onChange={(e) => setNewCatThreshold(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
