'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Filter,
  Radio,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { repository } from '@/lib/api';
import { ActivityItem } from '@/lib/types';
import { SectionHeader } from '@/components/SectionHeader';

const CATEGORIES = ['All Events', 'Triggers', 'Decisions', 'Executions', 'Errors'];

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState('All Events');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repository.getActivity().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter((item) => {
    if (filter === 'All Events') return true;
    if (filter === 'Triggers') return item.type === 'trigger';
    if (filter === 'Decisions') return item.type === 'decision';
    if (filter === 'Executions') return item.type === 'execution';
    if (filter === 'Errors') return item.type === 'error';
    return true;
  });

  const getEventIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'trigger':
        return <Zap size={14} color="#10b981" />;
      case 'decision':
        return <Brain size={14} color="#38bdf8" />;
      case 'execution':
        return <CheckCircle2 size={14} color="#a855f7" />;
      case 'error':
        return <AlertTriangle size={14} color="#f43f5e" />;
    }
  };

  return (
    <div className="content">
      <div className="eyebrow">Deterministic Audit Ledger</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Agent Activity Feed
        </h1>
        <span className="status-chip">
          <Radio size={12} className="status-dot-pulse" style={{ display: 'inline', margin: 0 }} /> Live Neural Mesh
        </span>
      </div>

      {/* Filter Pills */}
      <div className="filter-pills" style={{ marginTop: 20 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`pill-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <SectionHeader
        title="Chronological Event Sequence"
        detail="Every detected signal, agent decision, worker execution, and exception"
      />

      <div className="panel" style={{ padding: '8px 24px' }}>
        {filtered.map((item) => (
          <div className="activity-item" key={item.id} style={{ padding: '16px 0' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  item.type === 'error'
                    ? 'rgba(244,63,94,0.1)'
                    : item.type === 'trigger'
                    ? 'rgba(16,185,129,0.1)'
                    : item.type === 'decision'
                    ? 'rgba(56,189,248,0.1)'
                    : 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {getEventIcon(item.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="activity-title">{item.title}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'DM Mono, monospace',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                  }}
                >
                  {item.type}
                </span>
                {item.companyId && (
                  <Link
                    href={`/companies/${item.companyId}`}
                    style={{
                      fontSize: '11px',
                      color: '#38bdf8',
                      fontFamily: 'DM Mono, monospace',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    {item.companyId.toUpperCase()} <ArrowUpRight size={10} />
                  </Link>
                )}
              </div>
              <div className="activity-detail" style={{ marginTop: 4, color: '#cbd5e1' }}>
                {item.detail}
              </div>
            </div>

            <time className="activity-time mono">
              {new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
              <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
                {new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </time>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="empty">
            <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No activity logged under this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

