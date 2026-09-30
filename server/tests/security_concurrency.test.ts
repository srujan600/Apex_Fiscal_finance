import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { getDb, closeDb } from '../src/db/connection';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { spendingService } from '../src/domains/spending/spending.service';
import { budgetsService } from '../src/domains/budgets/budgets.service';
import { auditService } from '../src/domains/audit/audit.service';
import { exceptionsService } from '../src/domains/exceptions/exceptions.service';
import { createRateLimiter } from '../src/middleware/rateLimiter';
import { sanitizePayloadGuard } from '../src/middleware/securityHeaders';
import { requireRole, requirePermission } from '../src/middleware/auth';
import { AppError } from '../src/middleware/errorHandler';

describe('Phase 10 Security Hardening & Concurrency Stress Tests', () => {
  before(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    closeDb();
    const db = getDb(':memory:');
    initSchema(db);
    seedDatabase(db);
  });

  after(() => {
    closeDb();
  });

  // 1. Concurrency: High-Frequency Race Condition Prevention
  test('Concurrency: prevents double-spend under simultaneous concurrent requests', async () => {
    const db = getDb();

    // Create a constrained test budget with exactly $100,000.00 available
    const testDeptId = 'dept-test-race';
    const testBudgetId = 'bgt-test-race';
    db.prepare(`
      INSERT OR REPLACE INTO departments (id, code, name, lead_manager, manager_title, manager_avatar)
      VALUES (?, 'RTD', 'Race Test Dept', 'Stress Test Bot', 'VP of Testing', '')
    `).run(testDeptId);

    db.prepare(`
      INSERT OR REPLACE INTO budgets (
        id, code, department_id, department_name, fiscal_period, allocated_cents,
        actual_settled_cents, committed_cents, available_cents, utilization_rate,
        risk_level, days_to_run_out, lead_manager
      ) VALUES (?, 'BGT-2025-RTD', ?, 'Race Test Dept', '2025-Q3', 10000000, 0, 0, 10000000, 0.0, 'HEALTHY', 90, 'Stress Test Bot')
    `).run(testBudgetId, testDeptId);

    // Fire 20 concurrent requisitions for $30,000 each
    // Only 3 should fit within $100,000 ceiling. The remaining 17 should be flagged or blocked without over-allocating headroom.
    const concurrentRequests = Array.from({ length: 20 }, (_, i) => ({
      departmentId: testDeptId,
      departmentName: 'Race Test Dept',
      category: 'Cloud Infrastructure & Compute',
      categoryId: 'cat-cld',
      amount: 30000,
      vendor: `Concurrent Vendor ${i + 1}`,
      businessPurpose: `Stress test concurrency run #${i + 1}`,
      requestedBy: `Agent ${i + 1}`,
      requestorRole: 'EMPLOYEE',
      idempotencyKey: `race-key-${i + 1}-${Date.now()}`,
    }));

    const results = await Promise.all(
      concurrentRequests.map((req) => spendingService.submitRequest(req))
    );

    // Verify budget post-state: available headroom must NEVER be negative
    const budget = budgetsService.getBudgetById(testBudgetId);
    assert.ok(budget, 'Test budget must exist');
    assert.ok(
      budget.available >= 0,
      `Available headroom ($${budget.available}) must never drop below $0`
    );
    assert.ok(
      budget.committed <= 100000,
      `Committed balance ($${budget.committed}) must not exceed allocated budget of $100,000`
    );

    // Check count of successfully committed vs blocked requests
    const accepted = results.filter((r) => r.status === 'PRE_CLEARED' || r.status === 'APPROVED' || r.status === 'PENDING_APPROVAL');
    const blocked = results.filter((r) => r.status === 'BLOCKED');

    assert.ok(accepted.length <= 3, `No more than 3 requests can fit into $100k at $30k each. Got ${accepted.length}`);
    assert.strictEqual(blocked.length, 20 - accepted.length);
  });

  // 2. Concurrency: Idempotency Race Condition Protection
  test('Concurrency: identical idempotency keys concurrently submitted produce only 1 charge', async () => {
    const sharedIdempotencyKey = `shared-race-key-${Date.now()}`;
    const reqPayload = {
      departmentId: 'dept-eng',
      departmentName: 'Engineering - Platform Core',
      category: 'Cloud Infrastructure & Compute',
      categoryId: 'cat-cld',
      amount: 5000,
      vendor: 'AWS Cloud Services',
      businessPurpose: 'Concurrent idempotency stress test',
      requestedBy: 'Alex Rivera',
      requestorRole: 'DEPT_MANAGER',
      idempotencyKey: sharedIdempotencyKey,
    };

    // Fire 10 simultaneous requests with identical idempotency key
    const promises = Array.from({ length: 10 }, () => spendingService.submitRequest(reqPayload));
    const responses = await Promise.all(promises);

    // Every single response must share the exact same tracking number and ID
    const firstId = responses[0].id;
    const firstTracking = responses[0].trackingNumber;

    for (const res of responses) {
      assert.strictEqual(res.id, firstId);
      assert.strictEqual(res.trackingNumber, firstTracking);
    }

    // Database must have exactly 1 record for this idempotency key
    const db = getDb();
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM spending_requests WHERE tracking_number = ?').get(sharedIdempotencyKey) as any;
    assert.strictEqual(countRow.cnt, 1, 'Only 1 record must be persisted in database despite 10 parallel invocations');
  });

  // 3. Cryptographic Audit Hash Chain Integrity & Verification
  test('Cryptographic Audit: verifies intact hash chain and detects in-place tampering', () => {
    // 3a. Verify initial ledger state is 100% valid
    const initialVerification = auditService.verifyLedgerIntegrity();
    assert.strictEqual(initialVerification.verified, true);
    assert.strictEqual(initialVerification.consensusStatus, '12/12 Consensus Verified');
    assert.ok(initialVerification.totalBlocks >= 3);

    // 3b. Append new blocks and verify chain continuity
    const db = getDb();
    const newBlock1 = auditService.appendEvent(db, {
      actor: 'Victoria Sterling',
      actorRole: 'CFO',
      action: 'SECURITY_AUDIT_PROBE_1',
      entity: 'Ledger Engine',
      entityId: '#PROBE-01',
      oldValue: 'CHECK: 0',
      newValue: 'CHECK: 1',
      reason: 'Automated cryptographic continuity test',
    });

    const newBlock2 = auditService.appendEvent(db, {
      actor: 'Victoria Sterling',
      actorRole: 'CFO',
      action: 'SECURITY_AUDIT_PROBE_2',
      entity: 'Ledger Engine',
      entityId: '#PROBE-02',
      oldValue: 'CHECK: 1',
      newValue: 'CHECK: 2',
      reason: 'Automated cryptographic continuity test',
    });

    assert.strictEqual(newBlock2.prevHash, newBlock1.txHash, 'Block 2 prevHash must point directly to Block 1 txHash');

    const verifiedPostAppend = auditService.verifyLedgerIntegrity();
    assert.strictEqual(verifiedPostAppend.verified, true);

    // 3c. Simulate malicious tampering: corrupt parent hash pointer in an intermediate block
    auditService.corruptHashLink(newBlock2.blockNumber, '0xdeadbeefbadhash123456');

    const tamperedVerification = auditService.verifyLedgerIntegrity();
    assert.strictEqual(tamperedVerification.verified, false, 'Tampered ledger must fail verification');
    assert.strictEqual(tamperedVerification.brokenLinkAtBlock, newBlock2.blockNumber);
    assert.ok(tamperedVerification.tamperDetails?.includes('Cryptographic parent mismatch'));
  });

  // 4. Role-Based Access Control (RBAC) & Privilege Escalation Prevention
  test('RBAC: non-privileged roles are strictly blocked from sensitive operations', () => {
    // 4a. Employee attempting CFO sovereign override
    const reqAsEmployee: any = {
      user: {
        id: 'usr_emp',
        name: 'Jordan Hayes',
        role: 'EMPLOYEE',
        title: 'Staff Software Engineer',
        avatar: '',
        department: 'dept-eng',
        spendingLimitCents: 500000,
      },
    };

    let caughtCfoError = false;
    const cfoGuard = requireRole('CFO');
    cfoGuard(reqAsEmployee, {} as any, (err?: any) => {
      if (err instanceof AppError && err.code === 'FORBIDDEN_ROLE') {
        caughtCfoError = true;
      }
    });
    assert.strictEqual(caughtCfoError, true, 'Employee role must be forbidden from CFO operations');

    // 4b. Employee attempting budget reallocation permission
    let caughtPermissionError = false;
    const reallocateGuard = requirePermission('REALLOCATE_BUDGET');
    reallocateGuard(reqAsEmployee, {} as any, (err?: any) => {
      if (err instanceof AppError && err.code === 'FORBIDDEN_PERMISSION') {
        caughtPermissionError = true;
      }
    });
    assert.strictEqual(caughtPermissionError, true, 'Employee role must lack REALLOCATE_BUDGET permission');

    // 4c. Non-CFO attempting exceptionsService.overrideException directly
    assert.throws(
      () => {
        exceptionsService.overrideException(
          'ex-9042',
          'Rogue override attempt',
          'None',
          'Jordan Hayes',
          'EMPLOYEE' as any
        );
      },
      (err: any) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 5. Rate Limiter: sliding window flood protection
  test('Rate Limiter: enforces sliding window threshold and rejects excessive requests with HTTP 429', () => {
    const limiter = createRateLimiter({
      windowMs: 10000,
      maxRequests: 3,
      keyGenerator: () => 'test-ip-client',
    });

    const mockReq: any = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      user: { id: 'usr-flood-test' },
      headers: { 'x-test-rate-limit': 'true' },
    };

    const headersSet: Record<string, any> = {};
    const mockRes: any = {
      setHeader: (k: string, v: any) => {
        headersSet[k] = v;
      },
    };

    let errors: any[] = [];
    const nextFn = (err?: any) => {
      if (err) errors.push(err);
    };

    // Requests 1, 2, 3 should pass
    limiter(mockReq, mockRes, nextFn);
    limiter(mockReq, mockRes, nextFn);
    limiter(mockReq, mockRes, nextFn);
    assert.strictEqual(errors.length, 0, 'First 3 requests within threshold must pass');

    // Request 4 should trigger 429 rate limit
    limiter(mockReq, mockRes, nextFn);
    assert.strictEqual(errors.length, 1, '4th request must be rejected');
    assert.strictEqual(errors[0].statusCode, 429);
    assert.strictEqual(errors[0].code, 'RATE_LIMIT_EXCEEDED');
    assert.strictEqual(headersSet['X-RateLimit-Remaining'], 0);
  });

  // 6. Security Payload Guard: prototype pollution rejection
  test('Security Payload Guard: blocks prototype pollution and malicious property injection', () => {
    const maliciousPayload = JSON.parse('{"businessPurpose": "Routine payment", "__proto__": {"isAdmin": true}}');
    const mockReq: any = { body: maliciousPayload };
    const mockRes: any = {};

    let caughtPollution = false;
    sanitizePayloadGuard(mockReq, mockRes, (err?: any) => {
      if (err instanceof AppError && err.code === 'MALICIOUS_PAYLOAD') {
        caughtPollution = true;
      }
    });

    assert.strictEqual(caughtPollution, true, 'Prototype pollution attempt must be detected and rejected');
  });

  // 7. Input Bounds Guard: negative spend amounts rejected
  test('Input Bounds: negative and zero spending requests are strictly rejected', async () => {
    assert.throws(
      () => {
        spendingService.submitRequest({
          departmentId: 'dept-eng',
          departmentName: 'Engineering - Platform Core',
          category: 'Capital Equipment & Hardware',
          categoryId: 'cat-cpx',
          amount: -500, // Negative amount
          vendor: 'Bad Vendor',
          businessPurpose: 'Negative amount exploit attempt',
          requestedBy: 'Attacker',
          requestorRole: 'EMPLOYEE',
        });
      },
      (err: any) => err instanceof AppError && err.statusCode === 400
    );
  });

  // 8. OWASP Security Headers Verification
  test('Security Headers: enforces OWASP enterprise headers on all HTTP responses', async () => {
    const { createApp } = await import('../src/app');
    const app = createApp();

    const server = await new Promise<any>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);

      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
      assert.strictEqual(res.headers.get('x-xss-protection'), '1; mode=block');
      assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      assert.ok(res.headers.get('content-security-policy')?.includes("default-src 'none'"));
      assert.ok(res.headers.get('cache-control')?.includes('no-store'));
    } finally {
      if (server) {
        server.close();
      }
    }
  });
});

