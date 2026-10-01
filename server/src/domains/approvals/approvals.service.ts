import { getDb, runTransaction } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';
import { UserRole, getTierForRole } from '../../types/common';
import { SpendingRequestDTO } from '../spending/spending.service';
import { auditService } from '../audit/audit.service';

export interface EscalateRequestDTO {
  escalateTo?: string;
  note: string;
}

export class ApprovalsService {
  private mapRowToDTO(row: any): SpendingRequestDTO {
    return {
      id: row.id,
      trackingNumber: row.tracking_number,
      category: row.category,
      categoryId: row.category_id,
      departmentId: row.department_id,
      departmentName: row.department_name,
      amount: row.amount_cents / 100,
      vendor: row.vendor,
      businessPurpose: row.business_purpose,
      requestedBy: row.requested_by,
      requestorRole: row.requestor_role,
      submittedAt: row.submitted_at,
      status: row.status,
      riskLevel: row.risk_level,
      ruleTriggered: row.rule_triggered,
      policyReason: row.policy_reason,
      preCommitmentUtil: row.pre_commitment_util,
      postCommitmentUtil: row.post_commitment_util,
      hasAttachment: Boolean(row.has_attachment),
    };
  }

  public getPendingApprovals(): SpendingRequestDTO[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM spending_requests WHERE status = 'PENDING_APPROVAL' ORDER BY created_at DESC")
      .all() as any[];
    return rows.map((r) => this.mapRowToDTO(r));
  }

  public approveRequest(id: string, actorName: string = 'Victoria Sterling', actorRole: UserRole = 'CFO'): SpendingRequestDTO {
    return runTransaction((db) => {
      const request = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      if (!request) {
        throw new AppError(`Spending request '${id}' not found`, 404, 'REQUEST_NOT_FOUND');
      }

      if (request.status === 'APPROVED' || request.status === 'APPROVED_OVERRIDE') {
        return this.mapRowToDTO(request);
      }

      if (request.status === 'REJECTED') {
        throw new AppError('Cannot approve a rejected request. A new requisition must be submitted.', 400, 'ALREADY_REJECTED');
      }

      // Hierarchical check: Tier 1 (Executive) or Tier 2 (Controller) required for approvals
      // Tier 3 (Analyst) and Tier 4 (Auditor) lack approval authority
      const actorTier = getTierForRole(actorRole);
      if (actorTier > 2 || actorRole === 'EMPLOYEE' || actorRole === 'TIER_3_ANALYST' || actorRole === 'TIER_4_AUDITOR') {
        throw new AppError(
          'Action requires Tier 2 (Finance Manager / Controller) or higher authorization. Tier 3 analysts and Tier 4 auditors do not possess supervisory approval privileges.',
          403,
          'INSUFFICIENT_PRIVILEGES'
        );
      }

      // Transition to APPROVED
      const newStatus = request.status === 'BLOCKED' ? 'APPROVED_OVERRIDE' : 'APPROVED';

      // Update budget: move from committed to settled spend
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
        request.department_id,
        request.department_id
      ) as any;

      if (budget) {
        const amountCents = request.amount_cents;
        const newCommitted = Math.max(0, budget.committed_cents - amountCents);
        const newSettled = budget.actual_settled_cents + amountCents;

        db.prepare(`
          UPDATE budgets
          SET committed_cents = ?,
              actual_settled_cents = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(newCommitted, newSettled, budget.id);
      }

      db.prepare(`
        UPDATE spending_requests
        SET status = ?,
            policy_reason = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(newStatus, `Approved by ${actorName} (${actorRole})`, id);

      // Append audit event
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'REQUISITION_APPROVED',
        entity: 'Requisition',
        entityId: request.tracking_number,
        oldValue: `STATUS: ${request.status}`,
        newValue: `STATUS: ${newStatus}`,
        reason: `Supervisory multi-sig verification completed by ${actorName}`,
      });

      const updated = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }

  public rejectRequest(id: string, reason: string, actorName: string = 'Victoria Sterling', actorRole: UserRole = 'CFO'): SpendingRequestDTO {
    if (!reason || !reason.trim()) {
      throw new AppError('A valid rejection justification is mandatory for audit compliance.', 400, 'REASON_REQUIRED');
    }

    return runTransaction((db) => {
      const request = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      if (!request) {
        throw new AppError(`Spending request '${id}' not found`, 404, 'REQUEST_NOT_FOUND');
      }

      if (request.status === 'REJECTED') {
        return this.mapRowToDTO(request);
      }

      // If actor is employee, block rejection
      // Hierarchical check: Tier 1 (Executive) or Tier 2 (Controller) required for rejections
      const actorTier = getTierForRole(actorRole);
      if (actorTier > 2 || actorRole === 'EMPLOYEE' || actorRole === 'TIER_3_ANALYST' || actorRole === 'TIER_4_AUDITOR') {
        throw new AppError(
          'Action requires Tier 2 (Finance Manager / Controller) or higher authorization. Tier 3 analysts and Tier 4 auditors do not possess supervisory signoff privileges.',
          403,
          'INSUFFICIENT_PRIVILEGES'
        );
      }

      // Release reserved committed funds back into available headroom
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
        request.department_id,
        request.department_id
      ) as any;

      if (budget && (request.status === 'PENDING_APPROVAL' || request.status === 'PRE_CLEARED')) {
        const releasedCommitted = Math.max(0, budget.committed_cents - request.amount_cents);
        const newAvail = Math.max(0, budget.allocated_cents - (budget.actual_settled_cents + releasedCommitted));
        const newUtil = budget.allocated_cents > 0 ? ((budget.actual_settled_cents + releasedCommitted) / budget.allocated_cents) * 100 : 0;
        let newRisk = budget.risk_level;
        if (newUtil >= budget.hard_cap_threshold_pct) newRisk = 'CRITICAL_BREACH';
        else if (newUtil >= budget.warning_threshold_pct) newRisk = 'ATTENTION';
        else newRisk = 'HEALTHY';

        db.prepare(`
          UPDATE budgets
          SET committed_cents = ?,
              available_cents = ?,
              utilization_rate = ?,
              risk_level = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(releasedCommitted, newAvail, parseFloat(newUtil.toFixed(1)), newRisk, budget.id);
      }

      // Update spending request status
      db.prepare(`
        UPDATE spending_requests
        SET status = 'REJECTED',
            policy_reason = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(reason.trim(), id);

      // Append audit event
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'REQUISITION_REJECTED',
        entity: 'Requisition',
        entityId: request.tracking_number,
        oldValue: `STATUS: ${request.status}`,
        newValue: 'STATUS: REJECTED',
        reason: reason.trim(),
      });

      const updated = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }

  public escalateRequest(id: string, note: string, actorName: string = 'Alex Rivera', actorRole: UserRole = 'DEPT_MANAGER'): SpendingRequestDTO {
    return runTransaction((db) => {
      const request = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      if (!request) {
        throw new AppError(`Spending request '${id}' not found`, 404, 'REQUEST_NOT_FOUND');
      }

      const actorTier = getTierForRole(actorRole);
      if (actorTier === 4 || actorRole === 'TIER_4_AUDITOR') {
        throw new AppError('Tier 4 (Read-Only / Auditor) clearance prohibits workflow escalation or modification.', 403, 'INSUFFICIENT_PRIVILEGES');
      }

      const escalationNote = note || 'Escalated to Group CFO for multi-sig review.';
      db.prepare(`
        UPDATE spending_requests
        SET policy_reason = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(escalationNote, id);

      // Append audit event
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'REQUISITION_ESCALATED',
        entity: 'Requisition',
        entityId: request.tracking_number,
        oldValue: `STATUS: ${request.status}`,
        newValue: 'ESCALATED_TO_CFO',
        reason: escalationNote,
      });

      const updated = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }
}

export const approvalsService = new ApprovalsService();
