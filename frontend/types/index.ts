export type ScenarioType =
  | 'API Timeout'
  | 'Customer Escalation'
  | 'Repeated Payment Failure';

export interface IssueOption {
  id: string;
  scenario: ScenarioType;
  title: string;
  description: string;
  context: string;
  symptoms: string[];
  badge: string;
  entity: string;
}

export interface AnalysisStep {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface HistoricalMemory {
  case_id?: string;
  text: string;
  scenario?: string;
  outcome?: string;
  worked_or_failed?: string;
  summary?: string;
}

export interface AnalysisResult {
  scenario: string;
  problem_title: string;
  recommendation: string;
  reasoning: string;
  similar_cases: HistoricalMemory[];
  failed_approaches: string[];
  successful_approaches: string[];
  root_causes: string[];
  steps: AnalysisStep[];
  new_memory_retained: boolean;
  retained_memory_summary?: string;
}

export interface HealthStatus {
  status: string;
  hindsight_connected: boolean;
  gemini_configured: boolean;
  bank_id: string;
  model: string;
  version: string;
}
