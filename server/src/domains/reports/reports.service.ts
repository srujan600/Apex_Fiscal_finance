import { getDb } from '../../db/connection';

export interface DepartmentVarianceDTO {
  id: string;
  code: string;
  name: string;
  manager: string;
  allocated: number;
  spent: number;
  committed: number;
  totalLiability: number;
  variance: number;
  variancePct: number;
  utilPct: number;
  status: 'APPROVED' | 'WARNING' | 'CRITICAL' | 'BLOCKED';
}

export interface CategoryVarianceDTO {
  id: string;
  code: string;
  name: string;
  allocated: number;
  spent: number;
  committed: number;
  totalLiability: number;
  variance: number;
  utilPct: number;
  thresholdPct: number;
  riskLevel: string;
}

export interface VarianceReportDTO {
  period: string;
  totalAllocated: number;
  totalSettled: number;
  totalCommitted: number;
  totalRunRate: number;
  totalVariance: number;
  departments: DepartmentVarianceDTO[];
  categories: CategoryVarianceDTO[];
}

export class ReportsService {
  public getVarianceReport(period: string = 'Q3'): VarianceReportDTO {
    const db = getDb();
    const budgets = db.prepare('SELECT * FROM budgets ORDER BY utilization_rate DESC').all() as any[];
    const categories = db.prepare('SELECT * FROM categories ORDER BY allocated_cents DESC').all() as any[];

    let totalAllocated = 0;
    let totalSettled = 0;
    let totalCommitted = 0;

    const departmentRows: DepartmentVarianceDTO[] = budgets.map((b) => {
      const allocated = b.allocated_cents / 100;
      const spent = b.actual_settled_cents / 100;
      const committed = b.committed_cents / 100;
      const totalLiability = spent + committed;
      const variance = totalLiability - allocated;
      const variancePct = allocated > 0 ? (variance / allocated) * 100 : 0;
      const utilPct = allocated > 0 ? (totalLiability / allocated) * 100 : 0;

      totalAllocated += allocated;
      totalSettled += spent;
      totalCommitted += committed;

      let status: 'APPROVED' | 'WARNING' | 'CRITICAL' | 'BLOCKED' = 'APPROVED';
      if (utilPct > 100) status = 'BLOCKED';
      else if (utilPct > 90) status = 'CRITICAL';
      else if (utilPct > 80) status = 'WARNING';

      return {
        id: b.department_id,
        code: b.code,
        name: b.department_name,
        manager: b.lead_manager,
        allocated,
        spent,
        committed,
        totalLiability,
        variance,
        variancePct: parseFloat(variancePct.toFixed(2)),
        utilPct: parseFloat(utilPct.toFixed(1)),
        status,
      };
    });

    const categoryRows: CategoryVarianceDTO[] = categories.map((c) => {
      const allocated = c.allocated_cents / 100;
      const spent = c.spent_cents / 100;
      const committed = c.committed_cents / 100;
      const totalLiability = spent + committed;
      const variance = totalLiability - allocated;
      const utilPct = allocated > 0 ? (totalLiability / allocated) * 100 : 0;

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        allocated,
        spent,
        committed,
        totalLiability,
        variance,
        utilPct: parseFloat(utilPct.toFixed(1)),
        thresholdPct: c.threshold_percent,
        riskLevel: c.risk_level,
      };
    });

    const totalRunRate = totalSettled + totalCommitted;
    const totalVariance = totalRunRate - totalAllocated;

    return {
      period,
      totalAllocated,
      totalSettled,
      totalCommitted,
      totalRunRate,
      totalVariance,
      departments: departmentRows,
      categories: categoryRows,
    };
  }

  public exportCsv(type: 'variance' | 'spending' | 'audit' | 'budgets', period: string = 'Q3'): string {
    const db = getDb();

    if (type === 'spending') {
      const rows = db.prepare('SELECT * FROM spending_requests ORDER BY created_at DESC').all() as any[];
      const headers = ['Tracking #', 'Submitted At', 'Department', 'Category', 'Vendor', 'Amount ($)', 'Status', 'Risk Level', 'Purpose'];
      const dataLines = rows.map((r) => [
        r.tracking_number,
        `"${r.submitted_at}"`,
        `"${r.department_name}"`,
        `"${r.category}"`,
        `"${r.vendor}"`,
        (r.amount_cents / 100).toFixed(2),
        r.status,
        r.risk_level,
        `"${(r.business_purpose || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...dataLines.map((line) => line.join(','))].join('\n');
    }

    if (type === 'audit') {
      const rows = db.prepare('SELECT * FROM audit_events ORDER BY block_number DESC').all() as any[];
      const headers = ['Block #', 'Tx Hash', 'Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Entity ID', 'Old Value', 'New Value', 'Reason'];
      const dataLines = rows.map((r) => [
        r.block_number,
        r.tx_hash,
        `"${r.timestamp}"`,
        `"${r.actor}"`,
        r.actor_role,
        r.action,
        `"${r.entity}"`,
        `"${r.entity_id}"`,
        `"${(r.old_value || '').replace(/"/g, '""')}"`,
        `"${(r.new_value || '').replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...dataLines.map((line) => line.join(','))].join('\n');
    }

    if (type === 'budgets') {
      const rows = db.prepare('SELECT * FROM budgets ORDER BY id ASC').all() as any[];
      const headers = ['Code', 'Department', 'Fiscal Period', 'Allocated ($)', 'Settled ($)', 'Committed ($)', 'Available ($)', 'Util %', 'Risk Level'];
      const dataLines = rows.map((b) => [
        b.code,
        `"${b.department_name}"`,
        b.fiscal_period,
        (b.allocated_cents / 100).toFixed(2),
        (b.actual_settled_cents / 100).toFixed(2),
        (b.committed_cents / 100).toFixed(2),
        (b.available_cents / 100).toFixed(2),
        b.utilization_rate,
        b.risk_level,
      ]);
      return [headers.join(','), ...dataLines.map((line) => line.join(','))].join('\n');
    }

    // Default: Variance Report
    const varianceData = this.getVarianceReport(period);
    const headers = ['Cost Center', 'Department', 'Manager', 'Allocated ($)', 'Spent ($)', 'Committed ($)', 'Total Run-Rate ($)', 'Variance ($)', 'Variance %', 'Status'];
    const dataLines = varianceData.departments.map((d) => [
      d.code,
      `"${d.name}"`,
      `"${d.manager}"`,
      d.allocated.toFixed(2),
      d.spent.toFixed(2),
      d.committed.toFixed(2),
      d.totalLiability.toFixed(2),
      d.variance.toFixed(2),
      `${d.variancePct}%`,
      d.status,
    ]);
    return [headers.join(','), ...dataLines.map((line) => line.join(','))].join('\n');
  }
}

export const reportsService = new ReportsService();
