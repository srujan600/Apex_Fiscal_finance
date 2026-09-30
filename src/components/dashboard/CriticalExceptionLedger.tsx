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
          <span className="w-1.5 h-3.5 bg-rose-500 rounded-full" />
          <h2 className="text-xs font-mono font-semibold text-slate-900 uppercase tracking-wider">
            Tier 4: Critical Exception & Override Ledger
          </h2>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ACTION MANDATORY ({pendingExceptions.length} BLOCKED)
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Total Blocked Capital:{' '}
          <strong className="text-slate-900 font-bold">
            {formatCurrency(totalBlockedCapital, currency)}
          </strong>
        </span>
      </div>

      {/* Tactical Exceptions Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase border-b border-slate-200/80 h-10 select-none">
                <th className="px-4 font-semibold">Incident / ID</th>
                <th className="px-3 font-semibold">Department</th>
                <th className="px-3 font-semibold">Vendor & Purpose</th>
                <th className="px-3 font-semibold text-right">Commitment Value</th>
                <th className="px-3 font-semibold">Breach Classification</th>
                <th className="px-4 font-semibold text-right">Executive Decision Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {pendingExceptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-mono text-xs">
                    ✓ ZERO PENDING BREACH INCIDENTS · ALL CAPITAL POLICIES IN FULL COMPLIANCE
                  </td>
                </tr>
              ) : (
                pendingExceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Column 1: Incident / ID */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            ex.breachClassification === 'CRITICAL_EXCEPTION'
                              ? 'bg-rose-500 animate-pulse'
                              : ex.breachClassification === 'WARNING_AUDIT'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                        />
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">
                            {ex.incidentCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {ex.timestamp} · {ex.detectionSource}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Department */}
                    <td className="px-3 py-3.5">
                      <span className="text-slate-900 font-semibold block">{ex.department}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">{ex.subDepartment}</span>
                    </td>

                    {/* Column 3: Vendor & Purpose */}
                    <td className="px-3 py-3.5 max-w-xs">
                      <span className="text-slate-900 font-semibold block truncate">{ex.vendor}</span>
                      <span className="text-[10px] text-slate-500 block truncate leading-tight">
                        {ex.violationDetail}
                      </span>
                    </td>

                    {/* Column 4: Commitment Value */}
                    <td className="px-3 py-3.5 text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {formatCurrency(ex.commitmentValue, currency)}
                      </span>
                      <span className="text-[10px] text-rose-600 block font-mono font-medium">
                        {ex.breachClassification === 'CRITICAL_EXCEPTION'
                          ? 'Over ceiling'
                          : 'Buffer alert'}
                      </span>
                    </td>

                    {/* Column 5: Breach Classification */}
                    <td className="px-3 py-3.5">
                      <StatusBadge status={ex.breachClassification} />
                    </td>

                    {/* Column 6: Executive Decision Rail */}
                    <td className="px-4 py-3.5 text-right">
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
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">COMMITMENT VALUE</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {formatCurrency(selectedIncident.commitmentValue, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">DEPARTMENT / COST CENTER</span>
                <span className="font-semibold text-slate-900">{selectedIncident.department}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Business Purpose</span>
              <p className="text-slate-700 text-xs leading-relaxed">{selectedIncident.businessPurpose}</p>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-rose-700 block uppercase font-bold">
                Violation Telemetry Analysis
              </span>
              <p className="text-rose-800 text-xs leading-relaxed font-medium">{selectedIncident.violationDetail}</p>
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
            <p className="text-slate-600">
              You are authorizing an explicit breach override for{' '}
              <strong className="text-slate-900 font-semibold">{selectedIncident.vendor}</strong> in{' '}
              <strong className="text-slate-900 font-semibold">{selectedIncident.department}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 block font-medium">
                Executive Justification Memo:
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
    </section>
  );
};
