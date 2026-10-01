import { UserRole, GovernanceTier, TierDefinition } from '../types';

export interface PersonaCredential {
  role: UserRole;
  governanceTier: GovernanceTier;
  tierName: string;
  tierBadge: string;
  name: string;
  title: string;
  email: string;
  password: string;
  defaultTab: string;
  defaultTabLabel: string;
  avatar: string;
  department: string;
  spendingLimit: string;
  description: string;
  securityClearance: string;
  badgeLabel: string;
  permissions: string[];
  restrictions: string[];
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 1,
    code: 'TIER_1_EXECUTIVE',
    name: 'Tier 1 (Executive / C-Suite)',
    shortName: 'Executive / C-Suite',
    badgeLabel: 'TIER 1 · C-SUITE',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-100',
    authorityLimit: '₹415 Cr / Sovereign Discretionary',
    description: 'High-level summary metrics, strategy controls, policy threshold overrides, and enterprise audit logs.',
    capabilities: [
      'High-level summary metrics & global variance telemetry',
      'Strategy controls (capital freeze / emergency unfreeze)',
      'Policy threshold overrides (critical breach exceptions)',
      'Enterprise audit logs & cryptographic verification',
      'Statutory policy rules modification & deployment',
      'Full institutional sign-off authority',
    ],
    restrictions: [],
  },
  {
    tier: 2,
    code: 'TIER_2_CONTROLLER',
    name: 'Tier 2 (Finance Manager / Controller)',
    shortName: 'Finance Manager / Controller',
    badgeLabel: 'TIER 2 · CONTROLLER',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-indigo-100',
    authorityLimit: '₹83 Cr',
    description: 'Risk threshold adjustments, transaction approvals, and operational settings.',
    capabilities: [
      'Risk threshold adjustments (envelope & category caps)',
      'Transaction approvals & rejections (up to ₹83 Cr)',
      'Operational settings & institutional calibration',
      'Multi-envelope treasury liquidity reallocations',
      'Webhook alerts & notification parameter management',
    ],
    restrictions: [
      'No sovereign policy overrides (Tier 1 only)',
      'No emergency capital outflow freeze authority',
      'No statutory policy graph rules modification',
    ],
  },
  {
    tier: 3,
    code: 'TIER_3_ANALYST',
    name: 'Tier 3 (Risk / Financial Analyst)',
    shortName: 'Risk / Financial Analyst',
    badgeLabel: 'TIER 3 · RISK ANALYST (NO SIGN-OFF)',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 ring-sky-100',
    authorityLimit: '₹2.07 Cr (Data Entry / No Approval Authority)',
    description: 'Data entry, portfolio analysis, and model adjustments (no final sign-off authority).',
    capabilities: [
      'Data entry & spending requisition creation',
      'Portfolio analysis & departmental burn burndown',
      'Model adjustments & forward scenario sensitivity simulations',
      'Pre-clearance budget impact sandboxing',
      'Requisition escalation to Tier 2/1',
    ],
    restrictions: [
      'STRICTLY NO final sign-off / approval authority',
      'No policy threshold overrides',
      'No budget or risk threshold changes',
      'No system or operational settings modification',
    ],
  },
  {
    tier: 4,
    code: 'TIER_4_AUDITOR',
    name: 'Tier 4 (Read-Only / Auditor)',
    shortName: 'Read-Only / Auditor',
    badgeLabel: 'TIER 4 · READ-ONLY AUDITOR',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-100',
    authorityLimit: 'Read-Only Audit Clearance (Zero Mutations)',
    description: 'Read-only visibility into past reports, compliance logs, and risk metrics.',
    capabilities: [
      'Read-only visibility into past reports & variance ledgers',
      'Read-only compliance logs & SOX 404 audit ledger',
      'Inspection of risk metrics and validator node consensus',
      'Cryptographic ledger integrity verification',
    ],
    restrictions: [
      'STRICTLY READ-ONLY: All data mutations prohibited',
      'No requisition submissions or data entry',
      'No transaction approvals or rejections',
      'No model adjustments or threshold changes',
      'No settings modifications',
    ],
  },
];

export const PERSONA_CREDENTIALS: Record<UserRole, PersonaCredential> = {
  // Tier 1 Primary
  TIER_1_EXECUTIVE: {
    role: 'TIER_1_EXECUTIVE',
    governanceTier: 1,
    tierName: 'Tier 1 (Executive / C-Suite)',
    tierBadge: 'TIER 1 · C-SUITE',
    name: 'Victoria Sterling',
    title: 'Group Chief Financial Officer',
    email: 'cfo@apexfiscal.com',
    password: 'ApexCFO#2026',
    defaultTab: 'dashboard',
    defaultTabLabel: 'Executive Overview & Global Variance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    department: 'Global Treasury & Finance',
    spendingLimit: '₹415 Cr / Sovereign Discretionary',
    description: 'High-level summary metrics, strategy controls, policy threshold overrides, and enterprise audit logs.',
    securityClearance: 'Tier 1 Sovereign Root',
    badgeLabel: 'TIER 1 · C-SUITE',
    permissions: [
      'High-Level Summary Metrics & Global Variance',
      'Strategy Controls (Discretionary Capital Freeze)',
      'Policy Threshold Overrides on Exceptions',
      'Enterprise Audit Logs & Cryptographic Verification',
      'Statutory Policy Rules Creation & Enforcement',
    ],
    restrictions: [],
  },
  CFO: {
    role: 'CFO',
    governanceTier: 1,
    tierName: 'Tier 1 (Executive / C-Suite)',
    tierBadge: 'TIER 1 · C-SUITE',
    name: 'Victoria Sterling',
    title: 'Group Chief Financial Officer',
    email: 'cfo@apexfiscal.com',
    password: 'ApexCFO#2026',
    defaultTab: 'dashboard',
    defaultTabLabel: 'Executive Overview & Global Variance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    department: 'Global Treasury & Finance',
    spendingLimit: '₹415 Cr / Sovereign Discretionary',
    description: 'High-level summary metrics, strategy controls, policy threshold overrides, and enterprise audit logs.',
    securityClearance: 'Tier 1 Sovereign Root',
    badgeLabel: 'TIER 1 · C-SUITE',
    permissions: [
      'High-Level Summary Metrics & Global Variance',
      'Strategy Controls (Discretionary Capital Freeze)',
      'Policy Threshold Overrides on Exceptions',
      'Enterprise Audit Logs & Cryptographic Verification',
      'Statutory Policy Rules Creation & Enforcement',
    ],
    restrictions: [],
  },

  // Tier 2 Primary
  TIER_2_CONTROLLER: {
    role: 'TIER_2_CONTROLLER',
    governanceTier: 2,
    tierName: 'Tier 2 (Finance Manager / Controller)',
    tierBadge: 'TIER 2 · CONTROLLER',
    name: 'Marcus Vance',
    title: 'VP Treasury & Financial Controller',
    email: 'treasury@apexfiscal.com',
    password: 'Treasury#2026',
    defaultTab: 'budgets',
    defaultTabLabel: 'Treasury Allocations & Risk Controls',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    department: 'Corporate Finance & Treasury',
    spendingLimit: '₹83 Cr',
    description: 'Risk threshold adjustments, transaction approvals, and operational settings.',
    securityClearance: 'Tier 2 Controller Clearance',
    badgeLabel: 'TIER 2 · CONTROLLER',
    permissions: [
      'Risk Threshold Adjustments (Envelopes & Categories)',
      'Transaction Approvals & Rejections (up to ₹83 Cr)',
      'Operational Settings & Institutional Calibration',
      'Multi-Envelope Liquidity Reallocation',
      'Critical Exception Queue Triage (Non-Sovereign)',
    ],
    restrictions: [
      'No sovereign policy overrides (Tier 1 only)',
      'No emergency capital outflow freeze authority',
      'No statutory policy graph rules modification',
    ],
  },
  FINANCE_ADMIN: {
    role: 'FINANCE_ADMIN',
    governanceTier: 2,
    tierName: 'Tier 2 (Finance Manager / Controller)',
    tierBadge: 'TIER 2 · CONTROLLER',
    name: 'Marcus Vance',
    title: 'VP Treasury & Financial Controller',
    email: 'treasury@apexfiscal.com',
    password: 'Treasury#2026',
    defaultTab: 'budgets',
    defaultTabLabel: 'Treasury Allocations & Risk Controls',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    department: 'Corporate Finance & Treasury',
    spendingLimit: '₹83 Cr',
    description: 'Risk threshold adjustments, transaction approvals, and operational settings.',
    securityClearance: 'Tier 2 Controller Clearance',
    badgeLabel: 'TIER 2 · CONTROLLER',
    permissions: [
      'Risk Threshold Adjustments (Envelopes & Categories)',
      'Transaction Approvals & Rejections (up to ₹83 Cr)',
      'Operational Settings & Institutional Calibration',
      'Multi-Envelope Liquidity Reallocation',
      'Critical Exception Queue Triage (Non-Sovereign)',
    ],
    restrictions: [
      'No sovereign policy overrides (Tier 1 only)',
      'No emergency capital outflow freeze authority',
      'No statutory policy graph rules modification',
    ],
  },

  // Tier 3 Primary (NO final sign-off authority)
  TIER_3_ANALYST: {
    role: 'TIER_3_ANALYST',
    governanceTier: 3,
    tierName: 'Tier 3 (Risk / Financial Analyst)',
    tierBadge: 'TIER 3 · RISK ANALYST',
    name: 'Alex Rivera',
    title: 'Lead Financial & Risk Portfolio Analyst',
    email: 'requisitioner@apexfiscal.com',
    password: 'Requisition#2026',
    defaultTab: 'spending',
    defaultTabLabel: 'Purchase Requisitions & Sandbox',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    department: 'Risk Intelligence & Infrastructure',
    spendingLimit: '₹2.07 Cr (Data Entry / No Approval Authority)',
    description: 'Data entry, portfolio analysis, and model adjustments (no final sign-off authority).',
    securityClearance: 'Tier 3 Analyst Clearance',
    badgeLabel: 'TIER 3 · ANALYST (NO SIGN-OFF)',
    permissions: [
      'Data Entry & Requisition Submission',
      'Portfolio Spend Velocity & Headroom Analysis',
      'Forecasting Model Adjustments & Sensitivity Simulations',
      'Pre-Clearance Impact Sandboxing',
      'Requisition Escalation to Tier 2 Controller',
    ],
    restrictions: [
      'STRICTLY NO final sign-off / approval authority',
      'No policy threshold overrides',
      'No budget or risk threshold changes',
      'No system or operational settings modification',
    ],
  },
  EMPLOYEE: {
    role: 'EMPLOYEE',
    governanceTier: 3,
    tierName: 'Tier 3 (Risk / Financial Analyst)',
    tierBadge: 'TIER 3 · RISK ANALYST',
    name: 'Alex Rivera',
    title: 'Lead Financial & Risk Portfolio Analyst',
    email: 'requisitioner@apexfiscal.com',
    password: 'Requisition#2026',
    defaultTab: 'spending',
    defaultTabLabel: 'Purchase Requisitions & Sandbox',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    department: 'Risk Intelligence & Infrastructure',
    spendingLimit: '₹2.07 Cr (Data Entry / No Approval Authority)',
    description: 'Data entry, portfolio analysis, and model adjustments (no final sign-off authority).',
    securityClearance: 'Tier 3 Analyst Clearance',
    badgeLabel: 'TIER 3 · ANALYST (NO SIGN-OFF)',
    permissions: [
      'Data Entry & Requisition Submission',
      'Portfolio Spend Velocity & Headroom Analysis',
      'Forecasting Model Adjustments & Sensitivity Simulations',
      'Pre-Clearance Impact Sandboxing',
      'Requisition Escalation to Tier 2 Controller',
    ],
    restrictions: [
      'STRICTLY NO final sign-off / approval authority',
      'No policy threshold overrides',
      'No budget or risk threshold changes',
      'No system or operational settings modification',
    ],
  },
  DEPT_MANAGER: {
    role: 'DEPT_MANAGER',
    governanceTier: 3,
    tierName: 'Tier 3 (Risk / Financial Analyst)',
    tierBadge: 'TIER 3 · RISK ANALYST',
    name: 'Sarah Jenkins',
    title: 'VP of Platform Engineering (Cost Center Lead)',
    email: 'eng.lead@apexfiscal.com',
    password: 'DeptManager#2026',
    defaultTab: 'approvals',
    defaultTabLabel: 'Cost Center Burn & Escalations',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    department: 'Engineering - Platform Core',
    spendingLimit: '₹16.60 Cr',
    description: 'Cost center analysis, spend pacing, and workflow escalations to Controller.',
    securityClearance: 'Tier 3 Analyst & Dept Lead',
    badgeLabel: 'TIER 3 · DEPT LEAD',
    permissions: [
      'Cost Center Headroom & Burn Velocity Analysis',
      'Requisition Evaluation & Escalation to Tier 2',
      'Pre-Clearance Impact Sandboxing',
      'Departmental Spending Forecast Simulations',
    ],
    restrictions: [
      'No final sign-off authority without Tier 2 Controller co-sign',
      'No policy threshold overrides',
      'No operational settings modification',
    ],
  },

  // Tier 4 Primary (Read-Only)
  TIER_4_AUDITOR: {
    role: 'TIER_4_AUDITOR',
    governanceTier: 4,
    tierName: 'Tier 4 (Read-Only / Auditor)',
    tierBadge: 'TIER 4 · READ-ONLY AUDITOR',
    name: 'Devon Thorne',
    title: 'Statutory Compliance & Internal Controls Auditor',
    email: 'admin@apexfiscal.com',
    password: 'SysAdmin#2026',
    defaultTab: 'audit',
    defaultTabLabel: 'Cryptographic Ledger & Compliance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    department: 'InfoSec & Internal Controls',
    spendingLimit: 'Read-Only Audit Clearance (Zero Mutations)',
    description: 'Read-only visibility into past reports, compliance logs, and risk metrics.',
    securityClearance: 'Tier 4 Compliance Auditor',
    badgeLabel: 'TIER 4 · READ-ONLY AUDITOR',
    permissions: [
      'Read-Only Visibility: Variance & Past Financial Reports',
      'Read-Only Visibility: SOX 404 Cryptographic Audit Trail',
      'Read-Only Visibility: Compliance Logs & Breach Records',
      'Ledger Integrity Verification & Hash Continuity Check',
      'PBFT Consensus Node Health Monitoring',
    ],
    restrictions: [
      'STRICTLY READ-ONLY: All data mutations prohibited',
      'No data entry or requisition submissions',
      'No transaction approvals or rejections',
      'No model adjustments or threshold changes',
      'No settings modifications',
    ],
  },
  SYSTEM_ADMIN: {
    role: 'SYSTEM_ADMIN',
    governanceTier: 4,
    tierName: 'Tier 4 (Read-Only / Auditor)',
    tierBadge: 'TIER 4 · READ-ONLY AUDITOR',
    name: 'Devon Thorne',
    title: 'Statutory Compliance & Internal Controls Auditor',
    email: 'admin@apexfiscal.com',
    password: 'SysAdmin#2026',
    defaultTab: 'audit',
    defaultTabLabel: 'Cryptographic Ledger & Compliance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    department: 'InfoSec & Internal Controls',
    spendingLimit: 'Read-Only Audit Clearance (Zero Mutations)',
    description: 'Read-only visibility into past reports, compliance logs, and risk metrics.',
    securityClearance: 'Tier 4 Compliance Auditor',
    badgeLabel: 'TIER 4 · READ-ONLY AUDITOR',
    permissions: [
      'Read-Only Visibility: Variance & Past Financial Reports',
      'Read-Only Visibility: SOX 404 Cryptographic Audit Trail',
      'Read-Only Visibility: Compliance Logs & Breach Records',
      'Ledger Integrity Verification & Hash Continuity Check',
      'PBFT Consensus Node Health Monitoring',
    ],
    restrictions: [
      'STRICTLY READ-ONLY: All data mutations prohibited',
      'No data entry or requisition submissions',
      'No transaction approvals or rejections',
      'No model adjustments or threshold changes',
      'No settings modifications',
    ],
  },
};

// 4 Primary Personas representing the exact 4-Tier Financial Governance Hierarchy
export const PRIMARY_TIER_PERSONAS: PersonaCredential[] = [
  PERSONA_CREDENTIALS.TIER_1_EXECUTIVE,
  PERSONA_CREDENTIALS.TIER_2_CONTROLLER,
  PERSONA_CREDENTIALS.TIER_3_ANALYST,
  PERSONA_CREDENTIALS.TIER_4_AUDITOR,
];

export const PERSONAS_LIST = Object.values(PERSONA_CREDENTIALS);

export function getGovernanceTier(role: UserRole | string): GovernanceTier {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'TIER_1_EXECUTIVE' || normalized === 'CFO') return 1;
  if (normalized === 'TIER_2_CONTROLLER' || normalized === 'FINANCE_ADMIN') return 2;
  if (normalized === 'TIER_3_ANALYST' || normalized === 'EMPLOYEE' || normalized === 'DEPT_MANAGER') return 3;
  if (normalized === 'TIER_4_AUDITOR' || normalized === 'SYSTEM_ADMIN') return 4;
  return 4;
}

export const ROLE_DEFAULT_TABS: Record<UserRole, string> = {
  TIER_1_EXECUTIVE: 'dashboard',
  CFO: 'dashboard',
  TIER_2_CONTROLLER: 'budgets',
  FINANCE_ADMIN: 'budgets',
  TIER_3_ANALYST: 'spending',
  EMPLOYEE: 'spending',
  DEPT_MANAGER: 'approvals',
  TIER_4_AUDITOR: 'audit',
  SYSTEM_ADMIN: 'audit',
};

export const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  TIER_1_EXECUTIVE: [
    'dashboard',
    'budgets',
    'spending',
    'approvals',
    'exceptions',
    'forecasts',
    'departments',
    'categories',
    'policies',
    'reports',
    'audit',
    'settings',
  ],
  CFO: [
    'dashboard',
    'budgets',
    'spending',
    'approvals',
    'exceptions',
    'forecasts',
    'departments',
    'categories',
    'policies',
    'reports',
    'audit',
    'settings',
  ],
  TIER_2_CONTROLLER: [
    'dashboard',
    'budgets',
    'spending',
    'approvals',
    'exceptions',
    'forecasts',
    'departments',
    'categories',
    'reports',
    'audit',
    'settings',
  ],
  FINANCE_ADMIN: [
    'dashboard',
    'budgets',
    'spending',
    'approvals',
    'exceptions',
    'forecasts',
    'departments',
    'categories',
    'reports',
    'audit',
    'settings',
  ],
  TIER_3_ANALYST: [
    'dashboard',
    'departments',
    'spending',
    'approvals',
    'forecasts',
    'reports',
  ],
  EMPLOYEE: [
    'dashboard',
    'departments',
    'spending',
    'approvals',
    'forecasts',
    'reports',
  ],
  DEPT_MANAGER: [
    'dashboard',
    'departments',
    'spending',
    'approvals',
    'exceptions',
    'forecasts',
    'reports',
  ],
  TIER_4_AUDITOR: [
    'audit',
    'reports',
    'dashboard',
    'budgets',
    'departments',
    'categories',
    'forecasts',
    'policies',
    'settings',
  ],
  SYSTEM_ADMIN: [
    'audit',
    'reports',
    'dashboard',
    'budgets',
    'departments',
    'categories',
    'forecasts',
    'policies',
    'settings',
  ],
};

export function authenticatePersona(identifier: string, password: string): PersonaCredential | null {
  const normalizedId = identifier.trim().toLowerCase();
  const persona = PERSONAS_LIST.find((p) => {
    const emailMatch = p.email.toLowerCase() === normalizedId;
    const usernameMatch = p.email.split('@')[0].toLowerCase() === normalizedId;
    const nameMatch = p.name.toLowerCase() === normalizedId;
    const roleMatch = p.role.toLowerCase() === normalizedId;
    const tierMatch = `tier ${p.governanceTier}` === normalizedId || `tier${p.governanceTier}` === normalizedId;
    return (emailMatch || usernameMatch || nameMatch || roleMatch || tierMatch) && p.password === password.trim();
  });
  return persona || null;
}
