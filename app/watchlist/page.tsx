'use client';

import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Plus, Radio, Star, Trash2, Zap } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Company, SkoreJob, Trigger } from '@/lib/types';
import { repository } from '@/lib/api';
import { watchlistStore } from '@/lib/watchlist';
import { SectionHeader } from '@/components/SectionHeader';
import { StatusBadge } from '@/components/StatusBadge';

export default function WatchlistPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [watched, setWatched] = useState<string[]>([]);
  const [latestJobs, setLatestJobs] = useState<Record<string, SkoreJob | undefined>>({});
  const [latestTriggers, setLatestTriggers] = useState<Record<string, Trigger | undefined>>({});

  const loadWatchlist = useCallback(() => {
    setWatched(watchlistStore.getWatched());
  }, []);

  useEffect(() => {
    loadWatchlist();
    repository.listCompanies().then(setCompanies);

    const handleChange = () => loadWatchlist();
    window.addEventListener('wtfxai_watchlist_change', handleChange);
    return () => window.removeEventListener('wtfxai_watchlist_change', handleChange);
  }, [loadWatchlist]);

  // Fetch latest job and trigger for each watched company
  useEffect(() => {
    if (watched.length === 0) return;
    watched.forEach(async (companyId) => {
      const [jobs, triggers] = await Promise.all([
        repository.getJobs(companyId),
        repository.getTriggers(companyId),
      ]);
      setLatestJobs((prev) => ({ ...prev, [companyId]: jobs[0] }));
      setLatestTriggers((prev) => ({ ...prev, [companyId]: triggers[0] }));
    });
  }, [watched]);

  const items = companies.filter((company) => watched.includes(company.id));

  const removeCompany = (id: string) => {
    watchlistStore.remove(id);
  };

  const resetWatchlist = () => {
    watchlistStore.reset();
  };

  return (
    <div className="content">
      <div className="eyebrow">Personal Coverage Portfolio</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Desk Watchlist
        </h1>
        <span className="status-chip">
          <Star size={13} fill="#10b981" color="#10b981" /> {items.length} Active Pins
        </span>
      </div>

      <SectionHeader
        title="Pinned Entities & Priority Alerts"
        detail="Realtime factor sensitivity tracking and prioritized event notifications"
        action={
          items.length < companies.length ? (
            <button
              className="button secondary"
              onClick={resetWatchlist}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} /> Restore Defaults
            </button>
          ) : undefined
        }
      />

      <div className="panel table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Tracked Entity</th>
              <th style={{ width: '18%' }}>Sector Class</th>
              <th style={{ width: '18%' }}>Research State</th>
              <th style={{ width: '20%' }}>Latest Trigger</th>
              <th style={{ width: '14%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((company) => {
              const job = latestJobs[company.id];
              const trigger = latestTriggers[company.id];
              return (
                <tr key={company.id}>
                  <td>
                    <Link
                      href={`/companies/${company.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, rgba(2,132,199,0.2) 0%, rgba(56,189,248,0.1) 100%)',
                          border: '1px solid rgba(56,189,248,0.25)',
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: 'DM Mono, monospace',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#38bdf8',
                          flexShrink: 0,
                        }}
                      >
                        {company.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <span className="ticker">{company.ticker}</span>
                        <div className="company-name">{company.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        color: '#cbd5e1',
                      }}
                    >
                      {company.sector}
                    </span>
                  </td>
                  <td>
                    {job ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <StatusBadge status={job.status} />
                        {job.score != null && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '11px',
                              color: job.score >= 80 ? '#34d399' : '#38bdf8',
                              fontWeight: 600,
                            }}
                          >
                            SKORE {job.score}/100
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="status-badge status-processing">
                        <span className="status-dot-pulse" style={{ width: 6, height: 6 }} /> Active Watch
                      </span>
                    )}
                  </td>
                  <td>
                    {trigger ? (
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                          <Zap size={12} color="#10b981" />
                          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{trigger.type}</span>
                          <span className={`severity severity-${trigger.severity}`} style={{ fontSize: '10px' }}>
                            {trigger.severity}
                          </span>
                        </div>
                        <div
                          style={{
                            color: '#94a3b8',
                            fontSize: '11px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 220,
                          }}
                        >
                          {trigger.summary}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748b' }}>No active triggers</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Link href={`/companies/${company.id}`} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Analyze <ArrowUpRight size={13} />
                      </Link>
                      <button
                        className="button secondary"
                        aria-label={`Remove ${company.ticker} from watchlist`}
                        title="Remove from watchlist"
                        onClick={() => removeCompany(company.id)}
                        style={{ padding: '6px 9px', color: '#94a3b8' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="empty">
            <BriefcaseBusiness size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>Your desk watchlist is currently empty.</p>
            <p style={{ margin: '6px 0 16px', fontSize: '12px', color: '#64748b' }}>
              Pin companies to maintain real-time neural radar across key equities.
            </p>
            <button className="button primary" onClick={resetWatchlist}>
              <Plus size={14} /> Populate Default Watchlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
