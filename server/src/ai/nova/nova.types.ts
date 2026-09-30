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
  liquidity_runway_assessment: string;
  cost_center_vulnerabilities: Array<{
    department: string;
    risk_level: string;
    exposure_amount: number;
    recommended_action: string;
  }>;
  policy_effectiveness_score: number;
  is_ai_generated: boolean;
  generated_at: string;
}
