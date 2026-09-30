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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">REQUESTED VALUE</span>
            <span className="text-base font-mono font-bold text-slate-900 block mt-0.5">
              {formatCurrency(request.amount, currency)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">TARGET DEPARTMENT</span>
            <span className="font-semibold text-slate-900 block mt-0.5 truncate">{request.departmentName}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">EXPENSE CATEGORY</span>
            <span className="font-semibold text-slate-900 block mt-0.5 truncate">{request.category}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">DESIGNATED VENDOR</span>
            <span className="font-semibold text-slate-900 block mt-0.5 truncate">{request.vendor}</span>
          </div>
        </div>

        {/* Live Policy Evaluation Verdict Box */}
        <div
          className={`p-4 rounded-xl border space-y-2.5 shadow-sm ${
            isBlocked
              ? 'bg-rose-50/70 border-rose-200 text-rose-800'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-base ${isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}
                data-icon={isBlocked ? 'block' : 'verified'}
              >
                {isBlocked ? 'block' : 'verified'}
              </span>
              <span className="font-mono font-bold text-xs uppercase tracking-wider">
                {isBlocked ? 'POLICY DECISION: BLOCKED' : 'POLICY DECISION: PRE-CLEARED'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-medium">{request.ruleTriggered || 'RULE-EVAL'}</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-700">
            {request.policyReason || (isBlocked ? 'This request would exceed available budget headroom.' : 'Request is within allocated spend limits.')}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-200/60 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block font-medium">Pre-Commitment Utilization:</span>
              <span className="text-slate-900 font-semibold">{request.preCommitmentUtil.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Projected Post-Commitment:</span>
              <span className={`font-bold ${request.postCommitmentUtil > 100 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {request.postCommitmentUtil.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Business Purpose & Justification */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
            Business Purpose & Procurement Scope
          </span>
          <p className="text-slate-700 text-xs leading-relaxed">{request.businessPurpose}</p>
        </div>

        {/* Verified Attachments Preview */}
        {request.hasAttachment && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
              Associated Procurement Attachments
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-lg" data-icon="description">
                  description
                </span>
                <div>
                  <span className="font-mono text-slate-900 text-xs font-semibold block">
                    Vendor_Quote_{request.vendor.replace(/\s+/g, '_')}_Q3_Signed.pdf
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">2.4 MB · SHA-256 Verified</span>
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
