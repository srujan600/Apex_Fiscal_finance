import React from 'react';
import { SpendingRequest } from '../../types';
import { Modal } from '../ui/Modal';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

interface RequestDetailModalProps {
  request: SpendingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const { currency, approveRequest, rejectRequest } = useApp();

  if (!request) return null;

  const isBlocked = request.status === 'BLOCKED' || request.postCommitmentUtil > 100;
  const isApproved = request.status === 'APPROVED' || request.status === 'APPROVED_OVERRIDE';

  const handleApprove = () => {
    approveRequest(request.id);
    if (onApprove) onApprove(request.id);
    onClose();
  };

  const handleReject = () => {
    rejectRequest(request.id, 'Ceiling constraint exceeded');
    if (onReject) onReject(request.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Requisition Dossier: ${request.trackingNumber}`}
      subtitle={`Submitted by ${request.requestedBy} (${request.requestorRole}) · ${request.submittedAt}`}
      badge={request.status}
      badgeVariant={isBlocked ? 'destructive' : isApproved ? 'primary' : 'warning'}
      maxWidth="lg"
      footer={
        <>
          <TactileButton variant="ghost" onClick={onClose}>
            Close
          </TactileButton>

          {!isApproved && (
            <>
              <TactileButton
                variant="destructive"
                icon="close"
                onClick={handleReject}
              >
                Reject Requisition
              </TactileButton>

              <TactileButton
                variant="primary"
                icon="check"
                onClick={handleApprove}
              >
                Approve Requisition
              </TactileButton>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Core Attributes Quad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">REQUESTED VALUE</span>
            <span className="text-base font-mono font-bold text-white block mt-0.5">
              {formatCurrency(request.amount, currency)}
            </span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">TARGET DEPARTMENT</span>
            <span className="font-semibold text-white block mt-0.5 truncate">{request.departmentName}</span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">EXPENSE CATEGORY</span>
            <span className="font-semibold text-white block mt-0.5 truncate">{request.category}</span>
          </div>

          <div className="p-3 rounded bg-[#090D16] border border-[#1E2D4A]">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">DESIGNATED VENDOR</span>
            <span className="font-semibold text-white block mt-0.5 truncate">{request.vendor}</span>
          </div>
        </div>

        {/* Live Policy Evaluation Verdict Box */}
        <div
          className={`p-3.5 rounded-lg border space-y-2 ${
            isBlocked
              ? 'bg-[#E11D48]/10 border-[#E11D48]/40 text-[#ffb4ab]'
              : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-base ${isBlocked ? 'text-[#E11D48]' : 'text-[#10B981]'}`}
                data-icon={isBlocked ? 'block' : 'verified'}
              >
                {isBlocked ? 'block' : 'verified'}
              </span>
              <span className="font-mono font-bold text-xs uppercase tracking-wider">
                {isBlocked ? 'POLICY DECISION: BLOCKED' : 'POLICY DECISION: PRE-CLEARED'}
              </span>
            </div>
            <span className="text-[10px] font-mono">{request.ruleTriggered || 'RULE-EVAL'}</span>
          </div>

          <p className="text-xs leading-relaxed text-[#dfe2ef]">
            {request.policyReason || (isBlocked ? 'This request would exceed available budget headroom.' : 'Request is within allocated spend limits.')}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E2D4A]/50 text-[11px] font-mono">
            <div>
              <span className="text-[#8c909f] block">Pre-Commitment Utilization:</span>
              <span className="text-white font-semibold">{request.preCommitmentUtil.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[#8c909f] block">Projected Post-Commitment:</span>
              <span className={`font-bold ${request.postCommitmentUtil > 100 ? 'text-[#ff8093]' : 'text-[#10B981]'}`}>
                {request.postCommitmentUtil.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Business Purpose & Justification */}
        <div className="p-3 bg-[#090D16] border border-[#1E2D4A] rounded space-y-1">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
            Business Purpose & Procurement Scope
          </span>
          <p className="text-white text-xs leading-relaxed">{request.businessPurpose}</p>
        </div>

        {/* Verified Attachments Preview */}
        {request.hasAttachment && (
          <div className="p-3 bg-[#090D16] border border-[#1E2D4A] rounded space-y-2">
            <span className="text-[10px] font-mono text-[#8c909f] uppercase block">
              Associated Procurement Attachments
            </span>
            <div className="flex items-center justify-between p-2 rounded bg-[#0D1526] border border-[#1E2D4A]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#3B82F6] text-lg" data-icon="description">
                  description
                </span>
                <div>
                  <span className="font-mono text-white text-xs font-medium block">
                    Vendor_Quote_{request.vendor.replace(/\s+/g, '_')}_Q3_Signed.pdf
                  </span>
                  <span className="text-[10px] font-mono text-[#8c909f]">2.4 MB · SHA-256 Verified</span>
                </div>
              </div>
              <TactileButton variant="ghost" size="sm" icon="file_download">
                Download
              </TactileButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
