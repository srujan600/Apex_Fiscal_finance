import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';

export const CategorySpendBar: React.FC = () => {
  const { categories, currency, requests, setActiveTab } = useApp();

  const pendingApprovals = requests.filter((r) => r.status === 'PENDING_APPROVAL');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Category Spending Pod (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Resource Allocation
              </span>
              <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                Spend Concentration by Category
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs font-semibold font-mono text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
            >
              All Categories →
            </button>
          </div>

          <div className="space-y-3.5 mt-4">
            {categories.slice(0, 4).map((cat) => {
              const util = ((cat.spent + cat.committed) / cat.allocated) * 100;
              const isHigh = util >= 90;
              const isWarning = util >= 80 && util < 90;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-900 font-semibold">{cat.name}</span>
                    <span className="font-mono text-slate-500">
                      <strong className="text-slate-900 font-bold">
                        {formatCurrency(cat.spent + cat.committed, currency, 'compact')}
                      </strong>{' '}
                      /{formatCurrency(cat.allocated, currency, 'compact')}{' '}
                      <span className={isHigh ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                        ({util.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* Utilization bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/60">
                    <div
                      className={isHigh ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'}
                      style={{ width: `${Math.min(100, util)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3.5 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Enforced Sub-Cap Thresholds</span>
          <span className="text-slate-900 font-medium">92.4% Max Allowed Cloud Burn</span>
        </div>
      </div>

      {/* Pending Approvals & Real-Time Alerts Pod (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Queue Telemetry
              </span>
              <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                Pending Approvals & Alerts
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {pendingApprovals.length} IN FLIGHT
            </span>
          </div>

          <div className="space-y-2.5 mt-4">
            {pendingApprovals.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-slate-400">
                No requisitions currently awaiting supervisory sign-off.
              </div>
            ) : (
              pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {req.trackingNumber}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5 font-medium">
                      {req.vendor} · {req.departmentName}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-900 block">
                      {formatCurrency(req.amount, currency, 'compact')}
                    </span>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[10px] font-mono font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* High-Risk Flash Alert */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5" data-icon="crisis_alert">
                crisis_alert
              </span>
              <div className="leading-tight">
                <span className="font-bold text-rose-950 font-mono uppercase text-[10px] block">
                  CAPITAL VELOCITY ANOMALY DETECTED
                </span>
                <span className="text-[11px] text-rose-700 font-medium">
                  Engineering daily burn exceeded 30-day moving average by +14.2%.
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('approvals')}
          className="mt-5 w-full h-9 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all group"
        >
          <span>Open Full Approvals Command Center</span>
          <span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-0.5 transition-transform duration-200" data-icon="arrow_forward">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
