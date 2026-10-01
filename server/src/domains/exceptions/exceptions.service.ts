import { getDb, runTransaction } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';
import { UserRole, getTierForRole } from '../../types/common';
import { budgetsService } from '../budgets/budgets.service';
import { auditService } from '../audit/audit.service';

export interface ExceptionIncidentDTO {
  id: string;
  incidentCode: string;
  requestId: string | null;
  timestamp: string;
  detectionSource: string;
  department: string;
  subDepartment: string;
  vendor: string;
  businessPurpose: string;
  violationDetail: string;
  commitmentValue: number;
  breachClassification: string;
  ruleCode: string;
  status: 'PENDING_DECISION' | 'OVERRIDDEN' | 'ENFORCED_REJECTED';
  overrideJustification?: string;
  offsetSource?: string;
}

export class ExceptionsService {
  private mapRowToDTO(row: any): ExceptionIncidentDTO {
    return {
      id: row.id,
      incidentCode: row.incident_code,
      requestId: row.request_id || null,
      timestamp: row.timestamp,
      detectionSource: row.detection_source,
      department: row.department,
      subDepartment: row.sub_department,
      vendor: row.vendor,
      businessPurpose: row.business_purpose,
      violationDetail: row.violation_detail,
      commitmentValue: row.commitment_value_cents / 100,
      breachClassification: row.breach_classification,
      ruleCode: row.rule_code,
      status: row.status,
      overrideJustification: row.override_justification || undefined,
      offsetSource: row.offset_source || undefined,
    };
  }

  public getAllExceptions(statusFilter?: string): ExceptionIncidentDTO[] {
    const db = getDb();
    let query = 'SELECT * FROM exception_incidents';
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }

    query += ' ORDER BY created_at DESC, id DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.mapRowToDTO(r));
  }

  public getExceptionById(id: string): ExceptionIncidentDTO {
    const db = getDb();
    const row = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(id) as any;
    if (!row) {
      throw new AppError(`Exception incident '${id}' not found`, 404, 'EXCEPTION_NOT_FOUND');
    }
    return this.mapRowToDTO(row);
  }

  public overrideException(
    id: string,
    justification: string,
    offsetSource?: string,
    actorName: string = 'Victoria Sterling',
    actorRole: UserRole = 'CFO'
  ): ExceptionIncidentDTO {
    if (!justification || !justification.trim()) {
      throw new AppError('A valid executive justification memo is required for sovereign override.', 400, 'JUSTIFICATION_REQUIRED');
    }

    // Role check: Only Tier 1 Executive / CFO (or legacy Finance Admin) may perform Sovereign Overrides
    const actorTier = getTierForRole(actorRole);
    if (actorTier !== 1 && actorRole !== 'CFO' && actorRole !== 'TIER_1_EXECUTIVE' && actorRole !== 'FINANCE_ADMIN') {
      throw new AppError('Sovereign policy override requires CFO or Executive C-Suite authorization.', 403, 'INSUFFICIENT_PRIVILEGES');
    }

    return runTransaction((db) => {
      const ex = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(id) as any;
      if (!ex) {
        throw new AppError(`Exception incident '${id}' not found`, 404, 'EXCEPTION_NOT_FOUND');
      }

      if (ex.status === 'OVERRIDDEN') {
        return this.mapRowToDTO(ex);
      }

      const offset = offsetSource || 'Executive Strategic Buffer';

      // 1. Update exception status
      db.prepare(`
        UPDATE exception_incidents
        SET status = 'OVERRIDDEN',
            override_justification = ?,
            offset_source = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(justification.trim(), offset, id);

      // 2. If linked requisition exists and is BLOCKED, unlock and approve it
      if (ex.request_id) {
        const req = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(ex.request_id) as any;
        if (req && (req.status === 'BLOCKED' || req.status === 'PENDING_APPROVAL')) {
          db.prepare(`
            UPDATE spending_requests
            SET status = 'APPROVED_OVERRIDE',
                policy_reason = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(`Sovereign Override: ${justification.trim()}`, req.id);

          // Update budget commitment
          const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
            req.department_id,
            req.department_id
          ) as any;

          if (budget && req.status === 'BLOCKED') {
            const newCommitted = budget.committed_cents + req.amount_cents;
            const newAvail = Math.max(0, budget.allocated_cents - (budget.actual_settled_cents + newCommitted));
            db.prepare(`
              UPDATE budgets
              SET committed_cents = ?,
                  available_cents = ?,
                  updated_at = datetime('now')
              WHERE id = ?
            `).run(newCommitted, newAvail, budget.id);
          }
        }
      }

      // 3. Append cryptographic audit event
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'POLICY_OVERRIDE_EXECUTED',
        entity: 'Exception Incident',
        entityId: ex.incident_code,
        oldValue: `STATUS: ${ex.status}`,
        newValue: 'STATUS: OVERRIDDEN',
        reason: `${justification.trim()} (Offset: ${offset})`,
      });

      const updated = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }

  public enforceRejectException(
    id: string,
    reason: string = 'Policy Hard-Stop Enforced',
    actorName: string = 'Victoria Sterling',
    actorRole: UserRole = 'CFO'
  ): ExceptionIncidentDTO {
    return runTransaction((db) => {
      const ex = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(id) as any;
      if (!ex) {
        throw new AppError(`Exception incident '${id}' not found`, 404, 'EXCEPTION_NOT_FOUND');
      }

      if (ex.status === 'ENFORCED_REJECTED') {
        return this.mapRowToDTO(ex);
      }

      // 1. Update exception incident
      db.prepare(`
        UPDATE exception_incidents
        SET status = 'ENFORCED_REJECTED',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      // 2. If linked requisition exists, enforce BLOCKED / REJECTED status
      if (ex.request_id) {
        db.prepare(`
          UPDATE spending_requests
          SET status = 'REJECTED',
              policy_reason = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(`Enforced rejection: ${reason}`, ex.request_id);
      }

      // 3. Append audit log
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'POLICY_HARD_STOP_ENFORCED',
        entity: 'Exception Incident',
        entityId: ex.incident_code,
        oldValue: `STATUS: ${ex.status}`,
        newValue: 'STATUS: ENFORCED_REJECTED',
        reason,
      });

      const updated = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }

  public rebalanceAndResolve(
    id: string,
    sourceBudgetId: string,
    amount: number,
    justification?: string,
    actorName: string = 'Victoria Sterling',
    actorRole: UserRole = 'CFO'
  ): ExceptionIncidentDTO {
    const db = getDb();
    const ex = this.getExceptionById(id);

    // Find destination budget matching exception department
    const targetBudget = db.prepare('SELECT id FROM budgets WHERE department_name LIKE ? OR department_id = ? LIMIT 1').get(
      `%${ex.department}%`,
      ex.department
    ) as any;

    const targetBudgetId = targetBudget ? targetBudget.id : 'bgt-eng';

    // 1. Perform atomic budget rebalance
    budgetsService.reallocateBudget(
      {
        sourceId: sourceBudgetId,
        targetId: targetBudgetId,
        amount,
        reason: `Rebalance offset for Exception ${ex.incidentCode}`,
      },
      actorName,
      actorRole
    );

    // 2. Perform override
    return this.overrideException(
      id,
      justification || `Resolved via capital reserve reallocation from ${sourceBudgetId}.`,
      `Reallocation from ${sourceBudgetId}`,
      actorName,
      actorRole
    );
  }
}

export const exceptionsService = new ExceptionsService();
