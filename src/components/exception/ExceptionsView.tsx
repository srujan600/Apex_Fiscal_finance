import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExceptionIncident } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

export const ExceptionsView: React.FC = () => {
  const {
    exceptions,
    budgets,
    currency,
    overrideException,
    enforceRejectException,
    reallocateBudget,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2D4A]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#E11D48]/20 text-[#ff8093] border border-[#E11D48]/40">
              Sovereign Exception Triage
            </span>
            <span className="text-[11px] font-mono text-[#8c909f]">POLICY CEILING BREACHES</span>
          </div>
          <h1 className="text-xl md:text-2xl text-white font-semibold tracking-tight mt-1">
            Exception Management & Executive Override Command
          </h1>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Interception queue for expenditures that exceed authorized departmental envelopes or category sub-caps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded bg-[#E11D48]/10 border border-[#E11D48]/30 text-xs font-mono text-[#ff8093]">
            Total Blocked: <strong>{formatCurrency(totalBlockedCapital, currency)}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1E2D4A] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveSeverityFilter('PENDING')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-2 ${
            activeSeverityFilter === 'PENDING'
              ? 'bg-[#E11D48] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          <span>Action Mandatory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-white">
            {pendingExceptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSeverityFilter('ALL')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeSeverityFilter === 'ALL'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          All Incidents ({exceptions.length})
        </button>

        <button
          onClick={() => setActiveSeverityFilter('OVERRIDDEN')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeSeverityFilter === 'OVERRIDDEN'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          Authorized Overrides
        </button>

        <button
          onClick={() => setActiveSeverityFilter('ENFORCED')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeSeverityFilter === 'ENFORCED'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
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
              className={`tactile-tier-1 rounded-xl p-5 border transition-all space-y-4 ${
                isCritical && isPending
                  ? 'border-[#E11D48]/50 hover:border-[#E11D48]'
                  : 'border-[#1E2D4A] hover:border-[#3B82F6]/40'
              }`}
            >
              {/* Card Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2D4A]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isCritical ? 'bg-[#E11D48]/20 text-[#ff8093] border border-[#E11D48]/40' : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                    }`}
                  >
                    {isCritical ? 'CRIT' : 'WARN'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{ex.incidentCode}</span>
                      <span className="text-xs text-[#8c909f]">·</span>
                      <span className="text-xs font-semibold text-white uppercase">{ex.department}</span>
                      <span className="text-[10px] text-[#8c909f]">({ex.subDepartment})</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8c909f] block mt-0.5">
                      Detected: {ex.timestamp} via {ex.detectionSource} · Rule: <strong className="text-white">{ex.ruleCode}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                      Commitment Blocked
                    </span>
                    <span className="text-lg font-mono font-bold text-white block leading-tight">
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
                    <span className="font-semibold text-white text-sm">{ex.vendor}</span>
                    <span className="text-[10px] font-mono text-[#8c909f] bg-[#090D16] px-2 py-0.5 rounded border border-[#1E2D4A]">
                      Commercial Contract
                    </span>
                  </div>
                  <p className="text-white text-xs leading-relaxed">{ex.businessPurpose}</p>
                </div>

                {/* Financial Impact Analysis Box (Required by prompt) */}
                <div className="md:col-span-4 p-3 rounded bg-[#090D16] border border-[#E11D48]/30 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#ff8093] uppercase block flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs leading-none" data-icon="analytics">analytics</span>
                    Financial Impact of Override
                  </span>
                  <div className="text-[11px] font-mono text-[#dfe2ef] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-[#8c909f]">Immediate Deficit:</span>
                      <span className="text-[#ff8093] font-semibold">+{formatCurrency(ex.commitmentValue, currency, 'compact')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c909f]">Required Reserve Offset:</span>
                      <span className="text-[#F59E0B]">Strategic Buffer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c909f]">Compliance Level:</span>
                      <span className="text-white">L4 CFO Attestation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Rail (Review, Approve, Reject, Override, Request Justification, Reallocate Budget) */}
              <div className="pt-3 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3">
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

                    <TactileButton
                      variant="primary"
                      size="sm"
                      icon="gavel"
                      onClick={() => handleOpenOverride(ex)}
                    >
                      Approve Override
                    </TactileButton>
                  </div>
                )}

                {ex.status === 'OVERRIDDEN' && (
                  <span className="text-xs font-mono text-[#10B981] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                    Override Executed by Group CFO
                  </span>
                )}

                {ex.status === 'ENFORCED_REJECTED' && (
                  <span className="text-xs font-mono text-[#ff8093] flex items-center gap-1">
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
            <div className="p-3.5 rounded bg-[#E11D48]/10 border border-[#E11D48]/40 space-y-2">
              <span className="font-mono font-bold text-xs text-[#ff8093] uppercase block">
                Financial Impact & Ledger Offset Analysis
              </span>
              <p className="text-xs leading-relaxed text-[#dfe2ef]">
                Authorizing this override will immediately charge{' '}
                <strong className="text-white font-mono">{formatCurrency(targetIncidentForOverride.commitmentValue, currency)}</strong>{' '}
                against the quarterly capital allocation and bypass the automated hard cap trigger (
                <span className="font-mono text-[#ff8093]">{targetIncidentForOverride.ruleCode}</span>).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Offsetting Reserve Source"
                value={offsetSource}
                onChange={(e) => setOffsetSource(e.target.value)}
                options={[
                  { value: 'Cloud Ops Strategic Buffer', label: 'Cloud Ops Strategic Buffer ($2.6M Headroom)' },
                  { value: 'Sales Operations Reserve', label: 'Sales Operations Reserve ($4.1M Headroom)' },
                  { value: 'Executive Contingency Pool', label: 'Executive Contingency Pool ($5.0M Headroom)' },
                ]}
              />

              <Input
                label="Authorized Amount"
                value={formatCurrency(targetIncidentForOverride.commitmentValue, currency)}
                readOnly={true}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-sans text-[#8c909f] font-medium block">
                Executive Justification Memo (Permanent Audit Entry)
              </label>
              <textarea
                value={overrideMemo}
                onChange={(e) => setOverrideMemo(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded p-2.5 focus:border-[#3B82F6] focus:outline-none"
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
            <label className="text-[11px] text-[#8c909f] block">
              Inquiry Prompt to Department Lead:
            </label>
            <textarea
              value={justificationPrompt}
              onChange={(e) => setJustificationPrompt(e.target.value)}
              rows={3}
              className="w-full text-xs font-sans bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded p-2.5 focus:border-[#3B82F6] focus:outline-none"
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
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#090D16] border border-[#1E2D4A] rounded">
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">BLOCKED VALUE</span>
                <span className="font-mono font-bold text-white text-base">
                  {formatCurrency(selectedIncidentForDossier.commitmentValue, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">VIOLATION CLASS</span>
                <span className="font-bold text-[#ff8093]">{selectedIncidentForDossier.breachClassification}</span>
              </div>
            </div>

            <p className="text-white text-xs leading-relaxed">{selectedIncidentForDossier.violationDetail}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
