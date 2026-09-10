export type CompanyStatus = 'active' | 'monitoring' | 'paused';
export type JobStatus = 'queued' | 'started' | 'completed' | 'failed';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ReportGenerationStatus = 'certified' | 'in-review' | 'draft';

export interface Company {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  status: CompanyStatus;
}

export interface Trigger {
  id: string;
  companyId: string;
  type: string;
  detectedAt: string;
  severity: Severity;
  summary: string;
}

export interface AgentDecision {
  id: string;
  triggerId: string;
  action: string;
  priority: string;
  rationale: string;
  createdAt: string;
}

export interface SkoreFactor {
  name: string;
  impact: number;
  weight: number;
}

export interface SkoreJob {
  id: string;
  companyId: string;
  status: JobStatus;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  score?: number;
  factors: SkoreFactor[];
  userId?: string;
}

export interface Report {
  id: string;
  companyId: string;
  score: number;
  factors: SkoreFactor[];
  generatedAt: string;
  reportUrl?: string;
  userId?: string;
  // Extended fields for Report Viewer capability
  title?: string;
  generationStatus?: ReportGenerationStatus;
  executiveSummary?: string;
  investmentThesis?: string;
  keyCatalysts?: string[];
  riskFactors?: string[];
  sources?: string[];
  modelVersion?: string;
  checksum?: string;
  authorAgent?: string;
}

export interface ResearchBrief {
  companyId: string;
  summary: string;
  whyItMatters: string;
  affectedFactors: { name: string; direction: 'up' | 'down' }[];
  watchNext: string[];
  evidence: string[];
  userId?: string;
}

export interface ActivityItem {
  id: string;
  type: 'trigger' | 'decision' | 'execution' | 'error';
  title: string;
  detail: string;
  timestamp: string;
  companyId: string;
  userId?: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  companyId: string;
  createdAt?: string;
}

export interface DashboardStats {
  activeTriggers: number;
  queuedSkore: number;
  completedReports: number;
  failures: number;
}

export const statusLabel: Record<JobStatus, string> = {
  queued: 'Queued',
  started: 'Processing',
  completed: 'Complete',
  failed: 'Failed',
};

export const statusTone: Record<JobStatus, string> = {
  queued: 'status-queued',
  started: 'status-processing',
  completed: 'status-complete',
  failed: 'status-failed',
};

export const factorDirection = (impact: number): 'up' | 'down' => (impact >= 0 ? 'up' : 'down');
