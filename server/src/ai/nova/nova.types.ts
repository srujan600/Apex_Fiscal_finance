export interface NovaCompletionRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface NovaCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface BudgetExplanationDTO {
  department_name: string;
  allocated_budget: number;
  actual_settled: number;
  committed_spend: number;
  available_headroom: number;
  utilization_percent: number;
  projected_overrun: number;
  risk_level: string;
  days_to_exhaustion: number;
}

export interface ForecastExplanationDTO {
  epoch: string;
  total_ceiling: number;
  settled_to_date: number;
  committed_in_flight: number;
  year_end_projected: number;
  projected_variance: number;
  breach_date: string;
  scenario: string;
  stress_multiplier: number;
}

export interface ApprovalExplanationDTO {
  tracking_number: string;
  amount: number;
  department: string;
  category: string;
  decision: string;
  triggered_rule?: string;
  pre_commitment_util: number;
  post_commitment_util: number;
  required_action: string;
}

export interface NovaExplanationResult {
  summary: string;
  risk_assessment: string;
  recommendations: string[];
  is_ai_generated: boolean;
  model: string;
  latency_ms: number;
}

export interface AnomalyExplanationDTO {
  incident_code: string;
  department: string;
  sub_department?: string;
  vendor: string;
  amount: number;
  violation_detail: string;
  breach_classification: string;
  rule_code: string;
}

export interface ManagementInsightsDTO {
  executive_briefing: string;
  executiveSummary?: string;
  liquidity_runway_assessment: string;
  cost_center_vulnerabilities: Array<{
    department: string;
    risk_level: string;
    exposure_amount: number;
    recommended_action: string;
  }>;
  keyRiskDrivers?: Array<{
    department: string;
    risk_level: string;
    exposure_amount: number;
    recommended_action: string;
  }>;
  policy_effectiveness_score: number;
  is_ai_generated: boolean;
  generated_at: string;
}

export interface AczenNovaBudget {
  object: 'budget';
  id: string;
  department_id: string;
  category: string;
  month: string;
  amount: number;
  committed: number;
  remaining: number;
}

export interface AczenNovaExpense {
  object: 'expense';
  id: string;
  expense_number: string;
  category: string;
  vendor_name: string;
  description: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  tds_rate?: number;
  tds_amount?: number;
  payment_method?: string;
  expense_date?: string;
  currency?: string;
  created_at?: string;
  employee_id?: string;
  department_id?: string;
  business_unit_id?: string;
  client_id?: string | null;
  recurring?: boolean;
}

export interface AczenNovaDepartment {
  object: 'department';
  id: string;
  name: string;
  cost_center: string;
  business_unit_id?: string;
  head_employee_id?: string;
}

export interface AczenNovaLiveAnalysis {
  status: 'CONNECTED_AND_ACTIVE';
  provider: 'Aczen Nova API (v1)';
  company_books_height: {
    total_budget_envelopes: number;
    total_historical_expenses: number;
    departments_monitored: number;
  };
  live_overruns_detected: {
    count: number;
    total_deficit_amount: number;
    critical_categories: Array<{
      category: string;
      department_id: string;
      allocated: number;
      committed: number;
      overrun: number;
    }>;
  };
  category_velocity: Record<string, number>;
  source: 'https://www.aczen.in/nova-api/v1';
  timestamp: string;
}

// --- AI Agent / Copilot Types ---

export type AgentRole = 'user' | 'assistant' | 'system';

export interface AgentMessage {
  role: AgentRole;
  content: string;
  timestamp?: string;
}

export type AgentIntent =
  | 'BUDGET_QUERY'
  | 'DEPARTMENT_SPEND_ANALYSIS'
  | 'VENDOR_SPEND_ANALYSIS'
  | 'PRE_CLEARANCE_SIMULATION'
  | 'ACZEN_NOVA_LIVE_BOOKS'
  | 'FORECAST_SCENARIO'
  | 'POLICY_GOVERNANCE'
  | 'GENERAL_FINANCIAL_ADVISORY';

export interface AgentChatRequest {
  message: string;
  conversationHistory?: AgentMessage[];
  context?: {
    role?: string;
    departmentId?: string;
    currency?: 'USD' | 'INR';
    [key: string]: any;
  };
}

export interface AgentChatResponse {
  reply: string;
  intent: AgentIntent;
  structuredData?: Record<string, any>;
  suggestedActions?: string[];
  model: string;
  latencyMs: number;
  timestamp: string;
}

export interface AgentCapabilities {
  name: string;
  version: string;
  provider: 'Aczen';
  persona: string;
  description: string;
  supportedIntents: AgentIntent[];
  tools: string[];
  liveNovaConnected: boolean;
  status: 'READY' | 'DEGRADED' | 'CONFIG_ERROR';
}
