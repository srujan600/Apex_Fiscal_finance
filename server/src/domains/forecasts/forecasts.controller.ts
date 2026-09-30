import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { forecastsService } from './forecasts.service';
import { validateBody } from '../../middleware/validation';

export const forecastsRouter = Router();

const sensitivitySchema = z.object({
  scenario: z.string().optional(),
  stressFactor: z.number().min(-50).max(100).optional(),
  emergencyContingency: z.number().nonnegative().optional(),
});

// GET /api/forecasts/summary
forecastsRouter.get('/summary', (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = (req.query.scenario as string) || 'baseline';
    const stressFactor = parseFloat((req.query.stressFactor as string) || '0');
    const horizon = (req.query.horizon as string) || 'FY_2026';

    const data = forecastsService.getForecastSummary(scenario, stressFactor, horizon);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/forecasts/risks
forecastsRouter.get('/risks', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const risks = forecastsService.getRiskDrivers();
    res.json({ success: true, data: risks });
  } catch (error) {
    next(error);
  }
});

// GET /api/forecasts/mitigations
forecastsRouter.get('/mitigations', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mitigations = forecastsService.getMitigations();
    res.json({ success: true, data: mitigations });
  } catch (error) {
    next(error);
  }
});

// POST /api/forecasts/simulate-sensitivity
forecastsRouter.post(
  '/simulate-sensitivity',
  validateBody(sensitivitySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const simulation = forecastsService.simulateSensitivity(req.body);
      res.json({ success: true, data: simulation });
    } catch (error) {
      next(error);
    }
  }
);
