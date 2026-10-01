import { Request, Response, NextFunction } from 'express';
import { UserRole, UserContext, GovernanceTier, getTierForRole, getTierMetadata } from '../types/common';
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
  | 'SYSTEM_SETTINGS'
  | 'RISK_THRESHOLD_ADJUSTMENT'
  | 'OPERATIONAL_SETTINGS'
  | 'DATA_ENTRY'
  | 'MODEL_ADJUSTMENTS'
  | 'VIEW_REPORTS';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Tier 1: Executive / C-Suite (Full Sovereign Authority)
  TIER_1_EXECUTIVE: [
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
    'RISK_THRESHOLD_ADJUSTMENT',
    'OPERATIONAL_SETTINGS',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_REPORTS',
  ],
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
    'RISK_THRESHOLD_ADJUSTMENT',
    'OPERATIONAL_SETTINGS',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_REPORTS',
  ],

  // Tier 2: Finance Manager / Controller (Risk thresholds, approvals, operational settings)
  TIER_2_CONTROLLER: [
    'REALLOCATE_BUDGET',
    'APPROVE_REQUISITION',
    'SUBMIT_REQUISITION',
    'MANAGE_BUDGETS',
    'MANAGE_CATEGORIES',
    'RISK_THRESHOLD_ADJUSTMENT',
    'OPERATIONAL_SETTINGS',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],
  FINANCE_ADMIN: [
    'REALLOCATE_BUDGET',
    'APPROVE_REQUISITION',
    'SUBMIT_REQUISITION',
    'MANAGE_BUDGETS',
    'MANAGE_CATEGORIES',
    'RISK_THRESHOLD_ADJUSTMENT',
    'OPERATIONAL_SETTINGS',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],

  // Tier 3: Risk / Financial Analyst (Data entry, portfolio analysis, model adjustments - NO final sign-off authority)
  TIER_3_ANALYST: [
    'SUBMIT_REQUISITION',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],
  DEPT_MANAGER: [
    'SUBMIT_REQUISITION',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],
  EMPLOYEE: [
    'SUBMIT_REQUISITION',
    'DATA_ENTRY',
    'MODEL_ADJUSTMENTS',
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],

  // Tier 4: Read-Only / Auditor (Read-only visibility into past reports, compliance logs, risk metrics - ZERO mutations)
  TIER_4_AUDITOR: [
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],
  SYSTEM_ADMIN: [
    'VIEW_AUDIT',
    'VIEW_REPORTS',
  ],
};

// Map Tier aliases to database canonical roles
const ROLE_TO_DB_ROLE: Record<string, string> = {
  TIER_1_EXECUTIVE: 'CFO',
  CFO: 'CFO',
  TIER_2_CONTROLLER: 'FINANCE_ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  TIER_3_ANALYST: 'EMPLOYEE',
  EMPLOYEE: 'EMPLOYEE',
  DEPT_MANAGER: 'DEPT_MANAGER',
  TIER_4_AUDITOR: 'SYSTEM_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
};

/**
 * Authentication middleware.
 * Supports:
 * 1. X-User-Role header (for frontend's command perspective switcher and tier hierarchy)
 * 2. X-User-Id header
 * 3. Default fallback to CFO for administrative command
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const rawRoleHeader = (req.headers['x-user-role'] as string)?.toUpperCase();
    const userIdHeader = req.headers['x-user-id'] as string | undefined;

    const db = getDb();

    let userRecord: any = null;

    if (userIdHeader) {
      userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdHeader);
    } else if (rawRoleHeader) {
      const dbRole = ROLE_TO_DB_ROLE[rawRoleHeader] || rawRoleHeader;
      userRecord = db.prepare('SELECT * FROM users WHERE role = ?').get(dbRole);
    }

    // Default fallback to CFO persona if none provided
    if (!userRecord) {
      userRecord = db.prepare("SELECT * FROM users WHERE role = 'CFO'").get();
    }

    if (!userRecord) {
      // In-memory fallback if DB not yet seeded
      const fallbackTier = 1;
      const tierMeta = getTierMetadata(fallbackTier);
      req.user = {
        id: 'usr_cfo',
        name: 'Victoria Sterling',
        role: 'CFO',
        governanceTier: fallbackTier,
        tierName: tierMeta.name,
        tierBadge: tierMeta.badgeLabel,
        title: 'Group Chief Financial Officer',
        avatar: '',
        department: 'dept-cld',
        spendingLimitCents: 5000000000,
      };
      return next();
    }

    // Determine active role: if rawRoleHeader requested a tier alias, honor it in context
    const effectiveRole = (rawRoleHeader && (ROLE_PERMISSIONS as any)[rawRoleHeader] ? rawRoleHeader : userRecord.role) as UserRole;
    const governanceTier = getTierForRole(effectiveRole);
    const tierMeta = getTierMetadata(governanceTier);

    req.user = {
      id: userRecord.id,
      name: userRecord.name,
      role: effectiveRole,
      governanceTier,
      tierName: tierMeta.name,
      tierBadge: tierMeta.badgeLabel,
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
 * Requires a specific governance tier.
 * Tier 1: Executive / C-Suite
 * Tier 2: Finance Manager / Controller
 * Tier 3: Risk / Financial Analyst
 * Tier 4: Read-Only / Auditor
 */
export function requireTier(...allowedTiers: GovernanceTier[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    const currentTier = req.user.governanceTier || getTierForRole(req.user.role);
    if (!allowedTiers.includes(currentTier)) {
      const tierDesc = allowedTiers
        .map((t) => getTierMetadata(t).name)
        .join(' or ');
      return next(
        new AppError(
          `Access forbidden: Operation requires clearance from ${tierDesc}. Your active clearance is Tier ${currentTier} (${req.user.role}).`,
          403,
          'FORBIDDEN_PERMISSION'
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
          `Permission denied: Action requires '${permission}' permission. Current clearance: ${req.user.role} (Tier ${req.user.governanceTier}).`,
          403,
          'FORBIDDEN_PERMISSION'
        )
      );
    }

    next();
  };
}
