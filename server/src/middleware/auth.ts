import { Request, Response, NextFunction } from 'express';
import { UserRole, UserContext } from '../types/common';
import { AppError } from './errorHandler';
import { getDb } from '../db/connection';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

export type Permission =
  | 'EXECUTE_OVERRIDE'
  | 'EMERGENCY_FREEZE'
  | 'REALLOCATE_BUDGET'
  | 'MANAGE_POLICIES'
  | 'APPROVE_REQUISITION'
  | 'SUBMIT_REQUISITION'
  | 'MANAGE_BUDGETS'
  | 'MANAGE_CATEGORIES'
  | 'VIEW_AUDIT'
  | 'SYSTEM_SETTINGS';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CFO: [
    'EXECUTE_OVERRIDE',
    'EMERGENCY_FREEZE',
    'REALLOCATE_BUDGET',
    'MANAGE_POLICIES',
    'APPROVE_REQUISITION',
    'SUBMIT_REQUISITION',
    'MANAGE_BUDGETS',
    'MANAGE_CATEGORIES',
    'VIEW_AUDIT',
    'SYSTEM_SETTINGS',
  ],
  FINANCE_ADMIN: [
    'REALLOCATE_BUDGET',
    'APPROVE_REQUISITION',
    'SUBMIT_REQUISITION',
    'MANAGE_BUDGETS',
    'MANAGE_CATEGORIES',
    'VIEW_AUDIT',
  ],
  DEPT_MANAGER: [
    'APPROVE_REQUISITION',
    'SUBMIT_REQUISITION',
  ],
  EMPLOYEE: [
    'SUBMIT_REQUISITION',
  ],
  SYSTEM_ADMIN: [
    'MANAGE_POLICIES',
    'VIEW_AUDIT',
    'SYSTEM_SETTINGS',
  ],
};

/**
 * Authentication middleware.
 * Supports:
 * 1. X-User-Role header (for frontend's command perspective switcher)
 * 2. X-User-Id header
 * 3. Default fallback to CFO for administrative command
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const roleHeader = (req.headers['x-user-role'] as string)?.toUpperCase() as UserRole | undefined;
    const userIdHeader = req.headers['x-user-id'] as string | undefined;

    const db = getDb();

    let userRecord: any = null;

    if (userIdHeader) {
      userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdHeader);
    } else if (roleHeader && ROLE_PERMISSIONS[roleHeader]) {
      userRecord = db.prepare('SELECT * FROM users WHERE role = ?').get(roleHeader);
    }

    // Default fallback to CFO persona if none provided
    if (!userRecord) {
      userRecord = db.prepare("SELECT * FROM users WHERE role = 'CFO'").get();
    }

    if (!userRecord) {
      // In-memory fallback if DB not yet seeded
      req.user = {
        id: 'usr_cfo',
        name: 'Victoria Sterling',
        role: 'CFO',
        title: 'Group Chief Financial Officer',
        avatar: '',
        department: 'dept-cld',
        spendingLimitCents: 5000000000,
      };
      return next();
    }

    req.user = {
      id: userRecord.id,
      name: userRecord.name,
      role: userRecord.role as UserRole,
      title: userRecord.title,
      avatar: userRecord.avatar,
      department: userRecord.department_id,
      spendingLimitCents: userRecord.spending_limit_cents,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Requires one of the specified roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Operation requires one of [${allowedRoles.join(', ')}]. Current role is ${req.user.role}.`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}

/**
 * Requires a specific granular permission.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!permissions.includes(permission)) {
      return next(
        new AppError(
          `Permission denied: Action requires '${permission}' permission.`,
          403,
          'FORBIDDEN_PERMISSION'
        )
      );
    }

    next();
  };
}
