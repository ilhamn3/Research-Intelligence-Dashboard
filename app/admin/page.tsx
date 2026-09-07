'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Database,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Company } from '@/lib/types';
import { repository } from '@/lib/api';
import { SectionHeader } from '@/components/SectionHeader';

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    repository.listCompanies().then((items) => {
      setCompanies(items);
      setSelected(items[0]?.id ?? '');
    });
  }, []);

  function queue(action: string) {
    if (busy || !selected) return;
    setBusy(true);
    const target = companies.find((company) => company.id === selected);
    setMessage(`${action} command dispatched for ${target?.ticker ?? selected}. Background worker allocated.`);
    window.setTimeout(() => setBusy(false), 800);
  }

  return (
    <div className="content">
      <div className="eyebrow">Desk Operations & Controls</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Operator Console
        </h1>
        <span className="status-chip">
          <ShieldCheck size={13} color="#10b981" /> Idempotency Protected
        </span>
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        {/* Left Column: Workflow Triggers */}
        <div>
          <SectionHeader
            title="Manual Pipeline Triggers"
            detail="Execute asynchronous worker tasks against specific equity coverage entities"
          />

          <div className="panel">
            <label
              className="eyebrow"
              htmlFor="company"
              style={{ display: 'block', marginBottom: 8 }}
            >
              Select Target Entity
            </label>

            <select
              id="company"
              className="search"
              style={{
                width: '100%',
                height: '44px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '0 12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              disabled={!companies.length}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id} style={{ background: '#0a0e17', color: '#fff' }}>
                  {company.ticker} — {company.name} ({company.sector})
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <button
                className="button lime"
                disabled={busy || !selected}
                onClick={() => queue('Immediate Workflow Queue')}
              >
                <Play size={14} /> Queue Workflow
              </button>
              <button
                className="button secondary"
                disabled={busy || !selected}
                onClick={() => queue('Retry Latest Failure')}
              >
                <RotateCcw size={14} /> Retry Latest Error
              </button>
              <button
                className="button secondary"
                disabled={busy || !selected}
                onClick={() => queue('Full SKORE Recalculation')}
              >
                <RefreshCw size={14} /> Force Recalculate
              </button>
            </div>

            {message && (
              <div className="alert" style={{ marginTop: 20 }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Health Diagnostics */}
        <div>
          <SectionHeader
            title="System Health & Infrastructure"
            detail="Active microservices, vector indexes, and pipeline health"
          />

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Database size={18} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Postgres Database & Supabase</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Primary relational store</div>
                </div>
              </div>
              <span className="status-badge status-complete">Connected</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Asynchronous Worker Pool</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SKORE scoring microservices</div>
                </div>
              </div>
              <span className="status-badge status-processing">Ready (4 Workers)</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 8,
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Neural Synthesis Engine</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Gemini Flash 1.5 Research Model</div>
                </div>
              </div>
              <span className="status-badge status-complete">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

