import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { TierBadge } from '../common/TierRestrictedBadge';

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
  const {
    role,
    governanceTier,
    tierName,
    tierBadge,
    isTier1,
    canExecuteOverrides,
    currency,
    setCurrency,
    exceptions,
    setActiveTab,
    currentPersona,
    logout,
  } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING_DECISION');

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoleMenu(false);
    };

    if (showRoleMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRoleMenu]);

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-14 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs flex items-center justify-between px-3.5 sm:px-6 md:px-8 select-none transition-all">
      {/* Left Financial Posture Indicators */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Nav Hamburger */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Toggle navigation drawer"
        >
          <span className="material-symbols-outlined text-xl leading-none">menu</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs truncate">
          <span className="font-mono text-slate-400 font-medium uppercase tracking-wider text-[11px] hidden sm:inline shrink-0">All Entities</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-900 font-semibold text-xs truncate">Global Treasury Vault</span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden lg:block" />

        {/* Real-Time Metrics Chip Group (Expanded for large screens) */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Q3 CAP:</span>
            <span className="text-xs font-mono text-slate-900 font-semibold">
              {formatCurrency(48500000, currency, 'compact')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">COMMITTED:</span>
            <span className="text-xs font-mono text-blue-600 font-semibold">
              {formatCurrency(38200000, currency, 'compact')}{' '}
              <span className="text-slate-400 font-normal">(78.8%)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">BUFFER:</span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">
              {formatCurrency(10300000, currency, 'compact')}
            </span>
          </div>

          <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-mono text-rose-700 font-medium uppercase tracking-wide">
              RISK: ELEVATED (3 DEPTS)
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Action Rail */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

        {/* Action Button: Simulate Policy (Hidden on mobile/tablet to avoid overflow) */}
        <button
          onClick={onOpenSimulatorModal || (() => setActiveTab('spending'))}
          className="hidden lg:flex h-8.5 px-3 rounded-xl text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer group"
          title="Run pre-clearance simulation sandbox"
        >
          <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-slate-700 transition-colors" data-icon="play_arrow">
            play_arrow
          </span>
          <span>Simulate Policy</span>
        </button>

        {/* Single Primary Action: Execute Override (Tier 1 Sovereign Only) */}
        {canExecuteOverrides ? (
          <button
            onClick={onOpenOverrideModal || (() => setActiveTab('exceptions'))}
            className="h-8.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/15 flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            title="Open sovereign Tier 1 override protocol dialog"
          >
            <span className="material-symbols-outlined text-base text-amber-400" data-icon="gavel">
              gavel
            </span>
            <span className="hidden sm:inline">Execute Override</span>
            <span className="sm:hidden">Override</span>
          </button>
        ) : (
          <button
            disabled
            className="h-8.5 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200/80 flex items-center gap-1.5 cursor-not-allowed opacity-60 shadow-xs"
            title={`Tier ${governanceTier}: Sovereign policy overrides are restricted to Tier 1 Executive clearance`}
          >
            <span className="material-symbols-outlined text-[15px] text-slate-400" data-icon="lock">
              lock
            </span>
            <span className="hidden sm:inline">Override Locked</span>
            <span className="sm:hidden">Locked</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Alerts Button */}
        <button
          onClick={() => setActiveTab('exceptions')}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all relative cursor-pointer"
          title="Exceptions Alert"
          aria-label="Exception notifications"
        >
          <span className="material-symbols-outlined text-xl leading-none" data-icon="notifications">
            notifications
          </span>
          {pendingExceptions.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Active Executive Profile & Session Dropdown Selector */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            aria-expanded={showRoleMenu}
            aria-haspopup="menu"
            className="flex items-center gap-2 h-9 px-2 sm:px-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title={`Active Session: ${currentPersona.name} (Tier ${governanceTier} - ${tierName})`}
          >
            <img
              src={currentPersona.avatar}
              alt={currentPersona.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="text-left hidden sm:block leading-tight">
              <span className="font-semibold text-slate-900 block text-xs truncate max-w-[110px]">{currentPersona.name}</span>
            </div>
            <TierBadge tier={governanceTier} size="sm" />
            <span className="material-symbols-outlined text-sm text-slate-400" data-icon="expand_more">
              expand_more
            </span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-11 w-72 sm:w-84 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/15 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              {/* Active Session Info Header */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Governance Session
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    AUTHENTICATED
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={currentPersona.avatar}
                    alt={currentPersona.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{currentPersona.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">{currentPersona.email}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{currentPersona.title}</span>
                  </div>
                </div>

                {/* Tier Clearance Badge */}
                <div className="pt-2 border-t border-slate-200/60">
                  <TierBadge tier={governanceTier} size="md" showDetails />
                </div>

                <div className="pt-1.5 space-y-1 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Department:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">{currentPersona.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Authority Limit:</span>
                    <span className="font-bold text-emerald-700">{currentPersona.spendingLimit.split('/')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Explicit Sign Out Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out to Landing Portal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
