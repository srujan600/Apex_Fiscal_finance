import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { settingsService } from './settings.service';
import { validateBody } from '../../middleware/validation';
import { requirePermission, requireTier } from '../../middleware/auth';
import { ApiResponse, UserRole } from '../../types/common';

export const settingsRouter = Router();

const updateSettingsSchema = z.object({
  inrExchangeRate: z.number().positive().optional(),
  slackWebhook: z.string().url().optional(),
  pagerdutyKey: z.string().min(5).optional(),
});

// GET /api/settings (Viewable by all tiers for configuration transparency)
settingsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = settingsService.getSettings();
    const response: ApiResponse = {
      success: true,
      data: settings,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/settings (Tier 1 & Tier 2: Operational Settings Modification)
settingsRouter.patch(
  '/',
  requireTier(1, 2),
  requirePermission('OPERATIONAL_SETTINGS'),
  validateBody(updateSettingsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = (req.user?.role || 'FINANCE_ADMIN') as UserRole;

      const updated = settingsService.updateOperationalSettings(req.body, actorName, actorRole);
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

// POST /api/settings/freeze (STRICTLY Tier 1 Executive / C-Suite Sovereign Authority)
settingsRouter.post(
  '/freeze',
  requireTier(1),
  requirePermission('EMERGENCY_FREEZE'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = settingsService.triggerEmergencyFreeze(actorName, actorRole);
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

// POST /api/settings/unfreeze (STRICTLY Tier 1 Executive / C-Suite Sovereign Authority)
settingsRouter.post(
  '/unfreeze',
  requireTier(1),
  requirePermission('EMERGENCY_FREEZE'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Victoria Sterling';
      const actorRole = (req.user?.role || 'CFO') as UserRole;

      const result = settingsService.resolveEmergencyFreeze(actorName, actorRole);
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
