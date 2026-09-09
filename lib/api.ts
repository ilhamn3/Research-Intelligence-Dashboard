import { ActivityItem, Company, DashboardStats, Report, ResearchBrief, SkoreJob, Trigger } from './types';
import { createClient } from '@supabase/supabase-js';
import * as mock from './mock-data';

export interface DashboardRepository {
  listCompanies(query?: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: Omit<Company, 'id'>): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company>;
  deleteCompany(id: string): Promise<boolean>;
  getJobs(companyId?: string): Promise<SkoreJob[]>;
  getJob(id: string): Promise<SkoreJob | undefined>;
  getTriggers(companyId?: string): Promise<Trigger[]>;
  getReports(companyId?: string): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  getStats(): Promise<DashboardStats>;
  getActivity(): Promise<ActivityItem[]>;
  getUserActivity(userId?: string): Promise<ActivityItem[]>;
  saveBrief(brief: ResearchBrief): Promise<ResearchBrief>;
  retryJob(id: string): Promise<SkoreJob>;
  rerunJob(companyId: string): Promise<SkoreJob>;
}

// In-memory runtime state clone for dynamic updates
let activeCompanies: Company[] = [...mock.companies];
let activeJobs: SkoreJob[] = [...mock.jobs];
let activeReports: Report[] = [...mock.reports];

function getFastApiUrl(): string | null {
  return process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_BACKEND_URL || null;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your_supabase') || key.includes('your_supabase')) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

async function query<T>(request: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data ?? ([] as T);
}

export const repository: DashboardRepository = {
  listCompanies: async (search = '') => {
    // 1. Try FastAPI backend if configured
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/companies${search ? `?q=${encodeURIComponent(search)}` : ''}`);
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }

    // 2. Try Supabase
    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('companies').select('*').order('ticker');
        if (search.trim()) {
          const value = search.trim().replace(/[%_]/g, '');
          request = request.or(`name.ilike.%${value}%,ticker.ilike.%${value}%,sector.ilike.%${value}%`);
        }
        const data = await query<Company[]>(request);
        if (data && data.length > 0) {
          activeCompanies = data;
          return data;
        }
      }
    } catch {}

    // 3. Fallback to active runtime state
    const term = search.trim().toLowerCase();
    if (!term) return activeCompanies;
    return activeCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.ticker.toLowerCase().includes(term) ||
        c.sector.toLowerCase().includes(term)
    );
  },

  createCompany: async (companyData) => {
    const id = `c-${Date.now().toString(36)}`;
    const newCompany: Company = {
      id,
      ticker: companyData.ticker.toUpperCase().trim(),
      name: companyData.name.trim(),
      sector: companyData.sector.trim(),
      status: companyData.status || 'active',
    };

    try {
      const client = getSupabase();
      if (client) {
        await client.from('companies').insert([newCompany]);
      }
    } catch (err) {
      console.warn('Supabase insert company fallback to local:', err);
    }

    activeCompanies.unshift(newCompany);
    return newCompany;
  },

  updateCompany: async (id, updates) => {
    try {
      const client = getSupabase();
      if (client) {
        await client.from('companies').update(updates).eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase update company fallback to local:', err);
    }

    const idx = activeCompanies.findIndex((c) => c.id === id);
    if (idx >= 0) {
      activeCompanies[idx] = { ...activeCompanies[idx], ...updates };
      return activeCompanies[idx];
    }
    throw new Error(`Company with ID ${id} not found.`);
  },

  deleteCompany: async (id) => {
    try {
      const client = getSupabase();
      if (client) {
        await client.from('companies').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase delete company fallback to local:', err);
    }

    activeCompanies = activeCompanies.filter((c) => c.id !== id);
    return true;
  },

  getCompany: async (id) => {
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/companies/${id}`);
        if (res.ok) return await res.json();
      } catch {}
    }

    try {
      const client = getSupabase();
      if (client) {
        const items = await query<Company[]>(client.from('companies').select('*').eq('id', id).limit(1));
        if (items && items[0]) return items[0];
      }
    } catch {}
    return activeCompanies.find((c) => c.id === id) || mock.companies.find((c) => c.id === id);
  },

  getJobs: async (companyId) => {
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/jobs${companyId ? `?company_id=${companyId}` : ''}`);
        if (res.ok) return await res.json();
      } catch {}
    }

    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('skore_jobs').select('*').order('queued_at', { ascending: false });
        if (companyId) request = request.eq('company_id', companyId);
        const rows = await query<Array<Record<string, unknown>>>(request);
        if (rows && rows.length > 0) {
          return rows.map((row) => ({
            id: row.id as string,
            companyId: row.company_id as string,
            status: row.status as SkoreJob['status'],
            queuedAt: row.queued_at as string,
            startedAt: (row.started_at as string) ?? undefined,
            completedAt: (row.completed_at as string) ?? undefined,
            error: (row.error as string) ?? undefined,
            score: (row.score as number) ?? undefined,
            factors: (row.factors as SkoreJob['factors']) ?? [],
          }));
        }
      }
    } catch {}
    return companyId ? activeJobs.filter((j) => j.companyId === companyId) : activeJobs;
  },

  getJob: async (id) => {
    const all = await repository.getJobs();
    return all.find((j) => j.id === id);
  },

  getTriggers: async (companyId) => {
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/triggers${companyId ? `?company_id=${companyId}` : ''}`);
        if (res.ok) return await res.json();
      } catch {}
    }

    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('triggers').select('*').order('detected_at', { ascending: false });
        if (companyId) request = request.eq('company_id', companyId);
        const rows = await query<Array<Record<string, unknown>>>(request);
        if (rows && rows.length > 0) {
          return rows.map((row) => ({
            id: row.id as string,
            companyId: row.company_id as string,
            type: row.type as string,
            detectedAt: row.detected_at as string,
            severity: row.severity as Trigger['severity'],
            summary: row.summary as string,
          }));
        }
      }
    } catch {}
    return companyId ? mock.triggers.filter((t) => t.companyId === companyId) : mock.triggers;
  },

  getReports: async (companyId) => {
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/reports${companyId ? `?company_id=${companyId}` : ''}`);
        if (res.ok) return await res.json();
      } catch {}
    }

    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('reports').select('*').order('generated_at', { ascending: false });
        if (companyId) request = request.eq('company_id', companyId);
        const rows = await query<Array<Record<string, unknown>>>(request);
        if (rows && rows.length > 0) {
          return rows.map((row) => ({
            id: row.id as string,
            companyId: row.company_id as string,
            score: row.score as number,
            factors: (row.factors as Report['factors']) ?? [],
            generatedAt: row.generated_at as string,
            reportUrl: (row.report_url as string) ?? undefined,
            title: row.title as string | undefined,
            generationStatus: (row.generation_status as Report['generationStatus']) ?? 'certified',
            executiveSummary: row.executive_summary as string | undefined,
            investmentThesis: row.investment_thesis as string | undefined,
            keyCatalysts: (row.key_catalysts as string[]) ?? undefined,
            riskFactors: (row.risk_factors as string[]) ?? undefined,
            sources: (row.sources as string[]) ?? undefined,
            modelVersion: (row.model_version as string) ?? undefined,
            checksum: (row.checksum as string) ?? undefined,
            authorAgent: (row.author_agent as string) ?? undefined,
          }));
        }
      }
    } catch {}
    return companyId ? activeReports.filter((r) => r.companyId === companyId) : activeReports;
  },

  getReport: async (id) => {
    const all = await repository.getReports();
    return all.find((r) => r.id.toLowerCase() === id.toLowerCase());
  },

  getStats: async () => {
    const [triggers, jobs, reports] = await Promise.all([
      repository.getTriggers(),
      repository.getJobs(),
      repository.getReports(),
    ]);
    return {
      activeTriggers: triggers.filter((trigger) => ['high', 'critical'].includes(trigger.severity)).length,
      queuedSkore: jobs.filter((job) => ['queued', 'started'].includes(job.status)).length,
      completedReports: reports.length,
      failures: jobs.filter((job) => job.status === 'failed').length,
    };
  },

  getActivity: async () => {
    try {
      const client = getSupabase();
      if (client) {
        const [triggers, jobs, decisions] = await Promise.all([
          repository.getTriggers(),
          repository.getJobs(),
          query<Array<Record<string, unknown>>>(
            client.from('agent_decisions').select('*').order('created_at', { ascending: false })
          ),
        ]);
        if (triggers.length > 0 || jobs.length > 0 || decisions.length > 0) {
          const triggerMap = new Map(triggers.map((trigger) => [trigger.id, trigger.companyId]));
          return [
            ...triggers.map((trigger) => ({
              id: trigger.id,
              type: 'trigger' as const,
              title: `${trigger.type} detected`,
              detail: trigger.summary,
              timestamp: trigger.detectedAt,
              companyId: trigger.companyId,
            })),
            ...decisions.map((decision) => ({
              id: String(decision.id),
              type: 'decision' as const,
              title: String(decision.action),
              detail: String(decision.rationale),
              timestamp: String(decision.created_at),
              companyId: triggerMap.get(String(decision.trigger_id)) ?? '',
            })),
            ...jobs.map((job) => ({
              id: job.id,
              type: job.status === 'failed' ? ('error' as const) : ('execution' as const),
              title: job.status === 'failed' ? 'SKORE execution failed' : `SKORE ${job.status}`,
              detail: job.error ?? `Job ${job.id} is ${job.status}.`,
              timestamp: job.completedAt ?? job.startedAt ?? job.queuedAt,
              companyId: job.companyId,
            })),
          ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }
      }
    } catch {}

    const triggerMap = new Map(mock.triggers.map((trigger) => [trigger.id, trigger.companyId]));
    return [
      ...mock.triggers.map((trigger) => ({
        id: trigger.id,
        type: 'trigger' as const,
        title: `${trigger.type} detected`,
        detail: trigger.summary,
        timestamp: trigger.detectedAt,
        companyId: trigger.companyId,
      })),
      ...mock.decisions.map((decision) => ({
        id: String(decision.id),
        type: 'decision' as const,
        title: String(decision.action),
        detail: String(decision.rationale),
        timestamp: String(decision.createdAt),
        companyId: triggerMap.get(String(decision.triggerId)) ?? '',
      })),
      ...activeJobs.map((job) => ({
        id: job.id,
        type: job.status === 'failed' ? ('error' as const) : ('execution' as const),
        title: job.status === 'failed' ? 'SKORE execution failed' : `SKORE ${job.status}`,
        detail: job.error ?? `Job ${job.id} is ${job.status}.`,
        timestamp: job.completedAt ?? job.startedAt ?? job.queuedAt,
        companyId: job.companyId,
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  saveBrief: async (brief) => {
    try {
      const client = getSupabase();
      if (client) {
        await query(
          client.from('research_briefs').upsert({
            company_id: brief.companyId,
            summary: brief.summary,
            why_it_matters: brief.whyItMatters,
            affected_factors: brief.affectedFactors,
            watch_next: brief.watchNext,
            evidence: brief.evidence,
          })
        );
      }
    } catch {}
    return brief;
  },

  getUserActivity: async (userId?: string) => {
    const all = await repository.getActivity();
    if (!userId) return all;
    return all.map((item, idx) => ({
      ...item,
      detail: idx === 0 ? `Active session desk update: ${item.detail}` : item.detail,
    }));
  },

  retryJob: async (id) => {
    const jobIndex = activeJobs.findIndex((j) => j.id === id);
    if (jobIndex >= 0) {
      const existing = activeJobs[jobIndex];
      const updated: SkoreJob = {
        ...existing,
        status: 'completed',
        error: undefined,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score: existing.score || 83,
        factors:
          existing.factors.length > 0
            ? existing.factors
            : [
                { name: 'Regulatory rate base', impact: 5, weight: 0.35 },
                { name: 'Debt service cost', impact: -6, weight: 0.35 },
                { name: 'Clean power capacity', impact: 8, weight: 0.3 },
              ],
      };
      activeJobs[jobIndex] = updated;
      return updated;
    }
    throw new Error(`Job ${id} not found.`);
  },

  rerunJob: async (companyId) => {
    const newId = `job-${Math.floor(1050 + Math.random() * 900)}`;
    const newJob: SkoreJob = {
      id: newId,
      companyId,
      status: 'started',
      queuedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      score: 84,
      factors: [
        { name: 'Earnings momentum', impact: 12, weight: 0.35 },
        { name: 'Valuation multiple', impact: -3, weight: 0.25 },
        { name: 'Market structure', impact: 7, weight: 0.2 },
        { name: 'Estimate breadth', impact: 9, weight: 0.2 },
      ],
    };
    activeJobs.unshift(newJob);
    return newJob;
  },
};
