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
  {
    id: 'r1',
    companyId: 'c2',
    score: 74,
    generatedAt: '2026-09-04T16:31:00Z',
    factors: [
      { name: 'Cloud growth', impact: 11, weight: 0.35 },
      { name: 'AI capex', impact: -6, weight: 0.25 },
      { name: 'Valuation', impact: -3, weight: 0.2 },
      { name: 'Recurring ARR', impact: 8, weight: 0.2 },
    ],
    reportUrl: '/reports/r1',
    title: 'Microsoft Corporation (MSFT) Cloud Reacceleration & AI Capex Absorption',
    generationStatus: 'certified',
    executiveSummary:
      'Azure expansion maintains strong enterprise tailwinds (+29% YoY currency-neutral). Near-term operating margins face marginal headwinds due to aggressive AI compute cluster buildouts, but software pricing power and Office 365 Copilot monetization offset infrastructure depreciation.',
    investmentThesis:
      'High-conviction defensive compounder. Commercial backlog growth (+19%) supports multi-year revenue visibility. Multiple compression risk is bounded by sustained double-digit free cash flow generation.',
    keyCatalysts: [
      'Next quarterly Azure cloud consumption disclosures',
      'Copilot enterprise seat adoption conversion rates',
      'Gross margin inflection following custom silicon deployments',
    ],
    riskFactors: [
      'Accelerated hyperscale depreciation schedules lowering near-term GAAP operating income',
      'Antitrust scrutiny around multi-model licensing agreements',
    ],
    sources: [
      'MSFT Form 10-Q Amendment (SEC EDGAR)',
      'WTFXAI Automated Channel Checks & Web Crawl Feed',
      'Consensus Sell-Side Model Variance Ledger',
    ],
    modelVersion: 'WTFXAI-v2.4-NEURAL',
    checksum: 'sha256:d8a9f3b20c1844b82193e2b9c71',
    authorAgent: 'Agent-04 (Cloud Infrastructure Specialist)',
  },
  {
    id: 'r2',
    companyId: 'c5',
    score: 91,
    generatedAt: '2026-09-03T11:26:00Z',
    factors: [
      { name: 'Earnings momentum', impact: 18, weight: 0.35 },
      { name: 'Pipeline', impact: 14, weight: 0.3 },
      { name: 'Valuation', impact: -5, weight: 0.2 },
      { name: 'Commercial Scale', impact: 10, weight: 0.15 },
    ],
    reportUrl: '/reports/r2',
    title: 'Eli Lilly and Company (LLY) Incretin Franchise Monopoly & Capacity Ramping',
    generationStatus: 'certified',
    executiveSummary:
      'Exceptional fundamental trajectory driven by unprecedented demand for Mounjaro and Zepbound. Manufacturing capacity expansions in North Carolina and Germany are coming online ahead of schedule, removing previously forecasted supply-cap constraints.',
    investmentThesis:
      'Top decile quantitative conviction. Oral GLP-1 (orforglipron) phase 3 readouts present substantial upside asymmetry. Premium forward multiple is justified by best-in-class EPS CAGR through 2030.',
    keyCatalysts: [
      'Phase 3 oral GLP-1 readout for diabetes and weight management',
      'FDA manufacturing facility inspection clearance in Concord, NC',
      'International reimbursement approvals across EU5 markets',
    ],
    riskFactors: [
      'Compounding pharmacy litigation and legislative pricing intervention',
      'Payer formulary tier adjustments in upcoming benefit cycle',
    ],
    sources: [
      'FDA CDER Regulatory Filings & Inspection Ledger',
      'Quarterly Incretin Prescription Volume Audit (IQVIA Feed)',
      'WTFXAI Healthcare Factor Decomposition Engine',
    ],
    modelVersion: 'WTFXAI-v2.4-NEURAL',
    checksum: 'sha256:f12a84e621bc498d98341b6c00a',
    authorAgent: 'Agent-07 (BioPharma Pipeline Synthesizer)',
  },
  {
    id: 'r3',
    companyId: 'c1',
    score: 82,
    generatedAt: '2026-09-01T10:04:00Z',
    factors: [
      { name: 'Earnings momentum', impact: 14, weight: 0.3 },
      { name: 'Valuation', impact: -4, weight: 0.25 },
      { name: 'Market structure', impact: 9, weight: 0.2 },
      { name: 'Estimate breadth', impact: 12, weight: 0.25 },
    ],
    reportUrl: '/reports/r3',
    title: 'NVIDIA Corporation (NVDA) Datacenter Architecture Transition & Supply Velocity',
    generationStatus: 'certified',
    executiveSummary:
      'Blackwell platform rack-scale ramp exhibits robust yield stabilization across TSMC CoWoS packaging nodes. Forward sovereign AI capex commitments provide significant backlog duration, partially insulating the order book from short-term tech enterprise variance.',
    investmentThesis:
      'Dominant technological moat with CUDA ecosystem lock-in. Gross margins remain resilient above 74%. Valuation multiples have normalized to attractive risk-reward levels relative to projected free cash flow growth.',
    keyCatalysts: [
      'Blackwell B200 hyperscale shipment volume validation',
      'Sovereign AI infrastructure contract announcements',
      'Next quarterly consensus earnings revision threshold',
    ],
    riskFactors: [
      'Export control restrictions on next-generation accelerators',
      'Power availability and datacenter interconnection bottlenecks',
    ],
    sources: [
      'Taiwan Semiconductor Channel Supply Chain Audit',
      'WTFXAI Quantitative Order Book & Filing Tracker',
      'Global Datacenter Power Capacity Database',
    ],
    modelVersion: 'WTFXAI-v2.4-NEURAL',
    checksum: 'sha256:4a08c5819d3f10ec8763914a298',
    authorAgent: 'Agent-01 (Semiconductor Hardware Strategist)',
  },
  {
    id: 'r4',
    companyId: 'c3',
    score: 85,
    generatedAt: '2026-08-28T14:15:00Z',
    factors: [
      { name: 'Capital return', impact: 9, weight: 0.3 },
      { name: 'Net interest margin', impact: 8, weight: 0.3 },
      { name: 'Credit quality', impact: -4, weight: 0.25 },
      { name: 'Fee revenue', impact: 6, weight: 0.15 },
    ],
    reportUrl: '/reports/r4',
    title: 'JPMorgan Chase & Co. (JPM) Capital Resilience & Net Interest Trajectory',
    generationStatus: 'in-review',
    executiveSummary:
      'Premier commercial and investment banking balance sheet with peer-leading return on tangible common equity (ROTCE > 18%). Net interest income guidance remains conservative with deposit beta stabilizing.',
    investmentThesis:
      'Highest quality systemic financial institution. Substantial excess capital buffers allow aggressive share repurchases while navigating potential Basel III endgame revisions.',
    keyCatalysts: [
      'Federal Reserve Basel III Endgame final rulemaking announcement',
      'Investment banking advisory fee recovery velocity',
      'Commercial real estate loan reserve absorption updates',
    ],
    riskFactors: [
      'Rapid federal funds rate cuts compressing asset yields faster than deposit costs',
      'Elevated net charge-offs in prime credit card portfolios',
    ],
    sources: [
      'Federal Reserve Comprehensive Capital Analysis and Review (CCAR)',
      'JPM Form 8-K Earnings Supplement',
      'WTFXAI Interbank Credit Spread Monitor',
    ],
    modelVersion: 'WTFXAI-v2.4-NEURAL',
    checksum: 'sha256:91b7e41982cf0012e847c21fa33',
    authorAgent: 'Agent-03 (Financial Institutions Desk)',
  },
];

export const briefs: ResearchBrief[] = [];
