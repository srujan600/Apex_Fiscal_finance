import React from 'react';
import { useApp } from '../../context/AppContext';
import { truncateHash } from '../../utils/formatters';

export const AuditTicker: React.FC = () => {
  const { auditLogs, setActiveTab } = useApp();
  const latestLog = auditLogs[0];

  return (
    <footer className="tactile-tier-1 rounded-xl p-3 border border-[#1E2D4A] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono select-none">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[#10B981] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#10B981] status-pulse" />
          <span className="font-semibold tracking-wider text-[11px] uppercase">IMMUTABLE AUDIT STREAM</span>
        </div>

        <div className="h-3.5 w-px bg-[#1E2D4A] shrink-0" />

        <div className="text-[#8c909f] truncate max-w-2xl text-[11px]">
          {latestLog ? (
            <>
              <span className="text-white font-semibold mr-1.5">BLOCK #{latestLog.blockNumber}:</span>
              <span className="text-[#adc6ff] mr-1">{truncateHash(latestLog.txHash, 6, 4)}</span>
              <span className="mr-1.5">· {latestLog.action} ({latestLog.entityId})</span>
              <span className="text-[#8c909f]">· Actor: {latestLog.actor}</span>
            </>
          ) : (
            <span>STREAM SYNCHRONIZED · ZERO UNRECONCILED DISCREPANCIES</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[#8c909f] text-[11px] shrink-0">
        <span>Latency: 14ms</span>
        <span>Consensus: 12/12 Nodes</span>
        <button
          onClick={() => setActiveTab('audit')}
          className="text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
        >
          <span>Open Ledger</span>
          <span className="material-symbols-outlined text-xs leading-none" data-icon="open_in_new">
            open_in_new
          </span>
        </button>
      </div>
    </footer>
  );
};
