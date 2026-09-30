import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { novaService } from '../src/ai/nova/nova.service';
import { sanitizeContextForNova, validateNovaJsonOutput } from '../src/ai/nova/nova.validator';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 8 Aczen Nova AI Advisory Integration Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Context Sanitization
  await t.test('Sanitization: strips sensitive credentials and private keys from context', () => {
    const rawContext = {
      department: 'Engineering',
      vendor: 'AWS',
      token: 'bearer-secret-token-12345',
      apiKey: 'ak-live-secret-key-999',
      internalEmail: 'cfo@apex.internal',
      amount: 45000,
    };

    const sanitized = sanitizeContextForNova(rawContext);
    assert.strictEqual(sanitized.department, 'Engineering');
    assert.strictEqual(sanitized.vendor, 'AWS');
    assert.strictEqual(sanitized.amount, 45000);
    assert.strictEqual(sanitized.token, undefined);
    assert.strictEqual(sanitized.apiKey, undefined);
    assert.strictEqual('token' in sanitized, false);
    assert.strictEqual('apiKey' in sanitized, false);
  });

  // 2. JSON Output Validator
  await t.test('Validator: correctly parses clean JSON and handles markdown wrapped LLM responses', () => {
    const markdownOutput = '```json\n{\n  "summary": "Engineering budget is near capacity.",\n  "risk_assessment": "94.2% utilization presents imminent overrun risk.",\n  "recommendations": ["Cap non-critical spend", "Rebalance capital"]\n}\n```';
    const parsed = validateNovaJsonOutput(markdownOutput);

    assert.strictEqual(parsed.summary, 'Engineering budget is near capacity.');
    assert.strictEqual(parsed.risk_assessment, '94.2% utilization presents imminent overrun risk.');
    assert.strictEqual(parsed.recommendations.length, 2);
  });

  // 3. Budget Risk Explanation (Fail-Safe Deterministic Fallback)
  await t.test('Budget Advisory: generates structured risk narrative and actionable mitigation steps', async () => {
    const res = await novaService.explainBudget({
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

    assert.ok(res.summary.includes('Engineering'));
    assert.ok(res.risk_assessment.includes('Remaining headroom'));
    assert.ok(Array.isArray(res.recommendations));
    assert.ok(res.recommendations.length >= 2);
    assert.strictEqual(typeof res.latency_ms, 'number');
  });

  // 4. Forecast Trajectory Commentary
  await t.test('Forecast Advisory: evaluates macro scenario sensitivity and overrun probability', async () => {
    const res = await novaService.explainForecast({
      epoch: 'FY_2026',
      total_ceiling: 48500000,
      settled_to_date: 36400000,
      committed_in_flight: 11700000,
      year_end_projected: 52400000,
      projected_variance: -3900000,
      breach_date: 'October 14, 2026',
      scenario: 'ai_spike',
      stress_multiplier: 1.12,
    });

    assert.ok(res.summary.includes('October 14, 2026'));
    assert.ok(res.risk_assessment.includes('ai_spike'));
    assert.ok(res.recommendations.length >= 2);
  });

  // 5. Approval Requisition Commentary
  await t.test('Approval Advisory: explains policy gate rationale and supervisory requirement', async () => {
    const res = await novaService.explainApproval({
      tracking_number: 'REQ-9418',
      amount: 240000,
      department: 'Engineering - Platform Core',
      category: 'Cloud Infra',
      decision: 'PENDING_APPROVAL',
      triggered_rule: 'RULE-ENG-05 (Level-2 VP Signoff)',
      pre_commitment_util: 92.6,
      post_commitment_util: 94.2,
      required_action: 'REQUIRE_CFO_OVERRIDE',
    });

    assert.ok(res.summary.includes('REQ-9418'));
    assert.ok(res.risk_assessment.length > 0);
    assert.ok(res.recommendations.length >= 2);
  });

  // 6. Anomaly & Exception Explanation
  await t.test('Anomaly Advisory: provides root-cause diagnosis and governance options for blocked incident', async () => {
    const res = await novaService.explainAnomaly({
      incident_code: '#EX-9042',
      department: 'Engineering',
      vendor: 'OpenAI API Compute Expansion',
      amount: 340000,
      violation_detail: 'Exceeds AI Research Sub-cap by $120k. Causes departmental envelope to hit 96.5%.',
      breach_classification: 'CRITICAL_EXCEPTION',
      rule_code: 'RULE-ENG-08',
    });

    assert.ok(res.summary.includes('#EX-9042'));
    assert.ok(res.summary.includes('OpenAI'));
    assert.ok(res.risk_assessment.includes('CRITICAL_EXCEPTION'));
    assert.ok(res.recommendations.some((r) => r.includes('Sovereign Override') || r.includes('rejection')));
  });

  // 7. Executive Management Insights
  await t.test('Management Insights: synthesizes enterprise liquidity, cost center exposures, and policy score', async () => {
    const insights = await novaService.getManagementInsights();

    assert.ok(insights.executive_briefing.length > 20);
    assert.ok(insights.liquidity_runway_assessment.includes('runway'));
    assert.ok(Array.isArray(insights.cost_center_vulnerabilities));
    assert.ok(insights.cost_center_vulnerabilities.length >= 4);
    assert.ok(insights.policy_effectiveness_score >= 70);

    // Verify stored in ai_insights table
    const cached = db.prepare("SELECT * FROM ai_insights WHERE context_type = 'MANAGEMENT_BRIEFING'").get() as any;
    assert.ok(cached, 'Briefing must be cached in database');
    assert.ok(cached.insight_text.length > 0);
  });
});
