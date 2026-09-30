import { env } from '../../config/env';
import {
  NovaCompletionRequest,
  NovaCompletionResponse,
  AczenNovaBudget,
  AczenNovaExpense,
  AczenNovaDepartment,
  AczenNovaLiveAnalysis,
} from './nova.types';
import { NovaAuthError, NovaTimeoutError, NovaError, NovaConfigurationError } from './nova.errors';

export class NovaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(customBaseUrl?: string, customApiKey?: string, timeoutMs = 12000) {
    this.baseUrl = (customBaseUrl || process.env.NOVA_BASE_URL || env.NOVA_BASE_URL || 'https://www.aczen.in/nova-api/v1').replace(/\/+$/, '');
    this.apiKey = customApiKey !== undefined ? customApiKey : (process.env.NOVA_API_KEY || env.NOVA_API_KEY || '').trim();
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validates that NOVA_API_KEY is present at runtime.
   * Raises a clear NovaConfigurationError if missing.
   */
  public validateConfiguration(): void {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new NovaConfigurationError(
        'Missing required environment variable: NOVA_API_KEY. Please set NOVA_API_KEY in your .env file.'
      );
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Performs an authenticated GET request against Aczen Nova's Read-Only Financial API
   */
  private async get<T>(path: string, queryParams?: Record<string, any>): Promise<T> {
    if (!this.isConfigured()) {
      throw new NovaAuthError('Aczen Nova API key is not configured in server environment');
    }

    let url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined && v !== null) {
          sp.append(k, String(v));
        }
      }
      url += `?${sp.toString()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new NovaAuthError(`Aczen Nova authentication failed with status ${response.status}`);
        }
        const errorText = await response.text().catch(() => 'Unknown upstream error');
        throw new NovaError(
          `Aczen Nova API returned HTTP error ${response.status}: ${errorText.slice(0, 200)}`,
          response.status,
          response.status >= 500
        );
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new NovaTimeoutError(`Aczen Nova API call timed out after ${this.timeoutMs}ms`);
      }
      if (error instanceof NovaError) {
        throw error;
      }
      throw new NovaError(`Network error communicating with Aczen Nova: ${error.message}`);
    }
  }

  /**
   * Health check for Aczen Nova API
   */
  public async getHealth(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/health');
  }

  /**
   * Fetches real-time budget envelopes from Aczen Nova
   */
  public async getBudgets(params?: {
    limit?: number;
    offset?: number;
    department_id?: string;
    category?: string;
    month?: string;
  }): Promise<{ data: AczenNovaBudget[]; pagination: { limit: number; offset: number; total: number; has_more: boolean } }> {
    return this.get<{ data: AczenNovaBudget[]; pagination: any }>('/budgets', params);
  }

  /**
   * Fetches real-time company expenses from Aczen Nova
   */
  public async getExpenses(params?: {
    limit?: number;
    offset?: number;
    department_id?: string;
    category?: string;
  }): Promise<{ data: AczenNovaExpense[]; pagination: { limit: number; offset: number; total: number; has_more: boolean } }> {
    return this.get<{ data: AczenNovaExpense[]; pagination: any }>('/expenses', params);
  }

  /**
   * Fetches departments and cost centers from Aczen Nova
   */
  public async getDepartments(): Promise<{ data: AczenNovaDepartment[] }> {
    return this.get<{ data: AczenNovaDepartment[] }>('/departments');
  }

  /**
   * Fetches registered vendors from Aczen Nova
   */
  public async getVendors(params?: { limit?: number; offset?: number }): Promise<{ data: any[]; pagination: any }> {
    return this.get<{ data: any[]; pagination: any }>('/vendors', params);
  }

  /**
   * Fetches invoices from Aczen Nova
   */
  public async getInvoices(params?: { limit?: number; offset?: number }): Promise<{ data: any[]; pagination: any }> {
    return this.get<{ data: any[]; pagination: any }>('/invoices', params);
  }

  /**
   * Fetches payments from Aczen Nova
   */
  public async getPayments(params?: { limit?: number; offset?: number }): Promise<{ data: any[]; pagination: any }> {
    return this.get<{ data: any[]; pagination: any }>('/payments', params);
  }

  /**
   * LIVE DATA INTELLIGENCE:
   * Analyzes live company books directly from Aczen Nova API, identifying real-time
   * over-commitments, burn velocity across categories, and cross-department risk posture.
   */
  public async fetchAndAnalyzeBooks(): Promise<AczenNovaLiveAnalysis> {
    const [budgetsRes, expensesRes, deptsRes] = await Promise.all([
      this.getBudgets({ limit: 50 }),
      this.getExpenses({ limit: 50 }),
      this.getDepartments(),
    ]);

    const budgets = budgetsRes.data || [];
    const expenses = expensesRes.data || [];
    const depts = deptsRes.data || [];

    // Identify real breached/over-committed envelopes in Aczen Nova books
    const overcommitted = budgets.filter((b) => b.remaining < 0);
    const totalDeficit = overcommitted.reduce((sum, b) => sum + Math.abs(b.remaining), 0);

    const criticalCategories = overcommitted.map((b) => ({
      category: b.category,
      department_id: b.department_id,
      allocated: b.amount,
      committed: b.committed,
      overrun: Math.abs(b.remaining),
    }));

    // Aggregate category velocity from live expenses
    const categoryVelocity: Record<string, number> = {};
    for (const exp of expenses) {
      categoryVelocity[exp.category] = (categoryVelocity[exp.category] || 0) + (exp.total_amount || exp.amount || 0);
    }

    return {
      status: 'CONNECTED_AND_ACTIVE',
      provider: 'Aczen Nova API (v1)',
      company_books_height: {
        total_budget_envelopes: budgetsRes.pagination?.total || budgets.length,
        total_historical_expenses: expensesRes.pagination?.total || expenses.length,
        departments_monitored: depts.length,
      },
      live_overruns_detected: {
        count: overcommitted.length,
        total_deficit_amount: totalDeficit,
        critical_categories: criticalCategories.slice(0, 5),
      },
      category_velocity: categoryVelocity,
      source: 'https://www.aczen.in/nova-api/v1',
      timestamp: new Date().toISOString(),
    };
  }

  private cachedDeptAnalysis: { data: any; expiry: number } | null = null;
  private cachedVendorAnalysis: { data: any; expiry: number } | null = null;

  /**
   * Fetches and computes live department spending analysis across all Aczen Nova ledger books
   */
  public async getLiveDepartmentAnalysis(forceRefresh = false): Promise<any> {
    const now = Date.now();
    if (!forceRefresh && this.cachedDeptAnalysis && this.cachedDeptAnalysis.expiry > now) {
      return this.cachedDeptAnalysis.data;
    }

    const [depsRes, b1, b2, e1, e2] = await Promise.all([
      this.getDepartments(),
      this.getBudgets({ limit: 200, offset: 0 }),
      this.getBudgets({ limit: 200, offset: 200 }),
      this.getExpenses({ limit: 200, offset: 0 }),
      this.getExpenses({ limit: 200, offset: 200 }),
    ]);

    const deps = depsRes.data || [];
    const depMap = new Map(deps.map((d) => [d.id, d.name]));
    const budgets = (b1.data || []).concat(b2.data || []);
    const expenses = (e1.data || []).concat(e2.data || []);

    const deptStats: Record<
      string,
      {
        id: string;
        name: string;
        allocated: number;
        committed: number;
        settled: number;
        expenseCount: number;
        budgetLineCount: number;
        categories: Record<string, number>;
        vendors: Record<string, number>;
      }
    > = {};

    for (const d of deps) {
      deptStats[d.id] = {
        id: d.id,
        name: d.name,
        allocated: 0,
        committed: 0,
        settled: 0,
        expenseCount: 0,
        budgetLineCount: 0,
        categories: {},
        vendors: {},
      };
    }

    for (const b of budgets) {
      if (!deptStats[b.department_id]) {
        deptStats[b.department_id] = {
          id: b.department_id,
          name: depMap.get(b.department_id) || b.department_id,
          allocated: 0,
          committed: 0,
          settled: 0,
          expenseCount: 0,
          budgetLineCount: 0,
          categories: {},
          vendors: {},
        };
      }
      deptStats[b.department_id].allocated += Number(b.amount || 0);
      deptStats[b.department_id].committed += Number(b.committed || 0);
      deptStats[b.department_id].budgetLineCount += 1;
    }

    for (const exp of expenses) {
      const dId = exp.department_id || 'unknown';
      if (!deptStats[dId]) {
        deptStats[dId] = {
          id: dId,
          name: depMap.get(dId) || dId,
          allocated: 0,
          committed: 0,
          settled: 0,
          expenseCount: 0,
          budgetLineCount: 0,
          categories: {},
          vendors: {},
        };
      }
      const amt = Number(exp.amount || exp.total_amount || 0);
      deptStats[dId].settled += amt;
      deptStats[dId].expenseCount += 1;
      deptStats[dId].categories[exp.category] = (deptStats[dId].categories[exp.category] || 0) + amt;
      const v = exp.vendor_name || 'Unknown Vendor';
      deptStats[dId].vendors[v] = (deptStats[dId].vendors[v] || 0) + amt;
    }

    const rankings = Object.values(deptStats)
      .map((s) => {
        const topCategory = Object.entries(s.categories).sort((a, b) => b[1] - a[1])[0] || ['general', 0];
        const topVendor = Object.entries(s.vendors).sort((a, b) => b[1] - a[1])[0] || ['standard', 0];
        const remaining = s.allocated - s.committed;
        const utilization = s.allocated > 0 ? (s.committed / s.allocated) * 100 : 0;
        return {
          id: s.id,
          name: s.name,
          allocated: s.allocated,
          committed: s.committed,
          settled: s.settled,
          remaining,
          isOverrun: remaining < 0,
          deficit: remaining < 0 ? Math.abs(remaining) : 0,
          utilization,
          expenseCount: s.expenseCount,
          budgetLineCount: s.budgetLineCount,
          topCategory: topCategory[0],
          topCategoryAmount: topCategory[1],
          topVendor: topVendor[0],
          topVendorAmount: topVendor[1],
        };
      })
      .sort((a, b) => b.committed - a.committed);

    const totalAllocated = rankings.reduce((acc, r) => acc + r.allocated, 0);
    const totalCommitted = rankings.reduce((acc, r) => acc + r.committed, 0);
    const totalSettled = rankings.reduce((acc, r) => acc + r.settled, 0);

    const result = {
      highestSpendingDepartment: rankings[0] || null,
      rankings,
      totalAllocated,
      totalCommitted,
      totalSettled,
      totalExpenses: expenses.length,
      timestamp: new Date().toISOString(),
    };

    this.cachedDeptAnalysis = { data: result, expiry: now + 60000 };
    return result;
  }

  /**
   * Fetches and computes live vendor spending ranking across Aczen Nova expenses
   */
  public async getLiveVendorAnalysis(forceRefresh = false): Promise<any> {
    const now = Date.now();
    if (!forceRefresh && this.cachedVendorAnalysis && this.cachedVendorAnalysis.expiry > now) {
      return this.cachedVendorAnalysis.data;
    }

    const [e1, e2, depsRes] = await Promise.all([
      this.getExpenses({ limit: 200, offset: 0 }),
      this.getExpenses({ limit: 200, offset: 200 }),
      this.getDepartments(),
    ]);

    const depMap = new Map((depsRes.data || []).map((d) => [d.id, d.name]));
    const expenses = (e1.data || []).concat(e2.data || []);

    const vendorMap: Record<
      string,
      {
        name: string;
        totalAmount: number;
        expenseCount: number;
        categories: Record<string, number>;
        departments: Set<string>;
      }
    > = {};

    for (const exp of expenses) {
      const v = exp.vendor_name || 'Unknown Vendor';
      if (!vendorMap[v]) {
        vendorMap[v] = {
          name: v,
          totalAmount: 0,
          expenseCount: 0,
          categories: {},
          departments: new Set(),
        };
      }
      const amt = Number(exp.amount || exp.total_amount || 0);
      vendorMap[v].totalAmount += amt;
      vendorMap[v].expenseCount += 1;
      vendorMap[v].categories[exp.category] = (vendorMap[v].categories[exp.category] || 0) + amt;
      const deptName = depMap.get(exp.department_id || '') || exp.department_id || 'General';
      vendorMap[v].departments.add(deptName);
    }

    const topVendors = Object.values(vendorMap)
      .map((v) => {
        const topCat = Object.entries(v.categories).sort((a, b) => b[1] - a[1])[0] || ['general', 0];
        return {
          name: v.name,
          totalAmount: v.totalAmount,
          expenseCount: v.expenseCount,
          primaryCategory: topCat[0],
          departments: Array.from(v.departments),
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const result = {
      topVendors: topVendors.slice(0, 10),
      totalVendorSpend: topVendors.reduce((s, v) => s + v.totalAmount, 0),
      vendorCount: topVendors.length,
      timestamp: new Date().toISOString(),
    };

    this.cachedVendorAnalysis = { data: result, expiry: now + 60000 };
    return result;
  }

  /**
   * Legacy completion shim (kept for backwards compatibility with any legacy test harnesses)
   */
  public async complete(_request: NovaCompletionRequest): Promise<NovaCompletionResponse> {
    // Aczen Nova API is a read-only financial REST API.
    // Synthesize structured intelligence from the live books.
    const analysis = await this.fetchAndAnalyzeBooks();
    const content = JSON.stringify({
      summary: `Aczen Nova live ledger analysis active across ${analysis.company_books_height.total_budget_envelopes} envelopes. ${analysis.live_overruns_detected.count} live over-committed categories detected.`,
      risk_assessment: `Identified ${analysis.live_overruns_detected.count} over-committed cost centers in Aczen Nova books with ₹${analysis.live_overruns_detected.total_deficit_amount.toLocaleString('en-IN')} net liability.`,
      recommendations: [
        'Enforce pre-clearance throttling on high-velocity expense categories',
        'Rebalance capital from surplus cost centers in Aczen Nova ledger',
        'Require L4 CFO override for purchase orders exceeding single-item quotas',
      ],
    });

    return {
      id: `aczen-nova-${Date.now()}`,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
    };
  }
}

/**
 * Factory to instantiate and validate NovaClient using environment configuration
 */
export function createNovaClient(options: { requireApiKey?: boolean; baseUrl?: string; timeoutMs?: number } = {}): NovaClient {
  const client = new NovaClient(options.baseUrl, undefined, options.timeoutMs);
  if (options.requireApiKey !== false) {
    client.validateConfiguration();
  }
  return client;
}
