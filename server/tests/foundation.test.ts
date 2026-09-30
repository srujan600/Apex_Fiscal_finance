import assert from 'node:assert';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { runTransaction } from '../src/db/connection';
import { sanitizeContextForNova, validateNovaJsonOutput } from '../src/ai/nova/nova.validator';
import { NovaClient } from '../src/ai/nova/nova.client';
import { NovaService } from '../src/ai/nova/nova.service';
import { AppError } from '../src/middleware/errorHandler';

test('Phase 1 Backend Foundation Tests', async (t) => {
  // 1. Database and Schema Initialization in Memory
  await t.test('Database: in-memory schema creation and foreign key support', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema(db);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    assert.ok(tableNames.includes('users'), 'Users table must exist');
    assert.ok(tableNames.includes('departments'), 'Departments table must exist');
    assert.ok(tableNames.includes('budgets'), 'Budgets table must exist');
    assert.ok(tableNames.includes('categories'), 'Categories table must exist');
    assert.ok(tableNames.includes('spending_requests'), 'Spending requests table must exist');
    assert.ok(tableNames.includes('exception_incidents'), 'Exception incidents table must exist');
    assert.ok(tableNames.includes('policy_rules'), 'Policy rules table must exist');
    assert.ok(tableNames.includes('audit_events'), 'Audit events table must exist');
    assert.ok(tableNames.includes('system_settings'), 'System settings table must exist');
    assert.ok(tableNames.includes('ai_insights'), 'AI insights table must exist');

    db.close();
  });

  // 2. Database Seeding & Integer Precision
  await t.test('Database: seed populates required baseline with integer cents', () => {
    const db = new DatabaseSync(':memory:');
    initSchema(db);
    seedDatabase(db);

    const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as any).count;
    assert.strictEqual(userCount, 5, 'Must seed 5 role personas');

    const engBudget = db.prepare("SELECT * FROM budgets WHERE id = 'bgt-eng'").get() as any;
    assert.ok(engBudget, 'Engineering budget must exist');
    assert.strictEqual(engBudget.allocated_cents, 1500000000, '$15M must be 1.5B cents');
    assert.strictEqual(engBudget.actual_settled_cents, 1170000000, '$11.7M must be 1.17B cents');
    assert.strictEqual(engBudget.risk_level, 'CRITICAL_BREACH');

    const catCount = (db.prepare('SELECT count(*) as count FROM categories').get() as any).count;
    assert.strictEqual(catCount, 5, 'Must seed 5 categories');

    db.close();
  });

  // 3. Atomic Transaction Rollback
  await t.test('Database: atomic transaction rolls back on failure', () => {
    const db = new DatabaseSync(':memory:');
    initSchema(db);
    seedDatabase(db);

    const initialAlloc = (db.prepare("SELECT allocated_cents FROM budgets WHERE id = 'bgt-eng'").get() as any).allocated_cents;

    assert.throws(() => {
      runTransaction((txDb: DatabaseSync) => {
        txDb.prepare("UPDATE budgets SET allocated_cents = allocated_cents + 100000 WHERE id = 'bgt-eng'").run();
        throw new Error('Simulated failure during concurrent commit');
      }, db);
    }, /Simulated failure/);

    const postRollbackAlloc = (db.prepare("SELECT allocated_cents FROM budgets WHERE id = 'bgt-eng'").get() as any).allocated_cents;
    assert.strictEqual(postRollbackAlloc, initialAlloc, 'Allocated budget must be unchanged after transaction rollback');

    db.close();
  });

  // 4. Nova Context Sanitization (No PII / Secrets)
  await t.test('Nova: sanitization removes sensitive credentials and auth tokens', () => {
    const dirtyContext = {
      department: 'Engineering',
      allocated: 15000000,
      apiKey: 'secret_12345',
      userToken: 'bearer_token_xyz',
      passwordHash: 'hash_abc',
      nested: {
        safeField: 'active',
        secretCode: 'classified',
      },
    };

    const clean = sanitizeContextForNova(dirtyContext);
    assert.strictEqual((clean as any).apiKey, undefined, 'apiKey must be stripped');
    assert.strictEqual((clean as any).userToken, undefined, 'userToken must be stripped');
    assert.strictEqual((clean as any).passwordHash, undefined, 'passwordHash must be stripped');
    assert.strictEqual((clean as any).nested.secretCode, undefined, 'nested secretCode must be stripped');
    assert.strictEqual(clean.department, 'Engineering', 'Safe fields must be preserved');
    assert.strictEqual(clean.allocated, 15000000, 'Safe numbers must be preserved');
  });

  // 5. Nova Output Validation & JSON Parsing
  await t.test('Nova: validator handles raw JSON and markdown wrapped JSON', () => {
    const markdownWrapped = `\`\`\`json
{
  "summary": "Engineering budget is near threshold.",
  "risk_assessment": "94.2% utilization presents breach risk within 11 days.",
  "recommendations": ["Cap contractor expansion", "Transfer from Cloud Ops"]
}
\`\`\``;

    const validated = validateNovaJsonOutput(markdownWrapped);
    assert.strictEqual(validated.summary, 'Engineering budget is near threshold.');
    assert.strictEqual(validated.recommendations.length, 2);
  });

  // 6. Nova Fail-Safe Graceful Fallback
  await t.test('Nova: service degrades gracefully when API key is unconfigured', async () => {
    const client = new NovaClient('https://www.aczen.in/nova-api/v1', ''); // empty key
    const service = new NovaService(client);

    const result = await service.explainBudget({
      department_name: 'Engineering - Platform Core',
      allocated_budget: 15000000,
      actual_settled: 11700000,
      committed_spend: 2430000,
      available_headroom: 870000,
      utilization_percent: 94.2,
      projected_overrun: 1150000,
      risk_level: 'CRITICAL_BREACH',
      days_to_exhaustion: 11,
    });

    assert.ok(result.summary.includes('Engineering - Platform Core'), 'Fallback summary must contain department name');
    assert.strictEqual(result.is_ai_generated, false, 'Must be flagged as deterministic fallback');
    assert.strictEqual(result.model, 'deterministic-fallback');
    assert.ok(result.recommendations.length > 0, 'Must have prescriptive recommendations');
  });

  // 7. Error Handling & AppError
  await t.test('Error handling: AppError contains status code and error details', () => {
    const err = new AppError('Ceiling breach constraint', 422, 'BUDGET_EXCEEDED', { deficit: 50000 });
    assert.strictEqual(err.statusCode, 422);
    assert.strictEqual(err.code, 'BUDGET_EXCEEDED');
    assert.strictEqual(err.details.deficit, 50000);
  });
});
