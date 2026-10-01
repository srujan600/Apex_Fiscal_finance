import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExceptionIncident } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { TierAuthorizationBanner, LockedActionIndicator, TierBadge } from '../common/TierRestrictedBadge';

export const ExceptionsView: React.FC = () => {
  const {
    exceptions,
    budgets,
    currency,
    overrideException,
    enforceRejectException,
    reallocateBudget,
    governanceTier,
    tierName,
    canExecuteOverrides,
    isTier2OrHigher,
    isReadOnlyAuditor,
  } = useApp();

  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('ALL');
  const [selectedIncidentForDossier, setSelectedIncidentForDossier] = useState<ExceptionIncident | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetIncidentForOverride, setTargetIncidentForOverride] = useState<ExceptionIncident | null>(null);
  const [overrideMemo, setOverrideMemo] = useState('Critical operational business continuity justification approved by Group CFO.');
  const [offsetSource, setOffsetSource] = useState('Cloud Ops Strategic Buffer');

  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [reallocateTargetIncident, setReallocateTargetIncident] = useState<ExceptionIncident | null>(null);
  const [sourceDeptId, setSourceDeptId] = useState('dept-cld');
  const [transferAmount, setTransferAmount] = useState('250000');

  const [justificationModalOpen, setJustificationModalOpen] = useState(false);
  const [justificationIncident, setJustificationIncident] = useState<ExceptionIncident | null>(null);
  const [justificationPrompt, setJustificationPrompt] = useState('Please submit technical cost-reduction alternatives before override consideration.');

  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING_DECISION');
  const totalBlockedCapital = pendingExceptions.reduce((sum, e) => sum + e.commitmentValue, 0);

  const filteredExceptions = exceptions.filter((e) => {
    if (activeSeverityFilter === 'ALL') return true;
    if (activeSeverityFilter === 'PENDING') return e.status === 'PENDING_DECISION';
    if (activeSeverityFilter === 'OVERRIDDEN') return e.status === 'OVERRIDDEN';
    if (activeSeverityFilter === 'ENFORCED') return e.status === 'ENFORCED_REJECTED';
    return true;
  });

  const handleOpenOverride = (incident: ExceptionIncident) => {
    setTargetIncidentForOverride(incident);
    setOverrideModalOpen(true);
  };

  const handleConfirmOverride = () => {
    if (targetIncidentForOverride) {
      overrideException(
        targetIncidentForOverride.id,
        `${overrideMemo} (Offset Source: ${offsetSource})`
      );
      setOverrideModalOpen(false);
    }
  };

  const handleOpenReallocate = (incident: ExceptionIncident) => {
    setReallocateTargetIncident(incident);
    setTransferAmount(incident.commitmentValue.toString());
    setReallocateModalOpen(true);
  };

  const handleConfirmReallocate = () => {
    if (reallocateTargetIncident) {
      const amt = parseFloat(transferAmount) || 0;
      const targetDeptObj = budgets.find((b) => b.departmentName.includes(reallocateTargetIncident.department)) || budgets[0];
      reallocateBudget(sourceDeptId, targetDeptObj.id, amt);
      overrideException(
        reallocateTargetIncident.id,
        `Resolved via reserve reallocation of ${formatCurrency(amt, currency)} from ${sourceDeptId}.`
      );
      setReallocateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-rose-50 text-rose-700 border border-rose-200">
              Sovereign Exception Triage
            </span>
            <TierBadge tier={governanceTier} size="sm" />
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Exception Management & Executive Override Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interception queue for expenditures that exceed authorized departmental envelopes or category sub-caps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-700 shadow-sm font-semibold">
            Total Blocked: {formatCurrency(totalBlockedCapital, currency)}
          </span>
        </div>
      </div>

      {/* Tier Governance Authorization Banner */}
      <TierAuthorizationBanner />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-3 text-xs font-mono">
        <button
          onClick={() => setActiveSeverityFilter('PENDING')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSeverityFilter === 'PENDING'
              ? 'bg-rose-600 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <span>Action Mandatory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-800 text-white font-bold">
            {pendingExceptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSeverityFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeSeverityFilter === 'ALL'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          All Incidents ({exceptions.length})
        </button>

        <button
          onClick={() => setActiveSeverityFilter('OVERRIDDEN')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeSeverityFilter === 'OVERRIDDEN'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Authorized Overrides
        </button>

        <button
          onClick={() => setActiveSeverityFilter('ENFORCED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeSeverityFilter === 'ENFORCED'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Enforced Caps (Rejected)
        </button>
      </div>

      {/* Dedicated Exception Queue Cards */}
      <div className="space-y-4">
        {filteredExceptions.map((ex) => {
          const isPending = ex.status === 'PENDING_DECISION';
          const isCritical = ex.breachClassification === 'CRITICAL_EXCEPTION';

          return (
            <div
              key={ex.id}
              className={`bg-white rounded-2xl p-6 border transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 space-y-4 ${
                isCritical && isPending
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Card Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-sm ${
                      isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isCritical ? 'CRIT' : 'WARN'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{ex.incidentCode}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs font-bold text-slate-900 uppercase">{ex.department}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({ex.subDepartment})</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                      Detected: {ex.timestamp} via {ex.detectionSource} · Rule: <strong className="text-slate-900 font-semibold">{ex.ruleCode}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                      Commitment Blocked
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-900 block leading-tight">
                      {formatCurrency(ex.commitmentValue, currency)}
                    </span>
                  </div>
                  <StatusBadge status={ex.breachClassification} pulse={isCritical && isPending} />
                </div>
              </div>

              {/* Middle Section: Vendor & Telemetry Violation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                <div className="md:col-span-8 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{ex.vendor}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                      Commercial Contract
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">{ex.businessPurpose}</p>
                </div>

                {/* Financial Impact Analysis Box */}
                <div className="md:col-span-4 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-rose-800 uppercase block flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none text-rose-600" data-icon="analytics">analytics</span>
                    Financial Impact of Override
                  </span>
                  <div className="text-[11px] font-mono text-slate-700 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Immediate Deficit:</span>
                      <span className="text-rose-600 font-bold">+{formatCurrency(ex.commitmentValue, currency, 'compact')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Required Reserve Offset:</span>
                      <span className="text-amber-700 font-medium">Strategic Buffer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compliance Level:</span>
                      <span className="text-slate-900 font-semibold">L4 CFO Attestation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Rail */}
              <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <TactileButton
                  variant="surface"
                  size="sm"
                  icon="visibility"
                  onClick={() => setSelectedIncidentForDossier(ex)}
                >
                  Review Dossier
                </TactileButton>

                {isPending && (
                  <div className="flex flex-wrap items-center gap-2">
                    {isReadOnlyAuditor ? (
                      <LockedActionIndicator reason="Tier 4 Read-Only Auditor: Exception actions disabled" />
                    ) : (
                      <>
                        <TactileButton
                          variant="ghost"
                          size="sm"
                          icon="contact_support"
                          onClick={() => {
                            setJustificationIncident(ex);
                            setJustificationModalOpen(true);
                          }}
                        >
                          Request Justification
                        </TactileButton>

                        {isTier2OrHigher && (
                          <>
                            <TactileButton
                              variant="surface"
                              size="sm"
                              icon="swap_horiz"
                              onClick={() => handleOpenReallocate(ex)}
                            >
                              Reallocate Budget
                            </TactileButton>

                            <TactileButton
                              variant="destructive"
                              size="sm"
                              icon="block"
                              onClick={() => enforceRejectException(ex.id)}
                            >
                              Reject & Enforce Cap
                            </TactileButton>
                          </>
                        )}

                        {canExecuteOverrides ? (
                          <TactileButton
                            variant="primary"
                            size="sm"
                            icon="gavel"
                            onClick={() => handleOpenOverride(ex)}
                          >
                            Approve Override
                          </TactileButton>
                        ) : (
                          <LockedActionIndicator reason="Requires Tier 1 Executive clearance (Sovereign Override)" />
                        )}
                      </>
                    )}
                  </div>
                )}

                {ex.status === 'OVERRIDDEN' && (
                  <span className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                    Override Executed by Group CFO
                  </span>
                )}

                {ex.status === 'ENFORCED_REJECTED' && (
                  <span className="text-xs font-mono text-rose-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" data-icon="cancel">cancel</span>
                    Hard Cap Enforced · Outflow Halted
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Financial Impact Modal */}
      {targetIncidentForOverride && (
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title={`Execute Level-4 Override: ${targetIncidentForOverride.incidentCode}`}
          subtitle={`Department: ${targetIncidentForOverride.department} · Amount: ${formatCurrency(targetIncidentForOverride.commitmentValue, currency)}`}
          badge="L4 SOVEREIGN PROTOCOL"
          badgeVariant="destructive"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="verified" onClick={handleConfirmOverride}>
                Sign & Authorize Override
              </TactileButton>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Impact Readout */}
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 space-y-2">
              <span className="font-mono font-bold text-xs text-rose-800 uppercase block">
                Financial Impact & Ledger Offset Analysis
              </span>
              <p className="text-xs leading-relaxed text-slate-700">
                Authorizing this override will immediately charge{' '}
                <strong className="text-slate-900 font-mono font-bold">{formatCurrency(targetIncidentForOverride.commitmentValue, currency)}</strong>{' '}
                against the quarterly capital allocation and bypass the automated hard cap trigger (
                <span className="font-mono text-rose-600 font-semibold">{targetIncidentForOverride.ruleCode}</span>).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Offsetting Reserve Source"
                value={offsetSource}
                onChange={(e) => setOffsetSource(e.target.value)}
                options={[
                  { value: 'Cloud Ops Strategic Buffer', label: 'Cloud Ops Strategic Buffer (₹21.58 Cr Headroom)' },
                  { value: 'Sales Operations Reserve', label: 'Sales Operations Reserve (₹34.03 Cr Headroom)' },
                  { value: 'Executive Contingency Pool', label: 'Executive Contingency Pool (₹41.50 Cr Headroom)' },
                ]}
              />

              <Input
                label="Authorized Amount"
                value={formatCurrency(targetIncidentForOverride.commitmentValue, currency)}
                readOnly={true}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-sans text-slate-500 font-medium block">
                Executive Justification Memo (Permanent Audit Entry)
              </label>
              <textarea
                value={overrideMemo}
                onChange={(e) => setOverrideMemo(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Reallocate Budget Modal */}
      {reallocateTargetIncident && (
        <Modal
          isOpen={reallocateModalOpen}
          onClose={() => setReallocateModalOpen(false)}
          title={`Reallocate Budget to Resolve ${reallocateTargetIncident.incidentCode}`}
          subtitle={`Transfer headroom to eliminate the ${reallocateTargetIncident.department} breach without exceeding global ceilings.`}
          badge="BUFFER TRANSFER"
          badgeVariant="primary"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setReallocateModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="swap_horiz" onClick={handleConfirmReallocate}>
                Commit Reallocation & Clear Incident
              </TactileButton>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Transfer From (Surplus Buffer)"
                value={sourceDeptId}
                onChange={(e) => setSourceDeptId(e.target.value)}
                options={budgets.map((b) => ({
                  value: b.id,
                  label: `${b.departmentName} (${formatCurrency(b.available, currency, 'compact')} Avail)`,
                }))}
              />

              <Input
                label="Transfer Into (Recipient)"
                value={reallocateTargetIncident.department}
                readOnly={true}
              />
            </div>

            <Input
              label="Transfer Value"
              prefixSymbol={currency === 'INR' ? '₹' : '$'}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {/* Request Justification Modal */}
      {justificationIncident && (
        <Modal
          isOpen={justificationModalOpen}
          onClose={() => setJustificationModalOpen(false)}
          title={`Request Justification for ${justificationIncident.incidentCode}`}
          subtitle={`Direct inquiry to ${justificationIncident.department} lead`}
          badge="JUSTIFICATION"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setJustificationModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="send" onClick={() => setJustificationModalOpen(false)}>
                Send Inquiry Memo
              </TactileButton>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="text-[11px] text-slate-500 font-medium block">
              Inquiry Prompt to Department Lead:
            </label>
            <textarea
              value={justificationPrompt}
              onChange={(e) => setJustificationPrompt(e.target.value)}
              rows={3}
              className="w-full text-xs font-sans bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
            />
          </div>
        </Modal>
      )}

      {/* Review Dossier Modal */}
      {selectedIncidentForDossier && (
        <Modal
          isOpen={!!selectedIncidentForDossier}
          onClose={() => setSelectedIncidentForDossier(null)}
          title={`Exception Audit Dossier: ${selectedIncidentForDossier.incidentCode}`}
          subtitle={`${selectedIncidentForDossier.department} · ${selectedIncidentForDossier.vendor}`}
          badge={selectedIncidentForDossier.breachClassification}
          badgeVariant={selectedIncidentForDossier.breachClassification === 'CRITICAL_EXCEPTION' ? 'destructive' : 'primary'}
          footer={
            <TactileButton variant="surface" onClick={() => setSelectedIncidentForDossier(null)}>
              Close Dossier
            </TactileButton>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">BLOCKED VALUE</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {formatCurrency(selectedIncidentForDossier.commitmentValue, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">VIOLATION CLASS</span>
                <span className="font-bold text-rose-600">{selectedIncidentForDossier.breachClassification}</span>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed">{selectedIncidentForDossier.violationDetail}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
