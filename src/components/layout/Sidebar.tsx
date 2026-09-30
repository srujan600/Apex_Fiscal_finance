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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] z-50 md:z-40 bg-[#0D1526] border-r border-[#1E2D4A] shadow-2xl flex flex-col justify-between p-3.5 select-none overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand & Status */}
        <div>
          {/* Brand Lockup & Mobile Close Button */}
          <div className="flex items-center justify-between px-2 py-1 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center border border-[#3B82F6]/40 shadow-inner">
                <span className="material-symbols-outlined text-white text-lg" data-icon="lock_reset">
                  lock_reset
                </span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold tracking-wider text-white uppercase block">
                  APEX FISCAL
                </span>
                <span className="text-[10px] font-mono text-[#8c909f] block tracking-widest mt-0.5">
                  SpendGuard L4 Core
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="md:hidden text-[#8c909f] hover:text-white p-1 rounded hover:bg-[#1E2D4A]/50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>
          </div>

          {/* Live System Status Strip from Stitch */}
          <div className="px-2.5 py-1.5 rounded bg-[#090D16] border border-[#1E2D4A] flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isEmergencyFreezeActive ? 'bg-[#E11D48] animate-ping' : 'bg-[#10B981] status-pulse'}`} />
              <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${isEmergencyFreezeActive ? 'text-[#ff8093]' : 'text-[#10B981]'}`}>
                {isEmergencyFreezeActive ? 'OUTFLOW FREEZE' : 'ALL POLICIES ENFORCED'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8c909f]">L9-HASH</span>
          </div>

          {/* Main Nav Rail */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-r-md transition-all cursor-pointer group ${
                    isActive
                      ? 'text-[#adc6ff] bg-[#1E2D4A]/60 border-l-2 border-[#3B82F6] shadow-sm font-semibold'
                      : 'text-[#c2c6d6] hover:text-white hover:bg-[#1E2D4A]/30 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-lg leading-none transition-colors ${
                        isActive ? 'text-[#3B82F6]' : 'text-[#8c909f] group-hover:text-white'
                      }`}
                      data-icon={item.icon}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && Number(item.badge) > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#E11D48]/20 text-[#ff8093] border border-[#E11D48]/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Nav & Emergency Freeze */}
        <div className="space-y-3 pt-3 border-t border-[#1E2D4A]">
          {/* Emergency Freeze CTA from Stitch */}
          {isEmergencyFreezeActive ? (
            <button
              onClick={resolveEmergencyFreeze}
              className="w-full h-8 rounded text-xs font-mono font-semibold flex items-center justify-center gap-2 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/30 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base" data-icon="lock_open">
                lock_open
              </span>
              <span>Lift Emergency Freeze</span>
            </button>
          ) : (
            <button
              onClick={triggerEmergencyFreeze}
              className="w-full h-8 rounded text-xs font-semibold flex items-center justify-center gap-2 btn-tactile-destructive cursor-pointer"
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
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'text-[#adc6ff] bg-[#1E2D4A]/50' : 'text-[#8c909f] hover:text-white hover:bg-[#1E2D4A]/30'
              }`}
            >
              <span className="material-symbols-outlined text-base text-[#8c909f]" data-icon="settings">
                settings
              </span>
              <span>System Settings</span>
            </button>
          </div>

          {/* Executive Profile Card */}
          <div className="p-2 rounded bg-[#090D16] border border-[#1E2D4A] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-[#3B82F6]/50 object-cover shrink-0"
              />
              <div className="leading-tight truncate">
                <span className="text-xs font-semibold text-white block truncate">{user.name}</span>
                <span className="text-[10px] font-mono text-[#8c909f] block truncate">{user.title}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-base text-[#8c909f]" data-icon="badge">
              badge
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
