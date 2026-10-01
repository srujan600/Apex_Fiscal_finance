export type GovernanceTier = 1 | 2 | 3 | 4;

export type UserRole = 
  | 'TIER_1_EXECUTIVE'
  | 'TIER_2_CONTROLLER'
  | 'TIER_3_ANALYST'
  | 'TIER_4_AUDITOR'
  | 'CFO' 
  | 'FINANCE_ADMIN' 
  | 'DEPT_MANAGER' 
  | 'EMPLOYEE' 
  | 'SYSTEM_ADMIN';

export type Currency = 'USD' | 'INR';

export type RiskLevel = 'HEALTHY' | 'ATTENTION' | 'HIGH_RISK' | 'CRITICAL_BREACH';

export type RequestStatus = 
  | 'PRE_CLEARED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'APPROVED_OVERRIDE'
  | 'BLOCKED'
  | 'REJECTED';

export type BreachClassification = 
  | 'CRITICAL_EXCEPTION'
  | 'WARNING_AUDIT'
  | 'POLICY_OVERRIDE'
  | 'CAPEX_UNSCHEDULED';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version?: string;
    [key: string]: any;
  };
}

export interface UserContext {
  id: string;
  name: string;
  role: UserRole;
  governanceTier: GovernanceTier;
  tierName: string;
  tierBadge: string;
  title: string;
  avatar: string;
  department: string;
  spendingLimitCents: number;
}

export interface TierMetadata {
  tier: GovernanceTier;
  code: string;
  name: string;
  badgeLabel: string;
  description: string;
  capabilities: string[];
  restrictions: string[];
}

export function getTierForRole(role: string): GovernanceTier {
  const normalized = role?.toUpperCase() || '';
  if (normalized === 'TIER_1_EXECUTIVE' || normalized === 'CFO') {
    return 1;
  }
  if (normalized === 'TIER_2_CONTROLLER' || normalized === 'FINANCE_ADMIN') {
    return 2;
  }
  if (normalized === 'TIER_3_ANALYST' || normalized === 'DEPT_MANAGER' || normalized === 'EMPLOYEE') {
    return 3;
  }
  if (normalized === 'TIER_4_AUDITOR' || normalized === 'SYSTEM_ADMIN') {
    return 4;
  }
  return 4;
}

export function getTierMetadata(tier: GovernanceTier): TierMetadata {
  switch (tier) {
    case 1:
      return {
        tier: 1,
        code: 'TIER_1_EXECUTIVE',
        name: 'Tier 1 (Executive / C-Suite)',
        badgeLabel: 'TIER 1 · C-SUITE',
        description: 'High-level summary metrics, strategy controls, policy threshold overrides, and enterprise audit logs.',
        capabilities: [
          'High-level summary metrics & global variance telemetry',
          'Strategy controls (capital freeze / emergency unfreeze)',
          'Policy threshold overrides (critical breach exceptions)',
          'Enterprise audit logs & cryptographic verification',
          'Statutory policy rules modification',
        ],
        restrictions: [],
      };
    case 2:
      return {
        tier: 2,
        code: 'TIER_2_CONTROLLER',
        name: 'Tier 2 (Finance Manager / Controller)',
        badgeLabel: 'TIER 2 · CONTROLLER',
        description: 'Risk threshold adjustments, transaction approvals, and operational settings.',
        capabilities: [
          'Risk threshold adjustments (budgets & categories)',
          'Transaction approvals & rejections',
          'Operational settings & dual currency calibration',
          'Budget envelope reallocation & treasury management',
        ],
        restrictions: [
          'No sovereign policy overrides',
          'No emergency capital outflow freeze authority',
          'No statutory policy creation or graph toggling',
        ],
      };
    case 3:
      return {
        tier: 3,
        code: 'TIER_3_ANALYST',
        name: 'Tier 3 (Risk / Financial Analyst)',
        badgeLabel: 'TIER 3 · RISK ANALYST',
        description: 'Data entry, portfolio analysis, and model adjustments (no final sign-off authority).',
        capabilities: [
          'Data entry & spending requisition initiation',
          'Portfolio analysis & departmental spend tracking',
          'Model adjustments & forward scenario simulations',
          'Pre-clearance budget impact sandboxing',
          'Requisition escalation to Tier 2/1',
        ],
        restrictions: [
          'STRICTLY NO final sign-off / approval authority',
          'No policy threshold overrides',
          'No risk threshold or envelope modifications',
          'No operational or system settings changes',
        ],
      };
    case 4:
      return {
        tier: 4,
        code: 'TIER_4_AUDITOR',
        name: 'Tier 4 (Read-Only / Auditor)',
        badgeLabel: 'TIER 4 · READ-ONLY AUDITOR',
        description: 'Read-only visibility into past reports, compliance logs, and risk metrics.',
        capabilities: [
          'Read-only visibility into past financial reports & variance',
          'Read-only compliance logs & SOX 404 audit ledger',
          'Inspection of risk metrics and validator node consensus',
          'Cryptographic ledger integrity verification',
        ],
        restrictions: [
          'STRICTLY READ-ONLY: All data mutations prohibited',
          'No data entry or requisition submissions',
          'No transaction approvals or rejections',
          'No model adjustments or threshold changes',
          'No settings modifications',
        ],
      };
  }
}
