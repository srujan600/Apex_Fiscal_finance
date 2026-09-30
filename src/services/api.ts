import { UserProfile, UserRole, SpendCategory } from '../types';

const API_BASE = '/api';

export interface DepartmentDetail {
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

export class ApiClient {
  private activeRole: UserRole = 'CFO';

  public setRole(role: UserRole) {
    this.activeRole = role;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': this.activeRole,
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `HTTP error ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  }

  // --- Users & Auth ---
  public async getUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/users');
  }

  public async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>('/users/me');
  }

  public async switchRole(role: UserRole): Promise<{ activeRole: UserRole; user: UserProfile }> {
    this.setRole(role);
    return this.request<{ activeRole: UserRole; user: UserProfile }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  // --- Departments ---
  public async getDepartments(): Promise<DepartmentDetail[]> {
    return this.request<DepartmentDetail[]>('/departments');
  }

  public async getDepartment(id: string): Promise<DepartmentDetail> {
    return this.request<DepartmentDetail>(`/departments/${id}`);
  }

  // --- Categories ---
  public async getCategories(): Promise<SpendCategory[]> {
    return this.request<SpendCategory[]>('/categories');
  }

  public async createCategory(data: {
    name: string;
    allocated: number;
    thresholdPercent?: number;
    code?: string;
  }): Promise<SpendCategory> {
    return this.request<SpendCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Budgets ---
  public async getBudgets(): Promise<any[]> {
    return this.request<any[]>('/budgets');
  }

  public async getBudget(id: string): Promise<any> {
    return this.request<any>(`/budgets/${id}`);
  }

  public async createBudget(data: {
    departmentName: string;
    allocated: number;
    fiscalPeriod?: string;
    leadManager?: string;
    warningThresholdPct?: number;
    hardCapThresholdPct?: number;
  }): Promise<any> {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateBudget(
    id: string,
    data: { allocated: number; justification: string }
  ): Promise<any> {
    return this.request<any>(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async reallocateBudget(data: {
    sourceId: string;
    targetId: string;
    amount: number;
    reason?: string;
  }): Promise<{ source: any; target: any }> {
    return this.request<{ source: any; target: any }>('/budgets/reallocate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Spending Requisitions ---
  public async getSpendingRequests(params?: { status?: string; search?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/spending${qs}`);
  }

  public async getSpendingRequest(id: string): Promise<any> {
    return this.request<any>(`/spending/${id}`);
  }

  public async createSpendingRequest(data: any): Promise<any> {
    return this.request<any>('/spending', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async simulatePreClearance(data: { departmentId: string; amount: number }): Promise<any> {
    return this.request<any>('/spending/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Policy Engine ---
  public async getPolicies(status?: string): Promise<any[]> {
    const qs = status && status !== 'ALL' ? `?status=${status}` : '';
    return this.request<any[]>(`/policies${qs}`);
  }

  public async getPolicy(id: string): Promise<any> {
    return this.request<any>(`/policies/${id}`);
  }

  public async createPolicy(data: {
    code?: string;
    name: string;
    conditionExpression: string;
    thresholdValue: number;
    actionRequired: string;
    targetEntity?: string;
    status?: string;
  }): Promise<any> {
    return this.request<any>('/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async togglePolicy(id: string): Promise<any> {
    return this.request<any>(`/policies/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  public async evaluatePolicies(data: {
    amount: number;
    departmentId?: string;
    departmentName?: string;
    categoryId?: string;
    category?: string;
    vendor?: string;
  }): Promise<any> {
    return this.request<any>('/policies/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Approvals ---
  public async getPendingApprovals(): Promise<any[]> {
    return this.request<any[]>('/approvals');
  }

  public async approveRequest(id: string): Promise<any> {
    return this.request<any>(`/approvals/${id}/approve`, {
      method: 'POST',
    });
  }

  public async rejectRequest(id: string, reason: string): Promise<any> {
    return this.request<any>(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async escalateRequest(id: string, note?: string): Promise<any> {
    return this.request<any>(`/approvals/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  // --- Exceptions ---
  public async getExceptions(status?: string): Promise<any[]> {
    const qs = status && status !== 'ALL' ? `?status=${status}` : '';
    return this.request<any[]>(`/exceptions${qs}`);
  }

  public async getException(id: string): Promise<any> {
    return this.request<any>(`/exceptions/${id}`);
  }

  public async overrideException(
    id: string,
    justification: string,
    offsetSource?: string
  ): Promise<any> {
    return this.request<any>(`/exceptions/${id}/override`, {
      method: 'POST',
      body: JSON.stringify({ justification, offsetSource }),
    });
  }

  public async enforceRejectException(id: string, reason?: string): Promise<any> {
    return this.request<any>(`/exceptions/${id}/enforce-reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async rebalanceAndResolveException(
    id: string,
    data: { sourceBudgetId: string; amount: number; justification?: string }
  ): Promise<any> {
    return this.request<any>(`/exceptions/${id}/rebalance-resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Forecasting & Sensitivity Engine ---
  public async getForecastSummary(params?: {
    scenario?: string;
    stressFactor?: number;
    horizon?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.scenario) query.append('scenario', params.scenario);
    if (params?.stressFactor !== undefined) query.append('stressFactor', params.stressFactor.toString());
    if (params?.horizon) query.append('horizon', params.horizon);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/forecasts/summary${qs}`);
  }

  public async getForecastRisks(): Promise<any[]> {
    return this.request<any[]>('/forecasts/risks');
  }

  public async getForecastMitigations(): Promise<any[]> {
    return this.request<any[]>('/forecasts/mitigations');
  }

  public async simulateSensitivity(data: {
    scenario?: string;
    stressFactor?: number;
    emergencyContingency?: number;
  }): Promise<any> {
    return this.request<any>('/forecasts/simulate-sensitivity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Aczen Nova AI Advisory Engine ---
  public async getAiStatus(): Promise<any> {
    return this.request<any>('/ai/status');
  }

  public async explainBudget(data: {
    budgetId?: string;
    departmentName?: string;
    allocatedBudget?: number;
    actualSettled?: number;
    committedSpend?: number;
    availableHeadroom?: number;
    utilizationPercent?: number;
    projectedOverrun?: number;
    riskLevel?: string;
    daysToExhaustion?: number;
  }): Promise<any> {
    return this.request<any>('/ai/explain-budget', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async explainForecast(data: {
    scenario?: string;
    stressFactor?: number;
    horizon?: string;
  }): Promise<any> {
    return this.request<any>('/ai/explain-forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async explainApproval(requestId: string): Promise<any> {
    return this.request<any>('/ai/explain-approval', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  public async explainAnomaly(exceptionId: string): Promise<any> {
    return this.request<any>('/ai/explain-anomaly', {
      method: 'POST',
      body: JSON.stringify({ exceptionId }),
    });
  }

  public async getManagementInsights(): Promise<any> {
    return this.request<any>('/ai/management-insights');
  }

  public async getNovaLiveSummary(): Promise<any> {
    return this.request<any>('/ai/nova/live-summary');
  }

  public async getNovaStatus(): Promise<any> {
    return this.request<any>('/ai/status');
  }

  // --- Aczen Nova AI Copilot / Agent ---
  public async getAgentCapabilities(): Promise<any> {
    return this.request<any>('/ai/agent/capabilities');
  }

  public async chatWithAgent(payload: {
    message: string;
    conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string }[];
    context?: any;
  }): Promise<any> {
    return this.request<any>('/ai/agent/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Dashboard Aggregates ---
  public async getDashboardSummary(): Promise<any> {
    return this.request<any>('/dashboard/summary');
  }

  public async getSpendTrajectory(): Promise<any[]> {
    return this.request<any[]>('/dashboard/trajectory');
  }

  // --- Reporting & Variance Analysis ---
  public async getVarianceReport(period?: string): Promise<any> {
    const qs = period ? `?period=${period}` : '';
    return this.request<any>(`/reports/variance${qs}`);
  }

  public getExportCsvUrl(type: 'variance' | 'spending' | 'audit' | 'budgets', period?: string): string {
    const qs = period ? `&period=${period}` : '';
    return `/api/reports/export/csv?type=${type}${qs}`;
  }

  // --- Cryptographic Audit Trail ---
  public async getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    role?: string;
    action?: string;
    search?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.role && options.role !== 'ALL') params.set('role', options.role);
    if (options?.action && options.action !== 'ALL') params.set('action', options.action);
    if (options?.search) params.set('search', options.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/audit${qs}`);
  }

  public async verifyAuditLedger(): Promise<any> {
    return this.request<any>('/audit/verify');
  }
}

export const api = new ApiClient();

