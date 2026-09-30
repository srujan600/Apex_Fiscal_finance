import { Router, Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { ApiResponse } from '../../types/common';
import { z } from 'zod';
import { validateBody } from '../../middleware/validation';
import { requirePermission } from '../../middleware/auth';

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = categoriesService.getAllCategories();
    const response: ApiResponse = {
      success: true,
      data: categories,
      meta: { timestamp: new Date().toISOString(), count: categories.length },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id
categoriesRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = categoriesService.getCategoryById(String(req.params.id));
    const response: ApiResponse = {
      success: true,
      data: category,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

const createCategorySchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  allocated: z.number().positive(),
  thresholdPercent: z.number().min(1).max(100).optional(),
});

// POST /api/categories
categoriesRouter.post(
  '/',
  requirePermission('MANAGE_CATEGORIES'),
  validateBody(createCategorySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorName = req.user?.name || 'Administrator';
      const actorRole = req.user?.role || 'FINANCE_ADMIN';

      const created = categoriesService.createCategory(req.body, actorName, actorRole);
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
