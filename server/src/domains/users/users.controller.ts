import { Router, Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ApiResponse, UserRole } from '../../types/common';
import { z } from 'zod';
import { validateBody } from '../../middleware/validation';

export const usersRouter = Router();
export const authRouter = Router();

// GET /api/users
usersRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = usersService.getAllUsers();
    const response: ApiResponse = {
      success: true,
      data: users,
      meta: { timestamp: new Date().toISOString(), count: users.length },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me
usersRouter.get('/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.user?.role || 'CFO') as UserRole;
    const user = usersService.getUserByRole(role);
    const response: ApiResponse = {
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
usersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = usersService.getUserById(String(req.params.id));
    const response: ApiResponse = {
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

const switchRoleSchema = z.object({
  role: z.enum(['CFO', 'FINANCE_ADMIN', 'DEPT_MANAGER', 'EMPLOYEE', 'SYSTEM_ADMIN']),
});

// POST /api/auth/switch-role
authRouter.post(
  '/switch-role',
  validateBody(switchRoleSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.body;
      const user = usersService.getUserByRole(role as UserRole);
      const response: ApiResponse = {
        success: true,
        data: {
          activeRole: role,
          user,
        },
        meta: { timestamp: new Date().toISOString() },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
