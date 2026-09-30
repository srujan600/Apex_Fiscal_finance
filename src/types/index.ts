export type UserRole = 
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

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  department: string;
  spendingLimit: number;
}

export interface BudgetEnvelope {
  id: string;
  code: string;
  departmentId: string;
  departmentName: string;
  allocated: number;
  actualSettled: number;
  committed: number;
  available: number;
  utilizationRate: number;
  projectedOverrun: number;
  riskLevel: RiskLevel;
  daysToRunOut: number;
  leadManager: string;
  fiscalPeriod: string;
}

export interface SpendCategory {
  id: string;
  name: string;
  code: string;
  allocated: number;
  spent: number;
  committed: number;
  riskLevel: RiskLevel;
  thresholdPercent: number;
}

export interface SpendingRequest {
  id: string;
  trackingNumber: string;
  category: string;
  categoryId: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  vendor: string;
  businessPurpose: string;
  requestedBy: string;
  requestorRole: string;
  submittedAt: string;
  status: RequestStatus;
  riskLevel: RiskLevel;
  ruleTriggered?: string;
  policyReason?: string;
  preCommitmentUtil: number;
  postCommitmentUtil: number;
  hasAttachment?: boolean;
}

export interface ExceptionIncident {
  id: string;
  incidentCode: string;
  timestamp: string;
  detectionSource: string;
  department: string;
  subDepartment: string;
  vendor: string;
  businessPurpose: string;
  violationDetail: string;
  commitmentValue: number;
  breachClassification: BreachClassification;
  ruleCode: string;
  status: 'PENDING_DECISION' | 'OVERRIDDEN' | 'ENFORCED_REJECTED';
}

export interface PolicyRule {
  id: string;
  code: string;
  name: string;
  conditionExpression: string;
  thresholdValue: number;
  actionRequired: 'AUTO_BLOCK' | 'REQUIRE_CFO_OVERRIDE' | 'REQUIRE_MANAGER' | 'WARN_AUDIT';
  targetEntity: string;
  status: 'ACTIVE' | 'PAUSED';
  latencyMs: number;
}

export interface AuditEvent {
  id: string;
  blockNumber: number;
  txHash: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  verifiedNodes: string;
}
