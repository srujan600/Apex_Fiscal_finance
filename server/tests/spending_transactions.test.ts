import assert from 'node:assert';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { spendingService } from '../src/domains/spending/spending.service';
import { budgetsService } from '../src/domains/budgets/budgets.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 4 Spending & Transactions Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Zero-Regret Pre-Clearance Simulation
  await t.test('Simulation: accurately evaluates small, medium, and ceiling-breaching amounts', () => {
    // Nominal amount: $15,000 for Sales (bgt-sls has 64.1% utilization, warning threshold is 85%)
    const simNominal = spendingService.simulatePreClearance('bgt-sls', 15000);
    assert.strictEqual(simNominal.verdict, 'PRE_CLEARED');
    assert.strictEqual(simNominal.isViolation, false);

    // Over $50k threshold: $85,000 for Engineering (or triggers warning threshold)
    const simApproval = spendingService.simulatePreClearance('bgt-eng', 85000);
    assert.strictEqual(simApproval.verdict, 'PENDING_APPROVAL');
    assert.strictEqual(simApproval.isViolation, false);
    assert.ok(simApproval.ruleTriggered.includes('RULE-ENG-05') || simApproval.ruleTriggered.includes('RULE-WARN'));

    // Breach amount: $1,200,000 for Engineering (exceeds $870k headroom)
    const simBreach = spendingService.simulatePreClearance('bgt-eng', 1200000);
    assert.strictEqual(simBreach.verdict, 'BLOCKED');
    assert.strictEqual(simBreach.isViolation, true);
    assert.ok(simBreach.deficit > 0);
    assert.ok(simBreach.ruleTriggered.includes('RULE-ENG-08'));
  });

  // 2. Concurrency Protection & Race Condition Prevention
  await t.test('Concurrency: prevents double-spend when two requests compete for limited headroom', () => {
    // Create an isolated department with exactly $100,000 budget
    const createdBudget = budgetsService.createBudget(
      {
        departmentName: 'Concurrent Test Dept',
        allocated: 100000,
      },
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(createdBudget.available, 100000, 'Initial available is exactly $100,000');

    // Request A: $70,000
    const reqA = spendingService.submitRequest({
      category: 'Cloud Services',
      categoryId: 'cat-cld',
      departmentId: createdBudget.departmentId,
      departmentName: createdBudget.departmentName,
      amount: 70000,
      vendor: 'AWS Elastic Cluster',
      businessPurpose: 'Concurrent test load A',
      requestedBy: 'Engineer A',
      requestorRole: 'EMPLOYEE',
    });

    assert.strictEqual(reqA.status, 'PENDING_APPROVAL');
    const budgetAfterA = budgetsService.getBudgetById(createdBudget.id);
    assert.strictEqual(budgetAfterA.committed, 70000);
    assert.strictEqual(budgetAfterA.available, 30000, 'Available headroom must be down to $30,000');

    // Request B: $50,000 (Competing request)
    // Only $30,000 available, so Request B MUST NOT be approved/pre-cleared; it MUST BE BLOCKED!
    const reqB = spendingService.submitRequest({
      category: 'Cloud Services',
      categoryId: 'cat-cld',
      departmentId: createdBudget.departmentId,
      departmentName: createdBudget.departmentName,
      amount: 50000,
      vendor: 'Snowflake Ingestion',
      businessPurpose: 'Concurrent test load B',
      requestedBy: 'Engineer B',
      requestorRole: 'EMPLOYEE',
    });

    assert.strictEqual(reqB.status, 'BLOCKED', 'Request B must be deterministically BLOCKED');
    assert.strictEqual(reqB.riskLevel, 'CRITICAL_BREACH');

    // Verify Exception Incident was created for Request B
    const exB = db
      .prepare('SELECT * FROM exception_incidents WHERE request_id = ?')
      .get(reqB.id) as any;
    assert.ok(exB, 'Exception incident must be generated for blocked request');
    assert.strictEqual(exB.status, 'PENDING_DECISION');
    assert.strictEqual(exB.commitment_value_cents, 5000000, '$50,000 in cents');

    // Budget state remains protected at 70,000 committed, 30,000 available (Request B did not bleed committed spend)
    const budgetFinal = budgetsService.getBudgetById(createdBudget.id);
    assert.strictEqual(budgetFinal.committed, 70000);
    assert.strictEqual(budgetFinal.available, 30000);
  });

  // 3. Idempotency Protection
  await t.test('Idempotency: duplicate submissions with same key return original record without duplicate deductions', () => {
    const key = `IDEMP-KEY-${Date.now()}`;

    const first = spendingService.submitRequest({
      category: 'Enterprise SaaS',
      categoryId: 'cat-saas',
      departmentId: 'dept-mkt',
      departmentName: 'Global Marketing',
      amount: 15000,
      vendor: 'HubSpot Marketing Hub',
      businessPurpose: 'Campaign pipeline add-on',
      idempotencyKey: key,
    });

    const second = spendingService.submitRequest({
      category: 'Enterprise SaaS',
      categoryId: 'cat-saas',
      departmentId: 'dept-mkt',
      departmentName: 'Global Marketing',
      amount: 15000,
      vendor: 'HubSpot Marketing Hub',
      businessPurpose: 'Campaign pipeline add-on',
      idempotencyKey: key,
    });

    assert.strictEqual(first.id, second.id, 'Duplicate submission must return original record id');
    assert.strictEqual(first.trackingNumber, second.trackingNumber);
  });

  // 4. Query with Filters
  await t.test('Queries: filters by status and search keyword', () => {
    const blockedRequests = spendingService.getAllRequests('BLOCKED');
    assert.ok(blockedRequests.length >= 1, 'Must return at least 1 blocked request');
    blockedRequests.forEach((r) => assert.strictEqual(r.status, 'BLOCKED'));

    const searchResults = spendingService.getAllRequests('ALL', 'Amazon');
    assert.ok(searchResults.length >= 1);
    assert.ok(searchResults[0].vendor.includes('Amazon'));
  });

  closeDb();
});
