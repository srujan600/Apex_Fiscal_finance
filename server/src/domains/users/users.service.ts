import { getDb } from '../../db/connection';
import { UserRole, GovernanceTier, getTierForRole, getTierMetadata } from '../../types/common';
import { AppError } from '../../middleware/errorHandler';

export interface UserDTO {
  id: string;
  name: string;
  role: UserRole;
  governanceTier: GovernanceTier;
  tierName: string;
  tierBadge: string;
  title: string;
  avatar: string;
  department: string;
  spendingLimit: number;
  capabilities: string[];
  restrictions: string[];
}

const ROLE_ALIAS_MAP: Record<string, string> = {
  TIER_1_EXECUTIVE: 'CFO',
  TIER_2_CONTROLLER: 'FINANCE_ADMIN',
  TIER_3_ANALYST: 'EMPLOYEE',
  TIER_4_AUDITOR: 'SYSTEM_ADMIN',
};

export class UsersService {
  private formatUser(r: any, requestedRole?: string): UserDTO {
    const effectiveRole = (requestedRole || r.role) as UserRole;
    const tier = getTierForRole(effectiveRole);
    const meta = getTierMetadata(tier);

    return {
      id: r.id,
      name: r.name,
      role: effectiveRole,
      governanceTier: tier,
      tierName: meta.name,
      tierBadge: meta.badgeLabel,
      title: r.title,
      avatar: r.avatar,
      department: r.department || 'Corporate',
      spendingLimit: r.spending_limit_cents / 100, // convert minor units to dollars
      capabilities: meta.capabilities,
      restrictions: meta.restrictions,
    };
  }

  public getAllUsers(): UserDTO[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.role, 
        u.title, 
        u.avatar, 
        d.name as department, 
        u.spending_limit_cents
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id
    `).all() as any[];

    return rows.map((r) => this.formatUser(r));
  }

  public getUserById(id: string): UserDTO {
    const db = getDb();
    const r = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.role, 
        u.title, 
        u.avatar, 
        d.name as department, 
        u.spending_limit_cents
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(id) as any;

    if (!r) {
      throw new AppError(`User with id '${id}' not found`, 404, 'USER_NOT_FOUND');
    }

    return this.formatUser(r);
  }

  public getUserByRole(role: UserRole | string): UserDTO {
    const db = getDb();
    const searchRole = ROLE_ALIAS_MAP[role] || role;

    const r = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.role, 
        u.title, 
        u.avatar, 
        d.name as department, 
        u.spending_limit_cents
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = ?
      LIMIT 1
    `).get(searchRole) as any;

    if (!r) {
      throw new AppError(`User with role '${role}' not found`, 404, 'USER_ROLE_NOT_FOUND');
    }

    return this.formatUser(r, role);
  }
}

export const usersService = new UsersService();
