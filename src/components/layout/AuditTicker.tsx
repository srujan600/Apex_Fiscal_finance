import React from 'react';
import { useApp } from '../../context/AppContext';
import { truncateHash } from '../../utils/formatters';

export const AuditTicker: React.FC = () => {
  const { auditLogs, setActiveTab } = useApp();
  const latestLog = auditLogs[0];

  return (
    <footer className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono select-none">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-emerald-600 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
          <span className="font-semibold tracking-wider text-[11px] uppercase">IMMUTABLE AUDIT STREAM</span>
        </div>

        <div className="h-3.5 w-px bg-slate-200 shrink-0" />

        <div className="text-slate-600 truncate max-w-2xl text-[11px]">
          {latestLog ? (
            <>
              <span className="text-slate-900 font-semibold mr-1.5">BLOCK #{latestLog.blockNumber}:</span>
              <span className="text-blue-600 font-medium mr-1">{truncateHash(latestLog.txHash, 6, 4)}</span>
              <span className="mr-1.5 text-slate-700">· {latestLog.action} ({latestLog.entityId})</span>
              <span className="text-slate-500">· Actor: {latestLog.actor}</span>
            </>
          ) : (
            <span>STREAM SYNCHRONIZED · ZERO UNRECONCILED DISCREPANCIES</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-slate-500 text-[11px] shrink-0">
        <span>Latency: 14ms</span>
        <span>Consensus: 12/12 Nodes</span>
        <button
          onClick={() => setActiveTab('audit')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-semibold transition-colors"
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
