import assert from 'node:assert';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { usersService } from '../src/domains/users/users.service';
import { departmentsService } from '../src/domains/departments/departments.service';
import { categoriesService } from '../src/domains/categories/categories.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 2 Data Domains Tests', async (t) => {
  // Setup in-memory DB for test isolation
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Users Domain Tests
  await t.test('Users: retrieves all personas with correctly converted dollar limits', () => {
    const users = usersService.getAllUsers();
    assert.strictEqual(users.length, 5, 'Must return all 5 personas');

    const cfo = users.find((u) => u.role === 'CFO');
    assert.ok(cfo);
    assert.strictEqual(cfo.name, 'Victoria Sterling');
    assert.strictEqual(cfo.spendingLimit, 50000000, 'CFO limit must be 50M USD');

    const dm = usersService.getUserByRole('DEPT_MANAGER');
    assert.strictEqual(dm.name, 'Sarah Jenkins');
    assert.strictEqual(dm.title, 'VP of Platform Engineering');
    assert.strictEqual(dm.spendingLimit, 2000000, 'Dept Manager limit must be 2M USD');
  });

  // 2. Departments Domain Tests
  await t.test('Departments: retrieves departments hydrated with subteams and live budget data', () => {
    const depts = departmentsService.getAllDepartments();
    assert.strictEqual(depts.length, 4, 'Must return 4 core cost centers');

    const eng = depts.find((d) => d.id === 'dept-eng');
    assert.ok(eng, 'Engineering department must exist');
    assert.strictEqual(eng.code, 'CC-101-ENG');
    assert.strictEqual(eng.leadManager, 'Sarah Jenkins');
    assert.strictEqual(eng.allocated, 15000000, 'Must reflect 15M allocated budget');
    assert.strictEqual(eng.settled, 11700000, 'Must reflect 11.7M settled');
    assert.strictEqual(eng.committed, 2430000, 'Must reflect 2.43M committed');
    assert.strictEqual(eng.riskLevel, 'CRITICAL_BREACH');

    assert.ok(eng.subTeams.length >= 3, 'Must have sub-teams');
    assert.ok(eng.primaryVendors.includes('Amazon Web Services'));
    assert.ok(eng.primaryVendors.includes('OpenAI'));
  });

  // 3. Categories Domain Tests
  await t.test('Categories: retrieves categories and supports creating new sub-caps with audit logging', () => {
    const initialCats = categoriesService.getAllCategories();
    assert.strictEqual(initialCats.length, 5, 'Must return 5 initial categories');

    const cloudCat = initialCats.find((c) => c.code === 'CAT-CLOUD-01');
    assert.ok(cloudCat);
    assert.strictEqual(cloudCat.allocated, 18500000);
    assert.strictEqual(cloudCat.spent, 14200000);
    assert.strictEqual(cloudCat.thresholdPercent, 92.4);

    // Create a new category
    const created = categoriesService.createCategory(
      {
        name: 'Cyber Risk & Quantum Encryption Retainers',
        code: 'CAT-CYBER-06',
        allocated: 3500000,
        thresholdPercent: 80,
      },
      'Victoria Sterling',
      'CFO'
    );

    assert.strictEqual(created.code, 'CAT-CYBER-06');
    assert.strictEqual(created.allocated, 3500000);
    assert.strictEqual(created.spent, 0);

    // Verify persisted in DB
    const refreshedCats = categoriesService.getAllCategories();
    assert.strictEqual(refreshedCats.length, 6, 'Must now have 6 categories in DB');

    // Verify audit log entry was generated
    const latestAudit = db
      .prepare("SELECT * FROM audit_events WHERE action = 'CATEGORY_SUBCAP_CREATED' ORDER BY block_number DESC LIMIT 1")
      .get() as any;
    assert.ok(latestAudit, 'Must record audit log entry');
    assert.strictEqual(latestAudit.actor, 'Victoria Sterling');
    assert.strictEqual(latestAudit.actor_role, 'CFO');
    assert.ok(latestAudit.new_value.includes('$3,500,000'));
  });

  // 4. Lookups & Error Handling
  await t.test('Lookups: throws AppError(404) on non-existent records', () => {
    assert.throws(
      () => usersService.getUserById('non-existent-user'),
      (err: any) => err.code === 'USER_NOT_FOUND' && err.statusCode === 404
    );
    assert.throws(
      () => departmentsService.getDepartmentById('non-existent-dept'),
      (err: any) => err.code === 'DEPARTMENT_NOT_FOUND' && err.statusCode === 404
    );
    assert.throws(
      () => categoriesService.getCategoryById('non-existent-cat'),
      (err: any) => err.code === 'CATEGORY_NOT_FOUND' && err.statusCode === 404
    );
  });

  // 5. Auth & RBAC Endpoints Integration Test
  await t.test('Auth & RBAC: verifies login, logout, me, and RBAC permission gating', async () => {
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
      // Test login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'FINANCE_ADMIN' }),
      });
      const loginData: any = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginData.data.user.role, 'FINANCE_ADMIN');
      assert.ok(loginData.data.token.startsWith('jwt-session-'));

      // Test logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
      assert.strictEqual(logoutRes.status, 200);

      // Test me with role header
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'X-User-Role': 'DEPT_MANAGER' },
      });
      const meData: any = await meRes.json();
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meData.data.role, 'DEPT_MANAGER');

      // Test switch-role
      const switchRes = await fetch(`${baseUrl}/api/auth/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'CFO' }),
      });
      const switchData: any = await switchRes.json();
      assert.strictEqual(switchRes.status, 200);
      assert.strictEqual(switchData.data.activeRole, 'CFO');

      // Test RBAC on Category Creation: EMPLOYEE must be FORBIDDEN (403)
      const employeeForbiddenRes = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'EMPLOYEE',
        },
        body: JSON.stringify({
          name: 'Unauthorized Sub-Cap',
          allocated: 100000,
        }),
      });
      assert.strictEqual(employeeForbiddenRes.status, 403, 'EMPLOYEE must be blocked from managing categories');
      const employeeErr: any = await employeeForbiddenRes.json();
      assert.strictEqual(employeeErr.error.code, 'FORBIDDEN_PERMISSION');

      // Test RBAC on Category Creation: CFO must be PERMITTED (201)
      const cfoPermittedRes = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'CFO',
        },
        body: JSON.stringify({
          name: 'Executive Special Reserve',
          allocated: 5000000,
        }),
      });
      assert.strictEqual(cfoPermittedRes.status, 201, 'CFO must be permitted to create categories');
    } finally {
      if (server) {
        server.close();
      }
    }
  });

  closeDb();
});
