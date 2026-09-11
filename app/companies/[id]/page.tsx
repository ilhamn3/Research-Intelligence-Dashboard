'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Loader2,
  Radio,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { repository } from '@/lib/api';
import { auth } from '@/lib/auth';
import { watchlistStore } from '@/lib/watchlist';
import { Company, Report, ResearchBrief, SkoreJob, Trigger } from '@/lib/types';
import { SectionHeader } from '@/components/SectionHeader';
import { StatusBadge } from '@/components/StatusBadge';

export default function CompanyPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company>();
  const [jobs, setJobs] = useState<SkoreJob[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [brief, setBrief] = useState<ResearchBrief>();
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isWatched, setIsWatched] = useState(false);

  // Date/Time Filter States
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    Promise.all([
      repository.getCompany(params.id),
      repository.getJobs(params.id),
      repository.getTriggers(params.id),
      repository.getReports(params.id),
      watchlistStore.fetchWatched(),
    ]).then(([c, j, t, r, watched]) => {
      setCompany(c);
      setJobs(j);
      setTriggers(t);
      setReports(r);
      setIsWatched(watched.includes(params.id));
    });

    const handleWatchChange = () => {
      setIsWatched(watchlistStore.isWatched(params.id));
    };
    window.addEventListener('wtfxai_watchlist_change', handleWatchChange);
    return () => window.removeEventListener('wtfxai_watchlist_change', handleWatchChange);
  }, [params.id]);

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const repTime = new Date(report.generatedAt).getTime();
      const now = Date.now();

      if (dateFilter === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return repTime >= todayStart.getTime();
      }
      if (dateFilter === '7d') {
        return repTime >= now - 7 * 86400000;
      }
      if (dateFilter === '30d') {
        return repTime >= now - 30 * 86400000;
      }
      if (dateFilter === 'custom') {
        if (customStart && repTime < new Date(customStart).setHours(0, 0, 0, 0)) return false;
        if (customEnd && repTime > new Date(customEnd).setHours(23, 59, 59, 999)) return false;
        return true;
      }
      return true;
    });
  }, [reports, dateFilter, customStart, customEnd]);

  if (!company) {
    return (
      <div className="content">
        <div className="panel empty">
          <Loader2 size={24} className="status-dot-pulse" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: '#e2e8f0' }}>Retrieving company intelligence dossier...</p>
        </div>
      </div>
    );
  }

  const latest = jobs[0];

  async function generateBrief() {
    setLoadingBrief(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = await auth.getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/research-brief', {
        method: 'POST',
        headers,
        body: JSON.stringify({ companyId: company?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Brief generation failed.');
      setBrief(data.brief);
      setSuccessMessage('Executive Research Brief synthesized successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate brief.');
    } finally {
      setLoadingBrief(false);
    }
  }

  async function generateReport() {
    setGeneratingReport(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = await auth.getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({ companyId: company?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Report generation failed.');

      if (data.report) {
        await repository.saveReport(data.report);
        setReports((prev) => [data.report, ...prev.filter((r) => r.id !== data.report.id)]);
        const formattedDate = new Date(data.report.generatedAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setSuccessMessage(`New Research Dossier generated and saved in backend at ${formattedDate}!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate research report.');
    } finally {
      setGeneratingReport(false);
    }
  }

  async function toggleWatchlist() {
    const nowWatched = await watchlistStore.toggle(params.id);
    setIsWatched(nowWatched);
  }

  return (
    <div className="content">
      {/* Breadcrumbs */}
      <Link
        href="/companies"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#94a3b8',
          fontSize: 13,
          fontWeight: 500,
          textDecoration: 'none',
          marginBottom: 16,
          transition: 'color 0.15s ease',
        }}
      >
        <ArrowLeft size={15} /> Back to Coverage Universe
      </Link>

      {/* Hero Header */}
      <div className="company-hero">
        <div className="company-title">
          <div className="company-avatar">{company.ticker.slice(0, 2)}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="eyebrow">{company.sector}</span>
              <span
                className={`status-badge ${
                  company.status === 'active' ? 'status-complete' : 'status-processing'
                }`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
              >
                {company.status.toUpperCase()}
              </span>
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
              {company.ticker}{' '}
              <span style={{ fontSize: '16px', fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>
                {company.name}
              </span>
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="button secondary"
            onClick={toggleWatchlist}
            style={{ fontSize: '13px' }}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star
              size={14}
              fill={isWatched ? '#10b981' : 'none'}
              color={isWatched ? '#10b981' : '#94a3b8'}
            />{' '}
            {isWatched ? 'Watching' : 'Watch'}
          </button>

          <button
            className="button secondary"
            onClick={generateBrief}
            disabled={loadingBrief}
            style={{ fontSize: '13px' }}
          >
            {loadingBrief ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Synthesizing...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Generate Research Brief
              </>
            )}
          </button>

          <button
            className="button lime"
            onClick={generateReport}
            disabled={generatingReport}
            style={{ fontSize: '13px' }}
          >
            {generatingReport ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating Dossier...
              </>
            ) : (
              <>
                <FileText size={15} /> Generate Research Report
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert" style={{ marginTop: 20, borderColor: 'rgba(244,63,94,0.3)', color: '#fb7185' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert" style={{ marginTop: 20, borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: 6 }} />
          {successMessage}
        </div>
      )}

      {/* 2-Column Analytics Layout */}
      <div className="two-col" style={{ marginTop: 28 }}>
        {/* Left Column: Factor Breakdown, Signal History & Full Historical Reports */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionHeader
              eyebrow="Latest SKORE Snapshot"
              title="Factor Decomposition"
              detail="Quantitative contributors influencing composite confidence"
            />
            <div className="panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingBottom: 20,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div>
                  <div className="score">{latest?.score ?? '—'}</div>
                  <div className="score-label">Composite SKORE / 100</div>
                </div>
                <StatusBadge status={latest?.status ?? 'queued'} />
              </div>

              <div style={{ marginTop: 14 }}>
                {latest?.factors.map((factor) => (
                  <div className="factor-row" key={factor.name}>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{factor.name}</span>
                    <div className="factor-bar">
                      <div
                        className={`factor-fill ${factor.impact < 0 ? 'down' : ''}`}
                        style={{ width: `${Math.min(Math.abs(factor.impact) * 5 + 15, 100)}%` }}
                      />
                    </div>
                    <span
                      className="mono"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: factor.impact < 0 ? '#fb7185' : '#34d399',
                      }}
                    >
                      {factor.impact > 0 ? '+' : ''}
                      {factor.impact}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Research Reports Section with Date/Time Filter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
              <SectionHeader
                eyebrow="Certified Outputs"
                title="Historical Research Reports"
                detail="Every generated dossier for this company with date, time, and full audit provenance"
              />
              <span className="status-chip" style={{ marginBottom: 12 }}>
                <FileCheck size={12} color="#10b981" /> {reports.length} Total Dossiers
              </span>
            </div>

            {/* Date/Time Filter Bar */}
            <div
              className="panel"
              style={{
                marginBottom: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                background: 'rgba(10, 15, 26, 0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={11} /> Filter:
                </span>
                {(
                  [
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: '7d', label: 'Last 7 Days' },
                    { key: '30d', label: 'Last 30 Days' },
                    { key: 'custom', label: 'Custom Range' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    className={`pill-btn ${dateFilter === opt.key ? 'active' : ''}`}
                    onClick={() => setDateFilter(opt.key)}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--line)',
                      color: '#e2e8f0',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: '11px',
                    }}
                  />
                  <span style={{ color: '#64748b', fontSize: '11px' }}>to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--line)',
                      color: '#e2e8f0',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: '11px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* List of Dossiers */}
            <div className="panel" style={{ padding: '8px 18px' }}>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const genDate = new Date(report.generatedAt);
                  const dateStr = genDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const timeStr = genDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });

                  return (
                    <div key={report.id} className="activity-item" style={{ padding: '14px 0' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BookOpen size={15} color="#10b981" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                          {report.title || `${company.ticker} Research Dossier (${report.id})`}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: 4,
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            className="mono"
                            style={{
                              color: report.score >= 80 ? '#34d399' : '#38bdf8',
                              fontWeight: 700,
                            }}
                          >
                            Score: {report.score}/100
                          </span>

                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} color="#64748b" />
                            <strong style={{ color: '#e2e8f0' }}>{dateStr}</strong> at{' '}
                            <span className="mono" style={{ color: '#38bdf8' }}>
                              {timeStr}
                            </span>
                          </span>

                          {report.generationStatus && (
                            <span
                              className={`status-badge ${
                                report.generationStatus === 'certified'
                                  ? 'status-complete'
                                  : 'status-processing'
                              }`}
                              style={{ fontSize: '9px', padding: '1px 6px' }}
                            >
                              {report.generationStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/reports/${report.id}`}
                        className="button lime"
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                      >
                        Read Dossier <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>
                  <FileText size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px' }}>
                    {reports.length === 0
                      ? 'No research reports generated for this company yet.'
                      : 'No reports match the selected date filter.'}
                  </p>
                  {reports.length === 0 && (
                    <button
                      className="button lime"
                      onClick={generateReport}
                      disabled={generatingReport}
                      style={{ marginTop: 14, fontSize: '12px' }}
                    >
                      <FileText size={14} /> Generate First Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow="Audit Trail"
              title="Historical SKORE Runs"
              detail="Execution log of quantitative passes and state transitions"
            />
            <div className="panel table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Queued At</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                        {job.id}
                      </td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: '#fff' }}>
                        {job.score ?? '—'}
                      </td>
                      <td className="mono" style={{ textAlign: 'right', color: '#94a3b8' }}>
                        {new Date(job.queuedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Research Brief & Observed Signals */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionHeader
              eyebrow="AI Synthesis Dossier"
              title="Executive Research Brief"
              detail="Traceable neural synthesis across filings, revisions, and market structure"
            />
            {brief ? (
              <div
                className="panel"
                style={{ border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(14,19,31,0.9)' }}
              >
                <div className="brief-section" style={{ borderTop: 0, paddingTop: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={15} color="#38bdf8" />
                    <h3>Signal Summary</h3>
                  </div>
                  <p>{brief.summary}</p>
                </div>

                <div className="brief-section">
                  <h3>Why It Matters</h3>
                  <p>{brief.whyItMatters}</p>
                </div>

                <div className="brief-section">
                  <h3>SKORE Factors Affected</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {brief.affectedFactors.map((factor) => (
                      <div
                        key={factor.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--line)',
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{factor.name}</span>
                        {factor.direction === 'up' ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#34d399',
                              fontWeight: 600,
                            }}
                          >
                            <TrendingUp size={15} /> Impact Positive
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#fb7185',
                              fontWeight: 600,
                            }}
                          >
                            <TrendingDown size={15} /> Impact Negative
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="brief-section">
                  <h3>What to Watch</h3>
                  <ul>
                    {brief.watchNext.map((item) => (
                      <li key={item} style={{ margin: '4px 0' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="brief-section">
                  <h3>Evidence & Traceability</h3>
                  <ul>
                    {brief.evidence.map((item) => (
                      <li
                        key={item}
                        style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', margin: '4px 0' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="panel empty" style={{ border: '1px dashed var(--line)' }}>
                <Sparkles size={28} style={{ margin: '0 auto 12px', color: '#38bdf8' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>No Brief Generated Yet</h4>
                <p style={{ margin: '8px 0 16px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
                  Click &quot;Generate Research Brief&quot; to synthesize live regulatory filings, revisions, and SKORE factor impacts.
                </p>
                <button className="button primary" onClick={generateBrief} disabled={loadingBrief}>
                  <Sparkles size={14} /> Generate Now
                </button>
              </div>
            )}
          </div>

          <div>
            <SectionHeader
              eyebrow="Realtime Triggers"
              title="Observed Market Signals"
              detail="Active channel checks and data anomalies"
            />
            <div className="panel" style={{ padding: '8px 18px' }}>
              {triggers.length > 0 ? (
                triggers.map((trigger) => (
                  <div className="activity-item" key={trigger.id}>
                    <span className="status-dot-pulse" style={{ marginTop: 6 }} />
                    <div>
                      <div className="activity-title">{trigger.type}</div>
                      <div className="activity-detail">{trigger.summary}</div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          marginTop: 4,
                          fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        {new Date(trigger.detectedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`severity severity-${trigger.severity}`}>{trigger.severity}</span>
                  </div>
                ))
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>
                  No active trigger anomalies detected for this entity.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
