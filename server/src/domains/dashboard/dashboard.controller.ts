import { Router, Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export const dashboardRouter = Router();

// GET /api/dashboard/summary
dashboardRouter.get('/summary', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = dashboardService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/spending-trends
dashboardRouter.get('/spending-trends', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const trends = dashboardService.getSpendingTrends();
    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/trajectory
dashboardRouter.get('/trajectory', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const trajectory = dashboardService.getSpendTrajectory();
    res.json({ success: true, data: trajectory });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/risk
dashboardRouter.get('/risk', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const risk = dashboardService.getRiskMatrix();
    res.json({ success: true, data: risk });
  } catch (error) {
    next(error);
  }
});


