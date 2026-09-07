import { AgentDecision, Company, Report, ResearchBrief, SkoreJob, Trigger } from './types';

export const companies: Company[] = [
  { id: 'c1', ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', status: 'active' },
  { id: 'c2', ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Software & Cloud', status: 'monitoring' },
  { id: 'c3', ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', status: 'active' },
  { id: 'c4', ticker: 'NEE', name: 'NextEra Energy', sector: 'Utilities', status: 'paused' },
  { id: 'c5', ticker: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', status: 'active' },
];

export const triggers: Trigger[] = [
  { id: 't1', companyId: 'c1', type: 'Earnings revision', detectedAt: '2026-09-05T08:42:00Z', severity: 'high', summary: 'Consensus FY27 EPS estimate moved +8.4% after channel check.' },
  { id: 't2', companyId: 'c3', type: 'Credit spread', detectedAt: '2026-09-05T07:58:00Z', severity: 'medium', summary: 'Senior debt spread widened 14 bps versus financials basket.' },
  { id: 't3', companyId: 'c2', type: 'Regulatory filing', detectedAt: '2026-09-04T16:24:00Z', severity: 'low', summary: 'New AI infrastructure capex disclosure in 10-Q amendment.' },
  { id: 't4', companyId: 'c4', type: 'Data quality', detectedAt: '2026-09-04T14:11:00Z', severity: 'critical', summary: 'Fundamental feed delayed; automated scoring paused.' },
];

export const decisions: AgentDecision[] = [
  { id: 'd1', triggerId: 't1', action: 'Queue SKORE rerun', priority: 'P1', rationale: 'Material estimate revision exceeds configured threshold.', createdAt: '2026-09-05T08:44:00Z' },
  { id: 'd2', triggerId: 't2', action: 'Queue monitoring run', priority: 'P2', rationale: 'Spread move is notable but below escalation threshold.', createdAt: '2026-09-05T08:00:00Z' },
  { id: 'd3', triggerId: 't4', action: 'Pause workflow', priority: 'P0', rationale: 'Do not score stale fundamentals.', createdAt: '2026-09-04T14:12:00Z' },
];

export const jobs: SkoreJob[] = [
  { id: 'job-1042', companyId: 'c1', status: 'started', queuedAt: '2026-09-05T08:45:00Z', startedAt: '2026-09-05T08:46:00Z', score: 87, factors: [{ name: 'Earnings momentum', impact: 14, weight: 0.3 }, { name: 'Valuation', impact: -4, weight: 0.25 }, { name: 'Market structure', impact: 9, weight: 0.2 }, { name: 'Estimate breadth', impact: 12, weight: 0.25 }] },
  { id: 'job-1041', companyId: 'c3', status: 'queued', queuedAt: '2026-09-05T08:01:00Z', factors: [{ name: 'Credit quality', impact: -8, weight: 0.35 }, { name: 'Capital return', impact: 6, weight: 0.25 }, { name: 'Earnings momentum', impact: 4, weight: 0.2 }] },
  { id: 'job-1040', companyId: 'c2', status: 'completed', queuedAt: '2026-09-04T16:26:00Z', startedAt: '2026-09-04T16:27:00Z', completedAt: '2026-09-04T16:31:00Z', score: 74, factors: [{ name: 'Cloud growth', impact: 11, weight: 0.35 }, { name: 'AI capex', impact: -6, weight: 0.25 }, { name: 'Valuation', impact: -3, weight: 0.2 }] },
  { id: 'job-1039', companyId: 'c4', status: 'failed', queuedAt: '2026-09-04T14:12:00Z', startedAt: '2026-09-04T14:13:00Z', error: 'Fundamental feed unavailable after 3 retries.', factors: [] },
  { id: 'job-1038', companyId: 'c5', status: 'completed', queuedAt: '2026-09-03T11:20:00Z', startedAt: '2026-09-03T11:21:00Z', completedAt: '2026-09-03T11:26:00Z', score: 91, factors: [{ name: 'Earnings momentum', impact: 18, weight: 0.35 }, { name: 'Pipeline', impact: 14, weight: 0.3 }, { name: 'Valuation', impact: -5, weight: 0.2 }] },
];

export const reports: Report[] = [
  { id: 'r1', companyId: 'c2', score: 74, generatedAt: '2026-09-04T16:31:00Z', factors: jobs[2].factors, reportUrl: '/reports/r1' },
  { id: 'r2', companyId: 'c5', score: 91, generatedAt: '2026-09-03T11:26:00Z', factors: jobs[4].factors, reportUrl: '/reports/r2' },
  { id: 'r3', companyId: 'c1', score: 82, generatedAt: '2026-09-01T10:04:00Z', factors: jobs[0].factors, reportUrl: '/reports/r3' },
];

export const briefs: ResearchBrief[] = [];
