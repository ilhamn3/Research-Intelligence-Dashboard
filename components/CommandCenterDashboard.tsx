'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { watchlistStore } from '@/lib/watchlist';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Bolt,
  CheckCircle2,
  ChevronDown,
  Download,
  FileDown,
  Layers,
  Radio,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ActivityItem,
  Company,
  DashboardStats,
  Report,
  SkoreFactor,
  SkoreJob,
  Trigger,
} from '@/lib/types';
import { CorrelationChart } from '@/components/CorrelationChart';
import { ReconfigureWeightsModal } from '@/components/ReconfigureWeightsModal';

interface CommandCenterDashboardProps {
  stats: DashboardStats;
  activity: ActivityItem[];
  companies: Company[];
  jobs: SkoreJob[];
  reports: Report[];
  triggers: Trigger[];
}

const DEFAULT_COMPANY_DESCRIPTIONS: Record<string, string> = {
  c1: 'Accelerated computing, hyperscale GPU architecture & datacenter consensus dominance',
  c2: 'Enterprise cloud infrastructure, Azure AI copilot scaling & commercial software ecosystem',
  c3: 'Global systemic bank, credit underwriting breadth & net interest margin resilience',
  c4: 'Renewable energy transition, regulated utility capacity & clean power infrastructure',
  c5: 'Incretin metabolic therapeutics, oncological pipeline & high-growth pharma franchise',
  c6: 'Government defense contracts, commercial ontology platform & enterprise data mesh',
};

const DEFAULT_SECTOR_FACTORS: Record<string, SkoreFactor[]> = {
  Semiconductors: [
    { name: 'Earnings momentum', impact: 14, weight: 0.3 },
    { name: 'Valuation multiple', impact: -4, weight: 0.25 },
    { name: 'Market structure', impact: 9, weight: 0.2 },
    { name: 'Estimate breadth', impact: 12, weight: 0.25 },
  ],
  'Software & Cloud': [
    { name: 'Cloud growth', impact: 11, weight: 0.35 },
    { name: 'AI capex efficiency', impact: -6, weight: 0.25 },
    { name: 'Valuation multiple', impact: -3, weight: 0.2 },
    { name: 'Recurring ARR', impact: 8, weight: 0.2 },
  ],
  'Financial Services': [
    { name: 'Credit quality', impact: -8, weight: 0.35 },
    { name: 'Capital return', impact: 6, weight: 0.25 },
    { name: 'Earnings momentum', impact: 4, weight: 0.2 },
    { name: 'Net interest margin', impact: 7, weight: 0.2 },
  ],
  Healthcare: [
    { name: 'Earnings momentum', impact: 18, weight: 0.35 },
    { name: 'Clinical pipeline', impact: 14, weight: 0.3 },
    { name: 'Valuation multiple', impact: -5, weight: 0.2 },
    { name: 'Patent duration', impact: 6, weight: 0.15 },
  ],
  Utilities: [
    { name: 'Regulatory rate base', impact: 5, weight: 0.35 },
    { name: 'Debt service cost', impact: -9, weight: 0.35 },
    { name: 'Capital investment', impact: 4, weight: 0.3 },
  ],
};

export function CommandCenterDashboard({
  stats,
  activity,
  companies,
  jobs,
  reports,
  triggers,
}: CommandCenterDashboardProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies.find((c) => c.id === 'c1')?.id || companies[0]?.id || 'c1'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, SkoreFactor[]>>({});
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const { user } = useAuth();
  const [watchedIds, setWatchedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      watchlistStore.fetchWatched(user.id).then((ids) => {
        setWatchedIds(ids);
      });
    } else {
      setWatchedIds(watchlistStore.getWatched());
    }

    const handleWatchlistChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ watchlist: string[]; userId?: string }>;
      if (customEvent.detail?.userId && user?.id && customEvent.detail.userId !== user.id) {
        return;
      }
      setWatchedIds(watchlistStore.getWatched(user?.id));
    };

    window.addEventListener('wtfxai_watchlist_change', handleWatchlistChange);
    return () => {
      window.removeEventListener('wtfxai_watchlist_change', handleWatchlistChange);
    };
  }, [user?.id]);

  const userWatchedCompanies = useMemo(() => {
    return companies.filter((c) => watchedIds.includes(c.id));
  }, [companies, watchedIds]);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || companies[0],
    [companies, selectedCompanyId]
  );

  const focusJob = useMemo(
    () => jobs.find((j) => j.companyId === selectedCompany?.id) || jobs[0],
    [jobs, selectedCompany]
  );

  // Active factors for selected company
  const activeFactors = useMemo<SkoreFactor[]>(() => {
    if (!selectedCompany) return [];
    if (customWeights[selectedCompany.id]) {
      return customWeights[selectedCompany.id];
    }
    if (focusJob?.factors && focusJob.factors.length > 0) {
      return focusJob.factors;
    }
    const sectorDefaults = DEFAULT_SECTOR_FACTORS[selectedCompany.sector];
    if (sectorDefaults) return sectorDefaults;
    return [
      { name: 'Fundamental momentum', impact: 10, weight: 0.4 },
      { name: 'Valuation multiple', impact: -4, weight: 0.3 },
      { name: 'Market structure', impact: 6, weight: 0.3 },
    ];
  }, [selectedCompany, focusJob, customWeights]);

  // Recalculated composite score
  const compositeScore = useMemo(() => {
    const base = focusJob?.score ?? 80;
    if (selectedCompany && customWeights[selectedCompany.id]) {
      const factors = customWeights[selectedCompany.id];
      const netImpact = factors.reduce((sum, f) => sum + f.impact * f.weight, 0);
      return Math.min(99.9, Math.max(10, 75 + netImpact));
    }
    return base;
  }, [focusJob, selectedCompany, customWeights]);

  const scoreSentiment = useMemo(() => {
    if (compositeScore >= 80) return { label: 'BULLISH', bg: 'var(--emerald)', text: '#022c22' };
    if (compositeScore >= 65) return { label: 'BALANCED', bg: '#38bdf8', text: '#082f49' };
    return { label: 'CAUTION', bg: '#f43f5e', text: '#fff' };
  }, [compositeScore]);

  // --- Real Metric Calculations ---
  // 1. Sentiment Index: Weighted average SKORE score across all completed/active jobs
  const scoredJobs = useMemo(() => jobs.filter((j) => typeof j.score === 'number' && j.score > 0), [jobs]);
  const sentimentIndex = useMemo(() => {
    if (scoredJobs.length === 0) return 80;
    const avg = scoredJobs.reduce((acc, j) => acc + (j.score || 0), 0) / scoredJobs.length;
    return Math.round(avg);
  }, [scoredJobs]);

  // 2. Knowledge Depth: Monitored companies with active triggers or research jobs
  const knowledgeDepth = useMemo(() => {
    if (companies.length === 0) return 0;
    const activeEntities = new Set([
      ...triggers.map((t) => t.companyId),
      ...jobs.map((j) => j.companyId),
      ...reports.map((r) => r.companyId),
    ]);
    return Math.min(100, Math.round((activeEntities.size / companies.length) * 100));
  }, [companies, triggers, jobs, reports]);

  // 3. Operational Confidence: System execution success rate
  const { operationalConfidence, completedCount, failedCount } = useMemo(() => {
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const total = completed + failed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { operationalConfidence: rate, completedCount: completed, failedCount: failed };
  }, [jobs]);

  // 4. Risk Profile: Low volatility / stability index derived from triggers
  const { riskProfile, criticalOrHighCount } = useMemo(() => {
    if (triggers.length === 0) return { riskProfile: 100, criticalOrHighCount: 0 };
    const highCrit = triggers.filter((t) => t.severity === 'critical' || t.severity === 'high').length;
    const score = Math.max(0, Math.round((1 - highCrit / triggers.length) * 100));
    return { riskProfile: score, criticalOrHighCount: highCrit };
  }, [triggers]);

  const handleSaveWeights = (updatedFactors: SkoreFactor[]) => {
    if (!selectedCompany) return;
    setCustomWeights((prev) => ({
      ...prev,
      [selectedCompany.id]: updatedFactors,
    }));
    setFeedbackToast(`Factor weights recalibrated for ${selectedCompany.ticker}. Composite SKORE updated.`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  return (
    <div className="command-content">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: '#0e1726',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            borderRadius: 8,
            color: '#34d399',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(52, 211, 153, 0.2)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* User-Isolated Session Desk Banner */}
      <section
        className="panel"
        style={{
          marginBottom: 16,
          padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(13, 22, 38, 0.95) 0%, rgba(10, 15, 26, 0.8) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(2, 132, 199, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: '#38bdf8',
            }}
          >
            {user?.initials || 'US'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                {user ? `${user.name}'s Desk` : 'Institutional Workspace'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.04em',
                  background: user?.role === 'admin' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${user?.role === 'admin' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                  color: user?.role === 'admin' ? '#fbbf24' : '#38bdf8',
                  textTransform: 'uppercase',
                }}
              >
                {user?.role === 'admin' ? 'ADMIN' : 'USER CLEARANCE'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>
              {user?.department || 'Quantitative Strategies Desk'} · <span className="mono" style={{ color: '#64748b' }}>{user?.email || 'Active Session'}</span>
            </div>
          </div>
        </div>

        {/* User's Pinned Entities Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            My Pinned Universe ({userWatchedCompanies.length}):
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {userWatchedCompanies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCompanyId(c.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${selectedCompanyId === c.id ? '#38bdf8' : 'var(--line)'}`,
                  background: selectedCompanyId === c.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: selectedCompanyId === c.id ? '#38bdf8' : '#cbd5e1',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ★ {c.ticker}
              </button>
            ))}
            {userWatchedCompanies.length === 0 && (
              <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                No pinned entities. Browse Universe to pin companies.
              </span>
            )}
          </div>
          <Link href="/watchlist" className="button secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
            Manage Watchlist →
          </Link>
        </div>
      </section>

      {/* Company Spotlight */}
      {selectedCompany && (
        <section className="company-spotlight">
          <div className="spotlight-noise" />

          <div className="spotlight-main">
            <div className="company-logo">
              {selectedCompany.ticker.slice(0, 2)}
              <span>{selectedCompany.ticker.slice(2, 4)}</span>
            </div>

            <div className="spotlight-copy">
              <div className="spotlight-label">
                <Radio size={12} className="status-dot-pulse" style={{ display: 'inline', margin: 0 }} />
                LIVE TRACKED ENTITY · PRIMARY FOCUS
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>
                  {selectedCompany.name} <span>{selectedCompany.ticker} · {selectedCompany.sector}</span>
                </h1>

                {/* Entity Switcher Dropdown */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    aria-label="Switch primary entity"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--line)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '4px 28px 4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'DM Mono, monospace',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                    }}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: '#0b0f19', color: '#fff' }}>
                        SWITCH: {c.ticker} ({c.name})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#38bdf8',
                    }}
                  />
                </div>
              </div>

              <p className="spotlight-desc">
                {DEFAULT_COMPANY_DESCRIPTIONS[selectedCompany.id] ||
                  `${selectedCompany.sector} equity coverage with real-time SKORE factor sensitivity & channel signals.`}
              </p>

              <div className="price-line">
                <span
                  className={`status-badge ${
                    selectedCompany.status === 'active' ? 'status-complete' : 'status-processing'
                  }`}
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {selectedCompany.status.toUpperCase()}
                </span>
                <span className="change-pill">Realtime Signals Active</span>
                <small>Audit Verified · Composite Factor Consensus</small>
              </div>
            </div>
          </div>

          <div className="spotlight-meta">
            <div className="spotlight-score-box">
              <span>SKORE INTELLIGENCE</span>
              <div className="score-figure-row">
                <strong>{compositeScore.toFixed(1)}</strong>
                <em style={{ background: scoreSentiment.bg, color: scoreSentiment.text }}>
                  {scoreSentiment.label}
                </em>
              </div>
              <small>
                Confidence Index: {Math.min(99, Math.round(compositeScore * 1.08))}% consensus
              </small>
            </div>

            <Link href={`/companies/${selectedCompany.id}`} className="trigger-button">
              <Bolt size={15} /> VIEW RESEARCH DOSSIER
            </Link>
          </div>
        </section>
      )}

      {/* KPI Metric Cards — Powered by Real Data Calculations */}
      <div className="metric-row">
        <Metric
          label="Sentiment Index"
          value={`${sentimentIndex}%`}
          sub={`Coverage mean (${scoredJobs.length} scored entities)`}
          icon={<TrendingUp size={16} />}
          progress={sentimentIndex}
        />
        <Metric
          label="Knowledge Depth"
          value={`${knowledgeDepth}%`}
          sub={`Coverage entities with active intelligence`}
          icon={<Sparkles size={16} />}
          progress={knowledgeDepth}
        />
        <Metric
          label="Operational Confidence"
          value={`${operationalConfidence}%`}
          sub={`${completedCount} completed · ${failedCount} failures`}
          icon={<ShieldCheck size={16} />}
          progress={operationalConfidence}
        />
        <Metric
          label="Risk Profile"
          value={`${riskProfile}%`}
          sub={`${criticalOrHighCount} critical/high triggers active`}
          icon={<CheckCircle2 size={16} />}
          progress={riskProfile}
        />
      </div>

      {/* Primary Analytics & Right Rail */}
      <div className="command-grid">
        <div className="command-primary">
          {/* Real Historical Dynamic Correlation Chart */}
          <CorrelationChart reports={reports} jobs={jobs} companies={companies} />

          {/* System Trigger Log */}
          <section className="dark-panel system-log">
            <div className="panel-title">
              <div>
                <h2>
                  <Bell size={18} color="#38bdf8" /> Realtime Trigger & Audit Ledger
                </h2>
                <p>Event-driven signals filtered across quantitative news and disclosure channels</p>
              </div>
              <Link href="/activity" className="audit-link">
                Full Audit Trail <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="log-header">
              <span>Timestamp / Sector</span>
              <span>Trigger & Context</span>
              <span style={{ textAlign: 'center' }}>Impact</span>
            </div>

            {activity.slice(0, 5).map((item, index) => (
              <div className="log-row" key={item.id}>
                <div>
                  <b>
                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </b>
                  <small>{item.type.toUpperCase()}</small>
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span
                  className={`impact ${
                    item.type === 'error' ? 'critical' : index === 1 ? 'monitor' : 'positive'
                  }`}
                >
                  {item.type === 'error' ? 'Critical' : index === 1 ? 'Monitor' : 'Positive'}
                </span>
              </div>
            ))}
          </section>
        </div>

        {/* Right Rail */}
        <aside className="command-rail">
          {/* Driver Weights — Powered by Real per-company Factors */}
          <section className="dark-panel weights-panel">
            <div className="panel-title">
              <div>
                <h2>
                  <Layers size={17} color="#38bdf8" /> Driver Weights
                </h2>
                <p>
                  Algorithmic distribution for {selectedCompany?.ticker} ({activeFactors.length} factors)
                </p>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {activeFactors.map((factor) => {
                const weightPercent = Math.round(factor.weight * 100);
                return (
                  <div className="weight-row" key={factor.name}>
                    <div className="weight-row-top">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {factor.name}
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'DM Mono, monospace',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {weightPercent}% Weight
                        </span>
                      </span>
                      <b className={factor.impact >= 0 ? 'up' : 'down'}>
                        {factor.impact >= 0 ? '+' : ''}
                        {factor.impact}% impact
                      </b>
                    </div>

                    <div className="weight-track">
                      <i
                        className={factor.impact >= 0 ? '' : 'negative-fill'}
                        style={{ width: `${Math.max(10, Math.min(100, weightPercent))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reconfigure Factor Weights Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-action"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <Sliders size={13} /> RECONFIGURE FACTOR WEIGHTS →
            </button>
          </section>

          {/* Active Pipeline */}
          <section className="dark-panel pipeline-panel">
            <div className="panel-title">
              <div>
                <h2>Active Pipeline</h2>
              </div>
              <span className="live-count">{stats.activeTriggers || 4} AGENTS ACTIVE</span>
            </div>

            <div className="pipeline-art">
              <span>ANALYZING SENTIMENT & FILINGS...</span>
            </div>

            {jobs.slice(0, 3).map((job) => {
              const comp = companyMap.get(job.companyId);
              return (
                <div className="job-card" key={job.id}>
                  <span className="job-icon">
                    <BarChart3 size={16} />
                  </span>
                  <div>
                    <b>
                      {comp?.ticker ?? job.companyId.toUpperCase()} ·{' '}
                      {job.status === 'started' ? 'Live processing' : 'Synthesizing'}
                    </b>
                    <small>{job.status === 'started' ? 'Running neural pass' : 'Updated recently'}</small>
                  </div>
                  <CheckCircle2
                    size={16}
                    className={job.status === 'started' ? 'job-live' : 'job-dim'}
                  />
                </div>
              );
            })}

            <Link href="/queue" className="open-center">
              OPEN FULL WORKFLOW QUEUE <ArrowUpRight size={14} />
            </Link>
          </section>

          {/* Action Buttons */}
          <Link href="/reports" className="report-button">
            <FileDown size={16} /> VIEW GENERATED REPORTS (PDF)
          </Link>

          <Link href="/companies" className="export-button">
            <Download size={15} /> BROWSE RESEARCH UNIVERSE
          </Link>

          <div className="sync-note">
            <Radio size={14} />
            <span>Event-driven synchronization active. Consensus updates within 60 minutes.</span>
          </div>
        </aside>
      </div>

      {/* Reconfigure Weights Interactive Modal */}
      {selectedCompany && (
        <ReconfigureWeightsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          company={selectedCompany}
          initialFactors={activeFactors}
          onSave={handleSaveWeights}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  progress: number;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-wrap">{icon}</div>
      </div>
      <strong>{value}</strong>
      <div className="mini-track">
        <i style={{ width: `${Math.max(5, Math.min(100, progress))}%` }} />
      </div>
      <span style={{ fontSize: '11px', color: '#64748b' }}>{sub}</span>
    </div>
  );
}
