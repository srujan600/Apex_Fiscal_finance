import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SpendingRequest } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { CreateRequestModal } from './CreateRequestModal';
import { RequestDetailModal } from './RequestDetailModal';

export const SpendingView: React.FC = () => {
  const { requests, currency, approveRequest, rejectRequest } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SpendingRequest | null>(null);

  const totalCommittedValue = requests.reduce((sum, r) => sum + r.amount, 0);
  const blockedRequests = requests.filter((r) => r.status === 'BLOCKED');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING_APPROVAL');

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2D4A]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/30">
              Procurement Pre-Clearance
            </span>
            <span className="text-[11px] font-mono text-[#8c909f]">REQUISITIONS PIPELINE</span>
          </div>
          <h1 className="text-xl md:text-2xl text-white font-semibold tracking-tight mt-1">
            Corporate Spending Requests & Pre-Commitment Verification
          </h1>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Every expenditure is dynamically evaluated against cost center envelopes prior to binding vendor execution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TactileButton variant="primary" icon="add" onClick={() => setCreateModalOpen(true)}>
            Draft Spending Requisition
          </TactileButton>
        </div>
      </div>

      {/* Requisitions Overview Quad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">TOTAL REQUISITIONS</span>
          <span className="text-xl font-mono font-bold text-white block mt-1">
            {requests.length} Requests
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Current Quarter</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">TOTAL PIPELINE VALUE</span>
          <span className="text-xl font-mono font-bold text-[#3B82F6] block mt-1">
            {formatCurrency(totalCommittedValue, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Gross commitment</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">BLOCKED AT GUARDRAIL</span>
          <span className="text-xl font-mono font-bold text-[#ff8093] block mt-1">
            {blockedRequests.length} Requests
          </span>
          <span className="text-[10px] font-mono text-[#ff8093] block mt-0.5">Budget breach prevented</span>
        </div>

        <div className="tactile-tier-1 p-3.5 rounded-lg border border-[#1E2D4A]">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">AWAITING SUPERVISOR</span>
          <span className="text-xl font-mono font-bold text-[#c0c1ff] block mt-1">
            {pendingRequests.length} In Review
          </span>
          <span className="text-[10px] font-mono text-[#8c909f] block mt-0.5">Pre-cleared pipeline</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-[#0D1526] border border-[#1E2D4A]">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#8c909f] text-base" data-icon="search">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor, ID, or department..."
            className="w-full h-8 pl-8 pr-3 text-xs font-mono bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded focus:border-[#3B82F6] focus:outline-none placeholder-[#424754]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'BLOCKED', 'PENDING_APPROVAL', 'APPROVED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-[#3B82F6]/20 text-[#adc6ff] border border-[#3B82F6]/40 font-bold'
                  : 'text-[#8c909f] hover:text-white bg-[#090D16] border border-[#1E2D4A]'
              }`}
            >
              {filter === 'ALL'
                ? 'All Requisitions'
                : filter === 'BLOCKED'
                ? 'Blocked by Policy'
                : filter === 'PENDING_APPROVAL'
                ? 'Pending Review'
                : 'Approved'}
            </button>
          ))}
        </div>
      </div>

      {/* Requisitions Ledger Table */}
      <div className="tactile-tier-1 rounded-xl overflow-hidden border border-[#1E2D4A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090D16] text-[#64748B] text-[11px] font-mono uppercase border-b border-[#1E2D4A] h-9 select-none">
                <th className="px-4 font-semibold">Tracking # / Submitted</th>
                <th className="px-3 font-semibold">Department & Requisitioner</th>
                <th className="px-3 font-semibold">Vendor & Purpose</th>
                <th className="px-3 font-semibold text-right">Requested Amount</th>
                <th className="px-3 font-semibold">Policy Decision</th>
                <th className="px-3 font-semibold text-center">Attachment</th>
                <th className="px-4 font-semibold text-right">Actions Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131E36] text-xs">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-[#131E36]/60 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-white block">
                      {req.trackingNumber}
                    </span>
                    <span className="text-[10px] text-[#8c909f] font-mono block">
                      {req.submittedAt}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-white font-medium block">{req.departmentName}</span>
                    <span className="text-[10px] text-[#8c909f] block">
                      {req.requestedBy} ({req.requestorRole})
                    </span>
                  </td>

                  <td className="px-3 py-3 max-w-xs">
                    <span className="text-white font-semibold block truncate">{req.vendor}</span>
                    <span className="text-[10px] text-[#8c909f] block truncate">
                      {req.businessPurpose}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-bold text-white text-sm block">
                      {formatCurrency(req.amount, currency)}
                    </span>
                    <span className="text-[10px] text-[#8c909f] block font-mono">
                      Post-util: {req.postCommitmentUtil.toFixed(1)}%
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge status={req.status} pulse={req.status === 'BLOCKED'} />
                  </td>

                  <td className="px-3 py-3 text-center">
                    {req.hasAttachment ? (
                      <span className="material-symbols-outlined text-[#3B82F6] text-base" title="Signed SOW Attached" data-icon="attachment">
                        attachment
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#8c909f]">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <TactileButton
                        variant="surface"
                        size="sm"
                        onClick={() => setSelectedRequest(req)}
                      >
                        Dossier
                      </TactileButton>

                      {req.status === 'PENDING_APPROVAL' && (
                        <>
                          <TactileButton
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectRequest(req.id)}
                          >
                            Reject
                          </TactileButton>
                          <TactileButton
                            variant="primary"
                            size="sm"
                            onClick={() => approveRequest(req.id)}
                          >
                            Approve
                          </TactileButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};
