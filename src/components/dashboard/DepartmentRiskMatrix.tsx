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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
              Unit Exposure
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
              Department Risk Matrix
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
            1 CRITICAL
          </span>
        </div>

        {/* Department Utilization List */}
        <div className="space-y-3 mt-4">
          {budgets.map((b) => {
            const isCritical = b.utilizationRate >= 90;
            const isWarning = b.utilizationRate >= 85 && b.utilizationRate < 90;
            const settledWidth = Math.min(100, (b.actualSettled / b.allocated) * 100);
            const committedWidth = Math.min(100 - settledWidth, (b.committed / b.allocated) * 100);
            const bufferWidth = Math.max(0, 100 - (settledWidth + committedWidth));

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                  isCritical
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:shadow-sm'
                    : isWarning
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:shadow-sm'
                    : 'bg-slate-50/60 border-slate-200/70 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 truncate pr-2">
                    {b.departmentName}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {b.utilizationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                  <span>Burn: {formatCurrency(b.actualSettled + b.committed, currency, 'compact')}</span>
                  <span>Ceiling: {formatCurrency(b.allocated, currency, 'compact')}</span>
                </div>

                {/* Multi-segment gauge */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex my-2 border border-slate-200/60">
                  <div
                    className="bg-blue-600"
                    style={{ width: `${settledWidth}%` }}
                    title={`Settled: ${settledWidth.toFixed(0)}%`}
                  />
                  <div
                    className={isCritical ? 'bg-rose-500' : 'bg-indigo-500'}
                    style={{ width: `${committedWidth}%` }}
                    title={`Committed: ${committedWidth.toFixed(0)}%`}
                  />
                  <div
                    className="bg-slate-200"
                    style={{ width: `${bufferWidth}%` }}
                    title={`Headroom: ${bufferWidth.toFixed(0)}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  {isCritical ? (
                    <span className="text-rose-600 flex items-center gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      CRITICAL BREACH IN {b.daysToRunOut} DAYS
                    </span>
                  ) : isWarning ? (
                    <span className="text-amber-700 font-medium">ATTENTION REQUIRED (GTM Freeze)</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      ON MODEL · {formatCurrency(b.available, currency, 'compact')} Headroom
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectDepartment) onSelectDepartment(b.departmentId);
                      else setActiveTab('budgets');
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold"
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
        className="mt-5 w-full h-9 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined text-sm" data-icon="tune">
          tune
        </span>
        <span>Rebalance Department Allocations</span>
      </button>
    </div>
  );
};
