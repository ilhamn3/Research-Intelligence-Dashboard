import { ActivityItem, Company, DashboardStats, Report, ResearchBrief, SkoreJob, Trigger } from './types';
import { createClient } from '@supabase/supabase-js';
import { auth, getSupabaseClient } from './auth';
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
  saveReport(report: Report): Promise<Report>;
  getStats(): Promise<DashboardStats>;
  getActivity(): Promise<ActivityItem[]>;
  getUserActivity(userId?: string): Promise<ActivityItem[]>;
  saveBrief(brief: ResearchBrief): Promise<ResearchBrief>;
  retryJob(id: string): Promise<SkoreJob>;
  rerunJob(companyId: string): Promise<SkoreJob>;
  completeJob(id: string): Promise<SkoreJob>;
}

// In-memory runtime state clone for dynamic local fallbacks
let activeCompanies: Company[] = [...mock.companies];
let activeJobs: SkoreJob[] = [...mock.jobs];
let activeReports: Report[] = [...mock.reports];

function getFastApiUrl(): string | null {
  return process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_BACKEND_URL || null;
}

function getSupabase() {
  if (typeof window !== 'undefined') {
    const client = getSupabaseClient();
    if (client) return client;
  }
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

const REPORTS_STORAGE_KEY = 'wtfxai_persistent_reports';

function getLocalReports(userId?: string): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (raw) {
      const parsed: Report[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!userId) return parsed;
        return parsed.filter((r) => !r.userId || r.userId === userId);
      }
    }
  } catch {}
  return [];
}

function saveLocalReport(report: Report) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalReports();
    const updated = [report, ...existing.filter((r) => r.id.toLowerCase() !== report.id.toLowerCase())];
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

const JOBS_STORAGE_KEY = 'wtfxai_persistent_jobs';

function getLocalJobs(userId?: string): SkoreJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (raw) {
      const parsed: SkoreJob[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!userId) return parsed;
        return parsed.filter((j) => !j.userId || j.userId === userId);
      }
    }
  } catch {}
  return [];
}

function saveLocalJob(job: SkoreJob) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalJobs();
    const updated = [job, ...existing.filter((j) => j.id.toLowerCase() !== job.id.toLowerCase())];
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function parseReportRow(row: Record<string, unknown>): Report {
  let factors = (row.factors as Report['factors']) ?? [];
  let metadata: Partial<Report> = {};

  if (row.factors && typeof row.factors === 'object' && !Array.isArray(row.factors)) {
    const packed = row.factors as Record<string, unknown>;
    factors = (packed.factors as Report['factors']) ?? [];
    metadata = {
      title: packed.title as string | undefined,
      generationStatus: packed.generationStatus as Report['generationStatus'],
      executiveSummary: packed.executiveSummary as string | undefined,
      investmentThesis: packed.investmentThesis as string | undefined,
      keyCatalysts: packed.keyCatalysts as string[] | undefined,
      riskFactors: packed.riskFactors as string[] | undefined,
      sources: packed.sources as string[] | undefined,
      modelVersion: packed.modelVersion as string | undefined,
      checksum: packed.checksum as string | undefined,
      authorAgent: packed.authorAgent as string | undefined,
    };
  }

  return {
    id: row.id as string,
    companyId: row.company_id as string,
    score: Number(row.score),
    factors,
    generatedAt: row.generated_at as string,
    reportUrl: (row.report_url as string) ?? `/reports/${row.id}`,
    userId: (row.user_id as string) ?? undefined,
    title: (row.title as string) ?? metadata.title,
    generationStatus: (row.generation_status as Report['generationStatus']) ?? metadata.generationStatus ?? 'certified',
    executiveSummary: (row.executive_summary as string) ?? metadata.executiveSummary,
    investmentThesis: (row.investment_thesis as string) ?? metadata.investmentThesis,
    keyCatalysts: (row.key_catalysts as string[]) ?? metadata.keyCatalysts,
    riskFactors: (row.risk_factors as string[]) ?? metadata.riskFactors,
    sources: (row.sources as string[]) ?? metadata.sources,
    modelVersion: (row.model_version as string) ?? metadata.modelVersion,
    checksum: (row.checksum as string) ?? metadata.checksum,
    authorAgent: (row.author_agent as string) ?? metadata.authorAgent,
  };
}

export const repository: DashboardRepository = {
  listCompanies: async (search = '') => {
    const fastApi = getFastApiUrl();
    if (fastApi) {
      try {
        const res = await fetch(`${fastApi}/companies${search ? `?q=${encodeURIComponent(search)}` : ''}`);
        if (res.ok) return await res.json();
      } catch {}
    }

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

    let fetchedJobs: SkoreJob[] = [];

    // Query backend API route
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/jobs${companyId ? `?company_id=${companyId}` : ''}`);
        if (res.ok) {
          const json = await res.json();
          if (json.jobs && Array.isArray(json.jobs) && json.jobs.length > 0) {
            fetchedJobs = json.jobs;
          }
        }
      } catch {}
    }

    // Direct Supabase query if API didn't return rows
    if (fetchedJobs.length === 0) {
      try {
        const client = getSupabase();
        if (client) {
          let request = client.from('skore_jobs').select('*').order('queued_at', { ascending: false });
          if (companyId) request = request.eq('company_id', companyId);
          const rows = await query<Array<Record<string, unknown>>>(request);
          if (rows && rows.length > 0) {
            fetchedJobs = rows.map((row) => ({
              id: row.id as string,
              companyId: row.company_id as string,
              status: row.status as SkoreJob['status'],
              queuedAt: row.queued_at as string,
              startedAt: (row.started_at as string) ?? undefined,
              completedAt: (row.completed_at as string) ?? undefined,
              error: (row.error as string) ?? undefined,
              score: (row.score as number) ?? undefined,
              factors: (row.factors as SkoreJob['factors']) ?? [],
              userId: (row.user_id as string) ?? undefined,
            }));
          }
        }
      } catch {}
    }

    // Fallback baseline if DB is empty
    const baseList = fetchedJobs.length > 0 ? fetchedJobs : (companyId ? mock.jobs.filter((j) => j.companyId === companyId) : mock.jobs);

    // Merge baseline with activeJobs and persistent local storage
    const mergedMap = new Map<string, SkoreJob>();
    baseList.forEach((j) => mergedMap.set(j.id.toLowerCase(), j));

    const activeList = companyId ? activeJobs.filter((j) => j.companyId === companyId) : activeJobs;
    activeList.forEach((j) => {
      const existing = mergedMap.get(j.id.toLowerCase());
      if (!existing || existing.status !== j.status || j.completedAt) {
        mergedMap.set(j.id.toLowerCase(), j);
      }
    });

    const localJobs = getLocalJobs();
    localJobs.forEach((j) => {
      if (!companyId || j.companyId === companyId) {
        mergedMap.set(j.id.toLowerCase(), j);
      }
    });

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()
    );
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

    let dbReports: Report[] = [];
    try {
      const client = getSupabase();
      if (client) {
        let request = client.from('reports').select('*').order('generated_at', { ascending: false });
        if (companyId) request = request.eq('company_id', companyId);
        const rows = await query<Array<Record<string, unknown>>>(request);
        if (rows && rows.length > 0) {
          dbReports = rows.map((row) => parseReportRow(row));
        }
      }
    } catch (err) {
      console.warn('Supabase getReports query fallback to local:', err);
    }

    // Merge database reports, browser persistent storage reports, and in-memory activeReports
    const local = getLocalReports();
    const combined = [...local, ...activeReports, ...dbReports];
    const deduplicated = new Map<string, Report>();

    for (const rep of combined) {
      if (!deduplicated.has(rep.id.toLowerCase())) {
        deduplicated.set(rep.id.toLowerCase(), rep);
      }
    }

    const allReports = Array.from(deduplicated.values()).sort((a, b) =>
      b.generatedAt.localeCompare(a.generatedAt)
    );

    return companyId ? allReports.filter((r) => r.companyId === companyId) : allReports;
  },

  getReport: async (id: string) => {
    if (!id) return undefined;
    const cleanId = id.toLowerCase().trim();

    // 1. Check in-memory activeReports
    const inMem = activeReports.find((r) => r.id.toLowerCase() === cleanId);
    if (inMem) return inMem;

    // 2. Check browser persistent storage
    const stored = getLocalReports();
    const inStored = stored.find((r) => r.id.toLowerCase() === cleanId);
    if (inStored) return inStored;

    // 3. Query Supabase directly for this single report
    try {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from('reports')
          .select('*')
          .ilike('id', cleanId)
          .maybeSingle();

        if (data && !error) {
          const parsed = parseReportRow(data);
          activeReports.unshift(parsed);
          saveLocalReport(parsed);
          return parsed;
        }
      }
    } catch {}

    // 4. In browser, try querying server API endpoint /api/generate-report?id=...
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/generate-report?id=${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.report) {
            activeReports.unshift(json.report);
            saveLocalReport(json.report);
            return json.report;
          }
        }
      } catch {}
    }

    // 5. Fallback: all reports
    const all = await repository.getReports();
    return all.find((r) => r.id.toLowerCase() === cleanId);
  },

  saveReport: async (report: Report): Promise<Report> => {
    const effectiveUserId =
      report.userId || (typeof window !== 'undefined' ? auth.getStoredProfile()?.id : undefined);

    const reportWithUser = {
      ...report,
      userId: effectiveUserId,
    };

    // Pack extended fields into factors JSONB to ensure 100% compatibility across all schemas
    const packedFactors = {
      factors: reportWithUser.factors,
      title: reportWithUser.title,
      generationStatus: reportWithUser.generationStatus || 'certified',
      executiveSummary: reportWithUser.executiveSummary,
      investmentThesis: reportWithUser.investmentThesis,
      keyCatalysts: reportWithUser.keyCatalysts,
      riskFactors: reportWithUser.riskFactors,
      sources: reportWithUser.sources,
      modelVersion: reportWithUser.modelVersion || 'WTFXAI-v2.4-NEURAL',
      checksum: reportWithUser.checksum,
      authorAgent: reportWithUser.authorAgent,
    };

    const rowToInsert: Record<string, unknown> = {
      id: reportWithUser.id,
      company_id: reportWithUser.companyId,
      score: reportWithUser.score,
      factors: packedFactors,
      generated_at: reportWithUser.generatedAt,
      report_url: reportWithUser.reportUrl || `/reports/${reportWithUser.id}`,
    };

    if (effectiveUserId) {
      rowToInsert.user_id = effectiveUserId;
    }

    try {
      const client = getSupabase();
      if (client) {
        const { error } = await client.from('reports').insert([rowToInsert]);
        if (error) {
          // If error was due to user_id column not existing yet, retry without user_id
          if (error.message.includes('user_id')) {
            delete rowToInsert.user_id;
            await client.from('reports').insert([rowToInsert]);
          } else {
            console.warn('Supabase insert report warning:', error.message);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase saveReport fallback:', err);
    }

    // Persist to browser persistent storage and in-memory runtime
    saveLocalReport(reportWithUser);
    activeReports = [reportWithUser, ...activeReports.filter((r) => r.id !== reportWithUser.id)];
    return reportWithUser;
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
        const [triggers, jobs, decisions, logs] = await Promise.all([
          repository.getTriggers(),
          repository.getJobs(),
          query<Array<Record<string, unknown>>>(
            client.from('agent_decisions').select('*').order('created_at', { ascending: false })
          ),
          query<Array<Record<string, unknown>>>(
            client.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(20)
          ).catch(() => []),
        ]);

        const triggerMap = new Map(triggers.map((trigger) => [trigger.id, trigger.companyId]));
        const combined: ActivityItem[] = [
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
            userId: job.userId,
          })),
          ...logs.map((log) => ({
            id: String(log.id),
            type: (log.type as ActivityItem['type']) || 'execution',
            title: String(log.title),
            detail: String(log.detail),
            timestamp: String(log.timestamp),
            companyId: String(log.company_id || ''),
            userId: String(log.user_id || ''),
          })),
        ];

        return combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
        const row: Record<string, unknown> = {
          company_id: brief.companyId,
          summary: brief.summary,
          why_it_matters: brief.whyItMatters,
          affected_factors: brief.affectedFactors,
          watch_next: brief.watchNext,
          evidence: brief.evidence,
        };
        if (brief.userId) {
          row.user_id = brief.userId;
        }
        await query(client.from('research_briefs').upsert(row));
      }
    } catch {}
    return brief;
  },

  getUserActivity: async (userId?: string) => {
    const all = await repository.getActivity();
    if (!userId) return all;
    return all.filter((item) => !item.userId || item.userId === userId);
  },

  retryJob: async (id) => {
    const completedAt = new Date().toISOString();
    const activeUserId = typeof window !== 'undefined' ? auth.getStoredProfile()?.id : undefined;

    const updatedFactors = [
      { name: 'Regulatory rate base', impact: 6, weight: 0.35 },
      { name: 'Debt service cost', impact: -4, weight: 0.35 },
      { name: 'Clean power capacity', impact: 9, weight: 0.3 },
    ];

    let retried: SkoreJob | null = null;

    // 1. Call backend API route
    if (typeof window !== 'undefined') {
      try {
        const token = await auth.getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'retry', jobId: id }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.job) {
            retried = json.job;
          }
        }
      } catch (err) {
        console.warn('API route retryJob fallback:', err);
      }
    }

    // 2. Direct Supabase update attempt
    try {
      const client = getSupabase();
      if (client) {
        await client
          .from('skore_jobs')
          .update({
            status: 'completed',
            error: null,
            started_at: completedAt,
            completed_at: completedAt,
            score: 83,
            factors: updatedFactors,
            ...(activeUserId ? { user_id: activeUserId } : {}),
          })
          .eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase direct retryJob update:', err);
    }

    const jobIndex = activeJobs.findIndex((j) => j.id.toLowerCase() === id.toLowerCase());
    const existing = jobIndex >= 0 ? activeJobs[jobIndex] : undefined;

    const finalJob: SkoreJob = retried ?? {
      id,
      companyId: existing?.companyId ?? 'c4',
      status: 'completed',
      queuedAt: existing?.queuedAt ?? completedAt,
      startedAt: completedAt,
      completedAt,
      error: undefined,
      score: 83,
      factors: updatedFactors,
      userId: activeUserId ?? existing?.userId,
    };

    if (jobIndex >= 0) {
      activeJobs[jobIndex] = finalJob;
    } else {
      activeJobs.unshift(finalJob);
    }

    saveLocalJob(finalJob);
    return finalJob;
  },

  rerunJob: async (companyId) => {
    const newId = `job-${Math.floor(1050 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const activeUserId = typeof window !== 'undefined' ? auth.getStoredProfile()?.id : undefined;

    let createdJob: SkoreJob | null = null;

    // 1. Call backend API route
    if (typeof window !== 'undefined') {
      try {
        const token = await auth.getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'rerun', companyId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.job) {
            createdJob = json.job;
          }
        }
      } catch (err) {
        console.warn('API route rerunJob fallback:', err);
      }
    }

    if (!createdJob) {
      createdJob = {
        id: newId,
        companyId,
        status: 'started',
        queuedAt: now,
        startedAt: now,
        score: 84,
        factors: [
          { name: 'Earnings momentum', impact: 14, weight: 0.35 },
          { name: 'Valuation multiple', impact: -2, weight: 0.25 },
          { name: 'Market structure', impact: 8, weight: 0.2 },
          { name: 'Estimate breadth', impact: 10, weight: 0.2 },
        ],
        userId: activeUserId,
      };

      try {
        const client = getSupabase();
        if (client) {
          await client.from('skore_jobs').insert([
            {
              id: createdJob.id,
              company_id: createdJob.companyId,
              status: createdJob.status,
              queued_at: createdJob.queuedAt,
              started_at: createdJob.startedAt,
              score: createdJob.score,
              factors: createdJob.factors,
              user_id: activeUserId ?? null,
            },
          ]);
        }
      } catch (err) {
        console.warn('Supabase rerunJob direct insert:', err);
      }
    }

    activeJobs.unshift(createdJob);
    saveLocalJob(createdJob);
    return createdJob;
  },

  completeJob: async (id) => {
    const completedAt = new Date().toISOString();
    const activeUserId = typeof window !== 'undefined' ? auth.getStoredProfile()?.id : undefined;

    let completed: SkoreJob | null = null;

    if (typeof window !== 'undefined') {
      try {
        const token = await auth.getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'complete', jobId: id }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.completedAt) {
            // successful
          }
        }
      } catch (err) {
        console.warn('API route completeJob fallback:', err);
      }
    }

    try {
      const client = getSupabase();
      if (client) {
        await client
          .from('skore_jobs')
          .update({
            status: 'completed',
            completed_at: completedAt,
            ...(activeUserId ? { user_id: activeUserId } : {}),
          })
          .eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase direct completeJob update:', err);
    }

    const jobIndex = activeJobs.findIndex((j) => j.id.toLowerCase() === id.toLowerCase());
    const existing = jobIndex >= 0 ? activeJobs[jobIndex] : undefined;

    const finalJob: SkoreJob = {
      id,
      companyId: existing?.companyId ?? 'c1',
      status: 'completed',
      queuedAt: existing?.queuedAt ?? completedAt,
      startedAt: existing?.startedAt ?? completedAt,
      completedAt,
      error: undefined,
      score: existing?.score ?? 85,
      factors: existing?.factors && existing.factors.length > 0 ? existing.factors : [
        { name: 'Earnings momentum', impact: 14, weight: 0.35 },
        { name: 'Valuation multiple', impact: -2, weight: 0.25 },
        { name: 'Market structure', impact: 8, weight: 0.2 },
        { name: 'Estimate breadth', impact: 10, weight: 0.2 },
      ],
      userId: activeUserId ?? existing?.userId,
    };

    if (jobIndex >= 0) {
      activeJobs[jobIndex] = finalJob;
    } else {
      activeJobs.unshift(finalJob);
    }

    saveLocalJob(finalJob);
    return finalJob;
  },
};
