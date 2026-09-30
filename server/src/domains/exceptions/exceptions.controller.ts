import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { exceptionsService } from './exceptions.service';
import { validateBody } from '../../middleware/validation';
import { UserRole } from '../../types/common';

export const exceptionsRouter = Router();

const overrideSchema = z.object({
  justification: z.string().min(3, 'Executive justification must be at least 3 characters'),
  offsetSource: z.string().optional(),
});

const enforceRejectSchema = z.object({
  reason: z.string().optional(),
});

const rebalanceResolveSchema = z.object({
  sourceBudgetId: z.string().min(1, 'Source budget ID is required'),
  amount: z.number().positive('Reallocation amount must be positive'),
  justification: z.string().optional(),
});

// GET /api/exceptions
exceptionsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const list = exceptionsService.getAllExceptions(status);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

// GET /api/exceptions/:id
exceptionsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const incident = exceptionsService.getExceptionById(id);
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
});

// POST /api/exceptions/:id/override
exceptionsRouter.post(
  '/:id/override',
  validateBody(overrideSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = exceptionsService.overrideException(
        id,
        req.body.justification,
        req.body.offsetSource,
        actorName,
        actorRole
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exceptions/:id/enforce-reject
exceptionsRouter.post(
  '/:id/enforce-reject',
  validateBody(enforceRejectSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = exceptionsService.enforceRejectException(
        id,
        req.body.reason || 'Policy Hard-Stop Enforced',
        actorName,
        actorRole
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exceptions/:id/rebalance-resolve
exceptionsRouter.post(
  '/:id/rebalance-resolve',
  validateBody(rebalanceResolveSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = exceptionsService.rebalanceAndResolve(
        id,
        req.body.sourceBudgetId,
        req.body.amount,
        req.body.justification,
        actorName,
        actorRole
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
