import assert from 'node:assert';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { budgetsService } from '../src/domains/budgets/budgets.service';
import { getDb, closeDb } from '../src/db/connection';
import { AppError } from '../src/middleware/errorHandler';

test('Phase 3 Deterministic Budget Engine Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Deterministic Calculation Unit Test
  await t.test('Calculations: exact integer headroom and risk level verification', () => {
    // Case A: Healthy utilization (60%)
    const resA = budgetsService.calculateMetrics(100000000, 40000000, 20000000);
    assert.strictEqual(resA.availableCents, 40000000, '$1M - $600k = $400k available');
    assert.strictEqual(resA.utilizationRate, 60.0);
    assert.strictEqual(resA.riskLevel, 'HEALTHY');

    // Case B: Attention threshold (88.7%)
    const resB = budgetsService.calculateMetrics(800000000, 520000000, 189600000);
    assert.strictEqual(resB.availableCents, 90400000, '$8M - ($5.2M + $1.896M) = $904k');
    assert.strictEqual(resB.utilizationRate, 88.7);
    assert.strictEqual(resB.riskLevel, 'ATTENTION');

    // Case C: Critical breach (>=100% or depleted buffer)
    const resC = budgetsService.calculateMetrics(1500000000, 1170000000, 340000000);
    assert.strictEqual(resC.availableCents, 0);
    assert.strictEqual(resC.utilizationRate, 100.7);
    assert.strictEqual(resC.riskLevel, 'CRITICAL_BREACH');
    assert.strictEqual(resC.overrunCents, 10000000, 'Overrun must be $100k');
  });

  // 2. Budget Envelopes Query & Formatting
  await t.test('Budgets: retrieves seeded envelopes with calculated headroom in dollars', () => {
    const budgets = budgetsService.getAllBudgets();
    assert.strictEqual(budgets.length, 4, 'Must return 4 seeded department budgets');

    const eng = budgets.find((b) => b.id === 'bgt-eng');
    assert.ok(eng);
    assert.strictEqual(eng.allocated, 15000000);
    assert.strictEqual(eng.actualSettled, 11700000);
    assert.strictEqual(eng.committed, 2430000);
    assert.strictEqual(eng.available, 870000);
    assert.strictEqual(eng.utilizationRate, 94.2);
    assert.strictEqual(eng.riskLevel, 'CRITICAL_BREACH');
  });

  // 3. Create Budget Envelope
  await t.test('Budgets: creates new envelope, validates positive amount, and logs audit trail', () => {
    const created = budgetsService.createBudget(
      {
        departmentName: 'Data & AI Research',
        allocated: 6500000,
        fiscalPeriod: 'Q4-2025',
        leadManager: 'Dr. Evelyn Cross',
        warningThresholdPct: 80,
        hardCapThresholdPct: 95,
      },
      'Victoria Sterling',
      'CFO'
    );

    assert.ok(created.id);
    assert.strictEqual(created.allocated, 6500000);
    assert.strictEqual(created.available, 6500000, 'Initial available headroom must equal allocation');
    assert.strictEqual(created.utilizationRate, 0);
    assert.strictEqual(created.riskLevel, 'HEALTHY');

    // Verify audit event
    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'BUDGET_ENVELOPE_CREATED' ORDER BY block_number DESC LIMIT 1")
      .get() as any;
    assert.ok(audit);
    assert.strictEqual(audit.actor, 'Victoria Sterling');
    assert.ok(audit.new_value.includes('$6,500,000'));
  });

  // 4. Update Budget Allocation with Validation
  await t.test('Budgets: updates allocation, recalculates available headroom, blocks reduction below commitments', () => {
    // Engineering currently has 11.7M settled + 2.43M committed = 14.13M committed
    assert.throws(() => {
      budgetsService.updateBudget(
        'bgt-eng',
        { allocated: 12000000, justification: 'Attempting invalid budget reduction' },
        'Sarah Jenkins',
        'DEPT_MANAGER'
      );
    }, /Cannot reduce allocation below existing settled and committed/);

    // Increase allocation to 18M
    const updated = budgetsService.updateBudget(
      'bgt-eng',
      { allocated: 18000000, justification: 'Board-approved expansion for AI infrastructure' },
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(updated.allocated, 18000000);
    assert.strictEqual(updated.available, 3870000, '$18M - $14.13M = $3.87M available');
    assert.strictEqual(updated.riskLevel, 'HEALTHY', 'New headroom transitions envelope back to HEALTHY');
  });

  // 5. Cross-Department Rebalance with Concurrency Protection
  await t.test('Budgets: atomic rebalance transfers capital between cost centers safely', () => {
    // Cloud Ops (bgt-cld) has 14M allocated, 9.8M settled, 1.596M committed -> 2.604M available
    // Transfer 1,000,000 from Cloud Ops to Sales Ops (bgt-sls)
    const result = budgetsService.reallocateBudget(
      {
        sourceId: 'bgt-cld',
        targetId: 'bgt-sls',
        amount: 1000000,
        reason: 'Q3 sales quota surge reallocation',
      },
      'Marcus Vance',
      'FINANCE_ADMIN'
    );

    assert.strictEqual(result.source.allocated, 13000000, 'Cloud Ops allocated reduced by 1M');
    assert.strictEqual(result.source.available, 1604000, 'Cloud Ops available reduced by 1M');

    assert.strictEqual(result.target.allocated, 12500000, 'Sales Ops allocated increased by 1M');
    assert.strictEqual(result.target.available, 5128500, 'Sales Ops available increased by 1M');

    // Attempting to transfer more than available headroom must throw error
    assert.throws(() => {
      budgetsService.reallocateBudget(
        {
          sourceId: 'bgt-cld',
          targetId: 'bgt-sls',
          amount: 5000000, // exceeds 1.604M available
        },
        'Marcus Vance',
        'FINANCE_ADMIN'
      );
    }, /Insufficient available headroom/);
  });

  // 6. HTTP API Endpoints & RBAC Security Gate
  await t.test('Budgets API: verifies REST endpoints and RBAC permission enforcement', async () => {
    const { createApp } = await import('../src/app');
    const app = createApp();

    let server: any;
    let baseUrl = '';

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    try {
      // 1. GET /api/budgets
      const listRes = await fetch(`${baseUrl}/api/budgets`);
      assert.strictEqual(listRes.status, 200);
      const listData: any = await listRes.json();
      assert.strictEqual(listData.success, true);
      assert.ok(Array.isArray(listData.data));
      assert.ok(listData.data.length >= 4);

      // 2. GET /api/budgets/:id
      const detailRes = await fetch(`${baseUrl}/api/budgets/bgt-eng`);
      assert.strictEqual(detailRes.status, 200);
      const detailData: any = await detailRes.json();
      assert.strictEqual(detailData.data.id, 'bgt-eng');
      assert.strictEqual(detailData.data.code, 'BGT-2025-ENG');

      // 3. RBAC Gate: EMPLOYEE cannot modify budget allocation (403)
      const empPatchRes = await fetch(`${baseUrl}/api/budgets/bgt-eng`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'EMPLOYEE',
        },
        body: JSON.stringify({
          allocated: 20000000,
          justification: 'Unauthorized budget expansion',
        }),
      });
      assert.strictEqual(empPatchRes.status, 403, 'EMPLOYEE must be blocked from modifying budgets');

      // 4. RBAC Gate: FINANCE_ADMIN can update budget allocation (200)
      const adminPatchRes = await fetch(`${baseUrl}/api/budgets/bgt-eng`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'FINANCE_ADMIN',
        },
        body: JSON.stringify({
          allocated: 19000000,
          justification: 'Quarterly supplemental capital release',
        }),
      });
      assert.strictEqual(adminPatchRes.status, 200);
      const adminPatchData: any = await adminPatchRes.json();
      assert.strictEqual(adminPatchData.data.allocated, 19000000);

      // 5. POST /api/budgets/rebalance (Alias endpoint test)
      const rebalanceRes = await fetch(`${baseUrl}/api/budgets/rebalance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'FINANCE_ADMIN',
        },
        body: JSON.stringify({
          sourceId: 'bgt-sls',
          targetId: 'bgt-mkt',
          amount: 500000,
          reason: 'Inter-department marketing sprint fund transfer',
        }),
      });
      assert.strictEqual(rebalanceRes.status, 200);
      const rebalanceData: any = await rebalanceRes.json();
      assert.strictEqual(rebalanceData.success, true);
      assert.ok(rebalanceData.data.source);
      assert.ok(rebalanceData.data.target);
    } finally {
      if (server) {
        server.close();
      }
    }
  });

  closeDb();
});
