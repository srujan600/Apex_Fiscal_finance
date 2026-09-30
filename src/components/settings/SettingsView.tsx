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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              System Settings & Enterprise Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
              L4 ROOT CONSOLE
            </span>
          </div>
          <p className="text-xs text-[#8c909f] mt-1 font-mono">
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
        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-xs font-mono text-[#10B981] flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{saveToast}</span>
        </div>
      )}

      {/* Emergency Freeze Killswitch Banner */}
      <DoubleBezelCard className={isEmergencyFreezeActive ? 'border-2 border-[#EF4444]' : 'border border-[#EF4444]/30'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 ${
                isEmergencyFreezeActive
                  ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] animate-pulse'
                  : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {isEmergencyFreezeActive ? 'ac_unit' : 'lock_reset'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Global Capital Outflow Killswitch
                </h3>
                <StatusBadge status={isEmergencyFreezeActive ? 'BLOCKED' : 'APPROVED'} />
              </div>
              <p className="text-xs text-[#8c909f] mt-0.5">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                5-Tier Role-Based Access Control (RBAC) Matrix
              </h2>
              <p className="text-xs text-[#8c909f] mt-0.5">
                Switch perspective in real-time to inspect UI workflows across all operational ranks
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8c909f]">Active Perspective:</span>
              <span className="px-2.5 py-1 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-mono text-xs font-bold border border-[#3B82F6]/40">
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
                  className={`p-4 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-[#131E36] border-[#3B82F6] shadow-lg shadow-[#3B82F6]/10'
                      : 'bg-[#0D1526] border-[#1E293B] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{r.name}</div>
                      <div className="text-[10px] text-[#3B82F6] font-mono">{r.level}</div>
                    </div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => setRole(r.key)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#8c909f] hover:text-white bg-[#090D16] border border-[#1E293B] hover:border-[#3B82F6] cursor-pointer transition-colors"
                      >
                        Switch To
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#8c909f] mt-2 line-clamp-2">
                    {r.desc}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#8c909f]">Authority Limit:</span>
                    <span className="font-bold text-white">{r.spendingLimit}</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-[#8c909f]">
                      Granted Permissions:
                    </span>
                    <ul className="space-y-0.5">
                      {r.permissions.map((perm, idx) => (
                        <li key={idx} className="text-[10px] text-slate-300 flex items-center gap-1.5 font-mono">
                          <span className="material-symbols-outlined text-[12px] text-[#10B981]">
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
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">
                  currency_exchange
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Institutional Currency Calibration
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8c909f]">
                Dual Currency Engine
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between p-3 bg-[#0D1526] border border-[#1E293B] rounded">
                <div>
                  <div className="font-bold text-white">Default Display Currency</div>
                  <div className="text-[11px] text-[#8c909f]">
                    Switch between USD ($) institutional units and INR (₹) Lakhs/Crores
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#090D16] p-1 border border-[#1E293B] rounded">
                  {(['USD', 'INR'] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        currency === c
                          ? 'bg-[#3B82F6] text-white shadow-sm'
                          : 'text-[#8c909f] hover:text-white'
                      }`}
                    >
                      {c === 'USD' ? 'USD ($)' : 'INR (₹)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Institutional Peg Rate</span>
                  <span className="text-[10px] text-[#8c909f]">1 USD = ? INR</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-32 px-3 py-1.5 bg-[#090D16] border border-[#1E293B] rounded text-white font-mono focus:border-[#3B82F6] focus:outline-none"
                  />
                  <span className="text-xs text-[#8c909f]">INR per 1.00 USD</span>
                </div>
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Active Fiscal Quarter</div>
                  <div className="text-[11px] text-[#8c909f]">Current Statutory Board Authorization</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#090D16] border border-[#1E293B] text-white font-bold">
                  Q3 FY 2026
                </span>
              </div>
            </div>
          </div>
        </DoubleBezelCard>

        {/* Security, Webhooks & Consensus Validator Set */}
        <DoubleBezelCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">
                  security
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Webhooks & Distributed Validators
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                12 / 12 Nodes Online
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Slack Spend Alerts Webhook</span>
                  <span className="text-[10px] text-[#10B981]">Connected (#corp-spend-alerts)</span>
                </div>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#090D16] border border-[#1E293B] rounded text-slate-300 font-mono text-[11px] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">PagerDuty Breach Escalation Key</span>
                  <span className="text-[10px] text-[#10B981]">Active (P1 Incident Routing)</span>
                </div>
                <input
                  type="text"
                  value={pagerdutyKey}
                  onChange={(e) => setPagerdutyKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#090D16] border border-[#1E293B] rounded text-slate-300 font-mono text-[11px] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#0D1526] border border-[#1E293B] rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Statutory Audit Retention Standard</div>
                  <div className="text-[10px] text-[#8c909f]">SOX 404 / GAAS Compliant Immutable Log</div>
                </div>
                <span className="text-[#3B82F6] font-bold">7 Years / Immutable WORM</span>
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
          <div className="p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <span className="material-symbols-outlined text-[20px] text-[#EF4444]">
                warning
              </span>
              CRITICAL GOVERNANCE DIRECTIVE
            </div>
            <p className="text-[11px] leading-relaxed text-slate-200">
              Activating this killswitch will instantaneously freeze all outgoing purchase orders, halt pending automated credit card settlements, and require manual CFO cryptographic unlock to resume disbursements.
            </p>
          </div>

          <div className="p-3 bg-[#090D16] border border-[#1E293B] rounded space-y-1">
            <span className="text-[10px] text-[#8c909f] uppercase">Signing Authority:</span>
            <div className="font-bold text-white">Marcus Vance (Group CFO)</div>
            <div className="text-[10px] text-[#10B981]">Consensus Verification: 12 Nodes Armed</div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
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
