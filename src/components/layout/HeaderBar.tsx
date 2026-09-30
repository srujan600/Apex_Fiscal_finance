import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { UserRole } from '../../types';

interface HeaderBarProps {
  onOpenOverrideModal?: () => void;
  onOpenSimulatorModal?: () => void;
  onToggleMobileNav?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenOverrideModal,
  onOpenSimulatorModal,
  onToggleMobileNav,
}) => {
  const { role, setRole, currency, setCurrency, exceptions, setActiveTab } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING_DECISION');

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'CFO', label: 'Victoria Sterling (Group CFO)', desc: 'Sovereign override authority & global variance' },
    { role: 'FINANCE_ADMIN', label: 'Marcus Vance (VP Treasury)', desc: 'Treasury allocations & liquidity flow' },
    { role: 'DEPT_MANAGER', label: 'Sarah Jenkins (VP Eng)', desc: 'Cost center approvals & burn telemetry' },
    { role: 'EMPLOYEE', label: 'Alex Rivera (Staff Architect)', desc: 'Requisitioner & personal quota view' },
    { role: 'SYSTEM_ADMIN', label: 'Devon Thorne (Risk Architect)', desc: 'Rule topology & cryptographic audit' },
  ];

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-14 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs flex items-center justify-between px-4 md:px-8 select-none transition-all">
      {/* Left Financial Posture Indicators */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile Nav Hamburger */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <span className="material-symbols-outlined text-xl leading-none">menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-400 font-medium uppercase tracking-wider text-[11px] hidden sm:inline">All Entities</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-900 font-semibold text-xs truncate max-w-[140px] sm:max-w-none">Global Treasury Vault</span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Real-Time Metrics Chip Group */}
        <div className="hidden 2xl:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Q3 CEILING:</span>
            <span className="text-xs font-mono text-slate-900 font-semibold">
              {formatCurrency(48500000, currency, 'compact')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">COMMITTED:</span>
            <span className="text-xs font-mono text-blue-600 font-semibold">
              {formatCurrency(38200000, currency, 'compact')}{' '}
              <span className="text-slate-400 font-normal">(78.8%)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">BUFFER:</span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">
              {formatCurrency(10300000, currency, 'compact')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-mono text-rose-700 font-medium uppercase tracking-wide">
              RISK: ELEVATED (3 DEPTS)
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Action Rail */}
      <div className="flex items-center gap-2.5">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5 text-xs font-mono">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
              currency === 'USD' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
              currency === 'INR' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ₹ INR
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onOpenSimulatorModal || (() => setActiveTab('spending'))}
          className="h-8.5 px-3.5 rounded-xl text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-slate-700 transition-colors" data-icon="play_arrow">
            play_arrow
          </span>
          <span>Simulate Policy</span>
        </button>

        <button
          onClick={onOpenOverrideModal || (() => setActiveTab('exceptions'))}
          className="h-8.5 px-3.5 rounded-xl text-xs font-medium bg-white text-blue-600 hover:bg-blue-50/60 hover:text-blue-700 border border-blue-200/70 hover:border-blue-300 shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined text-base text-blue-600" data-icon="admin_panel_settings">
            admin_panel_settings
          </span>
          <span>Override Protocol</span>
        </button>

        <button
          onClick={onOpenOverrideModal || (() => setActiveTab('exceptions'))}
          className="h-8.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/15 flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-base text-white" data-icon="gavel">
            gavel
          </span>
          <span>Execute Override</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Alerts Button */}
        <button
          onClick={() => setActiveTab('exceptions')}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all relative cursor-pointer"
          title="Exceptions Alert"
        >
          <span className="material-symbols-outlined text-xl leading-none" data-icon="notifications">
            notifications
          </span>
          {pendingExceptions.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Role Perspective Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 h-8.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-semibold text-slate-900">{role}</span>
            <span className="material-symbols-outlined text-sm text-slate-400" data-icon="expand_more">
              expand_more
            </span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-10.5 w-76 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                  Switch Persona Perspective
                </span>
              </div>
              <div className="space-y-0.5">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      role === r.role
                        ? 'bg-slate-900 text-white font-medium shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-semibold block">{r.label}</span>
                    <span className={`text-[10px] block leading-tight mt-0.5 ${role === r.role ? 'text-slate-300' : 'text-slate-400 font-medium'}`}>
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
