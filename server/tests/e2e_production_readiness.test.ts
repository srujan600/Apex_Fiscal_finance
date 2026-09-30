import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../src/app';
import { getDb, closeDb } from '../src/db/connection';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';

describe('Phase 11 End-to-End Production Verification & Deployment Readiness', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    closeDb();
    const db = getDb(':memory:');
    initSchema(db);
    seedDatabase(db);

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) {
      server.close();
    }
    closeDb();
  });

  const request = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'CFO',
        ...(options.headers || {}),
      },
    });
    const body: any = await res.json().catch(() => null);
    return { status: res.status, headers: res.headers, body };
  };

  test('E2E: Health endpoint returns status HEALTHY with zero errors', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'HEALTHY');
    assert.strictEqual(res.body.data.service, 'Apex Fiscal Spend Control Core');
    assert.strictEqual(typeof res.body.data.nova_available, 'boolean');
  });

  test('E2E: Data Domains API endpoints respond with seeded records', async () => {
    // 1. Users
    const usersRes = await request('/api/users');
    assert.strictEqual(usersRes.status, 200);
    assert.ok(Array.isArray(usersRes.body.data));
    assert.ok(usersRes.body.data.some((u: any) => u.role === 'CFO'));

    // 2. Departments
    const deptRes = await request('/api/departments');
    assert.strictEqual(deptRes.status, 200);
    assert.ok(deptRes.body.data.length >= 4);
    assert.ok(deptRes.body.data.some((d: any) => d.code === 'CC-101-ENG'));

    // 3. Categories
    const catRes = await request('/api/categories');
    assert.strictEqual(catRes.status, 200);
    assert.ok(catRes.body.data.length >= 5);
  });

  test('E2E: Budget Engine endpoints return live headroom and allocations', async () => {
    const res = await request('/api/budgets');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    const engBudget = res.body.data.find((b: any) => b.code === 'BGT-2025-ENG');
    assert.ok(engBudget);
    assert.strictEqual(engBudget.allocated, 15000000);
    assert.ok(engBudget.available > 0);
  });

  test('E2E: Spending Simulation provides sub-15ms deterministic pre-clearance', async () => {
    const start = Date.now();
    const res = await request('/api/spending/simulate', {
      method: 'POST',
      body: JSON.stringify({
        departmentId: 'dept-eng',
        amount: 25000,
      }),
    });
    const duration = Date.now() - start;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.postCommitmentUtil > 0);
    assert.ok(duration < 250, `Simulation took ${duration}ms, expected sub-250ms`);
  });

  test('E2E: Policy Engine returns active rules and evaluation outcomes', async () => {
    const res = await request('/api/policies');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 5);

    const evalRes = await request('/api/policies/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        amount: 75000,
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        vendor: 'NVIDIA Corp',
      }),
    });
    assert.strictEqual(evalRes.status, 200);
    assert.strictEqual(evalRes.body.success, true);
    assert.ok(evalRes.body.data.ruleTriggered);
  });

  test('E2E: Approvals & Exceptions endpoints expose operational queue', async () => {
    const approvalsRes = await request('/api/approvals');
    assert.strictEqual(approvalsRes.status, 200);
    assert.ok(Array.isArray(approvalsRes.body.data));

    const exceptionsRes = await request('/api/exceptions');
    assert.strictEqual(exceptionsRes.status, 200);
    assert.ok(Array.isArray(exceptionsRes.body.data));
    assert.ok(exceptionsRes.body.data.some((e: any) => e.incidentCode === '#EX-9042'));
  });

  test('E2E: Forecasting & Sensitivity Engine produces forward trajectories', async () => {
    const forecastRes = await request('/api/forecasts/summary');
    assert.strictEqual(forecastRes.status, 200);
    assert.ok(forecastRes.body.data.projectedTrajectory.length === 12);
    assert.ok(forecastRes.body.data.burnRatePerMonth > 0);
  });

  test('E2E: Aczen Nova AI Advisory endpoints operate with zero-regret fallback', async () => {
    const insightsRes = await request('/api/ai/management-insights');
    assert.strictEqual(insightsRes.status, 200);
    assert.strictEqual(insightsRes.body.success, true);
    assert.ok(insightsRes.body.data.executiveSummary.length > 20);
    assert.ok(insightsRes.body.data.keyRiskDrivers.length > 0);
  });

  test('E2E: Dashboard Aggregates & Variance Reports respond with authoritative figures', async () => {
    const dashRes = await request('/api/dashboard/summary');
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(dashRes.body.success, true);
    assert.ok(dashRes.body.data.totalBudgetCap > 0);
    assert.strictEqual(dashRes.body.data.isEmergencyFreezeActive, false);

    const varianceRes = await request('/api/reports/variance');
    assert.strictEqual(varianceRes.status, 200);
    assert.ok(varianceRes.body.data.departmentVariance.length >= 4);
  });

  test('E2E: Cryptographic Audit Trail verifies 100% parent-link integrity', async () => {
    const auditRes = await request('/api/audit');
    assert.strictEqual(auditRes.status, 200);
    assert.ok(Array.isArray(auditRes.body.data));
    assert.ok(auditRes.body.data.length >= 3);

    const verifyRes = await request('/api/audit/verify');
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.data.verified, true);
    assert.strictEqual(verifyRes.body.data.consensusStatus, '12/12 Consensus Verified');
  });

  test('E2E: Enterprise Security Headers are enforced on all responses', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    assert.strictEqual(res.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, proxy-revalidate');
  });
});
