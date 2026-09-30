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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
              Procurement Pre-Clearance
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">REQUISITIONS PIPELINE</span>
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Corporate Spending Requests & Pre-Commitment Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL REQUISITIONS</span>
          <span className="text-xl font-mono font-bold text-slate-900 block mt-1">
            {requests.length} Requests
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Current Quarter</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TOTAL PIPELINE VALUE</span>
          <span className="text-xl font-mono font-bold text-blue-600 block mt-1">
            {formatCurrency(totalCommittedValue, currency, 'compact')}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Gross commitment</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">BLOCKED AT GUARDRAIL</span>
          <span className="text-xl font-mono font-bold text-rose-600 block mt-1">
            {blockedRequests.length} Requests
          </span>
          <span className="text-[10px] font-mono text-rose-600 block mt-0.5 font-medium">Budget breach prevented</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">AWAITING SUPERVISOR</span>
          <span className="text-xl font-mono font-bold text-indigo-600 block mt-1">
            {pendingRequests.length} In Review
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Pre-cleared pipeline</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base" data-icon="search">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor, ID, or department..."
            className="w-full h-9 pl-9 pr-3 text-xs font-mono bg-white text-slate-900 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'BLOCKED', 'PENDING_APPROVAL', 'APPROVED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
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
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase border-b border-slate-200/80 h-10 select-none">
                <th className="px-4 font-semibold">Tracking # / Submitted</th>
                <th className="px-3 font-semibold">Department & Requisitioner</th>
                <th className="px-3 font-semibold">Vendor & Purpose</th>
                <th className="px-3 font-semibold text-right">Requested Amount</th>
                <th className="px-3 font-semibold">Policy Decision</th>
                <th className="px-3 font-semibold text-center">Attachment</th>
                <th className="px-4 font-semibold text-right">Actions Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-slate-900 block">
                      {req.trackingNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {req.submittedAt}
                    </span>
                  </td>

                  <td className="px-3 py-3.5">
                    <span className="text-slate-900 font-semibold block">{req.departmentName}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {req.requestedBy} ({req.requestorRole})
                    </span>
                  </td>

                  <td className="px-3 py-3.5 max-w-xs">
                    <span className="text-slate-900 font-semibold block truncate">{req.vendor}</span>
                    <span className="text-[10px] text-slate-500 block truncate leading-tight">
                      {req.businessPurpose}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 text-right">
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      {formatCurrency(req.amount, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Post-util: {req.postCommitmentUtil.toFixed(1)}%
                    </span>
                  </td>

                  <td className="px-3 py-3.5">
                    <StatusBadge status={req.status} pulse={req.status === 'BLOCKED'} />
                  </td>

                  <td className="px-3 py-3.5 text-center">
                    {req.hasAttachment ? (
                      <span className="material-symbols-outlined text-blue-600 text-base" title="Signed SOW Attached" data-icon="attachment">
                        attachment
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
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
