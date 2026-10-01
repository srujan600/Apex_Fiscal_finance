import { Router, Request, Response, NextFunction } from 'express';
import { spendingService } from './spending.service';
import { ApiResponse } from '../../types/common';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../middleware/validation';
import { requirePermission, requireTier } from '../../middleware/auth';

export const spendingRouter = Router();

const getSpendingQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

// GET /api/spending
spendingRouter.get(
  '/',
  validateQuery(getSpendingQuerySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search } = req.query as any;
      const requests = spendingService.getAllRequests(status, search);
      const response: ApiResponse = {
        success: true,
        data: requests,
        meta: { timestamp: new Date().toISOString(), count: requests.length },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

const simulateSchema = z.object({
  departmentId: z.string().min(1),
  amount: z.number().positive(),
});

// POST /api/spending/simulate
spendingRouter.post(
  '/simulate',
  validateBody(simulateSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, amount } = req.body;
      const result = spendingService.simulatePreClearance(departmentId, amount);
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

// GET /api/spending/:id
spendingRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = spendingService.getRequestById(String(req.params.id));
    const response: ApiResponse = {
      success: true,
      data: request,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

const createSpendingRequestSchema = z.object({
  category: z.string().min(1),
  categoryId: z.string().min(1),
  departmentId: z.string().min(1),
  departmentName: z.string().min(1),
  amount: z.number().positive(),
  vendor: z.string().min(1),
  businessPurpose: z.string().min(3),
  hasAttachment: z.boolean().optional(),
  idempotencyKey: z.string().optional(),
});

// POST /api/spending (Data Entry: Tier 1, 2, 3; Tier 4 Read-Only Auditor strictly blocked)
spendingRouter.post(
  '/',
  requireTier(1, 2, 3),
  requirePermission('SUBMIT_REQUISITION'),
  validateBody(createSpendingRequestSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name;
      const actorRole = req.user?.role;
      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

      const created = spendingService.submitRequest(
        {
          ...req.body,
          idempotencyKey,
        },
        actorName,
        actorRole
      );

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
