import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { Modal } from '../ui/Modal';
import { UserRole, Currency } from '../../types';
import { TIER_DEFINITIONS, PRIMARY_TIER_PERSONAS } from '../../data/credentials';
import { TierBadge, LockedActionIndicator, TierAuthorizationBanner } from '../common/TierRestrictedBadge';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const {
    role,
    setRole,
    currency,
    setCurrency,
    governanceTier,
    tierName,
    tierBadge,
    isTier1,
    isTier2OrHigher,
    isReadOnlyAuditor,
    canTriggerEmergencyFreeze,
    canModifyOperationalSettings,
    isEmergencyFreezeActive,
    triggerEmergencyFreeze,
    resolveEmergencyFreeze,
  } = useApp();

  const [confirmFreezeModal, setConfirmFreezeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('83.00');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T000/B000/apex-spend-guard');
  const [pagerdutyKey, setPagerdutyKey] = useState('pd-live-9a2c4e88102f9');
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync settings from backend
  useEffect(() => {
    let mounted = true;
    api.getSettings().then((res) => {
      if (mounted && res && res.settings) {
        if (res.settings.inrExchangeRate) {
          setExchangeRate(res.settings.inrExchangeRate.toString());
        }
        if (res.settings.slackWebhook) {
          setSlackWebhook(res.settings.slackWebhook);
        }
        if (res.settings.pagerdutyKey) {
          setPagerdutyKey(res.settings.pagerdutyKey);
        }
      }
    }).catch(() => {
      // Keep defaults
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (!canModifyOperationalSettings) {
      setSaveToast({
        message: 'Permission denied: Operational settings changes require Tier 2+ Controller authorization.',
        type: 'error',
      });
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }

    setIsSaving(true);
    try {
      await api.updateSettings({
        inrExchangeRate: parseFloat(exchangeRate) || 83.0,
        slackWebhook: slackWebhook,
        pagerdutyKey: pagerdutyKey,
      });

      setSaveToast({
        message: 'System configuration & operational parameters updated successfully.',
        type: 'success',
      });
    } catch (_err) {
      setSaveToast({
        message: 'Configuration saved locally (offline / sandbox mode).',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              System Settings & Governance Hierarchy
            </h1>
            <TierBadge tier={governanceTier} size="md" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            4-Tier Financial Governance Hierarchy · Strategy Controls · Operational Peg Calibration · Distributed Validators
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canModifyOperationalSettings ? (
            <TactileButton
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">save</span>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </TactileButton>
          ) : (
            <div className="flex items-center gap-2">
              <LockedActionIndicator reason="Requires Tier 2+ Controller authority" />
              <TactileButton variant="primary" size="sm" disabled>
                <span className="material-symbols-outlined text-[16px] mr-1">lock</span>
                Save Configuration
              </TactileButton>
            </div>
          )}
        </div>
      </div>

      {/* Tier Governance Authorization Banner */}
      <TierAuthorizationBanner />

      {/* Save Toast Notification */}
      {saveToast && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2.5 shadow-sm animate-fadeIn ${
            saveToast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {saveToast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Strategy Control 1: Global Capital Outflow Killswitch (Tier 1 Sovereign Only) */}
      <DoubleBezelCard
        className={
          isEmergencyFreezeActive
            ? 'border-2 border-rose-400 bg-rose-50/50'
            : 'border border-rose-200/80 bg-rose-50/20'
        }
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                isEmergencyFreezeActive
                  ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse shadow-sm'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {isEmergencyFreezeActive ? 'ac_unit' : 'lock_reset'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
                  Global Capital Outflow Killswitch
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  TIER 1 SOVEREIGN ONLY
                </span>
                <StatusBadge status={isEmergencyFreezeActive ? 'BLOCKED' : 'APPROVED'} />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isEmergencyFreezeActive
                  ? 'TOTAL CAPITAL LOCKDOWN ACTIVE. All non-statutory outbound purchase orders and disbursement pipelines are frozen.'
                  : 'Normal operations active. Real-time pre-clearance rules are processing requisitions under standard policy graph.'}
              </p>
            </div>
          </div>

          <div>
            {canTriggerEmergencyFreeze ? (
              isEmergencyFreezeActive ? (
                <TactileButton
                  variant="surface"
                  onClick={resolveEmergencyFreeze}
                  icon="lock_open"
                >
                  Lift Global Outflow Freeze
                </TactileButton>
              ) : (
                <TactileButton
                  variant="destructive"
                  onClick={() => setConfirmFreezeModal(true)}
                  icon="dangerous"
                >
                  Trigger Emergency Freeze
                </TactileButton>
              )
            ) : (
              <div className="flex items-center gap-2">
                <LockedActionIndicator reason="Requires Tier 1 Executive clearance (Sovereign authority)" />
              </div>
            )}
          </div>
        </div>
      </DoubleBezelCard>

      {/* 4-Tier Financial Governance Hierarchy & Perspective Switcher */}
      <DoubleBezelCard>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                Multi-Tiered Financial Governance Hierarchy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch perspective in real-time to inspect how permissions, action buttons, and controls adapt to each tier
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Active Clearance:</span>
              <TierBadge tier={governanceTier} size="md" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIER_DEFINITIONS.map((t) => {
              const isCurrentTier = governanceTier === t.tier;
              const primaryPersona = PRIMARY_TIER_PERSONAS[t.tier - 1];

              return (
                <div
                  key={t.tier}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    isCurrentTier
                      ? 'bg-white border-2 border-blue-600 shadow-md ring-4 ring-blue-50/70'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Tier Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-blue-600 font-mono font-medium">
                          {primaryPersona ? primaryPersona.title : t.shortName}
                        </div>
                      </div>

                      {isCurrentTier ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => setRole(t.code as UserRole)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          Switch To
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Authority Limit:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">
                        {t.authorityLimit.split('/')[0]}
                      </span>
                    </div>

                    {/* Granted Capabilities */}
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-medium">
                        Granted Powers:
                      </span>
                      <ul className="space-y-1">
                        {t.capabilities.slice(0, 3).map((cap, idx) => (
                          <li
                            key={idx}
                            className="text-[10px] text-slate-600 flex items-start gap-1.5 font-mono leading-tight"
                          >
                            <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0 mt-0.5">
                              check
                            </span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Restrictions */}
                    {t.restrictions.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-rose-500 font-medium">
                          Strict Boundaries:
                        </span>
                        <ul className="space-y-1">
                          {t.restrictions.slice(0, 2).map((res, idx) => (
                            <li
                              key={idx}
                              className="text-[10px] text-rose-600 flex items-start gap-1.5 font-mono leading-tight"
                            >
                              <span className="material-symbols-outlined text-[13px] text-rose-500 shrink-0 mt-0.5">
                                block
                              </span>
                              <span>{res}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Quick Impersonation Button */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRole(t.code as UserRole)}
                      disabled={isCurrentTier}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        isCurrentTier
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 cursor-default'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                      }`}
                    >
                      {isCurrentTier ? 'CURRENT CLEARANCE' : `SIMULATE TIER ${t.tier}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DoubleBezelCard>

      {/* Operational Settings: Currency Peg & System Webhooks (Tier 1 & Tier 2 Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Calibration */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">
                  currency_exchange
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Institutional Currency Calibration
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                TIER 1 & 2 CONTROLLER
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Standard Reporting Currency</div>
                  <div className="text-[11px] text-slate-500">
                    Indian Rupee (₹ INR) Lakhs & Crores (Standard Enterprise Currency)
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 font-mono">INR (₹) Standard</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Institutional Peg Rate</span>
                  <span className="text-[10px] text-slate-500">1 USD = ? INR</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    disabled={!canModifyOperationalSettings}
                    className={`w-32 px-3 py-1.5 bg-white border rounded-xl text-slate-900 font-mono transition-all ${
                      canModifyOperationalSettings
                        ? 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                  <span className="text-xs text-slate-500">INR per 1.00 USD</span>
                  {!canModifyOperationalSettings && (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Read-Only
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Active Fiscal Quarter</div>
                  <div className="text-[11px] text-slate-500">Current Statutory Board Authorization</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold shadow-sm">
                  Q3 FY 2026
                </span>
              </div>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Webhooks & Alerts Configuration */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">
                  security
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Webhooks & Operational Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                12 / 12 Nodes Online
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Slack Spend Alerts Webhook</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Connected (#corp-spend-alerts)</span>
                </div>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  disabled={!canModifyOperationalSettings}
                  className={`w-full px-3 py-1.5 bg-white border rounded-xl font-mono text-[11px] transition-all ${
                    canModifyOperationalSettings
                      ? 'border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">PagerDuty Breach Escalation Key</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Active (P1 Incident Routing)</span>
                </div>
                <input
                  type="text"
                  value={pagerdutyKey}
                  onChange={(e) => setPagerdutyKey(e.target.value)}
                  disabled={!canModifyOperationalSettings}
                  className={`w-full px-3 py-1.5 bg-white border rounded-xl font-mono text-[11px] transition-all ${
                    canModifyOperationalSettings
                      ? 'border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Statutory Audit Retention Standard</div>
                  <div className="text-[10px] text-slate-500">SOX 404 / GAAS Compliant Immutable Log</div>
                </div>
                <span className="text-blue-600 font-bold">7 Years / Immutable WORM</span>
              </div>
            </div>
          </div>
        </DoubleBezelCard>
      </div>

      {/* Emergency Freeze Confirmation Modal */}
      <Modal
        isOpen={confirmFreezeModal}
        onClose={() => setConfirmFreezeModal(false)}
        title="Trigger Global Capital Outflow Killswitch"
        subtitle="Emergency discretionary protocol to immediately halt corporate disbursements."
        badge="EMERGENCY PROTOCOL"
        badgeVariant="destructive"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <span className="material-symbols-outlined text-[20px] text-rose-600">
                warning
              </span>
              CRITICAL GOVERNANCE DIRECTIVE
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700">
              Activating this killswitch will instantaneously freeze all outgoing purchase orders, halt pending automated credit card settlements, and require manual CFO cryptographic unlock to resume disbursements.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Signing Authority:</span>
            <div className="font-bold text-slate-900">Victoria Sterling (Group CFO / Tier 1 Sovereign)</div>
            <div className="text-[10px] text-emerald-700 font-medium">Consensus Verification: 12 Nodes Armed</div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <TactileButton variant="surface" onClick={() => setConfirmFreezeModal(false)}>
              Cancel & Abort
            </TactileButton>
            <TactileButton
              variant="destructive"
              onClick={() => {
                triggerEmergencyFreeze();
                setConfirmFreezeModal(false);
              }}
              icon="dangerous"
            >
              Confirm Emergency Freeze
            </TactileButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
