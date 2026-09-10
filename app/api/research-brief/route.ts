import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { repository } from '@/lib/api';
import { ResearchBrief, factorDirection } from '@/lib/types';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function fallbackBrief(
  companyId: string,
  name: string,
  ticker: string,
  score: number,
  factors: { name: string; impact: number }[],
  triggerSummary: string,
  userId?: string
): ResearchBrief {
  return {
    companyId,
    userId,
    summary: `${ticker} is showing a material research signal: ${triggerSummary}`,
    whyItMatters: `The latest SKORE snapshot is ${score}/100. The signal merits a focused review of estimate breadth and the factors moving the composite score.`,
    affectedFactors: factors.map((factor) => ({
      name: factor.name,
      direction: factorDirection(factor.impact),
    })),
    watchNext: [
      'Next earnings estimate revision',
      'Price action versus sector basket',
      'Confirmation from the next company filing',
    ],
    evidence: [`${name} · latest trigger`, `SKORE score ${score}/100`, 'WTFXAI internal monitoring feed'],
  };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    const supabase = getSupabaseServerClient();
    let authenticatedUserId: string | undefined;

    if (token && supabase) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        authenticatedUserId = userData.user.id;
      }
    }

    const { companyId } = await request.json();
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required.' }, { status: 400 });
    }

    const company = await repository.getCompany(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const [triggers, jobs] = await Promise.all([
      repository.getTriggers(companyId),
      repository.getJobs(companyId),
    ]);

    const latest = jobs[0];
    if (!latest) {
      return NextResponse.json({ error: 'No SKORE data is available for this company.' }, { status: 422 });
    }

    const promptData = { company, triggers, latestSkore: latest };
    const fallback = fallbackBrief(
      companyId,
      company.name,
      company.ticker,
      latest.score ?? 0,
      latest.factors,
      triggers[0]?.summary ?? 'No new trigger summary available.',
      authenticatedUserId
    );

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Return strict JSON only with keys whatHappened, whyItMatters, skoreFactorsAffected (array of name and direction up/down), whatToWatch (array), sources (array). Analyze this research data: ${JSON.stringify(
                        promptData
                      )}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const payload = await response.json();
          const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/^```json\s*|\s*```$/g, '');
          if (text) {
            const parsed = JSON.parse(text);
            const brief: ResearchBrief = {
              companyId,
              userId: authenticatedUserId,
              summary: parsed.whatHappened,
              whyItMatters: parsed.whyItMatters,
              affectedFactors: parsed.skoreFactorsAffected,
              watchNext: parsed.whatToWatch,
              evidence: parsed.sources,
            };
            return NextResponse.json({ brief: await repository.saveBrief(brief) });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini brief generation fallback:', geminiErr);
      }
    }

    try {
      return NextResponse.json({ brief: await repository.saveBrief(fallback) });
    } catch {
      return NextResponse.json({ brief: fallback });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to generate research brief.' },
      { status: 502 }
    );
  }
}
