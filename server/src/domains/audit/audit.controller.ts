import { Router, Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { ApiResponse } from '../../types/common';
import { requirePermission } from '../../middleware/auth';

export const auditRouter = Router();

/**
 * GET /api/audit
 * Retrieves audit logs with query filters.
 */
auditRouter.get('/', requirePermission('VIEW_AUDIT'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const role = req.query.role as string | undefined;
    const action = req.query.action as string | undefined;
    const search = req.query.search as string | undefined;

    const result = auditService.getAuditLogs({ limit, offset, role, action, search });

    const response: ApiResponse = {
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/verify
 * Performs full cryptographic verification of parent hash pointers and sequential integrity.
 */
auditRouter.get('/verify', requirePermission('VIEW_AUDIT'), (_req: Request, res: Response, next: NextFunction) => {
  try {
    const verification = auditService.verifyLedgerIntegrity();
    const response: ApiResponse = {
      success: true,
      data: verification,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/audit/verify
 * Explicit trigger for audit verification
 */
auditRouter.post('/verify', requirePermission('VIEW_AUDIT'), (_req: Request, res: Response, next: NextFunction) => {
  try {
    const verification = auditService.verifyLedgerIntegrity();
    const response: ApiResponse = {
      success: true,
      data: verification,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
