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
      <div className="lg:col-span-7 tactile-tier-1 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
            <div>
              <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider block">
                Resource Allocation
              </span>
              <h3 className="text-sm md:text-base font-semibold text-white tracking-tight">
                Spend Concentration by Category
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs font-mono text-[#3B82F6] hover:underline cursor-pointer"
            >
              All Categories →
            </button>
          </div>

          <div className="space-y-3 mt-3.5">
            {categories.slice(0, 4).map((cat) => {
              const util = ((cat.spent + cat.committed) / cat.allocated) * 100;
              const isHigh = util >= 90;
              const isWarning = util >= 80 && util < 90;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{cat.name}</span>
                    <span className="font-mono text-[#8c909f]">
                      <strong className="text-white">
                        {formatCurrency(cat.spent + cat.committed, currency, 'compact')}
                      </strong>{' '}
                      /{formatCurrency(cat.allocated, currency, 'compact')}{' '}
                      <span className={isHigh ? 'text-[#ff8093] font-bold' : isWarning ? 'text-[#F59E0B]' : 'text-[#10B981]'}>
                        ({util.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* Utilization bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#181B25] overflow-hidden flex border border-[#1E2D4A]/40">
                    <div
                      className={isHigh ? 'bg-[#E11D48]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'}
                      style={{ width: `${Math.min(100, util)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#1E2D4A] mt-4 flex items-center justify-between text-xs font-mono text-[#8c909f]">
          <span>Enforced Sub-Cap Thresholds</span>
          <span className="text-white font-medium">92.4% Max Allowed Cloud Burn</span>
        </div>
      </div>

      {/* Pending Approvals & Real-Time Alerts Pod (5 cols) */}
      <div className="lg:col-span-5 tactile-tier-1 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
            <div>
              <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider block">
                Queue Telemetry
              </span>
              <h3 className="text-sm md:text-base font-semibold text-white tracking-tight">
                Pending Approvals & Alerts
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6366F1]/20 text-[#c0c1ff] border border-[#6366F1]/40">
              {pendingApprovals.length} IN FLIGHT
            </span>
          </div>

          <div className="space-y-2.5 mt-3.5">
            {pendingApprovals.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-[#8c909f]">
                No requisitions currently awaiting supervisory sign-off.
              </div>
            ) : (
              pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  className="p-2.5 rounded bg-[#090D16] border border-[#1E2D4A] flex items-center justify-between gap-3"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {req.trackingNumber}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-[#8c909f] truncate block mt-0.5">
                      {req.vendor} · {req.departmentName}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-white block">
                      {formatCurrency(req.amount, currency, 'compact')}
                    </span>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[10px] font-mono text-[#3B82F6] hover:underline cursor-pointer"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* High-Risk Flash Alert */}
            <div className="p-2.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#ffb4ab]">
              <span className="material-symbols-outlined text-base text-[#EF4444] shrink-0 mt-0.5" data-icon="crisis_alert">
                crisis_alert
              </span>
              <div className="leading-tight">
                <span className="font-bold text-white font-mono uppercase text-[10px] block">
                  CAPITAL VELOCITY ANOMALY DETECTED
                </span>
                <span className="text-[11px] text-[#ffdad6]">
                  Engineering daily burn exceeded 30-day moving average by +14.2%.
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('approvals')}
          className="mt-4 w-full h-8 rounded text-xs font-mono btn-tactile-surface text-[#8c909f] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Open Full Approvals Command Center</span>
          <span className="material-symbols-outlined text-sm leading-none" data-icon="arrow_forward">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
