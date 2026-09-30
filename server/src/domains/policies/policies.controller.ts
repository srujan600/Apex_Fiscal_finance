import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { policiesService } from './policies.service';
import { validateBody } from '../../middleware/validation';
import { UserRole } from '../../types/common';

export const policiesRouter = Router();

const createPolicySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Policy name must be at least 2 characters'),
  conditionExpression: z.string().min(2, 'Condition expression is required'),
  thresholdValue: z.number().nonnegative('Threshold value must be non-negative'),
  actionRequired: z.enum(['AUTO_BLOCK', 'REQUIRE_CFO_OVERRIDE', 'REQUIRE_MANAGER', 'WARN_AUDIT']),
  targetEntity: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

const evaluatePolicySchema = z.object({
  amount: z.number().nonnegative('Amount must be non-negative'),
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
});

// GET /api/policies
policiesRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const policies = policiesService.getAllPolicies(status);
    res.json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
});

// GET /api/policies/:id
policiesRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const policy = policiesService.getPolicyById(id);
    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
});

// POST /api/policies
policiesRouter.post(
  '/',
  validateBody(createPolicySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const created = policiesService.createPolicy(req.body, actorName, actorRole);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/policies/:id/toggle
policiesRouter.patch('/:id/toggle', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actorName = req.user?.name || 'Victoria Sterling';
    const actorRole = (req.user?.role || 'CFO') as UserRole;

    const updated = policiesService.togglePolicy(id, actorName, actorRole);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/policies/evaluate
policiesRouter.post(
  '/evaluate',
  validateBody(evaluatePolicySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = policiesService.evaluatePolicies(req.body);
      res.json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }
);
