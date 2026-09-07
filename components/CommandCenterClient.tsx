'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bolt,
  CheckCircle2,
  ChevronDown,
  Layers,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Company, SkoreFactor, SkoreJob } from '@/lib/types';
import { ReconfigureWeightsModal } from '@/components/ReconfigureWeightsModal';

interface CommandCenterClientProps {
  companies: Company[];
  jobs: SkoreJob[];
  children?: React.ReactNode;
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

export function CommandCenterClient({ companies, jobs, children }: CommandCenterClientProps) {
  const [selectedId, setSelectedId] = useState<string>(
    companies.find((c) => c.id === 'c1')?.id || companies[0]?.id || 'c1'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, SkoreFactor[]>>({});
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedId) || companies[0],
    [companies, selectedId]
  );

  const focusJob = useMemo(
    () => jobs.find((j) => j.companyId === selectedCompany?.id) || jobs[0],
    [jobs, selectedCompany]
  );

  // Determine current active factors (custom configured > job factors > sector defaults)
  const currentFactors = useMemo<SkoreFactor[]>(() => {
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

  // Dynamically compute composite SKORE based on base score and factors
  const compositeScore = useMemo(() => {
    const base = focusJob?.score ?? 80;
    // If weights have been tuned, recompute offset
    if (selectedCompany && customWeights[selectedCompany.id]) {
      const factors = customWeights[selectedCompany.id];
      const netWeightedImpact = factors.reduce((sum, f) => sum + f.impact * f.weight, 0);
      return Math.min(99.9, Math.max(10, 75 + netWeightedImpact));
    }
    return base;
  }, [focusJob, selectedCompany, customWeights]);

  const scoreSentiment = useMemo(() => {
    if (compositeScore >= 80) return { label: 'BULLISH', bg: 'var(--emerald)', text: '#022c22' };
    if (compositeScore >= 65) return { label: 'BALANCED', bg: '#38bdf8', text: '#082f49' };
    return { label: 'CAUTION', bg: '#f43f5e', text: '#fff' };
  }, [compositeScore]);

  const handleSaveWeights = (newFactors: SkoreFactor[]) => {
    if (!selectedCompany) return;
    setCustomWeights((prev) => ({
      ...prev,
      [selectedCompany.id]: newFactors,
    }));
    setFeedbackToast(`Factor weights recalibrated for ${selectedCompany.ticker}.`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  return (
    <>
      {/* Toast Feedback */}
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
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
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
                <span className="status-badge status-complete" style={{ fontSize: '11px', padding: '2px 8px' }}>
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

      {/* Main Grid Content (Passed from parent or slotted) */}
      {children}

      {/* Reconfigure Weights Modal */}
      {selectedCompany && (
        <ReconfigureWeightsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          company={selectedCompany}
          initialFactors={currentFactors}
          onSave={handleSaveWeights}
        />
      )}
    </>
  );
}

/**
 * DriverWeightsPanel
 * Subcomponent rendered inside the right rail to display the selected company's
 * real factor weights and trigger the Reconfigure modal.
 */
interface DriverWeightsPanelProps {
  company: Company;
  factors: SkoreFactor[];
  onOpenReconfigure: () => void;
}

export function DriverWeightsPanel({
  company,
  factors,
  onOpenReconfigure,
}: DriverWeightsPanelProps) {
  return (
    <section className="dark-panel weights-panel">
      <div className="panel-title">
        <div>
          <h2>
            <Layers size={17} color="#38bdf8" /> Driver Weights
          </h2>
          <p>
            Algorithmic distribution for {company.ticker} ({factors.length} active factors)
          </p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {factors.map((factor) => {
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

      <button
        type="button"
        onClick={onOpenReconfigure}
        className="text-action"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          textAlign: 'center',
        }}
      >
        <Sliders size={13} /> RECONFIGURE FACTOR WEIGHTS →
      </button>
    </section>
  );
}
