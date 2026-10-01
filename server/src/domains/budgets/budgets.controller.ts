import { Router, Request, Response, NextFunction } from 'express';
import { budgetsService } from './budgets.service';
import { ApiResponse } from '../../types/common';
import { z } from 'zod';
import { validateBody } from '../../middleware/validation';
import { requirePermission, requireTier } from '../../middleware/auth';

export const budgetsRouter = Router();

// GET /api/budgets
budgetsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const budgets = budgetsService.getAllBudgets();
    const response: ApiResponse = {
      success: true,
      data: budgets,
      meta: { timestamp: new Date().toISOString(), count: budgets.length },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/budgets/:id
budgetsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = budgetsService.getBudgetById(String(req.params.id));
    const response: ApiResponse = {
      success: true,
      data: budget,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

const createBudgetSchema = z.object({
  departmentName: z.string().min(2),
  allocated: z.number().positive(),
  fiscalPeriod: z.string().optional(),
  leadManager: z.string().optional(),
  warningThresholdPct: z.number().min(1).max(100).optional(),
  hardCapThresholdPct: z.number().min(1).max(150).optional(),
});

// POST /api/budgets (Tier 1 & Tier 2: Budget envelope creation)
budgetsRouter.post(
  '/',
  requireTier(1, 2),
  requirePermission('MANAGE_BUDGETS'),
  validateBody(createBudgetSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = req.user?.role || 'FINANCE_ADMIN';

      const created = budgetsService.createBudget(req.body, actorName, actorRole);
      const response: ApiResponse = {
        success: true,
        data: created,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

const updateBudgetSchema = z.object({
  allocated: z.number().positive(),
  justification: z.string().min(5),
});

// PATCH /api/budgets/:id (Tier 1 & Tier 2: Risk threshold & allocation adjustments)
budgetsRouter.patch(
  '/:id',
  requireTier(1, 2),
  requirePermission('MANAGE_BUDGETS'),
  validateBody(updateBudgetSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = req.user?.role || 'FINANCE_ADMIN';

      const updated = budgetsService.updateBudget(String(req.params.id), req.body, actorName, actorRole);
      const response: ApiResponse = {
        success: true,
        data: updated,
        meta: { timestamp: new Date().toISOString() },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

const reallocateBudgetSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

// POST /api/budgets/reallocate (Tier 1 & Tier 2: Capital rebalancing)
budgetsRouter.post(
  '/reallocate',
  requireTier(1, 2),
  requirePermission('REALLOCATE_BUDGET'),
  validateBody(reallocateBudgetSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = req.user?.role || 'FINANCE_ADMIN';

      const result = budgetsService.reallocateBudget(req.body, actorName, actorRole);
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/budgets/rebalance (Alias for frontend compatibility)
budgetsRouter.post(
  '/rebalance',
  requireTier(1, 2),
  requirePermission('REALLOCATE_BUDGET'),
  validateBody(reallocateBudgetSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = req.user?.role || 'FINANCE_ADMIN';

      const result = budgetsService.reallocateBudget(req.body, actorName, actorRole);
      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
