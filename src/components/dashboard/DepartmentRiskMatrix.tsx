import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

interface DepartmentRiskMatrixProps {
  onRebalance?: () => void;
  onSelectDepartment?: (deptId: string) => void;
}

export const DepartmentRiskMatrix: React.FC<DepartmentRiskMatrixProps> = ({
  onRebalance,
  onSelectDepartment,
}) => {
  const { budgets, currency, setActiveTab } = useApp();

  return (
    <div className="tactile-tier-1 rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
          <div>
            <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider block">
              Unit Exposure
            </span>
            <h3 className="text-sm md:text-base font-semibold text-white tracking-tight">
              Department Risk Matrix
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E11D48]/15 text-[#ff8093] border border-[#E11D48]/30">
            1 CRITICAL
          </span>
        </div>

        {/* Department Utilization List */}
        <div className="space-y-3 mt-3.5">
          {budgets.map((b) => {
            const isCritical = b.utilizationRate >= 90;
            const isWarning = b.utilizationRate >= 85 && b.utilizationRate < 90;
            const settledWidth = Math.min(100, (b.actualSettled / b.allocated) * 100);
            const committedWidth = Math.min(100 - settledWidth, (b.committed / b.allocated) * 100);
            const bufferWidth = Math.max(0, 100 - (settledWidth + committedWidth));

            return (
              <div
                key={b.id}
                className={`p-3 rounded-lg bg-[#090D16] border transition-colors ${
                  isCritical
                    ? 'border-[#E11D48]/40 hover:border-[#E11D48]'
                    : isWarning
                    ? 'border-[#1E2D4A] hover:border-[#F59E0B]/50'
                    : 'border-[#1E2D4A] hover:border-[#3B82F6]/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white truncate max-w-[170px]">
                    {b.departmentName}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      isCritical ? 'text-[#ff8093]' : isWarning ? 'text-[#F59E0B]' : 'text-[#10B981]'
                    }`}
                  >
                    {b.utilizationRate.toFixed(1)}% (
                    {formatCurrency(b.actualSettled + b.committed, currency, 'compact')} /{' '}
                    {formatCurrency(b.allocated, currency, 'compact')})
                  </span>
                </div>

                {/* Multi-segment gauge */}
                <div className="w-full h-2 rounded bg-[#181B25] overflow-hidden flex my-2 border border-[#1E2D4A]/50">
                  <div
                    className="bg-[#3B82F6]"
                    style={{ width: `${settledWidth}%` }}
                    title={`Settled: ${settledWidth.toFixed(0)}%`}
                  />
                  <div
                    className={isCritical ? 'bg-[#E11D48]' : 'bg-[#818CF8]'}
                    style={{ width: `${committedWidth}%` }}
                    title={`Committed: ${committedWidth.toFixed(0)}%`}
                  />
                  <div
                    className="bg-[#262A34]"
                    style={{ width: `${bufferWidth}%` }}
                    title={`Headroom: ${bufferWidth.toFixed(0)}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#8c909f]">
                  {isCritical ? (
                    <span className="text-[#ff8093] flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-ping" />
                      CRITICAL BREACH IN {b.daysToRunOut} DAYS
                    </span>
                  ) : isWarning ? (
                    <span className="text-[#F59E0B]">ATTENTION REQUIRED (GTM Freeze)</span>
                  ) : (
                    <span className="text-[#10B981]">
                      ON MODEL · {formatCurrency(b.available, currency, 'compact')} Headroom
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectDepartment) onSelectDepartment(b.departmentId);
                      else setActiveTab('budgets');
                    }}
                    className="text-[#3B82F6] hover:underline cursor-pointer font-medium"
                  >
                    {isCritical ? 'Triage (2)' : 'Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onRebalance || (() => setActiveTab('budgets'))}
        className="mt-4 w-full h-8 rounded text-xs font-mono btn-tactile-surface text-[#8c909f] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm" data-icon="tune">
          tune
        </span>
        <span>Rebalance Department Allocations</span>
      </button>
    </div>
  );
};
