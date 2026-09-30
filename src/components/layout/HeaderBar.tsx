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
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-14 z-30 bg-[#090D16]/95 backdrop-blur-md border-b border-[#1E2D4A] shadow-sm flex items-center justify-between px-3 md:px-6 select-none">
      {/* Left Financial Posture Indicators */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile Nav Hamburger */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-1 text-[#8c909f] hover:text-white rounded hover:bg-[#1E2D4A]/50 transition-colors cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <span className="material-symbols-outlined text-xl leading-none">menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[#8c909f] uppercase tracking-wider text-[11px] hidden sm:inline">All Entities</span>
          <span className="text-[#424754] hidden sm:inline">/</span>
          <span className="text-[#dfe2ef] font-medium text-xs truncate max-w-[140px] sm:max-w-none">Global Treasury Vault</span>
        </div>

        <div className="h-4 w-px bg-[#1E2D4A]" />

        {/* Real-Time Metrics Chip Group from Stitch */}
        <div className="hidden 2xl:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1526] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase">Q3 CEILING:</span>
            <span className="text-xs font-mono text-white font-semibold">
              {formatCurrency(48500000, currency, 'compact')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1526] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase">COMMITTED:</span>
            <span className="text-xs font-mono text-[#3B82F6] font-semibold">
              {formatCurrency(38200000, currency, 'compact')}{' '}
              <span className="text-[#8c909f] font-normal">(78.8%)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1526] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase">BUFFER:</span>
            <span className="text-xs font-mono text-[#10B981] font-semibold">
              {formatCurrency(10300000, currency, 'compact')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#EF4444]/10 border border-[#EF4444]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
            <span className="text-[10px] font-mono text-[#ffb4ab] font-medium uppercase">
              RISK: ELEVATED (3 DEPTS)
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Action Rail */}
      <div className="flex items-center gap-2.5">
        {/* Currency Switcher */}
        <div className="flex items-center bg-[#0D1526] border border-[#1E2D4A] rounded p-0.5 text-xs font-mono">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currency === 'USD' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8c909f] hover:text-white'
            }`}
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currency === 'INR' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8c909f] hover:text-white'
            }`}
          >
            ₹ INR
          </button>
        </div>

        {/* 3D Tactile Action Buttons from Stitch */}
        <button
          onClick={onOpenSimulatorModal || (() => setActiveTab('spending'))}
          className="h-8 px-3 rounded text-xs font-medium btn-tactile-surface text-[#dfe2ef] flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-[#8c909f]" data-icon="play_arrow">
            play_arrow
          </span>
          <span>Simulate Policy</span>
        </button>

        <button
          onClick={onOpenOverrideModal || (() => setActiveTab('exceptions'))}
          className="h-8 px-3 rounded text-xs font-medium btn-tactile-surface text-[#3B82F6] flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-[#3B82F6]" data-icon="admin_panel_settings">
            admin_panel_settings
          </span>
          <span>Override Protocol</span>
        </button>

        <button
          onClick={onOpenOverrideModal || (() => setActiveTab('exceptions'))}
          className="h-8 px-3.5 rounded text-xs font-semibold btn-tactile-primary text-white flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-white" data-icon="gavel">
            gavel
          </span>
          <span>Execute Override</span>
        </button>

        <div className="h-4 w-px bg-[#1E2D4A] mx-0.5" />

        {/* Alerts Button */}
        <button
          onClick={() => setActiveTab('exceptions')}
          className="p-1.5 text-[#8c909f] hover:text-white rounded hover:bg-[#1E2D4A]/50 transition-colors relative cursor-pointer"
          title="Exceptions Alert"
        >
          <span className="material-symbols-outlined text-lg leading-none" data-icon="notifications">
            notifications
          </span>
          {pendingExceptions.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E11D48] ring-2 ring-[#090D16]" />
          )}
        </button>

        {/* Role Perspective Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 h-8 px-2.5 rounded bg-[#0D1526] border border-[#1E2D4A] hover:border-[#3B82F6]/50 text-xs text-[#dfe2ef] transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="font-semibold text-white">{role}</span>
            <span className="material-symbols-outlined text-sm text-[#8c909f]" data-icon="expand_more">
              expand_more
            </span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-10 w-72 bg-[#0D1526] border border-[#2A3E66] rounded-lg shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-[#1E2D4A] mb-1">
                <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider block">
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
                    className={`w-full text-left p-2 rounded text-xs transition-colors cursor-pointer ${
                      role === r.role ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/30' : 'hover:bg-[#131E36] text-[#dfe2ef]'
                    }`}
                  >
                    <span className="font-semibold block">{r.label}</span>
                    <span className="text-[10px] text-[#8c909f] block leading-tight mt-0.5">{r.desc}</span>
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
