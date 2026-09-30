import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { forecastsService } from '../src/domains/forecasts/forecasts.service';
import { getDb, closeDb } from '../src/db/connection';

test('Phase 7 Forecasting & Sensitivity Engine Tests', async (t) => {
  // Setup fresh in-memory database
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Baseline Summary & Monthly Cumulative Progression
  await t.test('Summary: calculates authoritative ceiling and 12-month trajectory curves', () => {
    const summary = forecastsService.getForecastSummary('baseline', 0, 'FY_2026');

    // Corporate ceiling should be sum of seeded budgets ($15M + $8M + $14M + $11.5M = $48.5M)
    assert.strictEqual(summary.totalCeiling, 48500000, 'Total ceiling must be $48,500,000');
    assert.strictEqual(summary.chartData.length, 12, 'Must have 12 monthly data points');

    // Verify historical vs forecast points
    const jan = summary.chartData[0];
    assert.strictEqual(jan.month, 'Jan');
    assert.strictEqual(jan.isForecast, false);
    assert.strictEqual(jan.actual, 3800000);

    const dec = summary.chartData[11];
    assert.strictEqual(dec.month, 'Dec');
    assert.strictEqual(dec.isForecast, true);
    assert.strictEqual(dec.projected, 52400000, 'Baseline Dec projection is $52.4M');

    // Baseline breach horizon check
    assert.strictEqual(summary.isBreached, true, '$52.4M projected > $48.5M ceiling');
    assert.ok(summary.projectedVariance > 0);
    assert.ok(summary.breachMonth !== null);
  });

  // 2. Scenario Testing (AI Spike & Renegotiation)
  await t.test('Scenarios: applies scenario multipliers to forward projections', () => {
    // AI Spike (1.12 multiplier)
    const aiSpike = forecastsService.getForecastSummary('ai_spike', 0);
    assert.strictEqual(aiSpike.totalMultiplier, 1.12);
    assert.ok(aiSpike.yearEndProjected > 52400000, 'AI Spike must increase projected spend');

    // Renegotiation (0.94 multiplier)
    const savings = forecastsService.getForecastSummary('renegotiation', 0);
    assert.strictEqual(savings.totalMultiplier, 0.94);
    assert.ok(savings.yearEndProjected < 52400000, 'Renegotiation must decrease projected spend');
  });

  // 3. Stress-Tester Simulation (-15% Freeze to +25% Surge)
  await t.test('Stress Testing: stressFactor adjusts forward burn rate and breach date', () => {
    // 15% Cap Freeze (-15 stress factor)
    const freeze = forecastsService.getForecastSummary('baseline', -15);
    assert.strictEqual(freeze.totalMultiplier, 0.85);
    assert.ok(freeze.yearEndProjected < 52400000);

    // 25% Surge (+25 stress factor)
    const surge = forecastsService.getForecastSummary('baseline', 25);
    assert.strictEqual(surge.totalMultiplier, 1.25);
    assert.ok(surge.yearEndProjected > 55000000);
  });

  // 4. Algorithmic Risk Drivers Detection
  await t.test('Risk Drivers: identifies high-utilization cost centers from live envelopes', () => {
    const drivers = forecastsService.getRiskDrivers();
    assert.ok(Array.isArray(drivers));
    assert.ok(drivers.length >= 1, 'Should identify at least 1 risk driver');

    // Engineering has 94.2% utilization in seed
    const engRisk = drivers.find((d) => d.costCenter.includes('Engineering'));
    assert.ok(engRisk, 'Engineering must be identified as risk driver due to >85% util');
    assert.strictEqual(engRisk.severity, 'CRITICAL');
  });

  // 5. Prescriptive Mitigation Playbook
  await t.test('Mitigations: provides actionable playbooks with dollar recovery targets', () => {
    const mitigations = forecastsService.getMitigations();
    assert.ok(Array.isArray(mitigations));
    assert.strictEqual(mitigations.length, 3);

    const totalRecoverable = mitigations.reduce((sum, m) => sum + m.recoverableAmount, 0);
    assert.strictEqual(totalRecoverable, 1545000, '$1,545,000 total recoverable capital');
  });

  // 6. Monte Carlo Sensitivity Simulation
  await t.test('Sensitivity: computes Monte Carlo 95% confidence intervals and department breakdowns', () => {
    const sim = forecastsService.simulateSensitivity({
      scenario: 'ai_spike',
      stressFactor: 10,
      emergencyContingency: 500000,
    });

    assert.ok(sim.stressedYearEnd > sim.baselineYearEnd);
    assert.ok(sim.confidenceLower95 < sim.stressedYearEnd);
    assert.ok(sim.confidenceUpper95 > sim.stressedYearEnd);
    assert.ok(sim.departmentBreakdowns.length >= 4);

    const engBreakdown = sim.departmentBreakdowns.find((b) => b.departmentId === 'dept-eng');
    assert.ok(engBreakdown);
    assert.ok(engBreakdown.stressedProjected > 0);
  });
});
