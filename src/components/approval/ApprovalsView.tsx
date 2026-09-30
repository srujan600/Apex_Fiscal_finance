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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2D4A]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#6366F1]/20 text-[#c0c1ff] border border-[#6366F1]/30">
              Multi-Level Sign-Off Queue
            </span>
            <span className="text-[11px] font-mono text-[#8c909f]">ACTIVE ROLE: {role}</span>
          </div>
          <h1 className="text-xl md:text-2xl text-white font-semibold tracking-tight mt-1">
            Approval Command Center
          </h1>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Prioritized supervisory decision queue for requisitions requiring multi-sig verification or threshold escalations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded bg-[#0D1526] border border-[#1E2D4A] text-xs font-mono">
            Pending Value: <strong className="text-white">{formatCurrency(totalPendingAmount, currency)}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1E2D4A] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-2 ${
            activeFilter === 'PENDING'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          <span>Pending Decision</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-white">
            {pendingApprovals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          All Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveFilter('ACTIONED')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeFilter === 'ACTIONED'
              ? 'bg-[#3B82F6] text-white font-bold'
              : 'text-[#8c909f] hover:text-white bg-[#0D1526]'
          }`}
        >
          Actioned History ({actionedApprovals.length})
        </button>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {displayedRequests.length === 0 ? (
          <div className="tactile-tier-1 p-8 rounded-xl text-center text-xs font-mono text-[#8c909f]">
            ✓ No requisitions currently pending in this queue.
          </div>
        ) : (
          displayedRequests.map((req) => {
            const isPending = req.status === 'PENDING_APPROVAL';

            return (
              <div
                key={req.id}
                className="tactile-tier-1 rounded-xl p-5 border border-[#1E2D4A] hover:border-[#3B82F6]/40 transition-all space-y-4"
              >
                {/* Top Row: Employee, Amount, Department, Category, Risk, Level */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1E2D4A]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#131E36] border border-[#2A3E66] flex items-center justify-center font-mono font-bold text-xs text-[#3B82F6]">
                      {req.requestedBy.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{req.requestedBy}</span>
                        <span className="text-[10px] font-mono text-[#8c909f]">({req.requestorRole})</span>
                        <span className="text-xs text-[#8c909f]">·</span>
                        <span className="text-[10px] font-mono text-[#adc6ff] uppercase">{req.departmentName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#8c909f] block mt-0.5">
                        Submitted: {req.submittedAt} · Category: <strong className="text-white">{req.category}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                        Requested Amount
                      </span>
                      <span className="text-lg font-mono font-bold text-white block leading-tight">
                        {formatCurrency(req.amount, currency)}
                      </span>
                    </div>

                    <StatusBadge status={req.status} />
                  </div>
                </div>

                {/* Middle Row: Policy Triggered & Business Purpose */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-8 space-y-1">
                    <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                      Business Purpose & Legal Justification
                    </span>
                    <p className="text-white text-xs leading-relaxed">{req.businessPurpose}</p>
                    <span className="text-[11px] text-[#8c909f] block">
                      Designated Vendor: <strong className="text-white">{req.vendor}</strong>
                    </span>
                  </div>

                  <div className="md:col-span-4 p-3 rounded bg-[#090D16] border border-[#1E2D4A] space-y-1">
                    <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
                      Policy Triggered & Approval Gate
                    </span>
                    <span className="font-mono font-bold text-white block text-[11px]">
                      {req.ruleTriggered || 'RULE-ENG-05 (Level-2 VP Signoff)'}
                    </span>
                    <span className="text-[10px] font-mono text-[#F59E0B] block">
                      Approval Level: L2 Department Head / L3 Finance
                    </span>
                    <span className="text-[10px] font-mono text-[#8c909f] block">
                      Post-Commitment: {req.postCommitmentUtil.toFixed(1)}% Capacity
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Tactile Actions Rail */}
                <div className="pt-3 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3">
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
            <p className="text-[#8c909f]">
              You are escalating requisition <strong className="text-white">{targetReqForEscalate.trackingNumber}</strong> ({formatCurrency(targetReqForEscalate.amount, currency)}) for executive review.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8c909f] block">
                Escalation Note to Executive Committee:
              </label>
              <textarea
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded p-2.5 focus:border-[#3B82F6] focus:outline-none"
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
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8c909f] block">
                Required Clarification Prompt:
              </label>
              <textarea
                value={justificationQuery}
                onChange={(e) => setJustificationQuery(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans bg-[#090D16] text-[#dfe2ef] border border-[#1E2D4A] rounded p-2.5 focus:border-[#3B82F6] focus:outline-none"
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
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#090D16] border border-[#1E2D4A] rounded">
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">REQUESTOR</span>
                <span className="text-white font-semibold">{selectedReqForDetail.requestedBy}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8c909f] block">AMOUNT</span>
                <span className="text-white font-bold font-mono">{formatCurrency(selectedReqForDetail.amount, currency)}</span>
              </div>
            </div>
            <p className="text-white leading-relaxed">{selectedReqForDetail.businessPurpose}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
