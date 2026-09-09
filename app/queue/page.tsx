'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { repository } from '@/lib/api';
import { Company, SkoreJob } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SectionHeader } from '@/components/SectionHeader';

export default function QueuePage() {
  const [jobs, setJobs] = useState<SkoreJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [data, comps] = await Promise.all([repository.getJobs(), repository.listCompanies()]);
    setJobs(data);
    setCompanies(comps);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const total = jobs.length;
  const processing = jobs.filter((j) => j.status === 'started' || j.status === 'queued').length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;

  async function handleRetryOrRerun(job: SkoreJob) {
    setBusyJobId(job.id);
    setMessage('');
    const comp = companyMap.get(job.companyId);
    const ticker = comp?.ticker ?? job.companyId.toUpperCase();

    try {
      if (job.status === 'failed') {
        const retried = await repository.retryJob(job.id);
        setMessageType('success');
        setMessage(
          `Retry dispatched for ${job.id} (${ticker}). New status: ${retried.status}. Score: ${retried.score ?? '—'}/100.`
        );
      } else {
        const newJob = await repository.rerunJob(job.companyId);
        setMessageType('success');
        setMessage(
          `SKORE rerun queued for ${ticker}. New job ${newJob.id} dispatched. Status: ${newJob.status}.`
        );
      }
      // Reload jobs after action
      const updated = await repository.getJobs();
      setJobs(updated);
    } catch (err) {
      setMessageType('error');
      setMessage(`Action failed for ${job.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    setBusyJobId(null);
  }

  return (
    <div className="content">
      <div className="eyebrow">Quantitative Engine Orchestration</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          SKORE Execution Queue
        </h1>
        <button
          className="button secondary"
          onClick={() => {
            load();
            setMessage('Execution ledger synchronized with background workers.');
            setMessageType('success');
          }}
          disabled={loading}
          style={{ fontSize: '13px' }}
        >
          <RefreshCw size={14} className={loading ? 'status-dot-pulse' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Queue'}
        </button>
      </div>

      {/* Metric Counters */}
      <div className="metric-row" style={{ marginTop: 24 }}>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Jobs in Ledger</span>
            <div className="metric-icon-wrap">
              <ListTodo size={16} />
            </div>
          </div>
          <strong>{total}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>All states recorded</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">In-Flight / Queued</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
              <Clock size={16} />
            </div>
          </div>
          <strong style={{ color: '#38bdf8' }}>{processing}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Workers currently engaged</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Completed Syntheses</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <strong style={{ color: '#34d399' }}>{completed}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Successfully generated</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Failed / Exceptions</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <strong style={{ color: failed > 0 ? '#fb7185' : '#94a3b8' }}>{failed}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Requires operator review</span>
        </div>
      </div>

      <SectionHeader
        title="Execution Ledger"
        detail="Pending / Processing / Complete / Failed states with timestamps and workflow actions"
      />

      {message && (
        <div
          className="alert"
          style={{
            marginBottom: 16,
            borderColor: messageType === 'error' ? 'rgba(244,63,94,0.3)' : undefined,
            color: messageType === 'error' ? '#fb7185' : undefined,
          }}
        >
          {messageType === 'error' ? (
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
          ) : (
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
          )}
          {message}
        </div>
      )}

      <div className="panel table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job Identifier</th>
              <th>Company</th>
              <th>Status</th>
              <th>Queued Timestamp</th>
              <th>Completed Timestamp</th>
              <th>Composite SKORE</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && !loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No active jobs in the queue ledger.</div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const comp = companyMap.get(job.companyId);
                const ticker = comp?.ticker ?? job.companyId.toUpperCase();
                return (
                  <tr key={job.id}>
                    <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {job.id}
                    </td>
                    <td>
                      <Link
                        href={`/companies/${job.companyId}`}
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <span className="ticker">{ticker}</span>
                        {comp && <span className="company-name">{comp.name}</span>}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <StatusBadge status={job.status} />
                        {job.error && (
                          <span style={{ color: '#fb7185', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                            {job.error}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="mono" style={{ color: '#94a3b8' }}>
                      {new Date(job.queuedAt).toLocaleString()}
                    </td>
                    <td className="mono" style={{ color: '#94a3b8' }}>
                      {job.completedAt
                        ? new Date(job.completedAt).toLocaleString()
                        : job.startedAt
                        ? `Started ${new Date(job.startedAt).toLocaleTimeString()}`
                        : '—'}
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: '#fff' }}>
                      {job.score ?? '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="button secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        disabled={busyJobId === job.id}
                        onClick={() => handleRetryOrRerun(job)}
                      >
                        {busyJobId === job.id ? (
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                        {job.status === 'failed' ? 'Retry Job' : 'Rerun SKORE'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
