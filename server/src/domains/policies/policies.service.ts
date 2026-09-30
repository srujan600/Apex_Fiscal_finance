import { getDb, runTransaction } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';
import { RiskLevel, UserRole } from '../../types/common';
import { auditService } from '../audit/audit.service';

export interface PolicyRuleDTO {
  id: string;
  code: string;
  name: string;
  conditionExpression: string;
  thresholdValue: number;
  actionRequired: 'AUTO_BLOCK' | 'REQUIRE_CFO_OVERRIDE' | 'REQUIRE_MANAGER' | 'WARN_AUDIT';
  targetEntity: string;
  status: 'ACTIVE' | 'PAUSED';
  latencyMs: number;
}

export interface CreatePolicyDTO {
  code?: string;
  name: string;
  conditionExpression: string;
  thresholdValue: number;
  actionRequired: 'AUTO_BLOCK' | 'REQUIRE_CFO_OVERRIDE' | 'REQUIRE_MANAGER' | 'WARN_AUDIT';
  targetEntity?: string;
  status?: 'ACTIVE' | 'PAUSED';
}

export interface PolicyEvaluationInput {
  amount: number;
  departmentId?: string;
  departmentName?: string;
  categoryId?: string;
  category?: string;
  vendor?: string;
}

export interface PolicyEvaluationResult {
  verdict: 'CLEARED' | 'BLOCKED' | 'FLAGGED';
  riskLevel: RiskLevel;
  triggeredRule?: PolicyRuleDTO;
  ruleTriggered?: string;
  actionRequired?: 'AUTO_BLOCK' | 'REQUIRE_CFO_OVERRIDE' | 'REQUIRE_MANAGER' | 'WARN_AUDIT';
  latencyMs: number;
  explanation: string;
  postCommitmentUtil?: number;
}

export class PoliciesService {
  private mapRowToDTO(row: any): PolicyRuleDTO {
    const isCurrency = row.threshold_value_cents >= 1000;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      conditionExpression: row.condition_expression,
      thresholdValue: isCurrency ? row.threshold_value_cents / 100 : row.threshold_value_cents,
      actionRequired: row.action_required,
      targetEntity: row.target_entity,
      status: row.status,
      latencyMs: row.latency_ms,
    };
  }

  public getAllPolicies(statusFilter?: string): PolicyRuleDTO[] {
    const db = getDb();
    let query = 'SELECT * FROM policy_rules';
    const params: any[] = [];

    if (statusFilter && (statusFilter === 'ACTIVE' || statusFilter === 'PAUSED')) {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }

    query += ' ORDER BY created_at ASC, id ASC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.mapRowToDTO(r));
  }

  public getPolicyById(id: string): PolicyRuleDTO {
    const db = getDb();
    const row = db.prepare('SELECT * FROM policy_rules WHERE id = ?').get(id) as any;
    if (!row) {
      throw new AppError(`Policy rule '${id}' not found`, 404, 'POLICY_NOT_FOUND');
    }
    return this.mapRowToDTO(row);
  }

  public createPolicy(dto: CreatePolicyDTO, actorName: string = 'Victoria Sterling', actorRole: UserRole = 'CFO'): PolicyRuleDTO {
    if (!dto.name || !dto.name.trim()) {
      throw new AppError('Policy rule name is required', 400, 'INVALID_NAME');
    }
    if (dto.thresholdValue < 0) {
      throw new AppError('Threshold value cannot be negative', 400, 'INVALID_THRESHOLD');
    }

    const randNum = Math.floor(Math.random() * 899 + 100);
    const code = dto.code && dto.code.trim() ? dto.code.trim() : `POL-2026-ENF-${randNum}`;
    const id = `pol-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const latencyMs = Math.floor(Math.random() * 6 + 11);

    const isCurrency =
      dto.conditionExpression.includes('$') ||
      dto.conditionExpression.toLowerCase().includes('amount') ||
      dto.thresholdValue >= 1000;
    const thresholdValueCents = isCurrency
      ? Math.round(dto.thresholdValue * 100)
      : Math.round(dto.thresholdValue);

    return runTransaction((db) => {
      // Check unique code
      const existing = db.prepare('SELECT id FROM policy_rules WHERE code = ?').get(code);
      if (existing) {
        throw new AppError(`Policy rule code '${code}' already exists`, 409, 'CODE_EXISTS');
      }

      db.prepare(`
        INSERT INTO policy_rules (
          id, code, name, condition_expression, threshold_value_cents,
          action_required, target_entity, status, latency_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        code,
        dto.name.trim(),
        dto.conditionExpression,
        thresholdValueCents,
        dto.actionRequired,
        dto.targetEntity || 'Department',
        dto.status || 'ACTIVE',
        latencyMs
      );

      // Append immutable audit log
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'POLICY_RULE_CREATED',
        entity: 'Policy Engine',
        entityId: code,
        oldValue: 'STATUS: UNREGISTERED',
        newValue: `STATUS: ${dto.status || 'ACTIVE'}`,
        reason: `New spend enforcement gate instantiated: ${dto.name}`,
      });

      const created = db.prepare('SELECT * FROM policy_rules WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(created);
    });
  }

  public togglePolicy(id: string, actorName: string = 'Victoria Sterling', actorRole: UserRole = 'CFO'): PolicyRuleDTO {
    return runTransaction((db) => {
      const existing = db.prepare('SELECT * FROM policy_rules WHERE id = ?').get(id) as any;
      if (!existing) {
        throw new AppError(`Policy rule '${id}' not found`, 404, 'POLICY_NOT_FOUND');
      }

      const nextStatus = existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

      db.prepare('UPDATE policy_rules SET status = ? WHERE id = ?').run(nextStatus, id);

      // Append audit log
      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'POLICY_STATUS_TOGGLED',
        entity: 'Policy Engine',
        entityId: existing.code,
        oldValue: `STATUS: ${existing.status}`,
        newValue: `STATUS: ${nextStatus}`,
        reason: `Administrator toggled policy state for ${existing.name}`,
      });

      const updated = db.prepare('SELECT * FROM policy_rules WHERE id = ?').get(id) as any;
      return this.mapRowToDTO(updated);
    });
  }

  public evaluatePolicies(input: PolicyEvaluationInput): PolicyEvaluationResult {
    const startTime = Date.now();
    const db = getDb();
    const amount = input.amount || 0;
    const amountCents = Math.round(amount * 100);

    // 1. Fetch budget if departmentId is provided
    let postUtil = 0;
    let isHardCapBreach = false;
    let isWarningBreach = false;

    if (input.departmentId) {
      const budget = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
        input.departmentId,
        input.departmentId
      ) as any;

      if (budget) {
        const inFlightAfterCents = budget.actual_settled_cents + budget.committed_cents + amountCents;
        postUtil = budget.allocated_cents > 0 ? (inFlightAfterCents / budget.allocated_cents) * 100 : 0;
        isHardCapBreach = postUtil > budget.hard_cap_threshold_pct || inFlightAfterCents > budget.allocated_cents;
        isWarningBreach = postUtil >= budget.warning_threshold_pct;
      }
    }

    // 2. Fetch all ACTIVE policies
    const activePolicies = (db.prepare("SELECT * FROM policy_rules WHERE status = 'ACTIVE' ORDER BY threshold_value_cents DESC").all() as any[]).map((r) =>
      this.mapRowToDTO(r)
    );

    // 3. Precedence Check: Hard Ceiling Auto-Lockdown
    if (isHardCapBreach) {
      const ceilingRule = activePolicies.find((r) => r.actionRequired === 'AUTO_BLOCK' || r.code === 'RULE-ENG-08');
      const ruleCode = ceilingRule ? ceilingRule.code : 'RULE-ENG-08';
      const ruleName = ceilingRule ? ceilingRule.name : 'Hard Ceiling Auto-Lockdown';
      return {
        verdict: 'BLOCKED',
        riskLevel: 'CRITICAL_BREACH',
        triggeredRule: ceilingRule,
        ruleTriggered: `${ruleCode} (${ruleName})`,
        actionRequired: 'AUTO_BLOCK',
        latencyMs: Math.max(1, Date.now() - startTime),
        explanation: `Automated zero-tolerance enforcement: ${ruleName}. Requisition causes commitment to breach authorized ceiling (${postUtil.toFixed(1)}%). Requires Group CFO Sovereign Override.`,
        postCommitmentUtil: parseFloat(postUtil.toFixed(1)),
      };
    }

    // 4. Check matching active rules by threshold
    // First, check if any active AUTO_BLOCK rule matches
    const autoBlockMatch = activePolicies.find((r) => {
      if (r.actionRequired !== 'AUTO_BLOCK') return false;
      const isUtilRule = r.conditionExpression.includes('%') || r.conditionExpression.toLowerCase().includes('utilization');
      if (isUtilRule) {
        return postUtil > r.thresholdValue;
      }
      return amount >= r.thresholdValue;
    });

    if (autoBlockMatch) {
      return {
        verdict: 'BLOCKED',
        riskLevel: 'CRITICAL_BREACH',
        triggeredRule: autoBlockMatch,
        ruleTriggered: `${autoBlockMatch.code} (${autoBlockMatch.name})`,
        actionRequired: 'AUTO_BLOCK',
        latencyMs: Math.max(1, Date.now() - startTime),
        explanation: `Automated zero-tolerance enforcement: ${autoBlockMatch.name}. Amount $${amount.toLocaleString('en-US')} breaches statutory threshold of $${autoBlockMatch.thresholdValue.toLocaleString('en-US')}.`,
        postCommitmentUtil: postUtil > 0 ? parseFloat(postUtil.toFixed(1)) : undefined,
      };
    }

    // Second, check multi-sig / supervisor approval rules (e.g. RULE-ENG-05 with threshold $50k)
    const approvalMatch = activePolicies.find((r) => {
      if (r.actionRequired !== 'REQUIRE_CFO_OVERRIDE' && r.actionRequired !== 'REQUIRE_MANAGER') {
        return false;
      }
      if (amount < r.thresholdValue) {
        return false;
      }
      // If rule condition explicitly checks for a specific category (e.g. Travel)
      if (r.conditionExpression.toLowerCase().includes('category') && input.category) {
        const condUpper = r.conditionExpression.toUpperCase();
        if (condUpper.includes('TRAVEL') && !input.category.toUpperCase().includes('TRAVEL')) {
          return false;
        }
      }
      return true;
    });

    if (approvalMatch) {
      return {
        verdict: 'FLAGGED',
        riskLevel: amount >= 100000 ? 'HIGH_RISK' : 'ATTENTION',
        triggeredRule: approvalMatch,
        ruleTriggered: `${approvalMatch.code} (${approvalMatch.name})`,
        actionRequired: approvalMatch.actionRequired,
        latencyMs: Math.max(1, Date.now() - startTime),
        explanation: `Conditional gate triggered: ${approvalMatch.name}. Requires elevated signature (${approvalMatch.actionRequired.replace(/_/g, ' ')}).`,
        postCommitmentUtil: postUtil > 0 ? parseFloat(postUtil.toFixed(1)) : undefined,
      };
    }

    // Third, check warning audit rule or departmental warning horizon
    if (isWarningBreach) {
      const warnRule = activePolicies.find((r) => r.actionRequired === 'WARN_AUDIT');
      return {
        verdict: 'FLAGGED',
        riskLevel: 'HIGH_RISK',
        triggeredRule: warnRule,
        ruleTriggered: warnRule ? `${warnRule.code} (${warnRule.name})` : 'RULE-WARN-02 (Variance Threshold)',
        actionRequired: 'WARN_AUDIT',
        latencyMs: Math.max(1, Date.now() - startTime),
        explanation: `Requisition approaches warning horizon (${postUtil.toFixed(1)}%). Requires management review and variance disclosure.`,
        postCommitmentUtil: parseFloat(postUtil.toFixed(1)),
      };
    }

    // Default: Safe pre-clearance
    return {
      verdict: 'CLEARED',
      riskLevel: 'HEALTHY',
      ruleTriggered: 'RULE-ENG-01 (Pre-Cleared Nominal)',
      latencyMs: Math.max(1, Date.now() - startTime),
      explanation: `Transaction of $${amount.toLocaleString('en-US')} safely clears all active operational policy thresholds with zero exceptions.`,
      postCommitmentUtil: postUtil > 0 ? parseFloat(postUtil.toFixed(1)) : undefined,
    };
  }
}

export const policiesService = new PoliciesService();
