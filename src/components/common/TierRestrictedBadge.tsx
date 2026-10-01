import React from 'react';
import { GovernanceTier } from '../../types';
import { useApp } from '../../context/AppContext';

interface TierBadgeProps {
  tier: GovernanceTier;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showDetails?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'sm',
  showIcon = true,
  showDetails = false,
}) => {
  const configs: Record<
    GovernanceTier,
    { label: string; bg: string; text: string; border: string; icon: string; title: string; desc: string }
  > = {
    1: {
      label: 'TIER 1 · C-SUITE',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: 'shield_person',
      title: 'Tier 1: Executive / C-Suite (Full Sovereign Authority)',
      desc: 'Summary metrics, strategy controls, policy threshold overrides, enterprise audit logs.',
    },
    2: {
      label: 'TIER 2 · CONTROLLER',
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      icon: 'admin_panel_settings',
      title: 'Tier 2: Finance Manager / Controller (Risk & Approvals)',
      desc: 'Risk threshold adjustments, transaction approvals, operational settings.',
    },
    3: {
      label: 'TIER 3 · RISK ANALYST',
      bg: 'bg-sky-50',
      text: 'text-sky-900',
      border: 'border-sky-300',
      icon: 'analytics',
      title: 'Tier 3: Risk / Financial Analyst (Data Entry & Models - No Sign-Off)',
      desc: 'Data entry, portfolio analysis, model adjustments (no final sign-off authority).',
    },
    4: {
      label: 'TIER 4 · READ-ONLY AUDITOR',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      icon: 'fact_check',
      title: 'Tier 4: Read-Only / Auditor (Compliance & Past Reports)',
      desc: 'Read-only visibility into past reports, compliance logs, and risk metrics.',
    },
  };

  const cfg = configs[tier] || configs[4];

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.2',
    sm: 'text-[10px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  }[size];

  if (showDetails) {
    return (
      <div className={`p-2.5 rounded-xl border ${cfg.bg} ${cfg.border} shadow-2xs space-y-1`}>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
          >
            {showIcon && <span className="material-symbols-outlined text-[13px] leading-none">{cfg.icon}</span>}
            <span>{cfg.label}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">Tier {tier} / 4</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">{cfg.desc}</p>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border shadow-2xs ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
      title={cfg.title}
    >
      {showIcon && <span className="material-symbols-outlined text-[13px] leading-none">{cfg.icon}</span>}
      <span>{cfg.label}</span>
    </span>
  );
};

interface LockedActionIndicatorProps {
  requiredTier?: GovernanceTier | string;
  reason?: string;
  className?: string;
}

export const LockedActionIndicator: React.FC<LockedActionIndicatorProps> = ({
  requiredTier = 1,
  reason,
  className = '',
}) => {
  const tierText =
    typeof requiredTier === 'number'
      ? requiredTier === 1
        ? 'Tier 1 (Executive)'
        : requiredTier === 2
        ? 'Tier 2 (Controller)'
        : `Tier ${requiredTier}`
      : requiredTier;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200 text-slate-500 text-[11px] font-mono select-none ${className}`}
      title={reason || `Action requires ${tierText} clearance`}
    >
      <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
      <span>{reason || `Locked · Requires ${tierText}`}</span>
    </div>
  );
};

interface ReadOnlyBannerProps {
  tier?: GovernanceTier;
}

export const TierAuthorizationBanner: React.FC<ReadOnlyBannerProps> = ({ tier: propTier }) => {
  const { governanceTier } = useApp();
  const tier = propTier ?? governanceTier;

  if (tier === 4) {
    return (
      <div className="mb-4 px-4 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-900 shadow-2xs animate-fadeIn">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Tier 4 Read-Only / Auditor Clearance Active
            </span>
            <span className="mx-2 text-emerald-300">|</span>
            <span className="text-[11px] text-emerald-700">
              Complete read-only visibility into past reports, compliance logs, and risk metrics. Action buttons and data entry are disabled.
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold">
          MUTATIONS DISABLED
        </span>
      </div>
    );
  }

  if (tier === 3) {
    return (
      <div className="mb-4 px-4 py-2 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-center justify-between text-xs font-mono text-sky-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-sky-600">info</span>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Tier 3 Risk & Financial Analyst Perspective
            </span>
            <span className="mx-2 text-sky-300">|</span>
            <span className="text-[11px] text-sky-700">
              Authorized for data entry, portfolio analysis, and model forecasting adjustments. Final sign-off authority is restricted to Tier 2+ Controllers.
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-800 text-[10px] font-bold">
          NO FINAL SIGN-OFF
        </span>
      </div>
    );
  }

  return null;
};
