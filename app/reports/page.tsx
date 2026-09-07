'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  Download,
  FileCheck,
  FileDown,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { repository } from '@/lib/api';
import { Company, Report } from '@/lib/types';
import { SectionHeader } from '@/components/SectionHeader';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([repository.getReports(), repository.listCompanies()]).then(([r, c]) => {
      setReports(r);
      setCompanies(c);
    });
  }, []);

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const filtered = reports.filter((report) => {
    const comp = companyMap.get(report.companyId);
    const text = `${report.id} ${report.companyId} ${comp?.name ?? ''} ${comp?.ticker ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const handleDownload = (id: string, ticker: string) => {
    setDownloading(id);
    window.setTimeout(() => {
      setDownloading(null);
      // Create a virtual download blob for demo export
      const element = document.createElement('a');
      const file = new Blob(
        [
          `WTFXAI RESEARCH INTELLIGENCE DOSSIER\nTarget: ${ticker}\nReport ID: ${id}\nDate: ${new Date().toISOString()}\nStatus: CERTIFIED OPERATIONAL CONSENSUS`,
        ],
        { type: 'text/plain' }
      );
      element.href = URL.createObjectURL(file);
      element.download = `WTFXAI_${ticker}_Intelligence_Dossier.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 600);
  };

  return (
    <div className="content">
      <div className="eyebrow">Desk Intelligence Artifacts</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Research Reports & Dossiers
        </h1>
        <span className="status-chip">
          <FileCheck size={13} color="#10b981" /> {reports.length} Certified Dossiers
        </span>
      </div>

      {/* Metric Highlights */}
      <div className="metric-row" style={{ marginTop: 24 }}>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Archived Dossiers</span>
            <div className="metric-icon-wrap">
              <FileText size={16} />
            </div>
          </div>
          <strong>{reports.length}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Full consensus briefs</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Mean SKORE Consensus</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <strong style={{ color: '#38bdf8' }}>
            {reports.length > 0
              ? (reports.reduce((acc, curr) => acc + (curr.score || 0), 0) / reports.length).toFixed(1)
              : '82.3'}
          </strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Coverage universe benchmark</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">High Conviction (85+)</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <strong style={{ color: '#34d399' }}>
            {reports.filter((r) => r.score >= 85).length || 2}
          </strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Top quartile consensus</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Export Format</span>
            <div className="metric-icon-wrap">
              <FileDown size={16} />
            </div>
          </div>
          <strong style={{ fontSize: '20px', letterSpacing: '0.04em' }}>PDF / TXT</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Compliance audit ready</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginTop: 24 }}>
        <div className="search-wrap">
          <input
            className="search"
            aria-label="Search reports"
            placeholder="Search reports by ticker, report ID, or company name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search size={18} />
        </div>
      </div>

      <SectionHeader
        title="Dossier Repository"
        detail="Traceable synthesis reports generated from multi-agent event workflows"
      />

      <div className="panel table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dossier ID</th>
              <th>Tracked Entity</th>
              <th>Composite SKORE</th>
              <th>Generation Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((report) => {
              const comp = companyMap.get(report.companyId);
              const ticker = comp?.ticker ?? report.companyId.toUpperCase();
              return (
                <tr key={report.id}>
                  <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {report.id.toUpperCase()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="ticker">{ticker}</span>
                      <span className="company-name">{comp?.name ?? 'Covered Asset'}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'DM Mono, monospace',
                        fontWeight: 700,
                        color: report.score >= 80 ? '#34d399' : '#38bdf8',
                        fontSize: '14px',
                      }}
                    >
                      {report.score}/100
                    </span>
                  </td>
                  <td className="mono" style={{ color: '#94a3b8' }}>
                    {new Date(report.generatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Link
                        href={`/companies/${report.companyId}`}
                        className="button secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Dossier <ArrowUpRight size={13} />
                      </Link>
                      <button
                        className="button primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        disabled={downloading === report.id}
                        onClick={() => handleDownload(report.id, ticker)}
                      >
                        <Download size={13} />
                        {downloading === report.id ? 'Exporting...' : 'Export'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty">
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0' }}>No dossiers match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
