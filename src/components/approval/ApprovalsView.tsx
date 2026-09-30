import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';
import { Modal } from '../ui/Modal';
import { SpendingRequest } from '../../types';

export const ApprovalsView: React.FC = () => {
  const { requests, currency, approveRequest, rejectRequest, role } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ACTIONED'>('PENDING');
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<SpendingRequest | null>(null);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [targetReqForEscalate, setTargetReqForEscalate] = useState<SpendingRequest | null>(null);
  const [escalateNote, setEscalateNote] = useState('');
  const [justificationModalOpen, setJustificationModalOpen] = useState(false);
  const [targetReqForJustification, setTargetReqForJustification] = useState<SpendingRequest | null>(null);
  const [justificationQuery, setJustificationQuery] = useState('');

  const pendingApprovals = requests.filter((r) => r.status === 'PENDING_APPROVAL');
  const actionedApprovals = requests.filter((r) => r.status !== 'PENDING_APPROVAL');

  const displayedRequests = activeFilter === 'ALL'
    ? requests
    : activeFilter === 'PENDING'
    ? pendingApprovals
    : actionedApprovals;

  const totalPendingAmount = pendingApprovals.reduce((sum, r) => sum + r.amount, 0);

  const handleEscalate = (req: SpendingRequest) => {
    setTargetReqForEscalate(req);
    setEscalateNote(`Escalated to Group CFO for multi-sig review. Requires discretionary approval under ${req.ruleTriggered || 'high-value policy gate'}.`);
    setEscalateModalOpen(true);
  };

  const handleConfirmEscalate = () => {
    setEscalateModalOpen(false);
  };

  const handleRequestJustification = (req: SpendingRequest) => {
    setTargetReqForJustification(req);
    setJustificationQuery('Please provide itemized breakdown of cloud infrastructure units and confirm failover requirement prior to approval.');
    setJustificationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Multi-Level Sign-Off Queue
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">ACTIVE ROLE: {role}</span>
          </div>
          <h1 className="text-xl md:text-2xl text-slate-900 font-bold tracking-tight mt-1">
            Approval Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized supervisory decision queue for requisitions requiring multi-sig verification or threshold escalations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs font-mono text-slate-500">
            Pending Value: <strong className="text-slate-900 font-bold">{formatCurrency(totalPendingAmount, currency)}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-3 text-xs font-mono">
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'PENDING'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <span>Pending Decision</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-white font-bold">
            {pendingApprovals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          All Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveFilter('ACTIONED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'ACTIONED'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Actioned History ({actionedApprovals.length})
        </button>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {displayedRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-xs font-mono text-slate-400 border border-slate-200/80 shadow-sm">
            ✓ No requisitions currently pending in this queue.
          </div>
        ) : (
          displayedRequests.map((req) => {
            const isPending = req.status === 'PENDING_APPROVAL';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 space-y-4"
              >
                {/* Top Row: Employee, Amount, Department, Category, Risk, Level */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs text-blue-700 shadow-sm">
                      {req.requestedBy.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.requestedBy}</span>
                        <span className="text-[10px] font-mono text-slate-400">({req.requestorRole})</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-[10px] font-mono text-blue-600 uppercase font-semibold">{req.departmentName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                        Submitted: {req.submittedAt} · Category: <strong className="text-slate-900 font-bold">{req.category}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                        Requested Amount
                      </span>
                      <span className="text-lg font-mono font-bold text-slate-900 block leading-tight">
                        {formatCurrency(req.amount, currency)}
                      </span>
                    </div>

                    <StatusBadge status={req.status} />
                  </div>
                </div>

                {/* Middle Row: Policy Triggered & Business Purpose */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-8 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                      Business Purpose & Legal Justification
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">{req.businessPurpose}</p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Designated Vendor: <strong className="text-slate-900 font-semibold">{req.vendor}</strong>
                    </span>
                  </div>

                  <div className="md:col-span-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                      Policy Triggered & Approval Gate
                    </span>
                    <span className="font-mono font-bold text-slate-900 block text-[11px]">
                      {req.ruleTriggered || 'RULE-ENG-05 (Level-2 VP Signoff)'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 block font-medium">
                      Approval Level: L2 Department Head / L3 Finance
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Post-Commitment: {req.postCommitmentUtil.toFixed(1)}% Capacity
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Tactile Actions Rail */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <TactileButton
                    variant="surface"
                    size="sm"
                    icon="visibility"
                    onClick={() => setSelectedReqForDetail(req)}
                  >
                    View Details
                  </TactileButton>

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2">
                      <TactileButton
                        variant="ghost"
                        size="sm"
                        icon="chat"
                        onClick={() => handleRequestJustification(req)}
                      >
                        Request Justification
                      </TactileButton>

                      <TactileButton
                        variant="surface"
                        size="sm"
                        icon="arrow_upward"
                        onClick={() => handleEscalate(req)}
                      >
                        Escalate
                      </TactileButton>

                      <TactileButton
                        variant="destructive"
                        size="sm"
                        icon="close"
                        onClick={() => rejectRequest(req.id)}
                      >
                        Reject
                      </TactileButton>

                      <TactileButton
                        variant="primary"
                        size="sm"
                        icon="check"
                        onClick={() => approveRequest(req.id)}
                      >
                        Approve
                      </TactileButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Escalate Modal */}
      {targetReqForEscalate && (
        <Modal
          isOpen={escalateModalOpen}
          onClose={() => setEscalateModalOpen(false)}
          title={`Escalate Requisition: ${targetReqForEscalate.trackingNumber}`}
          subtitle={`Route to higher supervisory level (Group CFO / Treasury Committee)`}
          badge="ESCALATION"
          badgeVariant="warning"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setEscalateModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="send" onClick={handleConfirmEscalate}>
                Transmit Escalation
              </TactileButton>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              You are escalating requisition <strong className="text-slate-900 font-semibold">{targetReqForEscalate.trackingNumber}</strong> ({formatCurrency(targetReqForEscalate.amount, currency)}) for executive review.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 block font-medium">
                Escalation Note to Executive Committee:
              </label>
              <textarea
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Request Justification Modal */}
      {targetReqForJustification && (
        <Modal
          isOpen={justificationModalOpen}
          onClose={() => setJustificationModalOpen(false)}
          title={`Request Justification: ${targetReqForJustification.trackingNumber}`}
          subtitle={`Request formal clarification from ${targetReqForJustification.requestedBy}`}
          badge="INQUIRY"
          badgeVariant="primary"
          footer={
            <>
              <TactileButton variant="ghost" onClick={() => setJustificationModalOpen(false)}>
                Cancel
              </TactileButton>
              <TactileButton variant="primary" icon="send" onClick={() => setJustificationModalOpen(false)}>
                Send Inquiry to Requisitioner
              </TactileButton>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 block font-medium">
                Required Clarification Prompt:
              </label>
              <textarea
                value={justificationQuery}
                onChange={(e) => setJustificationQuery(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* View Details Modal */}
      {selectedReqForDetail && (
        <Modal
          isOpen={!!selectedReqForDetail}
          onClose={() => setSelectedReqForDetail(null)}
          title={`Requisition Details: ${selectedReqForDetail.trackingNumber}`}
          subtitle={`${selectedReqForDetail.departmentName} · ${selectedReqForDetail.vendor}`}
          badge={selectedReqForDetail.status}
          footer={
            <TactileButton variant="surface" onClick={() => setSelectedReqForDetail(null)}>
              Close
            </TactileButton>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">REQUESTOR</span>
                <span className="text-slate-900 font-semibold">{selectedReqForDetail.requestedBy}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-semibold">AMOUNT</span>
                <span className="text-slate-900 font-bold font-mono">{formatCurrency(selectedReqForDetail.amount, currency)}</span>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">{selectedReqForDetail.businessPurpose}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
