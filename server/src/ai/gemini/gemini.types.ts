import {
  AgentRole,
  AgentMessage,
  AgentIntent,
  AgentChatRequest,
  AgentChatResponse,
  AgentCapabilities,
} from '../nova/nova.types';

export {
  AgentRole,
  AgentMessage,
  AgentIntent,
  AgentChatRequest,
  AgentChatResponse,
  AgentCapabilities,
};

export interface GeminiTelemetry {
  provider: 'Google Gemini';
  model: string;
  dataSource: 'Aczen Nova Synced (Live Books)';
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  groundingSources: string[];
  isFallback: boolean;
  fallbackReason?: string;
  timestamp: string;
}

export interface SpendSimulationResult {
  simulatedAmount: number;
  verdict: 'CLEARED' | 'FLAGGED' | 'BLOCKED';
  governingRule: string;
  actionRequired: string;
  latencyMs: number;
  departmentName?: string;
  preCommitmentUtil?: number;
  postCommitmentUtil?: number;
  headroomAvailable?: number;
}
