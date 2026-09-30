import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { approvalsService } from './approvals.service';
import { validateBody } from '../../middleware/validation';
import { UserRole } from '../../types/common';

export const approvalsRouter = Router();

const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection justification must be at least 3 characters'),
});

const escalateSchema = z.object({
  note: z.string().optional(),
  escalateTo: z.string().optional(),
});

// GET /api/approvals
approvalsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = approvalsService.getPendingApprovals();
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

// POST /api/approvals/:id/approve
approvalsRouter.post('/:id/approve', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actorName = req.user?.name || 'Victoria Sterling';
    const actorRole = (req.user?.role || 'CFO') as UserRole;

    const result = approvalsService.approveRequest(id, actorName, actorRole);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/approvals/:id/reject
approvalsRouter.post(
  '/:id/reject',
  validateBody(rejectSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = approvalsService.rejectRequest(id, req.body.reason, actorName, actorRole);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/approvals/:id/escalate
approvalsRouter.post(
  '/:id/escalate',
  validateBody(escalateSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const actorName = req.user?.name || 'Alex Rivera';
      const actorRole = (req.user?.role || 'DEPT_MANAGER') as UserRole;

      const result = approvalsService.escalateRequest(id, req.body.note || '', actorName, actorRole);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
