import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { ExceptionIncident } from '../../types';

interface CriticalExceptionLedgerProps {
  onOpenOverrideModal?: (incidentId: string) => void;
}

export const CriticalExceptionLedger: React.FC<CriticalExceptionLedgerProps> = ({
  onOpenOverrideModal,
}) => {
  const { exceptions, currency, overrideException, enforceRejectException } = useApp();
  const [selectedIncident, setSelectedIncident] = useState<ExceptionIncident | null>(null);
  const [justificationModalOpen, setJustificationModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideMemo, setOverrideMemo] = useState('');

  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING_DECISION');
  const totalBlockedCapital = pendingExceptions.reduce((acc, curr) => acc + curr.commitmentValue, 0);

  const handleOpenJustification = (incident: ExceptionIncident) => {
    setSelectedIncident(incident);
    setJustificationModalOpen(true);
  };

  const handleOpenOverride = (incident: ExceptionIncident) => {
    setSelectedIncident(incident);
    setOverrideMemo(`Group CFO approval authorized under Emergency Rule ${incident.ruleCode}. Reallocation applied.`);
    setOverrideModalOpen(true);
  };

  const handleConfirmOverride = () => {
    if (selectedIncident) {
      overrideException(selectedIncident.id, overrideMemo);
      setOverrideModalOpen(false);
    }
  };

  const handleReject = (id: string) => {
    enforceRejectException(id);
  };

  return (
    <section className="space-y-3.5" id="exceptions-ledger">
      {/* Header and Blocked Value Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-3.5 bg-[#E11D48] rounded-full" />
          <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
            Tier 4: Critical Exception & Override Ledger
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E11D48]/20 text-[#ff8093] border border-[#E11D48]/40">
            ACTION MANDATORY ({pendingExceptions.length} BLOCKED)
          </span>
        </div>
        <span className="text-xs font-mono text-[#8c909f]">
          Total Blocked Capital:{' '}
          <strong className="text-white font-bold">
            {formatCurrency(totalBlockedCapital, currency)}
          </strong>
        </span>
      </div>

      {/* Tactical Exceptions Table from Stitch */}
      <div className="tactile-tier-1 rounded-xl overflow-hidden border border-[#1E2D4A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090D16] text-[#64748B] text-[11px] font-mono uppercase border-b border-[#1E2D4A] h-9 select-none">
                <th className="px-4 font-semibold">Incident / ID</th>
                <th className="px-3 font-semibold">Department</th>
                <th className="px-3 font-semibold">Vendor & Purpose</th>
                <th className="px-3 font-semibold text-right">Commitment Value</th>
                <th className="px-3 font-semibold">Breach Classification</th>
                <th className="px-4 font-semibold text-right">Executive Decision Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131E36] text-xs font-sans">
              {pendingExceptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#8c909f] font-mono text-xs">
                    ✓ ZERO PENDING BREACH INCIDENTS · ALL CAPITAL POLICIES IN FULL COMPLIANCE
                  </td>
                </tr>
              ) : (
                pendingExceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-[#131E36]/60 transition-colors group">
                    {/* Column 1: Incident / ID */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            ex.breachClassification === 'CRITICAL_EXCEPTION'
                              ? 'bg-[#E11D48]'
                              : ex.breachClassification === 'WARNING_AUDIT'
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#3B82F6]'
                          }`}
                        />
                        <div>
                          <span className="font-mono font-bold text-white block">
                            {ex.incidentCode}
                          </span>
                          <span className="text-[10px] text-[#8c909f] font-mono block">
                            {ex.timestamp} · {ex.detectionSource}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Department */}
                    <td className="px-3 py-3">
                      <span className="text-white font-medium block">{ex.department}</span>
                      <span className="text-[10px] text-[#8c909f] block">{ex.subDepartment}</span>
                    </td>

                    {/* Column 3: Vendor & Purpose */}
                    <td className="px-3 py-3 max-w-xs">
                      <span className="text-white font-medium block truncate">{ex.vendor}</span>
                      <span className="text-[10px] text-[#8c909f] block truncate leading-tight">
                        {ex.violationDetail}
                      </span>
                    </td>

                    {/* Column 4: Commitment Value */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono font-bold text-white text-sm block">
                        {formatCurrency(ex.commitmentValue, currency)}
                      </span>
                      <span className="text-[10px] text-[#ff8093] block font-mono">
                        {ex.breachClassification === 'CRITICAL_EXCEPTION'
                          ? 'Over ceiling'
                          : 'Buffer alert'}
                      </span>
                    </td>

                    {/* Column 5: Breach Classification */}
                    <td className="px-3 py-3">
                      <StatusBadge status={ex.breachClassification} />
                    </td>

                    {/* Column 6: Executive Decision Rail */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TactileButton
                          variant="surface"
                          size="sm"
                          onClick={() => handleOpenJustification(ex)}
                        >
                          Justification
                        </TactileButton>

                        <TactileButton
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(ex.id)}
                        >
                          Reject
                        </TactileButton>

                        <TactileButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenOverride(ex)}
                        >
                          Approve Override
                        </TactileButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justification Details Modal */}
      {selectedIncident && (
        <Modal
          isOpen={justificationModalOpen}
          onClose={() => setJustificationModalOpen(false)}
          title={`Incident Audit Dossier: ${selectedIncident.incidentCode}`}
          subtitle={`Detected by ${selectedIncident.detectionSource} · Rule ${selectedIncident.ruleCode}`}
          badge={selectedIncident.breachClassification}
          badgeVariant={selectedIncident.breachClassification === 'CRITICAL_EXCEPTION' ? 'destructive' : 'warning'}
          footer={
            <TactileButton variant="surface" onClick={() => setJustificationModalOpen(false)}>
              Close Dossier
            </TactileButton>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#090D16] border border-[#1E2D4A] rounded">
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">COMMITMENT VALUE</span>
                <span className="text-sm font-mono font-bold text-white">
                  {formatCurrency(selectedIncident.commitmentValue, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">DEPARTMENT / COST CENTER</span>
                <span className="font-semibold text-white">{selectedIncident.department}</span>
              </div>
            </div>

            <div className="p-3 bg-[#090D16] border border-[#1E2D4A] rounded space-y-1">
              <span className="text-[10px] font-mono text-[#8c909f] block uppercase">Business Purpose</span>
              <p className="text-white text-xs leading-relaxed">{selectedIncident.businessPurpose}</p>
            </div>

            <div className="p-3 bg-[#E11D48]/10 border border-[#E11D48]/30 rounded space-y-1">
              <span className="text-[10px] font-mono text-[#ff8093] block uppercase font-bold">
                Violation Telemetry Analysis
              </span>
              <p className="text-[#ffb4ab] text-xs leading-relaxed">{selectedIncident.violationDetail}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Direct Override Modal */}
      {selectedIncident && (
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title={`Authorize Sovereign Override: ${selectedIncident.incidentCode}`}
          subtitle={`Offsetting ${formatCurrency(selectedIncident.commitmentValue, currency)} against executive contingency reserve.`}
          badge="CFO SIGN-OFF"
          badgeVariant="destructive"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="verified" onClick={handleConfirmOverride}>
                Sign & Execute Override
              </TactileButton>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#8c909f]">
              You are authorizing an explicit breach override for{' '}
              <strong className="text-white">{selectedIncident.vendor}</strong> in{' '}
              <strong className="text-white">{selectedIncident.department}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8c909f] block">
                Executive Justification Memo:
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
    </section>
  );
};
