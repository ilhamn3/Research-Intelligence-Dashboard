'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { repository } from '@/lib/api';
import { SkoreJob } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SectionHeader } from '@/components/SectionHeader';

export default function QueuePage() {
  const [jobs, setJobs] = useState<SkoreJob[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await repository.getJobs();
    setJobs(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const total = jobs.length;
  const processing = jobs.filter((j) => j.status === 'started' || j.status === 'queued').length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;

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
        detail="Traceable status of parallel worker runs, inputs, and scoring outcomes"
      />

      {message && (
        <div className="alert" style={{ marginBottom: 16 }}>
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
              <th>Composite SKORE</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && !loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No active jobs in the queue ledger.</div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {job.id}
                  </td>
                  <td>
                    <span className="ticker">{job.companyId.toUpperCase()}</span>
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
                  <td className="mono" style={{ fontWeight: 700, color: '#fff' }}>
                    {job.score ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="button secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() =>
                        setMessage(
                          `Manual trigger queued for ${job.id} (${job.companyId.toUpperCase()}). Worker dispatched.`
                        )
                      }
                    >
                      <RotateCcw size={12} />
                      {job.status === 'failed' ? 'Retry Job' : 'Rerun SKORE'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

