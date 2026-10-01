import { getDb, runTransaction } from '../../db/connection';
import { AppError } from '../../middleware/errorHandler';
import { UserRole, getTierForRole, getTierMetadata, GovernanceTier } from '../../types/common';
import { auditService } from '../audit/audit.service';

export interface SystemSettingsDTO {
  isEmergencyFreezeActive: boolean;
  inrExchangeRate: number;
  slackWebhook: string;
  pagerdutyKey: string;
  fiscalQuarter: string;
  consensusNodes: string;
  auditRetention: string;
  updatedAt: string;
  governanceTiers: Array<ReturnType<typeof getTierMetadata>>;
}

export interface UpdateOperationalSettingsInput {
  inrExchangeRate?: number;
  slackWebhook?: string;
  pagerdutyKey?: string;
}

export class SettingsService {
  public getSettings(): SystemSettingsDTO {
    const db = getDb();
    const row = db.prepare('SELECT * FROM system_settings WHERE id = ?').get('global') as any;

    const tiers: Array<ReturnType<typeof getTierMetadata>> = ([1, 2, 3, 4] as GovernanceTier[]).map((t) =>
      getTierMetadata(t)
    );

    if (!row) {
      return {
        isEmergencyFreezeActive: false,
        inrExchangeRate: 83.0,
        slackWebhook: 'https://hooks.slack.com/services/T000/B000/apex-spend-guard',
        pagerdutyKey: 'pd-live-9a2c4e88102f9',
        fiscalQuarter: 'Q3 FY 2026',
        consensusNodes: '12 / 12 Nodes Online',
        auditRetention: '7 Years / Immutable WORM',
        updatedAt: new Date().toISOString(),
        governanceTiers: tiers,
      };
    }

    return {
      isEmergencyFreezeActive: Boolean(row.is_emergency_freeze_active),
      inrExchangeRate: row.inr_exchange_rate || 83.0,
      slackWebhook: row.slack_webhook || 'https://hooks.slack.com/services/T000/B000/apex-spend-guard',
      pagerdutyKey: row.pagerduty_key || 'pd-live-9a2c4e88102f9',
      fiscalQuarter: 'Q3 FY 2026',
      consensusNodes: '12 / 12 Nodes Online',
      auditRetention: '7 Years / Immutable WORM',
      updatedAt: row.updated_at || new Date().toISOString(),
      governanceTiers: tiers,
    };
  }

  public updateOperationalSettings(
    input: UpdateOperationalSettingsInput,
    actorName: string,
    actorRole: UserRole
  ): SystemSettingsDTO {
    const tier = getTierForRole(actorRole);
    if (tier > 2) {
      throw new AppError(
        'Modifying operational parameters requires Tier 2 (Finance Manager / Controller) or higher clearance.',
        403,
        'INSUFFICIENT_PRIVILEGES'
      );
    }

    return runTransaction((db) => {
      const current = this.getSettings();

      const newRate = input.inrExchangeRate !== undefined ? input.inrExchangeRate : current.inrExchangeRate;
      const newSlack = input.slackWebhook !== undefined ? input.slackWebhook : current.slackWebhook;
      const newPager = input.pagerdutyKey !== undefined ? input.pagerdutyKey : current.pagerdutyKey;

      db.prepare(`
        UPDATE system_settings
        SET inr_exchange_rate = ?,
            slack_webhook = ?,
            pagerduty_key = ?,
            updated_at = datetime('now')
        WHERE id = 'global'
      `).run(newRate, newSlack, newPager);

      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'OPERATIONAL_SETTINGS_UPDATED',
        entity: 'SystemConfiguration',
        entityId: 'global',
        oldValue: JSON.stringify({ rate: current.inrExchangeRate, slack: current.slackWebhook, pagerduty: current.pagerdutyKey }),
        newValue: JSON.stringify({ rate: newRate, slack: newSlack, pagerduty: newPager }),
        reason: 'Operational parameter calibration by authorized controller/executive',
      });

      return this.getSettings();
    });
  }

  public triggerEmergencyFreeze(actorName: string, actorRole: UserRole): SystemSettingsDTO {
    const tier = getTierForRole(actorRole);
    if (tier !== 1) {
      throw new AppError(
        'Activating the Global Capital Outflow Killswitch strictly requires Tier 1 (Executive / C-Suite) Sovereign Authority.',
        403,
        'INSUFFICIENT_PRIVILEGES'
      );
    }

    return runTransaction((db) => {
      db.prepare(`
        UPDATE system_settings
        SET is_emergency_freeze_active = 1,
            updated_at = datetime('now')
        WHERE id = 'global'
      `).run();

      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'EMERGENCY_CAPITAL_FREEZE_TRIGGERED',
        entity: 'Killswitch',
        entityId: 'global',
        oldValue: 'FREEZE: INACTIVE',
        newValue: 'FREEZE: ACTIVE',
        reason: 'Executive discretionary emergency capital outflow freeze engaged',
      });

      return this.getSettings();
    });
  }

  public resolveEmergencyFreeze(actorName: string, actorRole: UserRole): SystemSettingsDTO {
    const tier = getTierForRole(actorRole);
    if (tier !== 1) {
      throw new AppError(
        'Lifting the Global Capital Outflow Killswitch strictly requires Tier 1 (Executive / C-Suite) Sovereign Authority.',
        403,
        'INSUFFICIENT_PRIVILEGES'
      );
    }

    return runTransaction((db) => {
      db.prepare(`
        UPDATE system_settings
        SET is_emergency_freeze_active = 0,
            updated_at = datetime('now')
        WHERE id = 'global'
      `).run();

      auditService.appendEvent(db, {
        actor: actorName,
        actorRole,
        action: 'EMERGENCY_CAPITAL_FREEZE_LIFTED',
        entity: 'Killswitch',
        entityId: 'global',
        oldValue: 'FREEZE: ACTIVE',
        newValue: 'FREEZE: INACTIVE',
        reason: 'Executive authorization lifting global disbursement halt protocol',
      });

      return this.getSettings();
    });
  }
}

export const settingsService = new SettingsService();
