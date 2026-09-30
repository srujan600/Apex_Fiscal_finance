import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { approvalsService } from '../src/domains/approvals/approvals.service';
import { exceptionsService } from '../src/domains/exceptions/exceptions.service';
import { spendingService } from '../src/domains/spending/spending.service';
import { budgetsService } from '../src/domains/budgets/budgets.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 6 Approvals & Exceptions Management Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Pending Approvals Listing
  await t.test('Approvals: retrieves pending approval requests', () => {
    const pending = approvalsService.getPendingApprovals();
    assert.ok(Array.isArray(pending));
    assert.ok(pending.length >= 1, 'Should have at least 1 seeded pending request');
    assert.ok(pending.every((r) => r.status === 'PENDING_APPROVAL'));
  });

  // 2. Supervisory Approval & Ledger Settlement
  await t.test('Approvals: approves requisition, updates budget settlement, and appends audit log', () => {
    // Find a pending request
    const pending = approvalsService.getPendingApprovals()[0];
    assert.ok(pending, 'Pending request must exist');

    const budgetBefore = budgetsService.getBudgetById(pending.departmentId);

    // Approve as CFO
    const approved = approvalsService.approveRequest(pending.id, 'Victoria Sterling', 'CFO');
    assert.strictEqual(approved.status, 'APPROVED');

    // Budget check: committed decreased, actual settled increased by amount
    const budgetAfter = budgetsService.getBudgetById(pending.departmentId);
    assert.strictEqual(
      budgetAfter.actualSettled,
      budgetBefore.actualSettled + pending.amount,
      'Settled spend must increase by approved amount'
    );
    assert.strictEqual(
      budgetAfter.committed,
      budgetBefore.committed - pending.amount,
      'Committed spend must decrease by approved amount'
    );

    // Verify audit event
    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'REQUISITION_APPROVED' AND entity_id = ?")
      .get(pending.trackingNumber) as any;
    assert.ok(audit, 'Audit log must record requisition approval');
    assert.strictEqual(audit.new_value, 'STATUS: APPROVED');
  });

  // 3. Rejection & Commitment Headroom Release
  await t.test('Approvals: rejects requisition, releases reserved headroom back to budget', () => {
    // Create an isolated requisition to test clean headroom release
    const req = spendingService.submitRequest({
      category: 'Cloud Services',
      categoryId: 'cat-cld',
      departmentId: 'dept-sls',
      departmentName: 'Sales Operations & Commercial',
      amount: 40000,
      vendor: 'Salesforce Platform Tier 3',
      businessPurpose: 'Sales automation pipeline compute',
      requestedBy: 'Rachel Scott',
      requestorRole: 'EMPLOYEE',
    });

    const budgetBefore = budgetsService.getBudgetById('dept-sls');
    const availableBefore = budgetBefore.available;

    // Reject requisition
    const rejected = approvalsService.rejectRequest(
      req.id,
      'Out of quarterly scope: defer to Q4 planning.',
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.policyReason, 'Out of quarterly scope: defer to Q4 planning.');

    // Budget available headroom must increase by 40,000 (committed released!)
    const budgetAfter = budgetsService.getBudgetById('dept-sls');
    assert.strictEqual(
      budgetAfter.available,
      availableBefore + 40000,
      'Available headroom must increase back by rejected amount'
    );

    // Audit log
    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'REQUISITION_REJECTED' AND entity_id = ?")
      .get(rejected.trackingNumber) as any;
    assert.ok(audit, 'Rejection audit log must be recorded');
    assert.strictEqual(audit.new_value, 'STATUS: REJECTED');
  });

  // 4. Role Authorization Constraint for Approvals
  await t.test('Approvals: blocks employees from supervisory approval privileges', () => {
    const pending = approvalsService.getPendingApprovals()[0];
    if (pending) {
      assert.throws(
        () => {
          approvalsService.approveRequest(pending.id, 'Alex Rivera', 'EMPLOYEE');
        },
        /privileges/,
        'Employee must be prohibited from approving requisitions'
      );
    }
  });

  // 5. Exception Incidents Retrieval & Value Scaling
  await t.test('Exceptions: retrieves exception incidents with dollar commitment value', () => {
    const list = exceptionsService.getAllExceptions();
    assert.ok(list.length >= 4, 'Must have at least 4 seeded exceptions');

    const ex9042 = list.find((e) => e.incidentCode === '#EX-9042');
    assert.ok(ex9042);
    assert.strictEqual(ex9042.commitmentValue, 340000, '$340,000 in dollars');
    assert.strictEqual(ex9042.status, 'PENDING_DECISION');
    assert.strictEqual(ex9042.breachClassification, 'CRITICAL_EXCEPTION');
  });

  // 6. CFO Sovereign Override Workflow
  await t.test('Exceptions: CFO sovereign override approves linked blocked request and logs audit', () => {
    // #EX-9042 is linked to 'req-9418' which is BLOCKED
    const overridden = exceptionsService.overrideException(
      'ex-9042',
      'Mission-critical sovereign search cluster token authorization.',
      'Group Strategic Reserves',
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(overridden.status, 'OVERRIDDEN');
    assert.strictEqual(overridden.overrideJustification, 'Mission-critical sovereign search cluster token authorization.');

    // Linked requisition should be updated to APPROVED_OVERRIDE
    const linkedReq = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get('req-9418') as any;
    assert.ok(linkedReq);
    assert.strictEqual(linkedReq.status, 'APPROVED_OVERRIDE');

    // Audit event recorded
    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'POLICY_OVERRIDE_EXECUTED' AND entity_id = '#EX-9042'")
      .get() as any;
    assert.ok(audit, 'Override audit event must exist');
    assert.strictEqual(audit.new_value, 'STATUS: OVERRIDDEN');
  });

  // 7. Enforce-Reject Workflow
  await t.test('Exceptions: enforce-reject marks exception as ENFORCED_REJECTED', () => {
    const rejectedEx = exceptionsService.enforceRejectException(
      'ex-9038',
      'Non-essential marketing venue deposit disallowed.',
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(rejectedEx.status, 'ENFORCED_REJECTED');

    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'POLICY_HARD_STOP_ENFORCED' AND entity_id = '#EX-9038'")
      .get() as any;
    assert.ok(audit, 'Hard stop enforcement audit log must exist');
    assert.strictEqual(audit.new_value, 'STATUS: ENFORCED_REJECTED');
  });

  // 8. Role Constraint on Sovereign Overrides
  await t.test('Exceptions: blocks non-executives from sovereign overrides', () => {
    assert.throws(
      () => {
        exceptionsService.overrideException(
          'ex-9031',
          'Attempted manager override',
          undefined,
          'Sarah Jenkins',
          'DEPT_MANAGER'
        );
      },
      /authorization/,
      'Department managers cannot perform sovereign overrides'
    );
  });

  // 9. HTTP REST Endpoints Integration Test
  await t.test('Approvals & Exceptions API: verifies REST endpoints and RBAC gates', async () => {
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
      // 1. GET /api/approvals
      const appRes = await fetch(`${baseUrl}/api/approvals`);
      assert.strictEqual(appRes.status, 200);
      const appData: any = await appRes.json();
      assert.strictEqual(appData.success, true);
      assert.ok(Array.isArray(appData.data));

      // 2. GET /api/exceptions
      const exRes = await fetch(`${baseUrl}/api/exceptions`);
      assert.strictEqual(exRes.status, 200);
      const exData: any = await exRes.json();
      assert.strictEqual(exData.success, true);
      assert.ok(Array.isArray(exData.data));
      assert.ok(exData.data.length >= 4);

      // 3. GET /api/exceptions/:id
      const exDetailRes = await fetch(`${baseUrl}/api/exceptions/ex-9031`);
      assert.strictEqual(exDetailRes.status, 200);
      const exDetailData: any = await exDetailRes.json();
      assert.strictEqual(exDetailData.data.id, 'ex-9031');

      // 4. POST /api/exceptions/:id/override (CFO)
      const overrideRes = await fetch(`${baseUrl}/api/exceptions/ex-9031/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'CFO',
        },
        body: JSON.stringify({
          justification: 'Executive override approved for critical software deployment.',
          offsetSource: 'Contingency Pool Alpha',
        }),
      });
      assert.strictEqual(overrideRes.status, 200);
      const overrideData: any = await overrideRes.json();
      assert.strictEqual(overrideData.data.status, 'OVERRIDDEN');

      // 5. POST /api/exceptions/:id/enforce-reject
      const enforceRes = await fetch(`${baseUrl}/api/exceptions/ex-9042/enforce-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'CFO',
        },
        body: JSON.stringify({
          reason: 'Excessive overrun rejected by finance committee.',
        }),
      });
      assert.strictEqual(enforceRes.status, 200);
      const enforceData: any = await enforceRes.json();
      assert.strictEqual(enforceData.data.status, 'ENFORCED_REJECTED');
    } finally {
      if (server) {
        server.close();
      }
    }
  });

  closeDb();
});
