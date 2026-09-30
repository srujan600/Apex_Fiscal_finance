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
  title: string;
  avatar: string;
  department: string;
  spendingLimitCents: number;
}
