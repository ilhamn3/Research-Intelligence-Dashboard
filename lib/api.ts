import { ActivityItem, Company, DashboardStats, Report, ResearchBrief, SkoreJob, Trigger } from './types';
import { createClient } from '@supabase/supabase-js';
import * as mock from './mock-data';

export interface DashboardRepository {
  listCompanies(query?: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getJobs(companyId?: string): Promise<SkoreJob[]>;
  getTriggers(companyId?: string): Promise<Trigger[]>;
  getReports(companyId?: string): Promise<Report[]>;
  getStats(): Promise<DashboardStats>;
  getActivity(): Promise<ActivityItem[]>;
  saveBrief(brief: ResearchBrief): Promise<ResearchBrief>;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function query<T>(request: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data ?? ([] as T);
}

export const repository: DashboardRepository = {
  listCompanies: async (search = '') => {
    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('companies').select('*').order('ticker');
        if (search.trim()) {
          const value = search.trim().replace(/[%_]/g, '');
          request = request.or(`name.ilike.%${value}%,ticker.ilike.%${value}%,sector.ilike.%${value}%`);
        }
        const data = await query<Company[]>(request);
        if (data && data.length > 0) return data;
      }
    } catch {}
    const term = search.trim().toLowerCase();
    if (!term) return mock.companies;
    return mock.companies.filter(
      (c) => c.name.toLowerCase().includes(term) || c.ticker.toLowerCase().includes(term) || c.sector.toLowerCase().includes(term)
    );
  },
  getCompany: async (id) => {
    try {
      const client = getSupabase();
      if (client) {
        const items = await query<Company[]>(client.from('companies').select('*').eq('id', id).limit(1));
        if (items && items[0]) return items[0];
      }
    } catch {}
    return mock.companies.find((c) => c.id === id);
  },
  getJobs: async (companyId) => {
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
    return companyId ? mock.jobs.filter((j) => j.companyId === companyId) : mock.jobs;
  },
  getTriggers: async (companyId) => {
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
          }));
        }
      }
    } catch {}
    return companyId ? mock.reports.filter((r) => r.companyId === companyId) : mock.reports;
  },
  getStats: async () => {
    const [triggers, jobs, reports] = await Promise.all([repository.getTriggers(), repository.getJobs(), repository.getReports()]);
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
          query<Array<Record<string, unknown>>>(client.from('agent_decisions').select('*').order('created_at', { ascending: false })),
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
      ...mock.jobs.map((job) => ({
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
};
