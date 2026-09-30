import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { AuditTicker } from './AuditTicker';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { NovaCopilotWidget } from '../ai/NovaCopilotWidget';
import { useApp } from '../../context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { overrideException, exceptions } = useApp();
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState(exceptions[0]?.id || '');
  const [justificationMemo, setJustificationMemo] = useState('Critical operational continuity offset approved by Group CFO.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedException = exceptions.find((e) => e.id === selectedExceptionId) || exceptions[0];

  const handleExecuteOverride = () => {
    if (!selectedException) return;
    setIsSubmitting(true);
    setTimeout(() => {
      overrideException(selectedException.id, justificationMemo);
      setIsSubmitting(false);
      setIsOverrideModalOpen(false);
    }, 400);
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* 1. Left Enterprise Sidebar */}
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* 2. Top Global App Bar */}
      <HeaderBar
        onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* 3. Main Workspace Container */}
      <main className="md:ml-[260px] pt-14 w-full md:w-[calc(100%-260px)] min-h-screen bg-slate-50 bg-grid-subtle flex flex-col justify-between transition-all">
        <div className="p-4 md:p-8 space-y-8 flex-1 max-w-[1720px] w-full mx-auto">
          {children}
        </div>

        {/* 4. Bottom Immutable Audit Stream Footer */}
        <div className="px-4 md:px-8 pb-8 pt-2 max-w-[1720px] w-full mx-auto">
          <AuditTicker />
        </div>
      </main>

      {/* Global Level-4 Sovereign Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Execute Sovereign CFO Override Protocol"
        subtitle="Level-4 cryptographic authorization to bypass statutory hard stop thresholds."
        badge="L4 SOVEREIGN PROTOCOL"
        badgeVariant="destructive"
        footer={
          <>
            <TactileButton
              variant="ghost"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              Cancel & Enforce Ceilings
            </TactileButton>
            <TactileButton
              variant="primary"
              onClick={handleExecuteOverride}
              isLoading={isSubmitting}
              icon="verified"
            >
              Authorize & Reallocate Offset
            </TactileButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">
              Target Breach Incident
            </span>
            <select
              value={selectedExceptionId}
              onChange={(e) => setSelectedExceptionId(e.target.value)}
              className="w-full h-9 text-xs font-mono bg-white text-slate-900 border border-slate-200 rounded-xl px-3 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer shadow-xs"
            >
              {exceptions
                .filter((e) => e.status === 'PENDING_DECISION')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.incidentCode} · {e.department} · ${e.commitmentValue.toLocaleString()} ({e.vendor})
                  </option>
                ))}
            </select>
          </div>

          {selectedException && (
            <div className="grid grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-mono font-medium">DEPARTMENT / UNIT</span>
                <span className="font-semibold text-slate-900">{selectedException.department}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-mono font-medium">VIOLATION CLASS</span>
                <span className="text-rose-600 font-mono font-bold">{selectedException.breachClassification}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/70">
                <span className="text-slate-400 text-[10px] block font-mono font-medium">REASON FOR BLOCK</span>
                <span className="text-slate-700 text-xs leading-relaxed mt-0.5 block">{selectedException.violationDetail}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 block">
              Executive Justification Memo (Mandatory for Board Audit)
            </label>
            <textarea
              value={justificationMemo}
              onChange={(e) => setJustificationMemo(e.target.value)}
              rows={3}
              className="w-full text-xs font-sans bg-white text-slate-900 border border-slate-200 rounded-xl p-3 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-xs"
              placeholder="State the non-negotiable business reason, offsetting reserve source, and expected ROI..."
            />
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center gap-2.5 text-xs text-rose-700">
            <span className="material-symbols-outlined text-base text-rose-600 shrink-0" data-icon="shield">
              shield
            </span>
            <span className="leading-relaxed">
              This override will be permanently committed to the immutable audit ledger with your digital signature hash.
            </span>
          </div>
        </div>
      </Modal>

      {/* Floating Aczen Nova AI Copilot Interactive Widget */}
      <NovaCopilotWidget />
    </div>
  );
};

