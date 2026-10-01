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

const allowedRoles = [
  'TIER_1_EXECUTIVE',
  'TIER_2_CONTROLLER',
  'TIER_3_ANALYST',
  'TIER_4_AUDITOR',
  'CFO',
  'FINANCE_ADMIN',
  'DEPT_MANAGER',
  'EMPLOYEE',
  'SYSTEM_ADMIN',
] as const;

const loginSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(allowedRoles).optional(),
});

// POST /api/auth/login
authRouter.post(
  '/login',
  validateBody(loginSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const targetRole = role || (email ? 'EMPLOYEE' : 'CFO');
      const user = usersService.getUserByRole(targetRole as UserRole);

      const response: ApiResponse = {
        success: true,
        data: {
          token: `jwt-session-${user.id}-${Date.now().toString(36)}`,
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

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Session terminated successfully' },
    meta: { timestamp: new Date().toISOString() },
  });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response, next: NextFunction) => {
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

const switchRoleSchema = z.object({
  role: z.enum(allowedRoles),
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
