'use client';

import Link from 'next/link';
import { Search, ArrowUpRight, Building2, Filter, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Company } from '@/lib/types';
import { repository } from '@/lib/api';
import { SectionHeader } from '@/components/SectionHeader';

const SECTORS = ['All', 'Semiconductors', 'Software & Cloud', 'Financial Services', 'Utilities', 'Healthcare'];

export default function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    repository.listCompanies(query).then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, [query]);

  const filtered = items.filter((company) => {
    if (selectedSector === 'All') return true;
    return company.sector.toLowerCase() === selectedSector.toLowerCase();
  });

  return (
    <div className="content">
      <div className="eyebrow">Equity Coverage Universe</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Companies & Coverage
        </h1>
        <span className="search-shortcut" style={{ fontSize: '12px', padding: '4px 10px' }}>
          {filtered.length} Entities Monitored
        </span>
      </div>

      {/* Search Bar & Sector Filters */}
      <div style={{ marginTop: 24 }}>
        <div className="search-wrap">
          <input
            className="search"
            aria-label="Search companies"
            placeholder="Search by company name, ticker (e.g. NVDA, MSFT), or sector..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 42,
                background: 'transparent',
                border: 0,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          ) : null}
          <Search size={18} />
        </div>

        <div className="filter-pills">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              className={`pill-btn ${selectedSector === sector ? 'active' : ''}`}
              onClick={() => setSelectedSector(sector)}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <SectionHeader
        title="Active Coverage Directory"
        detail="Traceable quantitative tracking, factor updates, and SKORE synthesis triggers"
      />

      <div className="panel table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Company / Identity</th>
              <th style={{ width: '26%' }}>Sector</th>
              <th style={{ width: '18%' }}>Monitoring State</th>
              <th style={{ width: '18%', textAlign: 'right' }}>Intelligence Dossier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((company) => (
              <tr key={company.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
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
                  </div>
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
                  <span
                    className={`status-badge ${
                      company.status === 'active'
                        ? 'status-complete'
                        : company.status === 'monitoring'
                        ? 'status-processing'
                        : 'status-queued'
                    }`}
                  >
                    {company.status === 'active' ? '● Active' : company.status === 'monitoring' ? '● Watching' : '○ Paused'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/companies/${company.id}`} className="button secondary">
                    View SKORE <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && !loading && (
          <div className="empty">
            <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>No companies found matching "{query}".</p>
            <p style={{ margin: '6px 0 16px', fontSize: '12px', color: '#64748b' }}>
              Try searching with another ticker or clear the sector filter.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setQuery('');
                setSelectedSector('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

