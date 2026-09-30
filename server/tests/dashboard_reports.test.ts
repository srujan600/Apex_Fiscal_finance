import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { dashboardService } from '../src/domains/dashboard/dashboard.service';
import { reportsService } from '../src/domains/reports/reports.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 9 Dashboard & Reporting Data Aggregation Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Dashboard Consolidated Summary
  await t.test('Dashboard: aggregates corporate ceilings, commitments, and active emergency freeze state', () => {
    const summary = dashboardService.getDashboardSummary();

    assert.strictEqual(summary.totalAllocated, 48500000, '$48,500,000 total allocated ceiling');
    assert.strictEqual(summary.totalSettled, 32700000, '$32,700,000 settled spend');
    assert.strictEqual(summary.totalCommitted, 7293500, '$7,293,500 committed in flight');
    assert.strictEqual(summary.totalAvailable, 8506500, '$8,506,500 available headroom');
    assert.ok(summary.overallUtilizationRate > 80, 'Utilization rate should be ~82.5%');

    assert.strictEqual(summary.isEmergencyFreezeActive, false, 'Initial freeze state is inactive');
    assert.strictEqual(summary.activeEpoch.period, 'Q3-2025');
    assert.strictEqual(summary.activeEpoch.dayOfEpoch, 68);

    assert.ok(summary.pendingApprovalsCount >= 1, 'Has pending approvals');
    assert.ok(summary.activeExceptionsCount >= 4, 'Has active exceptions');
  });

  // 2. Continuous Spend Trajectory Series
  await t.test('Dashboard: returns 12-month trajectory line points for chart visualization', () => {
    const trajectory = dashboardService.getSpendTrajectory();
    assert.strictEqual(trajectory.length, 12, '12 months Jan through Dec');

    const aug = trajectory.find((p) => p.month === 'Aug');
    assert.ok(aug);
    assert.strictEqual(aug.isForecast, false);
    assert.strictEqual(aug.actual, 36400000);

    const sep = trajectory.find((p) => p.month === 'Sep');
    assert.ok(sep);
    assert.strictEqual(sep.isForecast, true);
    assert.strictEqual(sep.ceiling, 48500000);
  });

  // 3. Department Variance Reporting
  await t.test('Reports: generates department variance table with GAAS/SOX metrics', () => {
    const report = reportsService.getVarianceReport('Q3');

    assert.strictEqual(report.period, 'Q3');
    assert.strictEqual(report.totalAllocated, 48500000);
    assert.strictEqual(report.departments.length, 4, '4 seeded departments');

    // Engineering check
    const eng = report.departments.find((d) => d.code === 'BGT-2025-ENG');
    assert.ok(eng);
    assert.strictEqual(eng.allocated, 15000000);
    assert.strictEqual(eng.spent, 11700000);
    assert.strictEqual(eng.committed, 2430000);
    assert.strictEqual(eng.totalLiability, 14130000);
    assert.strictEqual(eng.utilPct, 94.2);
    assert.strictEqual(eng.status, 'CRITICAL');
  });

  // 4. Category Variance Reporting
  await t.test('Reports: generates category sub-cap variance breakdown', () => {
    const report = reportsService.getVarianceReport('Q3');

    assert.strictEqual(report.categories.length, 5, '5 seeded spend categories');

    const cloud = report.categories.find((c) => c.code === 'CAT-CLOUD-01');
    assert.ok(cloud);
    assert.strictEqual(cloud.allocated, 18500000);
    assert.strictEqual(cloud.spent, 14200000);
    assert.strictEqual(cloud.riskLevel, 'HIGH_RISK');
  });

  // 5. Verifiable CSV Export Streaming
  await t.test('Reports: streams formatted CSV exports for variance, spending, audit, and budgets', () => {
    // 5a. Variance CSV
    const varianceCsv = reportsService.exportCsv('variance', 'Q3');
    assert.ok(varianceCsv.startsWith('Cost Center,Department,Manager'));
    assert.ok(varianceCsv.includes('BGT-2025-ENG'));
    assert.ok(varianceCsv.includes('15000000.00'));

    // 5b. Spending Requests CSV
    const spendingCsv = reportsService.exportCsv('spending');
    assert.ok(spendingCsv.startsWith('Tracking #,Submitted At,Department'));
    assert.ok(spendingCsv.includes('REQ-9418'));
    assert.ok(spendingCsv.includes('OpenAI API Compute Expansion') || spendingCsv.includes('Cloud Infra'));

    // 5c. Cryptographic Audit Trail CSV
    const auditCsv = reportsService.exportCsv('audit');
    assert.ok(auditCsv.startsWith('Block #,Tx Hash,Timestamp,Actor'));
    assert.ok(auditCsv.includes('8941204'));
    assert.ok(auditCsv.includes('Victoria Sterling'));

    // 5d. Budget Envelopes CSV
    const budgetsCsv = reportsService.exportCsv('budgets');
    assert.ok(budgetsCsv.startsWith('Code,Department,Fiscal Period'));
    assert.ok(budgetsCsv.includes('BGT-2025-CLD'));
    assert.ok(budgetsCsv.includes('14000000.00'));
  });
});
