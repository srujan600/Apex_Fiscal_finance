import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { Modal } from '../ui/Modal';
import { UserRole, Currency } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    role,
    setRole,
    currency,
    setCurrency,
    isEmergencyFreezeActive,
    triggerEmergencyFreeze,
    resolveEmergencyFreeze,
  } = useApp();

  const [confirmFreezeModal, setConfirmFreezeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('83.00');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T000/B000/apex-spend-guard');
  const [pagerdutyKey, setPagerdutyKey] = useState('pd-live-9a2c4e88102f9');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // RBAC Matrix Definitions
  const rolesList: {
    key: UserRole;
    name: string;
    desc: string;
    level: string;
    spendingLimit: string;
    permissions: string[];
  }[] = [
    {
      key: 'CFO',
      name: 'Group Chief Financial Officer',
      desc: 'Sovereign financial authority with unrestricted override and emergency killswitch powers.',
      level: 'Level 4 (Sovereign)',
      spendingLimit: '$50,000,000 / Discretionary',
      permissions: [
        'Execute L4 Sovereign Discretionary Override',
        'Trigger / Lift Global Capital Outflow Freeze',
        'Authorize Cross-Department Budget Rebalance',
        'Deploy & Pause Real-Time Policy Rules',
        'Verify & Export Cryptographic Audit Trails',
        'Sign Institutional Financial Filings (SOX 404)',
      ],
    },
    {
      key: 'FINANCE_ADMIN',
      name: 'VP Treasury & Global Allocations',
      desc: 'Manages multi-center budget envelopes, category caps, and L3 policy gates.',
      level: 'Level 3 (Executive)',
      spendingLimit: '$10,000,000',
      permissions: [
        'Rebalance Departmental Budget Envelopes',
        'Approve L3 Requisitions up to $10,000,000',
        'Deploy Spend Category Caps',
        'Review Critical Exception Dossiers',
        'Export Audit & Variance Ledgers',
      ],
    },
    {
      key: 'DEPT_MANAGER',
      name: 'VP of Platform Engineering',
      desc: 'Line of business leader responsible for departmental budget pacing and contractor POs.',
      level: 'Level 2 (Departmental)',
      spendingLimit: '$2,000,000',
      permissions: [
        'Approve Departmental Purchase Orders (< $2M)',
        'Request Discretionary Cap Overrides',
        'View Departmental Spend Velocity & Burndown',
        'Request Justification from Requestors',
      ],
    },
    {
      key: 'EMPLOYEE',
      name: 'Principal Cloud Infrastructure Architect',
      desc: 'Requisition originator initiating purchase requests through pre-clearance sandbox.',
      level: 'Level 1 (Originator)',
      spendingLimit: '$250,000',
      permissions: [
        'Create & Submit Spending Requisitions',
        'Run Live Pre-Clearance Budget Impact Sandbox',
        'Attach Executed Vendor Statements of Work',
        'View Status of Submitted Requisitions',
      ],
    },
    {
      key: 'SYSTEM_ADMIN',
      name: 'Lead Compliance & Risk Architect',
      desc: 'Technical administrator maintaining policy graph rules, PBFT validator nodes, and telemetry.',
      level: 'Security & Audit Admin',
      spendingLimit: '$1,000,000',
      permissions: [
        'Deploy Statutory Policy Graph Rules',
        'Configure PBFT Validator Consensus Nodes',
        'Audit Cryptographic Hash Consistency',
        'Manage Webhook Endpoints & Alert Routing',
      ],
    },
  ];

  const handleSaveSettings = () => {
    setSaveToast('System configuration & statutory policy parameters updated successfully.');
    setTimeout(() => setSaveToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              System Settings & Enterprise Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              L4 ROOT CONSOLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            5-Tier RBAC Architecture · Emergency Killswitch · Institutional Peg Calibration · Validator Consensus
          </p>
        </div>

        <TactileButton variant="primary" size="sm" onClick={handleSaveSettings}>
          <span className="material-symbols-outlined text-[16px] mr-1">save</span>
          Save System Configuration
        </TactileButton>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center gap-2 shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{saveToast}</span>
        </div>
      )}

      {/* Emergency Freeze Killswitch Banner */}
      <DoubleBezelCard className={isEmergencyFreezeActive ? 'border-2 border-rose-400 bg-rose-50/50' : 'border border-rose-200/80 bg-rose-50/20'}>
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
                <StatusBadge status={isEmergencyFreezeActive ? 'BLOCKED' : 'APPROVED'} />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEmergencyFreezeActive
                  ? 'TOTAL CAPITAL LOCKDOWN ACTIVE. All non-statutory outbound purchase orders and disbursement pipelines are frozen.'
                  : 'Normal operations active. Real-time pre-clearance rules are processing requisitions under standard policy graph.'}
              </p>
            </div>
          </div>

          <div>
            {isEmergencyFreezeActive ? (
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
            )}
          </div>
        </div>
      </DoubleBezelCard>

      {/* 5-Persona RBAC Governance Matrix */}
      <DoubleBezelCard>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                5-Tier Role-Based Access Control (RBAC) Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch perspective in real-time to inspect UI workflows across all operational ranks
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Active Perspective:</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200 shadow-sm">
                {role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesList.map((r) => {
              const isCurrent = role === r.key;
              return (
                <div
                  key={r.key}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-white border-2 border-blue-600 shadow-md ring-4 ring-blue-50/60'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{r.name}</div>
                      <div className="text-[10px] text-blue-600 font-mono font-medium">{r.level}</div>
                    </div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => setRole(r.key)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all shadow-sm active:scale-95"
                      >
                        Switch To
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                    {r.desc}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Authority Limit:</span>
                    <span className="font-bold text-slate-900">{r.spendingLimit}</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-medium">
                      Granted Permissions:
                    </span>
                    <ul className="space-y-0.5">
                      {r.permissions.map((perm, idx) => (
                        <li key={idx} className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                          <span className="material-symbols-outlined text-[12px] text-emerald-600">
                            check
                          </span>
                          <span className="truncate">{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DoubleBezelCard>

      {/* Financial Accounting & Currency Peg Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <span className="text-[10px] font-mono text-slate-500">
                Dual Currency Engine
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Default Display Currency</div>
                  <div className="text-[11px] text-slate-500">
                    Switch between USD ($) institutional units and INR (₹) Lakhs/Crores
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl shadow-sm">
                  {(['USD', 'INR'] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        currency === c
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {c === 'USD' ? 'USD ($)' : 'INR (₹)'}
                    </button>
                  ))}
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
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm transition-all"
                  />
                  <span className="text-xs text-slate-500">INR per 1.00 USD</span>
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

        {/* Security, Webhooks & Consensus Validator Set */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">
                  security
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Webhooks & Distributed Validators
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm transition-all"
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none shadow-sm transition-all"
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
            <div className="font-bold text-slate-900">Marcus Vance (Group CFO)</div>
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
