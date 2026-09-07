'use client';

import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Company } from '@/lib/types';
import { repository } from '@/lib/api';
import { SectionHeader } from '@/components/SectionHeader';

export default function WatchlistPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [watched, setWatched] = useState<string[]>(['c1', 'c3', 'c5']);

  useEffect(() => {
    repository.listCompanies().then(setCompanies);
  }, []);

  const items = companies.filter((company) => watched.includes(company.id));

  const removeCompany = (id: string) => {
    setWatched((prev) => prev.filter((item) => item !== id));
  };

  const resetWatchlist = () => {
    setWatched(['c1', 'c2', 'c3', 'c5']);
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
              <th style={{ width: '40%' }}>Tracked Entity</th>
              <th style={{ width: '25%' }}>Sector Class</th>
              <th style={{ width: '18%' }}>Agent Status</th>
              <th style={{ width: '17%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((company) => (
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
                  <span className="status-badge status-processing">
                    <span className="status-dot-pulse" style={{ width: 6, height: 6 }} /> Active Watch
                  </span>
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
            ))}
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

