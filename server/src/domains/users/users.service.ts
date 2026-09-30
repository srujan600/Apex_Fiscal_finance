import { getDb } from '../../db/connection';
import { UserRole } from '../../types/common';
import { AppError } from '../../middleware/errorHandler';

export interface UserDTO {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  department: string;
  spendingLimit: number;
}

export class UsersService {
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

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role as UserRole,
      title: r.title,
      avatar: r.avatar,
      department: r.department || 'Corporate',
      spendingLimit: r.spending_limit_cents / 100, // convert minor units to dollars
    }));
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

    return {
      id: r.id,
      name: r.name,
      role: r.role as UserRole,
      title: r.title,
      avatar: r.avatar,
      department: r.department || 'Corporate',
      spendingLimit: r.spending_limit_cents / 100,
    };
  }

  public getUserByRole(role: UserRole): UserDTO {
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
      WHERE u.role = ?
      LIMIT 1
    `).get(role) as any;

    if (!r) {
      throw new AppError(`User with role '${role}' not found`, 404, 'USER_ROLE_NOT_FOUND');
    }

    return {
      id: r.id,
      name: r.name,
      role: r.role as UserRole,
      title: r.title,
      avatar: r.avatar,
      department: r.department || 'Corporate',
      spendingLimit: r.spending_limit_cents / 100,
    };
  }
}

export const usersService = new UsersService();
