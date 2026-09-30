import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { AuditTicker } from './AuditTicker';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { Input } from '../ui/Input';
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
    <div className="min-h-screen bg-[#090D16] text-[#dfe2ef] flex">
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
      <main className="md:ml-[260px] pt-14 w-full md:w-[calc(100%-260px)] min-h-screen bg-grid-subtle flex flex-col justify-between">
        <div className="p-4 md:p-6 space-y-6 flex-1">
          {children}
        </div>

        {/* 4. Bottom Immutable Audit Stream Footer */}
        <div className="px-4 md:px-6 pb-6 pt-2">
          <AuditTicker />
        </div>
      </main>

      {/* Global Level-4 Sovereign Override Modal from Stitch */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Execute Sovereign CFO Override Protocol"
        subtitle="Level-4 cryptographic authorization to bypass hard stop thresholds."
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
          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A] space-y-2">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              Target Breach Incident
            </span>
            <select
              value={selectedExceptionId}
              onChange={(e) => setSelectedExceptionId(e.target.value)}
              className="w-full h-8 text-xs font-mono bg-[#0D1526] text-white border border-[#1E2D4A] rounded px-2"
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
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#131E36]/40 border border-[#2A3E66] text-xs">
              <div>
                <span className="text-[#8c909f] text-[10px] block font-mono">DEPARTMENT / UNIT</span>
                <span className="font-semibold text-white">{selectedException.department}</span>
              </div>
              <div>
                <span className="text-[#8c909f] text-[10px] block font-mono">VIOLATION CLASS</span>
                <span className="text-[#ff8093] font-mono font-bold">{selectedException.breachClassification}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#1E2D4A]">
                <span className="text-[#8c909f] text-[10px] block font-mono">REASON FOR BLOCK</span>
                <span className="text-white text-[11px] leading-relaxed">{selectedException.violationDetail}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#8c909f] block">
              Executive Justification Memo (Mandatory for Board Audit)
            </label>
            <textarea
              value={justificationMemo}
              onChange={(e) => setJustificationMemo(e.target.value)}
              rows={3}
              className="w-full text-xs font-sans bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded p-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="State the non-negotiable business reason, offsetting reserve source, and expected ROI..."
            />
          </div>

          <div className="p-2.5 rounded bg-[#E11D48]/10 border border-[#E11D48]/30 flex items-center gap-2 text-xs text-[#ffb4ab]">
            <span className="material-symbols-outlined text-base text-[#E11D48] shrink-0" data-icon="shield">
              shield
            </span>
            <span>
              This override will be permanently committed to the immutable audit ledger with your digital signature hash.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
