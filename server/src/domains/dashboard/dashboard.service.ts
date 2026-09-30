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

  public getSpendingTrends(): {
    trajectory: SpendTrajectoryPoint[];
    monthlyBreakdown: {
      month: string;
      totalSpend: number;
      byCategory: Record<string, number>;
      momGrowthPct: number;
    }[];
  } {
    const trajectory = this.getSpendTrajectory();
    const monthlyBreakdown = [
      {
        month: 'Jan',
        totalSpend: 3800000,
        byCategory: { 'Cloud Infrastructure': 1800000, 'AI Clusters': 900000, 'Software Licenses': 600000, Travel: 300000, Hardware: 200000 },
        momGrowthPct: 0,
      },
      {
        month: 'Feb',
        totalSpend: 4100000,
        byCategory: { 'Cloud Infrastructure': 1950000, 'AI Clusters': 1050000, 'Software Licenses': 600000, Travel: 320000, Hardware: 180000 },
        momGrowthPct: 7.9,
      },
      {
        month: 'Mar',
        totalSpend: 4300000,
        byCategory: { 'Cloud Infrastructure': 2050000, 'AI Clusters': 1150000, 'Software Licenses': 600000, Travel: 310000, Hardware: 190000 },
        momGrowthPct: 4.9,
      },
      {
        month: 'Apr',
        totalSpend: 4300000,
        byCategory: { 'Cloud Infrastructure': 2000000, 'AI Clusters': 1200000, 'Software Licenses': 610000, Travel: 300000, Hardware: 190000 },
        momGrowthPct: 0,
      },
      {
        month: 'May',
        totalSpend: 4600000,
        byCategory: { 'Cloud Infrastructure': 2100000, 'AI Clusters': 1350000, 'Software Licenses': 620000, Travel: 330000, Hardware: 200000 },
        momGrowthPct: 7.0,
      },
      {
        month: 'Jun',
        totalSpend: 4800000,
        byCategory: { 'Cloud Infrastructure': 2200000, 'AI Clusters': 1450000, 'Software Licenses': 630000, Travel: 310000, Hardware: 210000 },
        momGrowthPct: 4.3,
      },
      {
        month: 'Jul',
        totalSpend: 5300000,
        byCategory: { 'Cloud Infrastructure': 2400000, 'AI Clusters': 1750000, 'Software Licenses': 640000, Travel: 320000, Hardware: 190000 },
        momGrowthPct: 10.4,
      },
      {
        month: 'Aug',
        totalSpend: 5200000,
        byCategory: { 'Cloud Infrastructure': 2350000, 'AI Clusters': 1700000, 'Software Licenses': 650000, Travel: 310000, Hardware: 190000 },
        momGrowthPct: -1.9,
      },
    ];

    return {
      trajectory,
      monthlyBreakdown,
    };
  }

  public getRiskMatrix(): {
    overallRiskLevel: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    departments: {
      id: string;
      code: string;
      name: string;
      allocated: number;
      settled: number;
      committed: number;
      available: number;
      utilizationRate: number;
      riskLevel: string;
      daysToDepletion: number;
      projectedOverrun: number;
    }[];
  } {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM budgets ORDER BY utilization_rate DESC').all() as any[];

    let criticalCount = 0;
    let warningCount = 0;
    let healthyCount = 0;

    const departments = rows.map((b) => {
      const allocated = b.allocated_cents / 100;
      const settled = b.actual_settled_cents / 100;
      const committed = b.committed_cents / 100;
      const available = b.available_cents / 100;
      const utilizationRate = b.utilization_rate;
      const riskLevel = b.risk_level;

      if (riskLevel === 'CRITICAL_BREACH') criticalCount++;
      else if (riskLevel === 'HIGH_RISK') warningCount++;
      else healthyCount++;

      return {
        id: b.department_id,
        code: b.code,
        name: b.department_name,
        allocated,
        settled,
        committed,
        available,
        utilizationRate,
        riskLevel,
        daysToDepletion: b.days_to_run_out || 30,
        projectedOverrun: (b.projected_overrun_cents || 0) / 100,
      };
    });

    const overallRiskLevel = criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'HEALTHY';

    return {
      overallRiskLevel,
      criticalCount,
      warningCount,
      healthyCount,
      departments,
    };
  }
}

export const dashboardService = new DashboardService();

