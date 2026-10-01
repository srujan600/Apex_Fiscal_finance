import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { getDb, closeDb } from '../src/db/connection';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { createApp } from '../src/app';
import http from 'http';

describe('Phase 12 Multi-Tiered Financial Governance Hierarchy Verification', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    closeDb();
    const db = getDb(':memory:');
    initSchema(db);
    seedDatabase(db);
  });

  after(async () => {
    closeDb();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // 1. Tier 1 (Executive / C-Suite) Full Sovereign Authority
  test('Tier 1 (Executive / C-Suite): executes strategy controls, sovereign overrides, and policy rules', async () => {
    // 1a. Strategy Control: Emergency Freeze
    const freezeRes = await fetch(`${baseUrl}/api/settings/freeze`, {
      method: 'POST',
      headers: { 'X-User-Role': 'TIER_1_EXECUTIVE' },
    });
    assert.strictEqual(freezeRes.status, 200, 'Tier 1 must be permitted to trigger emergency freeze');
    const freezeData: any = await freezeRes.json();
    assert.strictEqual(freezeData.data.isEmergencyFreezeActive, true);

    // 1b. Strategy Control: Emergency Unfreeze
    const unfreezeRes = await fetch(`${baseUrl}/api/settings/unfreeze`, {
      method: 'POST',
      headers: { 'X-User-Role': 'CFO' },
    });
    assert.strictEqual(unfreezeRes.status, 200, 'Tier 1 (CFO) must be permitted to lift emergency freeze');
    const unfreezeData: any = await unfreezeRes.json();
    assert.strictEqual(unfreezeData.data.isEmergencyFreezeActive, false);

    // 1c. Sovereign Policy Override on critical exception
    const overrideRes = await fetch(`${baseUrl}/api/exceptions/ex-9042/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_1_EXECUTIVE',
      },
      body: JSON.stringify({
        justification: 'Executive strategic approval for sovereign AI infrastructure',
        offsetSource: 'C-Suite Reserve',
      }),
    });
    assert.strictEqual(overrideRes.status, 200, 'Tier 1 must be permitted to execute policy threshold overrides');
    const overrideData: any = await overrideRes.json();
    assert.strictEqual(overrideData.data.status, 'OVERRIDDEN');

    // 1d. Enterprise Audit Logs & Cryptographic Verification
    const auditRes = await fetch(`${baseUrl}/api/audit/verify`, {
      headers: { 'X-User-Role': 'TIER_1_EXECUTIVE' },
    });
    assert.strictEqual(auditRes.status, 200);
    const auditData: any = await auditRes.json();
    assert.strictEqual(auditData.data.verified, true);
  });

  // 2. Tier 2 (Finance Manager / Controller) Operational Authority & Sovereign Bounds
  test('Tier 2 (Finance Manager / Controller): approves transactions & edits settings, but blocked from sovereign overrides', async () => {
    // 2a. Transaction Approvals: Allowed for Tier 2
    const approveRes = await fetch(`${baseUrl}/api/approvals/req-9415/approve`, {
      method: 'POST',
      headers: { 'X-User-Role': 'TIER_2_CONTROLLER' },
    });
    assert.strictEqual(approveRes.status, 200, 'Tier 2 controller must be permitted to sign off on requisitions');
    const approveData: any = await approveRes.json();
    assert.strictEqual(approveData.data.status, 'APPROVED');

    // 2b. Operational Settings Modification: Allowed for Tier 2
    const patchSettingsRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'FINANCE_ADMIN',
      },
      body: JSON.stringify({ inrExchangeRate: 84.5 }),
    });
    assert.strictEqual(patchSettingsRes.status, 200, 'Tier 2 must be permitted to calibrate operational currency peg');

    // 2c. Strategy Controls: BLOCKED for Tier 2 (Emergency freeze is Tier 1 only)
    const freezeAttempt = await fetch(`${baseUrl}/api/settings/freeze`, {
      method: 'POST',
      headers: { 'X-User-Role': 'TIER_2_CONTROLLER' },
    });
    assert.strictEqual(freezeAttempt.status, 403, 'Tier 2 must be strictly forbidden from triggering emergency freeze');

    // 2d. Sovereign Policy Override: BLOCKED for Tier 2
    const overrideAttempt = await fetch(`${baseUrl}/api/exceptions/ex-9031/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'FINANCE_ADMIN',
      },
      body: JSON.stringify({ justification: 'Controller override attempt' }),
    });
    assert.strictEqual(overrideAttempt.status, 403, 'Tier 2 must be forbidden from sovereign policy threshold overrides');
  });

  // 3. Tier 3 (Risk / Financial Analyst) Data Entry & Strict NO Final Sign-Off Authority
  test('Tier 3 (Risk / Financial Analyst): submits data & adjusts models, but strictly prohibited from final sign-off', async () => {
    // 3a. Data Entry: Submitting Requisition is Allowed
    const submitReqRes = await fetch(`${baseUrl}/api/spending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_3_ANALYST',
      },
      body: JSON.stringify({
        departmentId: 'dept-eng',
        departmentName: 'Engineering - Platform Core',
        category: 'Cloud Infrastructure & Compute',
        categoryId: 'cat-cld',
        amount: 4500,
        vendor: 'DataDog Observability',
        businessPurpose: 'Production cluster monitoring telemetry license renewal',
      }),
    });
    assert.strictEqual(submitReqRes.status, 201, 'Tier 3 analyst must be permitted to enter spend requisitions');

    // 3b. Model Adjustments: Sensitivity Simulation is Allowed
    const simRes = await fetch(`${baseUrl}/api/forecasts/simulate-sensitivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_3_ANALYST',
      },
      body: JSON.stringify({ scenario: 'accelerated', stressFactor: 15 }),
    });
    assert.strictEqual(simRes.status, 200, 'Tier 3 analyst must be permitted to adjust forecasting models');

    // 3c. STRICT RESTRICTION: Approval Sign-off is FORBIDDEN for Tier 3
    const signOffAttempt = await fetch(`${baseUrl}/api/approvals/req-9415/approve`, {
      method: 'POST',
      headers: { 'X-User-Role': 'TIER_3_ANALYST' },
    });
    assert.strictEqual(signOffAttempt.status, 403, 'Tier 3 analyst must have NO final sign-off authority');
    const signOffErr: any = await signOffAttempt.json();
    assert.strictEqual(signOffErr.error.code, 'FORBIDDEN_PERMISSION');

    // 3d. Operational Settings Modification: FORBIDDEN for Tier 3
    const settingsAttempt = await fetch(`${baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_3_ANALYST',
      },
      body: JSON.stringify({ inrExchangeRate: 90.0 }),
    });
    assert.strictEqual(settingsAttempt.status, 403, 'Tier 3 analyst cannot modify operational settings');
  });

  // 4. Tier 4 (Read-Only / Auditor) Read-Only Visibility & Mutation Prohibition
  test('Tier 4 (Read-Only / Auditor): views past reports & logs, but all mutations are strictly blocked', async () => {
    // 4a. Read-Only Visibility: Reports & Audit are Allowed
    const varianceRes = await fetch(`${baseUrl}/api/reports/variance?period=Q3`, {
      headers: { 'X-User-Role': 'TIER_4_AUDITOR' },
    });
    assert.strictEqual(varianceRes.status, 200, 'Tier 4 auditor must have read-only visibility into reports');

    const auditLedgerRes = await fetch(`${baseUrl}/api/audit`, {
      headers: { 'X-User-Role': 'TIER_4_AUDITOR' },
    });
    assert.strictEqual(auditLedgerRes.status, 200, 'Tier 4 auditor must have read-only visibility into audit logs');

    // 4b. Mutation: Data Entry is FORBIDDEN for Tier 4
    const dataEntryAttempt = await fetch(`${baseUrl}/api/spending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_4_AUDITOR',
      },
      body: JSON.stringify({
        departmentId: 'dept-eng',
        departmentName: 'Engineering - Platform Core',
        category: 'Cloud Infrastructure & Compute',
        categoryId: 'cat-cld',
        amount: 1000,
        vendor: 'Prohibited Auditor Submission',
        businessPurpose: 'Should fail 403',
      }),
    });
    assert.strictEqual(dataEntryAttempt.status, 403, 'Tier 4 auditor must be prohibited from data entry');

    // 4c. Mutation: Transaction Approval is FORBIDDEN for Tier 4
    const approvalAttempt = await fetch(`${baseUrl}/api/approvals/req-9418/approve`, {
      method: 'POST',
      headers: { 'X-User-Role': 'TIER_4_AUDITOR' },
    });
    assert.strictEqual(approvalAttempt.status, 403, 'Tier 4 auditor cannot sign off on transactions');

    // 4d. Mutation: Settings modification is FORBIDDEN for Tier 4
    const settingsAttempt = await fetch(`${baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'TIER_4_AUDITOR',
      },
      body: JSON.stringify({ inrExchangeRate: 85.0 }),
    });
    assert.strictEqual(settingsAttempt.status, 403, 'Tier 4 auditor cannot modify settings');
  });
});
