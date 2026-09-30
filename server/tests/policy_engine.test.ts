import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { policiesService } from '../src/domains/policies/policies.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 5 Policy Engine & Deterministic Rule Evaluator Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Policy Retrieval & Conversion
  await t.test('Policies: retrieves seeded policy rules with accurate threshold conversions', () => {
    const policies = policiesService.getAllPolicies();
    assert.strictEqual(policies.length, 3, 'Must have 3 seeded policy rules');

    const rule1 = policies.find((p) => p.code === 'RULE-ENG-08');
    assert.ok(rule1);
    assert.strictEqual(rule1.actionRequired, 'AUTO_BLOCK');
    assert.strictEqual(rule1.thresholdValue, 100, 'Threshold is 100%');
    assert.strictEqual(rule1.status, 'ACTIVE');

    const rule2 = policies.find((p) => p.code === 'RULE-ENG-05');
    assert.ok(rule2);
    assert.strictEqual(rule2.actionRequired, 'REQUIRE_CFO_OVERRIDE');
    assert.strictEqual(rule2.thresholdValue, 50000, 'Threshold is $50,000 in dollars');

    const rule3 = policies.find((p) => p.code === 'RULE-PREDICT-01');
    assert.ok(rule3);
    assert.strictEqual(rule3.actionRequired, 'WARN_AUDIT');
    assert.strictEqual(rule3.thresholdValue, 30, 'Threshold is 30 days');
  });

  // 2. Toggle Policy Status & Audit Trail
  await t.test('Policies: toggles status from ACTIVE to PAUSED and back, with immutable audit trail', () => {
    const initial = policiesService.getPolicyById('pol-2');
    assert.strictEqual(initial.status, 'ACTIVE');

    // Toggle to PAUSED
    const toggled = policiesService.togglePolicy('pol-2', 'Victoria Sterling', 'CFO');
    assert.strictEqual(toggled.status, 'PAUSED');

    // Check audit trail entry
    const audit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'POLICY_STATUS_TOGGLED' AND entity_id = 'RULE-ENG-05' ORDER BY block_number DESC LIMIT 1")
      .get() as any;
    assert.ok(audit, 'Audit event must be logged');
    assert.strictEqual(audit.old_value, 'STATUS: ACTIVE');
    assert.strictEqual(audit.new_value, 'STATUS: PAUSED');

    // Toggle back to ACTIVE
    const toggledBack = policiesService.togglePolicy('pol-2', 'Victoria Sterling', 'CFO');
    assert.strictEqual(toggledBack.status, 'ACTIVE');
  });

  // 3. Create Custom Policy Rule
  await t.test('Policies: creates custom policy rule and logs audit event', () => {
    const created = policiesService.createPolicy(
      {
        code: 'POL-2026-TEST-99',
        name: 'Strict Vendor Travel Cap',
        conditionExpression: 'AMOUNT > $15,000 AND CATEGORY == Travel',
        thresholdValue: 15000,
        actionRequired: 'REQUIRE_MANAGER',
        targetEntity: 'Marketing & Sales',
        status: 'ACTIVE',
      },
      'Victoria Sterling',
      'CFO'
    );

    assert.ok(created.id);
    assert.strictEqual(created.code, 'POL-2026-TEST-99');
    assert.strictEqual(created.thresholdValue, 15000);
    assert.strictEqual(created.actionRequired, 'REQUIRE_MANAGER');

    // Verify stored in database
    const dbRecord = db.prepare('SELECT * FROM policy_rules WHERE code = ?').get('POL-2026-TEST-99') as any;
    assert.ok(dbRecord);
    assert.strictEqual(dbRecord.threshold_value_cents, 1500000);

    // Duplicate code rejection
    assert.throws(
      () => {
        policiesService.createPolicy(
          {
            code: 'POL-2026-TEST-99',
            name: 'Duplicate Rule',
            conditionExpression: 'AMOUNT > 1000',
            thresholdValue: 1000,
            actionRequired: 'AUTO_BLOCK',
          },
          'Victoria Sterling',
          'CFO'
        );
      },
      /already exists/,
      'Cannot create rule with duplicate code'
    );
  });

  // 4. Deterministic Evaluation Engine
  await t.test('Evaluation: evaluates ceiling breach, multi-sig threshold, and safe nominal clearing', () => {
    // 4a. Safe nominal transaction for Sales
    const evalNominal = policiesService.evaluatePolicies({
      amount: 12000,
      departmentId: 'bgt-sls',
      category: 'General Ops',
    });
    assert.strictEqual(evalNominal.verdict, 'CLEARED');
    assert.strictEqual(evalNominal.riskLevel, 'HEALTHY');

    // 4b. Single transaction >= $50,000 triggers multi-sig gate
    const evalMultiSig = policiesService.evaluatePolicies({
      amount: 65000,
      departmentId: 'bgt-sls',
      category: 'Cloud Services',
    });
    assert.strictEqual(evalMultiSig.verdict, 'FLAGGED');
    assert.strictEqual(evalMultiSig.actionRequired, 'REQUIRE_CFO_OVERRIDE');
    assert.ok(evalMultiSig.ruleTriggered?.includes('RULE-ENG-05'));

    // 4c. Ceiling breach triggers AUTO_BLOCK
    const evalBreach = policiesService.evaluatePolicies({
      amount: 1500000,
      departmentId: 'bgt-eng',
      category: 'AI Clusters',
    });
    assert.strictEqual(evalBreach.verdict, 'BLOCKED');
    assert.strictEqual(evalBreach.riskLevel, 'CRITICAL_BREACH');
    assert.strictEqual(evalBreach.actionRequired, 'AUTO_BLOCK');
    assert.ok(evalBreach.ruleTriggered?.includes('RULE-ENG-08'));
  });

  // 5. Dynamic Evaluation with PAUSED Rules
  await t.test('Evaluation: ignores PAUSED rules dynamically', () => {
    // Pause RULE-ENG-05 ($50k gate)
    policiesService.togglePolicy('pol-2', 'Victoria Sterling', 'CFO');

    // Submit $60,000 transaction for Sales (bgt-sls has plenty headroom, util stays below 85%)
    const evalPaused = policiesService.evaluatePolicies({
      amount: 60000,
      departmentId: 'bgt-sls',
      category: 'Software Licenses',
    });

    // Since RULE-ENG-05 is PAUSED and post-utilization is < 85%, transaction CLEARS!
    assert.strictEqual(evalPaused.verdict, 'CLEARED');
    assert.strictEqual(evalPaused.riskLevel, 'HEALTHY');

    // Restore RULE-ENG-05 to ACTIVE
    policiesService.togglePolicy('pol-2', 'Victoria Sterling', 'CFO');

    // Now re-evaluating should trigger FLAGGED again
    const evalRestored = policiesService.evaluatePolicies({
      amount: 60000,
      departmentId: 'bgt-sls',
      category: 'Software Licenses',
    });
    assert.strictEqual(evalRestored.verdict, 'FLAGGED');
    assert.strictEqual(evalRestored.actionRequired, 'REQUIRE_CFO_OVERRIDE');
  });

  // 6. HTTP API Endpoints Integration Test
  await t.test('Policy API: verifies REST endpoints for listing, creating, toggling, and evaluating policies', async () => {
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
      // 1. GET /api/policies
      const listRes = await fetch(`${baseUrl}/api/policies`);
      assert.strictEqual(listRes.status, 200);
      const listData: any = await listRes.json();
      assert.strictEqual(listData.success, true);
      assert.ok(Array.isArray(listData.data));
      assert.ok(listData.data.length >= 3);

      // 2. GET /api/policies/:id
      const getOneRes = await fetch(`${baseUrl}/api/policies/pol-1`);
      assert.strictEqual(getOneRes.status, 200);
      const getOneData: any = await getOneRes.json();
      assert.strictEqual(getOneData.data.id, 'pol-1');
      assert.strictEqual(getOneData.data.code, 'RULE-ENG-08');

      // 3. POST /api/policies (Create new policy)
      const createRes = await fetch(`${baseUrl}/api/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'CFO',
        },
        body: JSON.stringify({
          code: 'RULE-API-TEST-01',
          name: 'API Enforcement Policy Test',
          conditionExpression: 'AMOUNT > $250,000',
          thresholdValue: 250000,
          actionRequired: 'REQUIRE_CFO_OVERRIDE',
          targetEntity: 'Executive',
          status: 'ACTIVE',
        }),
      });
      assert.strictEqual(createRes.status, 201);
      const createData: any = await createRes.json();
      assert.strictEqual(createData.data.code, 'RULE-API-TEST-01');

      // 4. PATCH /api/policies/:id/toggle
      const toggleRes = await fetch(`${baseUrl}/api/policies/${createData.data.id}/toggle`, {
        method: 'PATCH',
        headers: { 'X-User-Role': 'CFO' },
      });
      assert.strictEqual(toggleRes.status, 200);
      const toggleData: any = await toggleRes.json();
      assert.strictEqual(toggleData.data.status, 'PAUSED');

      // 5. POST /api/policies/evaluate
      const evalRes = await fetch(`${baseUrl}/api/policies/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 75000,
          departmentId: 'dept-eng',
          departmentName: 'Engineering',
          vendor: 'NVIDIA Corp',
        }),
      });
      assert.strictEqual(evalRes.status, 200);
      const evalData: any = await evalRes.json();
      assert.strictEqual(evalData.success, true);
      assert.ok(evalData.data.ruleTriggered);
    } finally {
      if (server) {
        server.close();
      }
    }
  });

  closeDb();
});
