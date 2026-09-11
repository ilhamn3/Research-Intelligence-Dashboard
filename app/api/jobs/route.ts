import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SkoreJob } from '@/lib/types';
import * as mock from '@/lib/mock-data';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const supabase = getSupabaseServerClient();
    if (supabase) {
      let query = supabase.from('skore_jobs').select('*').order('queued_at', { ascending: false });
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const jobs: SkoreJob[] = data.map((row: Record<string, unknown>) => ({
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
        return NextResponse.json({ success: true, jobs });
      }
    }

    const filtered = companyId ? mock.jobs.filter((j) => j.companyId === companyId) : mock.jobs;
    return NextResponse.json({ success: true, jobs: filtered });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, jobId, companyId } = body;

    const supabase = getSupabaseServerClient();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    let userId: string | undefined;
    if (token && supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
        }
      } catch {}
    }

    if (action === 'retry') {
      if (!jobId) {
        return NextResponse.json({ error: 'jobId is required for retry action' }, { status: 400 });
      }

      const completedAt = new Date().toISOString();
      const updatedFactors = [
        { name: 'Regulatory rate base', impact: 6, weight: 0.35 },
        { name: 'Debt service cost', impact: -4, weight: 0.35 },
        { name: 'Clean power capacity', impact: 9, weight: 0.3 },
      ];
      const score = 83;

      let retriedJob: SkoreJob | null = null;

      if (supabase) {
        try {
          const updatePayload: Record<string, unknown> = {
            status: 'completed',
            error: null,
            started_at: completedAt,
            completed_at: completedAt,
            score,
            factors: updatedFactors,
          };
          if (userId) updatePayload.user_id = userId;

          const { data, error } = await supabase
            .from('skore_jobs')
            .update(updatePayload)
            .eq('id', jobId)
            .select();

          if (!error && data && data.length > 0) {
            const row = data[0];
            retriedJob = {
              id: row.id,
              companyId: row.company_id,
              status: row.status,
              queuedAt: row.queued_at,
              startedAt: row.started_at,
              completedAt: row.completed_at,
              error: undefined,
              score: row.score,
              factors: row.factors,
              userId: row.user_id,
            };
          }
        } catch (dbErr) {
          console.warn('Supabase retry update error in API route:', dbErr);
        }
      }

      if (!retriedJob) {
        retriedJob = {
          id: jobId,
          companyId: 'c4',
          status: 'completed',
          queuedAt: new Date(Date.now() - 3600000).toISOString(),
          startedAt: completedAt,
          completedAt,
          error: undefined,
          score,
          factors: updatedFactors,
          userId,
        };
      }

      // Log activity
      if (supabase) {
        try {
          await supabase.from('activity_logs').insert([
            {
              id: `act-${Date.now().toString(36)}`,
              user_id: userId ?? null,
              type: 'execution',
              title: `SKORE Job Recovered: ${jobId}`,
              detail: `Execution retry succeeded. Status: COMPLETE. Composite SKORE: ${score}/100.`,
              timestamp: completedAt,
              company_id: retriedJob.companyId,
            },
          ]);
        } catch {}
      }

      return NextResponse.json({ success: true, job: retriedJob });
    }

    if (action === 'rerun') {
      if (!companyId) {
        return NextResponse.json({ error: 'companyId is required for rerun action' }, { status: 400 });
      }

      const newId = `job-${Math.floor(1050 + Math.random() * 900)}`;
      const now = new Date().toISOString();
      const score = Math.floor(78 + Math.random() * 15);

      const newJob: SkoreJob = {
        id: newId,
        companyId,
        status: 'started',
        queuedAt: now,
        startedAt: now,
        score,
        factors: [
          { name: 'Earnings momentum', impact: 14, weight: 0.35 },
          { name: 'Valuation multiple', impact: -2, weight: 0.25 },
          { name: 'Market structure', impact: 8, weight: 0.2 },
          { name: 'Estimate breadth', impact: 10, weight: 0.2 },
        ],
        userId,
      };

      if (supabase) {
        try {
          const insertRow: Record<string, unknown> = {
            id: newJob.id,
            company_id: newJob.companyId,
            status: newJob.status,
            queued_at: newJob.queuedAt,
            started_at: newJob.startedAt,
            score: newJob.score,
            factors: newJob.factors,
          };
          if (userId) insertRow.user_id = userId;

          await supabase.from('skore_jobs').insert([insertRow]);
        } catch (dbErr) {
          console.warn('Supabase rerun insert error in API route:', dbErr);
        }

        try {
          await supabase.from('activity_logs').insert([
            {
              id: `act-${Date.now().toString(36)}`,
              user_id: userId ?? null,
              type: 'execution',
              title: `SKORE Calculation Dispatched: ${companyId.toUpperCase()}`,
              detail: `Job ${newJob.id} queued for execution. Status: PROCESSING.`,
              timestamp: now,
              company_id: companyId,
            },
          ]);
        } catch {}
      }

      return NextResponse.json({ success: true, job: newJob });
    }

    if (action === 'complete') {
      if (!jobId) {
        return NextResponse.json({ error: 'jobId is required for complete action' }, { status: 400 });
      }

      const completedAt = new Date().toISOString();
      if (supabase) {
        try {
          await supabase
            .from('skore_jobs')
            .update({
              status: 'completed',
              completed_at: completedAt,
            })
            .eq('id', jobId);
        } catch {}
      }

      return NextResponse.json({ success: true, completedAt });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Job workflow action failed' },
      { status: 500 }
    );
  }
}
