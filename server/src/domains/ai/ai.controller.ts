import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { novaService } from '../../ai/nova/nova.service';
import { forecastsService } from '../forecasts/forecasts.service';
import { getDb } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';
import { validateBody } from '../../middleware/validation';
import { BudgetExplanationDTO, ApprovalExplanationDTO, AnomalyExplanationDTO } from '../../ai/nova/nova.types';

export const aiRouter = Router();

const explainBudgetSchema = z.object({
  budgetId: z.string().optional(),
  departmentName: z.string().optional(),
  allocatedBudget: z.number().optional(),
  actualSettled: z.number().optional(),
  committedSpend: z.number().optional(),
  availableHeadroom: z.number().optional(),
  utilizationPercent: z.number().optional(),
  projectedOverrun: z.number().optional(),
  riskLevel: z.string().optional(),
  daysToExhaustion: z.number().optional(),
});

const explainForecastSchema = z.object({
  scenario: z.string().optional(),
  stressFactor: z.number().optional(),
  horizon: z.string().optional(),
});

const explainApprovalSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
});

const explainAnomalySchema = z.object({
  exceptionId: z.string().min(1, 'exceptionId is required'),
});

// GET /api/ai/status
aiRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      available: novaService.isAvailable(),
      provider: 'Aczen Nova API (v1)',
      architecture: 'Asynchronous explanation & advisory layer',
      rule: 'NOVA EXPLAINS. BACKEND DECIDES. DATABASE STORES THE TRUTH.',
    },
  });
});

// POST /api/ai/explain-budget & /api/ai/explain/budget
const handleExplainBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    let dto: BudgetExplanationDTO;

    if (req.body.budgetId) {
      const b = db.prepare('SELECT * FROM budgets WHERE id = ? OR department_id = ? LIMIT 1').get(
        req.body.budgetId,
        req.body.budgetId
      ) as any;

      if (!b) {
        throw new AppError(`Budget '${req.body.budgetId}' not found`, 404, 'BUDGET_NOT_FOUND');
      }

      dto = {
        department_name: b.department_name,
        allocated_budget: b.allocated_cents / 100,
        actual_settled: b.actual_settled_cents / 100,
        committed_spend: b.committed_cents / 100,
        available_headroom: b.available_cents / 100,
        utilization_percent: b.utilization_rate,
        projected_overrun: (b.projected_overrun_cents || 0) / 100,
        risk_level: b.risk_level,
        days_to_exhaustion: b.days_to_run_out || 30,
      };
    } else {
      dto = {
        department_name: req.body.departmentName || 'Engineering - Platform Core',
        allocated_budget: req.body.allocatedBudget || 15000000,
        actual_settled: req.body.actualSettled || 11700000,
        committed_spend: req.body.committedSpend || 2430000,
        available_headroom: req.body.availableHeadroom || 870000,
        utilization_percent: req.body.utilizationPercent || 94.2,
        projected_overrun: req.body.projectedOverrun || 1150000,
        risk_level: req.body.riskLevel || 'CRITICAL_BREACH',
        days_to_exhaustion: req.body.daysToExhaustion || 11,
      };
    }

    const explanation = await novaService.explainBudget(dto);
    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
aiRouter.post('/explain-budget', validateBody(explainBudgetSchema), handleExplainBudget);
aiRouter.post('/explain/budget', validateBody(explainBudgetSchema), handleExplainBudget);

// POST /api/ai/explain-forecast & /api/ai/explain/forecast
const handleExplainForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = req.body.scenario || 'baseline';
    const stressFactor = req.body.stressFactor || 0;
    const horizon = req.body.horizon || 'FY_2026';

    const summary = forecastsService.getForecastSummary(scenario, stressFactor, horizon);

    const explanation = await novaService.explainForecast({
      epoch: horizon,
      total_ceiling: summary.totalCeiling,
      settled_to_date: 36400000,
      committed_in_flight: 11700000,
      year_end_projected: summary.yearEndProjected,
      projected_variance: summary.projectedVariance,
      breach_date: summary.breachDateString,
      scenario: summary.scenario,
      stress_multiplier: summary.totalMultiplier,
    });

    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
aiRouter.post('/explain-forecast', validateBody(explainForecastSchema), handleExplainForecast);
aiRouter.post('/explain/forecast', validateBody(explainForecastSchema), handleExplainForecast);

// POST /api/ai/explain-approval & /api/ai/explain/approval
const handleExplainApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const r = db.prepare('SELECT * FROM spending_requests WHERE id = ?').get(req.body.requestId) as any;

    if (!r) {
      throw new AppError(`Spending request '${req.body.requestId}' not found`, 404, 'REQUEST_NOT_FOUND');
    }

    const dto: ApprovalExplanationDTO = {
      tracking_number: r.tracking_number,
      amount: r.amount_cents / 100,
      department: r.department_name,
      category: r.category,
      decision: r.status,
      triggered_rule: r.rule_triggered || undefined,
      pre_commitment_util: r.pre_commitment_util,
      post_commitment_util: r.post_commitment_util,
      required_action: r.status === 'BLOCKED' ? 'REQUIRE_CFO_OVERRIDE' : 'REQUIRE_MANAGER',
    };

    const explanation = await novaService.explainApproval(dto);
    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
aiRouter.post('/explain-approval', validateBody(explainApprovalSchema), handleExplainApproval);
aiRouter.post('/explain/approval', validateBody(explainApprovalSchema), handleExplainApproval);

// POST /api/ai/explain-anomaly & /api/ai/explain/anomaly
const handleExplainAnomaly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const ex = db.prepare('SELECT * FROM exception_incidents WHERE id = ?').get(req.body.exceptionId) as any;

    if (!ex) {
      throw new AppError(`Exception incident '${req.body.exceptionId}' not found`, 404, 'EXCEPTION_NOT_FOUND');
    }

    const dto: AnomalyExplanationDTO = {
      incident_code: ex.incident_code,
      department: ex.department,
      sub_department: ex.sub_department,
      vendor: ex.vendor,
      amount: ex.commitment_value_cents / 100,
      violation_detail: ex.violation_detail,
      breach_classification: ex.breach_classification,
      rule_code: ex.rule_code,
    };

    const explanation = await novaService.explainAnomaly(dto);
    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
aiRouter.post('/explain-anomaly', validateBody(explainAnomalySchema), handleExplainAnomaly);
aiRouter.post('/explain/anomaly', validateBody(explainAnomalySchema), handleExplainAnomaly);

// POST /api/ai/explain/spending or /api/ai/explain-spending
const handleExplainSpending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = Number(req.body.amount || 50000);
    const department = String(req.body.department || 'Engineering');
    const category = String(req.body.category || 'Cloud Services');
    const vendor = String(req.body.vendor || 'Unknown Vendor');

    const explanation = await novaService.explainApproval({
      tracking_number: req.body.trackingNumber || `REQ-SIM-${Date.now().toString().slice(-4)}`,
      amount,
      department,
      category,
      decision: amount > 50000 ? 'FLAGGED' : 'CLEARED',
      triggered_rule: amount > 50000 ? 'RULE-ENG-05 (Multi-Sig Gate)' : undefined,
      pre_commitment_util: 80,
      post_commitment_util: 85,
      required_action: amount > 50000 ? 'REQUIRE_CFO_OVERRIDE' : 'AUTOMATIC_CLEARANCE',
    });

    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};
aiRouter.post('/explain-spending', handleExplainSpending);
aiRouter.post('/explain/spending', handleExplainSpending);

// POST /api/ai/detect-anomalies
aiRouter.post('/detect-anomalies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const exceptions = db.prepare('SELECT * FROM exception_incidents ORDER BY created_at DESC LIMIT 5').all() as any[];
    const highSpendRequests = db.prepare('SELECT * FROM spending_requests WHERE amount_cents >= 5000000 ORDER BY created_at DESC LIMIT 5').all() as any[];

    const detectedAnomalies = [
      ...exceptions.map((ex) => ({
        id: ex.id,
        type: 'POLICY_EXCEPTION',
        code: ex.incident_code,
        severity: ex.breach_classification === 'CRITICAL_EXCEPTION' ? 'CRITICAL' : 'WARNING',
        department: ex.department,
        vendor: ex.vendor,
        amount: ex.commitment_value_cents / 100,
        description: ex.violation_detail,
        suggestedAction: 'Require executive review and sovereign offset designation',
      })),
      ...highSpendRequests.map((r) => ({
        id: r.id,
        type: 'VELOCITY_OUTLIER',
        code: r.tracking_number,
        severity: r.amount_cents > 20000000 ? 'CRITICAL' : 'WARNING',
        department: r.department_name,
        vendor: r.vendor,
        amount: r.amount_cents / 100,
        description: `Unusual transaction volume exceeding single-delegation standard threshold.`,
        suggestedAction: 'Audit contract terms and verify purchase order justification',
      })),
    ];

    res.json({
      success: true,
      data: {
        anomalyCount: detectedAnomalies.length,
        anomalies: detectedAnomalies,
        aiAssessment: 'Automated anomaly detection identified non-standard fiscal velocity signatures requiring supervisory reconciliation.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/management-insights and alias /insights
const handleManagementInsights = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await novaService.getManagementInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};
aiRouter.get('/management-insights', handleManagementInsights);
aiRouter.get('/insights', handleManagementInsights);



