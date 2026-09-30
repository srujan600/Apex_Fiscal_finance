import { getDb } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';

export interface DepartmentDetailDTO {
  id: string;
  name: string;
  code: string;
  leadManager: string;
  managerTitle: string;
  managerAvatar: string;
  headcount: number;
  allocated: number;
  settled: number;
  committed: number;
  riskLevel: 'HEALTHY' | 'ATTENTION' | 'CRITICAL_BREACH';
  subTeams: { name: string; lead: string; spend: number; members: number }[];
  primaryVendors: string[];
}

export class DepartmentsService {
  public getAllDepartments(): DepartmentDetailDTO[] {
    const db = getDb();

    const depts = db.prepare('SELECT * FROM departments ORDER BY code').all() as any[];

    return depts.map((d) => this.hydrateDepartment(db, d));
  }

  public getDepartmentById(id: string): DepartmentDetailDTO {
    const db = getDb();
    const d = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any;

    if (!d) {
      throw new AppError(`Department with id '${id}' not found`, 404, 'DEPARTMENT_NOT_FOUND');
    }

    return this.hydrateDepartment(db, d);
  }

  private hydrateDepartment(db: any, d: any): DepartmentDetailDTO {
    // 1. Fetch live budget figures from authoritative budgets table
    const budget = db.prepare(`
      SELECT allocated_cents, actual_settled_cents, committed_cents, risk_level 
      FROM budgets 
      WHERE department_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(d.id) as any;

    // 2. Fetch sub-teams
    const subTeams = db.prepare(`
      SELECT name, lead, spend_cents, members 
      FROM sub_teams 
      WHERE department_id = ?
    `).all(d.id) as any[];

    // 3. Fetch primary vendors
    const vendors = db.prepare(`
      SELECT vendor_name 
      FROM department_vendors 
      WHERE department_id = ?
    `).all(d.id) as any[];

    const allocated = budget ? budget.allocated_cents / 100 : 0;
    const settled = budget ? budget.actual_settled_cents / 100 : 0;
    const committed = budget ? budget.committed_cents / 100 : 0;
    const riskLevel = budget?.risk_level || 'HEALTHY';

    return {
      id: d.id,
      name: d.name,
      code: d.code,
      leadManager: d.lead_manager,
      managerTitle: d.manager_title,
      managerAvatar: d.manager_avatar,
      headcount: d.headcount,
      allocated,
      settled,
      committed,
      riskLevel,
      subTeams: subTeams.map((st) => ({
        name: st.name,
        lead: st.lead,
        spend: st.spend_cents / 100,
        members: st.members,
      })),
      primaryVendors: vendors.map((v) => v.vendor_name),
    };
  }
}

export const departmentsService = new DepartmentsService();
