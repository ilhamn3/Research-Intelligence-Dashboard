'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  X,
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
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  useEffect(() => {
    Promise.all([repository.getReports(), repository.listCompanies()]).then(([r, c]) => {
      setReports(r);
      setCompanies(c);
    });
  }, []);

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const filtered = reports.filter((report) => {
    const comp = companyMap.get(report.companyId);
    const text = `${report.id} ${report.companyId} ${comp?.name ?? ''} ${comp?.ticker ?? ''} ${report.title ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const handleDownload = (id: string, ticker: string) => {
    setDownloading(id);
    window.setTimeout(() => {
      setDownloading(null);
      const rep = reports.find((r) => r.id === id);
      const file = new Blob(
        [
          `WTFXAI RESEARCH INTELLIGENCE DOSSIER\nTarget: ${ticker}\nReport ID: ${id.toUpperCase()}\nDate: ${new Date().toISOString()}\nStatus: ${(rep?.generationStatus || 'CERTIFIED').toUpperCase()}\nScore: ${rep?.score ?? 80}/100\n\nExecutive Summary:\n${rep?.executiveSummary || 'Multimodal research synthesis generated from primary filings and order books.'}\n`,
        ],
        { type: 'text/plain' }
      );
      const element = document.createElement('a');
      element.href = URL.createObjectURL(file);
      element.download = `WTFXAI_${ticker}_Dossier_${id.toUpperCase()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 500);
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
            <span className="metric-label">Report Viewer Format</span>
            <div className="metric-icon-wrap">
              <FileDown size={16} />
            </div>
          </div>
          <strong style={{ fontSize: '20px', letterSpacing: '0.04em' }}>Interactive / PDF</strong>
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
        detail="Readable research and SKORE output with metadata, generation status, and factor attribution"
      />

      <div className="panel table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dossier ID</th>
              <th>Tracked Entity</th>
              <th>Generation Status</th>
              <th>Composite SKORE</th>
              <th>Generation Timestamp</th>
              <th style={{ textAlign: 'right' }}>Report Viewer Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((report) => {
              const comp = companyMap.get(report.companyId);
              const ticker = comp?.ticker ?? report.companyId.toUpperCase();
              const status = report.generationStatus || 'certified';
              return (
                <tr key={report.id}>
                  <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    <Link
                      href={`/reports/${report.id}`}
                      style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {report.id.toUpperCase()} <ArrowUpRight size={12} />
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Link href={`/companies/${report.companyId}`} style={{ textDecoration: 'none' }}>
                        <span className="ticker">{ticker}</span>
                      </Link>
                      <span className="company-name">{comp?.name ?? 'Covered Asset'}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        status === 'certified'
                          ? 'status-complete'
                          : status === 'in-review'
                          ? 'status-processing'
                          : 'status-queued'
                      }`}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {status.toUpperCase()}
                    </span>
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
                      <button
                        className="button secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setPreviewReport(report)}
                        title="Quick View summary"
                      >
                        <Eye size={13} /> Quick View
                      </button>
                      <Link
                        href={`/reports/${report.id}`}
                        className="button lime"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <BookOpen size={13} /> Read Full Report
                      </Link>
                      <button
                        className="button secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        disabled={downloading === report.id}
                        onClick={() => handleDownload(report.id, ticker)}
                        title="Export TXT Dossier"
                      >
                        <Download size={13} />
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

      {/* Quick View Drawer / Modal */}
      {previewReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewReport(null)}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0d131f',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              padding: '24px 28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="eyebrow">
                  Dossier Preview · {previewReport.id.toUpperCase()}
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                  {previewReport.title || `${companyMap.get(previewReport.companyId)?.ticker} Research Synthesis`}
                </h2>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <span className={`status-badge status-complete`}>
                {(previewReport.generationStatus || 'CERTIFIED').toUpperCase()} CONSENSUS
              </span>
              <span className="mono" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
                Score: {previewReport.score}/100
              </span>
              <span className="mono" style={{ color: '#64748b', fontSize: '12px' }}>
                {new Date(previewReport.generatedAt).toLocaleString()}
              </span>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 6 }}>
                Executive Summary
              </h3>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px', lineHeight: 1.6 }}>
                {previewReport.executiveSummary || 'Automated multi-agent synthesis across regulatory disclosures and factor sensitivities.'}
              </p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 8 }}>
                Factor Decomposition
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewReport.factors.map((factor) => (
                  <div key={factor.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#cbd5e1' }}>{factor.name}</span>
                    <span className="mono" style={{ color: factor.impact >= 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                      {factor.impact >= 0 ? '+' : ''}{factor.impact}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <button className="button secondary" onClick={() => setPreviewReport(null)}>
                Close Preview
              </button>
              <Link href={`/reports/${previewReport.id}`} className="button lime">
                Open Full Dossier <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
