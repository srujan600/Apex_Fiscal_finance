import { getDb } from '../../db/connection';

export interface DashboardSummaryDTO {
  totalAllocated: number;
  totalSettled: number;
  totalCommitted: number;
  totalAvailable: number;
  totalRunRate: number;
  overallUtilizationRate: number;
  pendingApprovalsCount: number;
  pendingApprovalsAmount: number;
  activeExceptionsCount: number;
  activeExceptionsAmount: number;
  isEmergencyFreezeActive: boolean;
  activeEpoch: {
    period: string;
    dayOfEpoch: number;
    totalDays: number;
  };
  auditBlockHeight: number;
}

export interface SpendTrajectoryPoint {
  month: string;
  actual?: number;
  committed?: number;
  projected: number;
  ceiling: number;
  isForecast: boolean;
}

export class DashboardService {
  public getDashboardSummary(): DashboardSummaryDTO {
    const db = getDb();

    // 1. Budget Envelope Aggregates
    const bgtRow = db.prepare(`
      SELECT 
        COALESCE(SUM(allocated_cents), 0) as total_allocated,
        COALESCE(SUM(actual_settled_cents), 0) as total_settled,
        COALESCE(SUM(committed_cents), 0) as total_committed,
        COALESCE(SUM(available_cents), 0) as total_available
      FROM budgets
    `).get() as any;

    const totalAllocated = (bgtRow?.total_allocated || 0) / 100;
    const totalSettled = (bgtRow?.total_settled || 0) / 100;
    const totalCommitted = (bgtRow?.total_committed || 0) / 100;
    const totalAvailable = (bgtRow?.total_available || 0) / 100;
    const totalRunRate = totalSettled + totalCommitted;
    const overallUtilizationRate = totalAllocated > 0 ? (totalRunRate / totalAllocated) * 100 : 0;

    // 2. Pending Approvals
    const pendingRow = db.prepare(`
      SELECT 
        COUNT(*) as cnt,
        COALESCE(SUM(amount_cents), 0) as total_amount
      FROM spending_requests
      WHERE status = 'PENDING_APPROVAL'
    `).get() as any;

    // 3. Active Exceptions
    const exRow = db.prepare(`
      SELECT 
        COUNT(*) as cnt,
        COALESCE(SUM(commitment_value_cents), 0) as total_amount
      FROM exception_incidents
      WHERE status = 'PENDING_DECISION'
    `).get() as any;

    // 4. System Settings (Emergency Freeze)
    const settings = db.prepare('SELECT is_emergency_freeze_active FROM system_settings WHERE id = ?').get('global') as any;
    const isEmergencyFreezeActive = Boolean(settings?.is_emergency_freeze_active);

    // 5. Latest Audit Block
    const auditRow = db.prepare('SELECT COALESCE(MAX(block_number), 8941204) as max_block FROM audit_events').get() as any;

    return {
      totalAllocated,
      totalSettled,
      totalCommitted,
      totalAvailable,
      totalRunRate,
      overallUtilizationRate: parseFloat(overallUtilizationRate.toFixed(1)),
      pendingApprovalsCount: pendingRow?.cnt || 0,
      pendingApprovalsAmount: (pendingRow?.total_amount || 0) / 100,
      activeExceptionsCount: exRow?.cnt || 0,
      activeExceptionsAmount: (exRow?.total_amount || 0) / 100,
      isEmergencyFreezeActive,
      activeEpoch: {
        period: 'Q3-2025',
        dayOfEpoch: 68,
        totalDays: 92,
      },
      auditBlockHeight: auditRow?.max_block || 8941204,
    };
  }

  public getSpendTrajectory(): SpendTrajectoryPoint[] {
    const summary = this.getDashboardSummary();
    const ceiling = summary.totalAllocated || 48500000;

    return [
      { month: 'Jan', actual: 3800000, committed: 3800000, projected: 3800000, ceiling, isForecast: false },
      { month: 'Feb', actual: 7900000, committed: 7900000, projected: 7900000, ceiling, isForecast: false },
      { month: 'Mar', actual: 12200000, committed: 12200000, projected: 12200000, ceiling, isForecast: false },
      { month: 'Apr', actual: 16500000, committed: 16500000, projected: 16500000, ceiling, isForecast: false },
      { month: 'May', actual: 21100000, committed: 21100000, projected: 21100000, ceiling, isForecast: false },
      { month: 'Jun', actual: 25900000, committed: 25900000, projected: 25900000, ceiling, isForecast: false },
      { month: 'Jul', actual: 31200000, committed: 32100000, projected: 31200000, ceiling, isForecast: false },
      { month: 'Aug', actual: 36400000, committed: 37800000, projected: 36400000, ceiling, isForecast: false },
      { month: 'Sep', committed: 41900000, projected: 42350000, ceiling, isForecast: true },
      { month: 'Oct', committed: 44200000, projected: 46100000, ceiling, isForecast: true },
      { month: 'Nov', committed: 46800000, projected: 49200000, ceiling, isForecast: true },
      { month: 'Dec', committed: 48100000, projected: 52400000, ceiling, isForecast: true },
    ];
  }
}

export const dashboardService = new DashboardService();
