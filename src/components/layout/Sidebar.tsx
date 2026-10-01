import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TierBadge } from '../common/TierRestrictedBadge';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number | string;
  badgeVariant?: 'destructive' | 'primary' | 'neutral';
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    user,
    exceptions,
    isEmergencyFreezeActive,
    triggerEmergencyFreeze,
    resolveEmergencyFreeze,
    role,
    governanceTier,
    tierName,
    canTriggerEmergencyFreeze,
    isReadOnlyAuditor,
    allowedTabs,
    logout,
  } = useApp();

  // Close on Escape key for mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const criticalExceptionsCount = exceptions.filter(
    (e) => e.status === 'PENDING_DECISION' && e.breachClassification === 'CRITICAL_EXCEPTION'
  ).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Control Center', icon: 'dashboard' },
    { id: 'budgets', label: 'Budget Allocation', icon: 'account_balance' },
    { id: 'spending', label: 'Pre-Clearance', icon: 'fact_check' },
    { id: 'approvals', label: 'Approval Queue', icon: 'how_to_reg' },
    {
      id: 'exceptions',
      label: 'Exception Triage',
      icon: 'notification_important',
      badge: criticalExceptionsCount,
      badgeVariant: 'destructive',
    },
    { id: 'forecasts', label: 'Forecast Engine', icon: 'monitoring' },
    { id: 'departments', label: 'Cost Centers', icon: 'corporate_fare' },
    { id: 'categories', label: 'Spend Categories', icon: 'category' },
    { id: 'policies', label: 'Enforcement Rules', icon: 'gavel' },
    { id: 'reports', label: 'Financial Reports', icon: 'query_stats' },
    { id: 'audit', label: 'Audit Trail', icon: 'history' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] z-50 md:z-40 bg-white border-r border-slate-200/80 shadow-sm flex flex-col p-3.5 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Enterprise Navigation"
      >
        {/* Top Brand & Status Section */}
        <div className="shrink-0 mb-2">
          {/* Brand Lockup & Mobile Close Button */}
          <div className="flex items-center justify-between px-1.5 py-1 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-white text-lg" data-icon="lock_reset">
                  lock_reset
                </span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase block font-sans">
                  APEX FISCAL
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-medium block tracking-wider mt-0.5">
                  SpendGuard L4 Core
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Close navigation drawer"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>
          </div>

          {/* Live System Status Strip */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-1.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEmergencyFreezeActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 status-pulse'
                }`}
              />
              <span
                className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                  isEmergencyFreezeActive ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {isEmergencyFreezeActive ? 'OUTFLOW FREEZE' : 'ALL POLICIES ACTIVE'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-medium">L9-HASH</span>
          </div>

          {/* Aczen Nova Live Financial Books Indicator */}
          <div className="px-2.5 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-800">
                ACZEN NOVA SYNCED
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold">372 ENVELOPES</span>
          </div>

          {/* Active Governance Tier Indicator */}
          <div className="mt-1.5">
            <TierBadge tier={governanceTier} size="sm" showDetails />
          </div>
        </div>

        {/* Middle Navigation Rail (Scrollable) */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-0.5 py-2 pr-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isAllowed = allowedTabs.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={!isAllowed ? `Boundary: requires higher role tier than ${role}` : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-150 cursor-pointer group active:scale-[0.98] ${
                  isActive
                    ? 'text-slate-900 bg-slate-100 font-semibold shadow-2xs'
                    : isAllowed
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 font-normal opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`material-symbols-outlined text-lg leading-none transition-colors shrink-0 ${
                      isActive ? 'text-blue-600' : isAllowed ? 'text-slate-400 group-hover:text-slate-700' : 'text-slate-300'
                    }`}
                    data-icon={item.icon}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isAllowed && (
                    <span
                      className="material-symbols-outlined text-[14px] text-slate-400"
                      title="Access restricted to higher role clearance"
                    >
                      lock
                    </span>
                  )}
                  {item.badge !== undefined && Number(item.badge) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Docked Section: Emergency Freeze, Settings & Profile */}
        <div className="shrink-0 space-y-2 pt-2.5 border-t border-slate-200/80">
          {/* Emergency Freeze CTA (Tier 1 Sovereign Only) */}
          {canTriggerEmergencyFreeze ? (
            isEmergencyFreezeActive ? (
              <button
                onClick={resolveEmergencyFreeze}
                className="w-full h-8.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base" data-icon="lock_open">
                  lock_open
                </span>
                <span>Lift Emergency Freeze</span>
              </button>
            ) : (
              <button
                onClick={triggerEmergencyFreeze}
                className="w-full h-8.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base" data-icon="ac_unit">
                  ac_unit
                </span>
                <span>Emergency Freeze</span>
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full h-8.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none"
              title={`Tier ${governanceTier} (${tierName}): Outflow killswitch is restricted to Tier 1 Executive clearance`}
            >
              <span className="material-symbols-outlined text-[15px]" data-icon="lock">
                lock
              </span>
              <span>Emergency Freeze [Tier 1]</span>
            </button>
          )}

          {/* System Settings Link */}
          {(() => {
            const isSettingsAllowed = allowedTabs.includes('settings');
            return (
              <button
                onClick={() => handleNavClick('settings')}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
                title={!isSettingsAllowed ? `Restricted (System Admin / CFO only)` : undefined}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === 'settings'
                    ? 'text-slate-900 bg-slate-100 font-semibold shadow-xs'
                    : isSettingsAllowed
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    : 'text-slate-400 hover:text-slate-500 opacity-60 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400" data-icon="settings">
                    settings
                  </span>
                  <span>System Settings</span>
                </div>
                {!isSettingsAllowed && (
                  <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
                )}
              </button>
            );
          })()}

          {/* Executive Profile Card with Logout */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7.5 h-7.5 rounded-full border border-slate-200 object-cover shrink-0"
              />
              <div className="leading-tight truncate">
                <span className="text-xs font-semibold text-slate-900 block truncate">{user.name}</span>
                <span className="text-[10px] font-mono text-slate-400 font-medium block truncate">{user.title}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
              title="Sign out of session"
              aria-label="Sign out"
            >
              <span className="material-symbols-outlined text-base leading-none">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
