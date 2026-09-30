import { getDb, runTransaction } from '../../db/connection';
import { RequestStatus, RiskLevel } from '../../types/common';
import { AppError } from '../../middleware/errorHandler';
import { policiesService } from '../policies/policies.service';
import { auditService } from '../audit/audit.service';

export interface SpendingRequestDTO {
  id: string;
  trackingNumber: string;
  category: string;
  categoryId: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  vendor: string;
  businessPurpose: string;
  requestedBy: string;
  requestorRole: string;
  submittedAt: string;
  status: RequestStatus;
  riskLevel: RiskLevel;
  ruleTriggered?: string;
  policyReason?: string;
  preCommitmentUtil: number;
  postCommitmentUtil: number;
  hasAttachment: boolean;
}

export interface CreateSpendingRequestDTO {
  category: string;
  categoryId: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  vendor: string;
  businessPurpose: string;
  requestedBy?: string;
  requestorRole?: string;
  hasAttachment?: boolean;
  idempotencyKey?: string;
}

export interface SimulationResultDTO {
  departmentId: string;
  departmentName: string;
  amount: number;
  currentAvailable: number;
  currentUtil: number;
  postCommitmentUtil: number;
  isViolation: boolean;
  deficit: number;
  verdict: RequestStatus;
  riskLevel: RiskLevel;
  ruleTriggered: string;
  policyReason: string;
  latencyMs: number;
}

export class SpendingService {
  /**
   * Deterministic zero-regret sandbox simulation.
   * Runs in-memory with sub-15ms latency against live database budgets.
   */
  public simulatePreClearance(departmentId: string, amount: number): SimulationResultDTO {
    const start = Date.now();
    const db = getDb();

    if (amount <= 0) {
      throw new AppError('Requisition amount must be positive', 400, 'INVALID_AMOUNT');
    }

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(departmentId, departmentId) as any;

    if (!budget) {
      throw new AppError(`Department budget '${departmentId}' not found`, 404, 'BUDGET_NOT_FOUND');
    }

    const amountCents = Math.round(amount * 100);
    const allocatedCents = budget.allocated_cents;
    const inFlightBeforeCents = budget.actual_settled_cents + budget.committed_cents;
    const inFlightAfterCents = inFlightBeforeCents + amountCents;

    const currentUtil = allocatedCents > 0 ? (inFlightBeforeCents / allocatedCents) * 100 : 0;
    const postUtil = allocatedCents > 0 ? (inFlightAfterCents / allocatedCents) * 100 : 0;
    const deficitCents = Math.max(0, inFlightAfterCents - allocatedCents);

    const evalResult = policiesService.evaluatePolicies({
      amount,
      departmentId: budget.department_id,
      departmentName: budget.department_name,
    });

    const isViolation = evalResult.verdict === 'BLOCKED';
    const verdict: RequestStatus = evalResult.verdict === 'BLOCKED' ? 'BLOCKED' : evalResult.verdict === 'FLAGGED' ? 'PENDING_APPROVAL' : 'PRE_CLEARED';
    const riskLevel: RiskLevel = evalResult.riskLevel;
    const ruleTriggered = evalResult.ruleTriggered || 'RULE-ENG-01 (Pre-Cleared Nominal)';
    const policyReason = evalResult.explanation;

    return {
      departmentId: budget.department_id,
      departmentName: budget.department_name,
      amount,
      currentAvailable: budget.available_cents / 100,
      currentUtil: parseFloat(currentUtil.toFixed(1)),
      postCommitmentUtil: parseFloat(postUtil.toFixed(1)),
      isViolation,
      deficit: deficitCents / 100,
      verdict,
      riskLevel,
      ruleTriggered,
      policyReason,
      latencyMs: Date.now() - start,
    };
  }

  public getAllRequests(statusFilter?: string, search?: string): SpendingRequestDTO[] {
    const db = getDb();
    let query = 'SELECT * FROM spending_requests';
    const params: any[] = [];
    const conditions: string[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      conditions.push('status = ?');
      params.push(statusFilter);
    }

    if (search && search.trim()) {
      conditions.push('(tracking_number LIKE ? OR vendor LIKE ? OR business_purpose LIKE ? OR department_name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.mapRowToDTO(r));
  }

  public getRequestById(id: string): SpendingRequestDTO {
    const db = getDb();
    const r = db.prepare('SELECT * FROM spending_requests WHERE id = ? OR tracking_number = ?').get(id, id) as any;

    if (!r) {
      throw new AppError(`Spending request '${id}' not found`, 404, 'REQUEST_NOT_FOUND');
    }

    return this.mapRowToDTO(r);
  }

  /**
   * Submits a spending requisition with concurrency protection and atomic state transitions.
   * If the request is BLOCKED, automatically instantiates an ExceptionIncident.
   */
  public submitRequest(
    dto: CreateSpendingRequestDTO,
    actorName?: string,
    actorRole?: string
  ): SpendingRequestDTO {
    if (dto.amount <= 0) {
      throw new AppError('Requisition amount must be positive', 400, 'INVALID_AMOUNT');
    }

    const requestorName = actorName || dto.requestedBy || 'Alex Rivera';
    const requestorRole = actorRole || dto.requestorRole || 'EMPLOYEE';
    const amountCents = Math.round(dto.amount * 100);

    return runTransaction((db) => {
      // 1. Idempotency Check: if idempotency key provided, check if already recorded
      if (dto.idempotencyKey) {
        const existing = db.prepare('SELECT * FROM spending_requests WHERE tracking_number = ?').get(dto.idempotencyKey) as any;
        if (existing) {
          return this.mapRowToDTO(existing);
        }
      }

      // 2. Fetch authoritative budget with lock
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
        dto.departmentId,
        dto.departmentId
      ) as any;

      if (!budget) {
        throw new AppError(`Department budget '${dto.departmentId}' not found`, 404, 'BUDGET_NOT_FOUND');
      }

      // 3. Concurrency check: recalculate available headroom in transaction
      const inFlightBeforeCents = budget.actual_settled_cents + budget.committed_cents;
      const inFlightAfterCents = inFlightBeforeCents + amountCents;
      const allocatedCents = budget.allocated_cents;

      const currentUtil = allocatedCents > 0 ? (inFlightBeforeCents / allocatedCents) * 100 : 0;
      const postUtil = allocatedCents > 0 ? (inFlightAfterCents / allocatedCents) * 100 : 0;
      const isOverBudget = postUtil > budget.hard_cap_threshold_pct || inFlightAfterCents > allocatedCents;

      const evalResult = policiesService.evaluatePolicies({
        amount: dto.amount,
        departmentId: budget.department_id,
        departmentName: budget.department_name,
        categoryId: dto.categoryId,
        category: dto.category,
        vendor: dto.vendor,
      });

      const status: RequestStatus = evalResult.verdict === 'BLOCKED' ? 'BLOCKED' : evalResult.verdict === 'FLAGGED' ? 'PENDING_APPROVAL' : 'PRE_CLEARED';
      const riskLevel: RiskLevel = evalResult.riskLevel;
      const ruleTriggered = evalResult.ruleTriggered || 'RULE-ENG-01 (Pre-Cleared Nominal)';
      const policyReason = evalResult.explanation;

      const randSuffix = Math.random().toString(36).substring(2, 7);
      const id = `req-${Date.now().toString(36)}-${randSuffix}`;
      const count = ((db.prepare('SELECT count(*) as count FROM spending_requests').get() as any)?.count || 0) + 9421;
      const trackingNumber = dto.idempotencyKey || `REQ-${count}-${randSuffix.toUpperCase()}`;

      // 4. If status is PENDING_APPROVAL or PRE_CLEARED, update committed spend in budget
      if (status === 'PENDING_APPROVAL' || status === 'PRE_CLEARED') {
        const newCommittedCents = budget.committed_cents + amountCents;
        const newAvailCents = Math.max(0, budget.allocated_cents - (budget.actual_settled_cents + newCommittedCents));
        const newUtil = ((budget.actual_settled_cents + newCommittedCents) / budget.allocated_cents) * 100;
        let newRisk: RiskLevel = budget.risk_level;
        if (newUtil >= budget.hard_cap_threshold_pct) newRisk = 'CRITICAL_BREACH';
        else if (newUtil >= budget.warning_threshold_pct) newRisk = 'ATTENTION';

        db.prepare(`
          UPDATE budgets 
          SET committed_cents = ?,
              available_cents = ?,
              utilization_rate = ?,
              risk_level = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(newCommittedCents, newAvailCents, parseFloat(newUtil.toFixed(1)), newRisk, budget.id);
      }

      // 5. Insert spending request
      db.prepare(`
        INSERT INTO spending_requests (
          id, tracking_number, category, category_id, department_id, department_name,
          amount_cents, vendor, business_purpose, requested_by, requestor_role,
          submitted_at, status, risk_level, rule_triggered, policy_reason,
          pre_commitment_util, post_commitment_util, has_attachment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        trackingNumber,
        dto.category,
        dto.categoryId,
        budget.department_id,
        budget.department_name,
        amountCents,
        dto.vendor,
        dto.businessPurpose,
        requestorName,
        requestorRole,
        status,
        riskLevel,
        ruleTriggered,
        policyReason,
        parseFloat(currentUtil.toFixed(1)),
        parseFloat(postUtil.toFixed(1)),
        dto.hasAttachment ? 1 : 0
      );

      // 6. If BLOCKED or breach, automatically instantiate Exception Incident
      if (status === 'BLOCKED' || postUtil > 100) {
        const exId = `ex-${Date.now().toString(36)}-${randSuffix}`;
        const exCode = `#EX-${count}`;
        db.prepare(`
          INSERT INTO exception_incidents (
            id, incident_code, request_id, timestamp, detection_source,
            department, sub_department, vendor, business_purpose, violation_detail,
            commitment_value_cents, breach_classification, rule_code, status
          ) VALUES (?, ?, ?, datetime('now'), 'SysGuard L9 Engine', ?, ?, ?, ?, ?, ?, 'CRITICAL_EXCEPTION', ?, 'PENDING_DECISION')
        `).run(
          exId,
          exCode,
          id,
          budget.department_name,
          dto.category,
          dto.vendor,
          dto.businessPurpose,
          `Causes departmental envelope to reach ${postUtil.toFixed(1)}%. Requires Group CFO override.`,
          amountCents,
          ruleTriggered.split(' ')[0] || 'RULE-ENG-08'
        );
      }

      // 7. Append immutable cryptographic audit event
      auditService.appendEvent(db, {
        actor: requestorName,
        actorRole: requestorRole as any,
        action: 'NEW_REQUISITION_SUBMITTED',
        entity: 'Requisition',
        entityId: trackingNumber,
        oldValue: 'STATUS: NONE',
        newValue: `STATUS: ${status} (Amount: $${dto.amount.toLocaleString('en-US')})`,
        reason: `Submitted for ${dto.vendor} (${dto.category})`,
      });

      return this.getRequestById(id);
    });
  }

  private mapRowToDTO(r: any): SpendingRequestDTO {
    return {
      id: r.id,
      trackingNumber: r.tracking_number,
      category: r.category,
      categoryId: r.category_id,
      departmentId: r.department_id,
      departmentName: r.department_name,
      amount: r.amount_cents / 100,
      vendor: r.vendor,
      businessPurpose: r.business_purpose,
      requestedBy: r.requested_by,
      requestorRole: r.requestor_role,
      submittedAt: r.submitted_at,
      status: r.status as RequestStatus,
      riskLevel: r.risk_level as RiskLevel,
      ruleTriggered: r.rule_triggered || undefined,
      policyReason: r.policy_reason || undefined,
      preCommitmentUtil: r.pre_commitment_util,
      postCommitmentUtil: r.post_commitment_util,
      hasAttachment: Boolean(r.has_attachment),
    };
  }
}

export const spendingService = new SpendingService();
