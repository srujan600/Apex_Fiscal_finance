import { getDb, runTransaction } from '../../db/connection';
import { RiskLevel } from '../../types/common';
import { AppError } from '../../middleware/errorHandler';
import { auditService } from '../audit/audit.service';

export interface BudgetEnvelopeDTO {
  id: string;
  code: string;
  departmentId: string;
  departmentName: string;
  allocated: number;
  actualSettled: number;
  committed: number;
  available: number;
  utilizationRate: number;
  projectedOverrun: number;
  riskLevel: RiskLevel;
  daysToRunOut: number;
  leadManager: string;
  fiscalPeriod: string;
  warningThresholdPct: number;
  hardCapThresholdPct: number;
}

export interface CreateBudgetDTO {
  departmentName: string;
  allocated: number;
  fiscalPeriod?: string;
  leadManager?: string;
  warningThresholdPct?: number;
  hardCapThresholdPct?: number;
}

export interface UpdateBudgetDTO {
  allocated: number;
  justification: string;
}

export interface ReallocateBudgetDTO {
  sourceId: string;
  targetId: string;
  amount: number;
  reason?: string;
}

export class BudgetsService {
  /**
   * Deterministic financial calculation engine for budget envelopes.
   * Calculations operate on exact integer cents.
   */
  public calculateMetrics(
    allocatedCents: number,
    settledCents: number,
    committedCents: number,
    warningPct = 85.0,
    hardCapPct = 100.0
  ) {
    const totalCommitted = settledCents + committedCents;
    const availableCents = Math.max(0, allocatedCents - totalCommitted);
    const utilizationRate = allocatedCents > 0 ? (totalCommitted / allocatedCents) * 100 : 0;
    const overrunCents = Math.max(0, totalCommitted - allocatedCents);

    let riskLevel: RiskLevel = 'HEALTHY';
    if (utilizationRate >= hardCapPct || availableCents <= 0) {
      riskLevel = 'CRITICAL_BREACH';
    } else if (utilizationRate >= warningPct) {
      riskLevel = 'ATTENTION';
    }

    // Days to run out estimate based on active period burn
    const daysToRunOut =
      availableCents <= 0
        ? 0
        : utilizationRate > 90
        ? Math.max(5, Math.floor((availableCents / (allocatedCents * 0.015)) * 1))
        : Math.max(15, Math.floor(90 * (1 - utilizationRate / 100)));

    return {
      availableCents,
      utilizationRate: parseFloat(utilizationRate.toFixed(1)),
      overrunCents,
      riskLevel,
      daysToRunOut,
    };
  }

  public getAllBudgets(): BudgetEnvelopeDTO[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM budgets ORDER BY code').all() as any[];

    return rows.map((r) => this.mapRowToDTO(r));
  }

  public getBudgetById(id: string): BudgetEnvelopeDTO {
    const db = getDb();
    const r = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(id, id) as any;

    if (!r) {
      throw new AppError(`Budget envelope '${id}' not found`, 404, 'BUDGET_NOT_FOUND');
    }

    return this.mapRowToDTO(r);
  }

  public createBudget(
    dto: CreateBudgetDTO,
    actorName = 'Administrator',
    actorRole = 'FINANCE_ADMIN'
  ): BudgetEnvelopeDTO {
    const db = getDb();

    if (dto.allocated <= 0) {
      throw new AppError('Allocated budget ceiling must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const id = `bgt-${Date.now().toString(36)}`;
    const code = `BGT-2025-${dto.departmentName.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 89 + 10)}`;
    const fiscalPeriod = dto.fiscalPeriod || 'Q3-2025';
    const leadManager = dto.leadManager || 'Lead Executive';
    const warningPct = dto.warningThresholdPct ?? 85.0;
    const hardCapPct = dto.hardCapThresholdPct ?? 100.0;
    const allocatedCents = Math.round(dto.allocated * 100);

    // Create or resolve department
    let dept = db.prepare('SELECT id FROM departments WHERE name = ?').get(dto.departmentName) as any;
    let deptId = dept?.id;

    if (!deptId) {
      deptId = `dept-${Date.now().toString(36)}`;
      const deptCode = `CC-${Math.floor(Math.random() * 899 + 100)}-${dto.departmentName.slice(0, 3).toUpperCase()}`;
      db.prepare(`
        INSERT INTO departments (id, code, name, lead_manager, manager_title, manager_avatar, headcount)
        VALUES (?, ?, ?, ?, 'Department Lead', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 25)
      `).run(deptId, deptCode, dto.departmentName, leadManager);
    }

    const metrics = this.calculateMetrics(allocatedCents, 0, 0, warningPct, hardCapPct);

    db.prepare(`
      INSERT INTO budgets (
        id, code, department_id, department_name, fiscal_period,
        allocated_cents, actual_settled_cents, committed_cents, available_cents,
        utilization_rate, projected_overrun_cents, risk_level, days_to_run_out,
        lead_manager, warning_threshold_pct, hard_cap_threshold_pct
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      code,
      deptId,
      dto.departmentName,
      fiscalPeriod,
      allocatedCents,
      metrics.availableCents,
      metrics.utilizationRate,
      metrics.overrunCents,
      metrics.riskLevel,
      metrics.daysToRunOut,
      leadManager,
      warningPct,
      hardCapPct
    );

    // Append to audit trail
    this.appendAuditLog(
      db,
      actorName,
      actorRole,
      'BUDGET_ENVELOPE_CREATED',
      'Department Budget',
      code,
      'STATUS: UNINITIALIZED',
      `CEILING: $${dto.allocated.toLocaleString('en-US')}`,
      `Created budget envelope for ${dto.departmentName} (${fiscalPeriod})`
    );

    return this.getBudgetById(id);
  }

  public updateBudget(
    id: string,
    dto: UpdateBudgetDTO,
    actorName = 'Administrator',
    actorRole = 'FINANCE_ADMIN'
  ): BudgetEnvelopeDTO {
    const db = getDb();
    const current = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as any;

    if (!current) {
      throw new AppError(`Budget envelope '${id}' not found`, 404, 'BUDGET_NOT_FOUND');
    }

    const newAllocCents = Math.round(dto.allocated * 100);
    const inFlightCents = current.actual_settled_cents + current.committed_cents;

    if (newAllocCents < inFlightCents && actorRole !== 'CFO') {
      throw new AppError(
        `Cannot reduce allocation below existing settled and committed spend ($${(inFlightCents / 100).toLocaleString('en-US')}) without CFO Sovereign Override.`,
        422,
        'ALLOCATION_BELOW_COMMITMENTS'
      );
    }

    const metrics = this.calculateMetrics(
      newAllocCents,
      current.actual_settled_cents,
      current.committed_cents,
      current.warning_threshold_pct,
      current.hard_cap_threshold_pct
    );

    db.prepare(`
      UPDATE budgets 
      SET allocated_cents = ?,
          available_cents = ?,
          utilization_rate = ?,
          projected_overrun_cents = ?,
          risk_level = ?,
          days_to_run_out = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      newAllocCents,
      metrics.availableCents,
      metrics.utilizationRate,
      metrics.overrunCents,
      metrics.riskLevel,
      metrics.daysToRunOut,
      id
    );

    const oldAllocStr = (current.allocated_cents / 100).toLocaleString('en-US');
    const newAllocStr = dto.allocated.toLocaleString('en-US');

    this.appendAuditLog(
      db,
      actorName,
      actorRole,
      'BUDGET_ALLOCATION_UPDATED',
      'Department Budget',
      current.code,
      `ALLOCATION: $${oldAllocStr}`,
      `ALLOCATION: $${newAllocStr}`,
      dto.justification || 'Executive quarterly allocation adjustment'
    );

    return this.getBudgetById(id);
  }

  /**
   * Cross-department budget rebalance execution.
   * Transfers authorized funds atomically using a database transaction.
   */
  public reallocateBudget(
    dto: ReallocateBudgetDTO,
    actorName = 'Administrator',
    actorRole = 'FINANCE_ADMIN'
  ): { source: BudgetEnvelopeDTO; target: BudgetEnvelopeDTO } {
    if (dto.sourceId === dto.targetId) {
      throw new AppError('Source and target department budgets cannot be the same', 400, 'INVALID_REBALANCE_TARGET');
    }

    if (dto.amount <= 0) {
      throw new AppError('Transfer amount must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const transferCents = Math.round(dto.amount * 100);

    return runTransaction((db) => {
      const source = db.prepare('SELECT * FROM budgets WHERE id = ?').get(dto.sourceId) as any;
      const target = db.prepare('SELECT * FROM budgets WHERE id = ?').get(dto.targetId) as any;

      if (!source) {
        throw new AppError(`Source budget '${dto.sourceId}' not found`, 404, 'SOURCE_BUDGET_NOT_FOUND');
      }
      if (!target) {
        throw new AppError(`Target budget '${dto.targetId}' not found`, 404, 'TARGET_BUDGET_NOT_FOUND');
      }

      // Check available headroom in source envelope
      const sourceTotalCommitted = source.actual_settled_cents + source.committed_cents;
      const sourceMaxTransferable = source.allocated_cents - sourceTotalCommitted;

      if (transferCents > sourceMaxTransferable) {
        throw new AppError(
          `Insufficient available headroom in ${source.department_name}. Maximum transferable amount is $${(sourceMaxTransferable / 100).toLocaleString('en-US')}.`,
          422,
          'INSUFFICIENT_SOURCE_HEADROOM'
        );
      }

      // Update source budget
      const newSourceAllocCents = source.allocated_cents - transferCents;
      const sourceMetrics = this.calculateMetrics(
        newSourceAllocCents,
        source.actual_settled_cents,
        source.committed_cents,
        source.warning_threshold_pct,
        source.hard_cap_threshold_pct
      );

      db.prepare(`
        UPDATE budgets 
        SET allocated_cents = ?,
            available_cents = ?,
            utilization_rate = ?,
            projected_overrun_cents = ?,
            risk_level = ?,
            days_to_run_out = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        newSourceAllocCents,
        sourceMetrics.availableCents,
        sourceMetrics.utilizationRate,
        sourceMetrics.overrunCents,
        sourceMetrics.riskLevel,
        sourceMetrics.daysToRunOut,
        source.id
      );

      // Update target budget
      const newTargetAllocCents = target.allocated_cents + transferCents;
      const targetMetrics = this.calculateMetrics(
        newTargetAllocCents,
        target.actual_settled_cents,
        target.committed_cents,
        target.warning_threshold_pct,
        target.hard_cap_threshold_pct
      );

      db.prepare(`
        UPDATE budgets 
        SET allocated_cents = ?,
            available_cents = ?,
            utilization_rate = ?,
            projected_overrun_cents = ?,
            risk_level = ?,
            days_to_run_out = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        newTargetAllocCents,
        targetMetrics.availableCents,
        targetMetrics.utilizationRate,
        targetMetrics.overrunCents,
        targetMetrics.riskLevel,
        targetMetrics.daysToRunOut,
        target.id
      );

      // Log append-only audit event
      this.appendAuditLog(
        db,
        actorName,
        actorRole,
        'BUDGET_REALLOCATION_COMMITTED',
        'Department Budgets',
        `${source.code} -> ${target.code}`,
        `SOURCE: $${(source.allocated_cents / 100).toLocaleString('en-US')} | TARGET: $${(target.allocated_cents / 100).toLocaleString('en-US')}`,
        `SOURCE: $${(newSourceAllocCents / 100).toLocaleString('en-US')} | TARGET: $${(newTargetAllocCents / 100).toLocaleString('en-US')}`,
        dto.reason || `Executive capital rebalance of $${dto.amount.toLocaleString('en-US')} authorized`
      );

      return {
        source: this.mapRowToDTO(db.prepare('SELECT * FROM budgets WHERE id = ?').get(source.id)),
        target: this.mapRowToDTO(db.prepare('SELECT * FROM budgets WHERE id = ?').get(target.id)),
      };
    });
  }

  private mapRowToDTO(r: any): BudgetEnvelopeDTO {
    return {
      id: r.id,
      code: r.code,
      departmentId: r.department_id,
      departmentName: r.department_name,
      allocated: r.allocated_cents / 100,
      actualSettled: r.actual_settled_cents / 100,
      committed: r.committed_cents / 100,
      available: r.available_cents / 100,
      utilizationRate: r.utilization_rate,
      projectedOverrun: r.projected_overrun_cents / 100,
      riskLevel: r.risk_level as RiskLevel,
      daysToRunOut: r.days_to_run_out,
      leadManager: r.lead_manager,
      fiscalPeriod: r.fiscal_period,
      warningThresholdPct: r.warning_threshold_pct,
      hardCapThresholdPct: r.hard_cap_threshold_pct,
    };
  }

  private appendAuditLog(
    db: any,
    actor: string,
    actorRole: string,
    action: string,
    entity: string,
    entityId: string,
    oldValue: string,
    newValue: string,
    reason: string
  ) {
    auditService.appendEvent(db, {
      actor,
      actorRole: actorRole as any,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      reason,
    });
  }
}

export const budgetsService = new BudgetsService();
