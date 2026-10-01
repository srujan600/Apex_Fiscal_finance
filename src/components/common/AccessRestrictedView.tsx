import React from 'react';
import { useApp } from '../../context/AppContext';
import { PERSONA_CREDENTIALS, ROLE_DEFAULT_TABS } from '../../data/credentials';
import { TactileButton } from '../ui/TactileButton';

interface AccessRestrictedViewProps {
  attemptedTab: string;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({ attemptedTab }) => {
  const { role, setActiveTab } = useApp();
  const currentPersona = PERSONA_CREDENTIALS[role];
  const defaultTab = ROLE_DEFAULT_TABS[role] || 'dashboard';

  const tabLabels: Record<string, string> = {
    dashboard: 'Control Center (Executive Telemetry)',
    budgets: 'Budget Allocation & Treasury Vault',
    spending: 'Pre-Clearance Sandbox & Requisitions',
    approvals: 'Approval Queue & SOW Governance',
    exceptions: 'Exception Triage & Overrides',
    forecasts: '12-Month Macro Forecasting Engine',
    departments: 'Cost Centers & Burn Telemetry',
    categories: 'Spend Categories & Threshold Gates',
    policies: 'Enforcement Rules & Graph Topology',
    reports: 'General Ledger Variance Reports',
    audit: 'Cryptographic Audit Trail (SHA-256)',
    settings: 'System Governance & Validator Config',
  };

  return (
    <div className="flex items-center justify-center min-h-[65vh] p-4">
      <div className="max-w-xl w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-3xl" data-icon="lock">
            lock
          </span>
        </div>

        {/* Title & Warning */}
        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-100/70 text-rose-700 border border-rose-200 uppercase tracking-wider">
            RBAC Perimeter Policy Enforced
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Authorization Boundary Restriction
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            The requested module{' '}
            <span className="font-semibold text-slate-900 font-mono">
              "{tabLabels[attemptedTab] || attemptedTab}"
            </span>{' '}
            requires higher statutory security privileges than your assigned operational tier.
          </p>
        </div>

        {/* Persona Credentials Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-mono">Active Persona:</span>
            <span className="font-semibold text-slate-900">{currentPersona.name} ({currentPersona.title})</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-mono">Clearance Tier:</span>
            <span className="font-mono font-bold text-blue-700">{currentPersona.securityClearance}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono">Spending Authority:</span>
            <span className="font-mono font-bold text-emerald-700">{currentPersona.spendingLimit}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <TactileButton
            variant="primary"
            size="md"
            icon="arrow_back"
            onClick={() => setActiveTab(defaultTab)}
          >
            Return to Authorized Workspace ({currentPersona.defaultTabLabel.split('/')[0].trim()})
          </TactileButton>
        </div>
      </div>
    </div>
  );
};
