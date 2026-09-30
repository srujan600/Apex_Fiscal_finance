import React from 'react';
import { useApp } from '../../context/AppContext';

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
  } = useApp();

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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] z-50 md:z-40 bg-white border-r border-slate-200/80 shadow-sm flex flex-col justify-between p-4 select-none overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand & Status */}
        <div>
          {/* Brand Lockup & Mobile Close Button */}
          <div className="flex items-center justify-between px-2 py-1 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-white text-lg" data-icon="lock_reset">
                  lock_reset
                </span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase block">
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
              className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>
          </div>

          {/* Live System Status Strip */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-2 shadow-xs">
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
          <div className="px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between mb-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-800">
                ACZEN NOVA SYNCED
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold">372 ENVELOPES</span>
          </div>

          {/* Main Nav Rail */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-lg leading-none transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                      data-icon={item.icon}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && Number(item.badge) > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Nav & Emergency Freeze */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          {/* Emergency Freeze CTA */}
          {isEmergencyFreezeActive ? (
            <button
              onClick={resolveEmergencyFreeze}
              className="w-full h-9 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base" data-icon="lock_open">
                lock_open
              </span>
              <span>Lift Emergency Freeze</span>
            </button>
          ) : (
            <button
              onClick={triggerEmergencyFreeze}
              className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base" data-icon="ac_unit">
                ac_unit
              </span>
              <span>Emergency Freeze</span>
            </button>
          )}

          {/* Secondary Links */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                activeTab === 'settings'
                  ? 'text-slate-900 bg-slate-100 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-base text-slate-400" data-icon="settings">
                settings
              </span>
              <span>System Settings</span>
            </button>
          </div>

          {/* Executive Profile Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
              />
              <div className="leading-tight truncate">
                <span className="text-xs font-semibold text-slate-900 block truncate">{user.name}</span>
                <span className="text-[10px] font-mono text-slate-400 font-medium block truncate">{user.title}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-base text-slate-400" data-icon="badge">
              badge
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
