import { getDb } from '../../db/connection';
import { RiskLevel, UserRole } from '../../types/common';
import { AppError } from '../../middleware/errorHandler';
import { auditService } from '../audit/audit.service';

export interface SpendCategoryDTO {
  id: string;
  name: string;
  code: string;
  allocated: number;
  spent: number;
  committed: number;
  riskLevel: RiskLevel;
  thresholdPercent: number;
}

export interface CreateCategoryDTO {
  name: string;
  code?: string;
  allocated: number;
  thresholdPercent?: number;
}

export class CategoriesService {
  public getAllCategories(): SpendCategoryDTO[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM categories ORDER BY code').all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      allocated: r.allocated_cents / 100,
      spent: r.spent_cents / 100,
      committed: r.committed_cents / 100,
      riskLevel: r.risk_level as RiskLevel,
      thresholdPercent: r.threshold_percent,
    }));
  }

  public getCategoryById(id: string): SpendCategoryDTO {
    const db = getDb();
    const r = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;

    if (!r) {
      throw new AppError(`Category with id '${id}' not found`, 404, 'CATEGORY_NOT_FOUND');
    }

    return {
      id: r.id,
      name: r.name,
      code: r.code,
      allocated: r.allocated_cents / 100,
      spent: r.spent_cents / 100,
      committed: r.committed_cents / 100,
      riskLevel: r.risk_level as RiskLevel,
      thresholdPercent: r.threshold_percent,
    };
  }

  public createCategory(dto: CreateCategoryDTO, actorName = 'Admin', actorRole = 'FINANCE_ADMIN'): SpendCategoryDTO {
    const db = getDb();

    const id = `cat-${Date.now().toString(36)}`;
    const code = dto.code || `CAT-CUST-${Math.floor(Math.random() * 89 + 10)}`;
    const thresholdPercent = dto.thresholdPercent ?? 85.0;
    const allocatedCents = Math.round(dto.allocated * 100);

    const insert = db.prepare(`
      INSERT INTO categories (id, code, name, allocated_cents, spent_cents, committed_cents, risk_level, threshold_percent)
      VALUES (?, ?, ?, ?, 0, 0, 'HEALTHY', ?)
    `);

    insert.run(id, code, dto.name, allocatedCents, thresholdPercent);

    // Append to cryptographic audit trail
    auditService.appendEvent(db, {
      actor: actorName,
      actorRole: actorRole as any,
      action: 'CATEGORY_SUBCAP_CREATED',
      entity: 'Spend Category',
      entityId: code,
      oldValue: 'STATUS: UNALLOCATED',
      newValue: `ALLOCATION: $${dto.allocated.toLocaleString('en-US')} (Threshold: ${thresholdPercent}%)`,
      reason: `Created category sub-cap: ${dto.name}`,
    });

    return {
      id,
      name: dto.name,
      code,
      allocated: dto.allocated,
      spent: 0,
      committed: 0,
      riskLevel: 'HEALTHY',
      thresholdPercent,
    };
  }
}

export const categoriesService = new CategoriesService();
