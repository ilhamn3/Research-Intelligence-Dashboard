'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Sliders, X, RotateCcw } from 'lucide-react';
import { Company, SkoreFactor } from '@/lib/types';

interface ReconfigureWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  initialFactors: SkoreFactor[];
  onSave: (updatedFactors: SkoreFactor[]) => Promise<void> | void;
}

export function ReconfigureWeightsModal({
  isOpen,
  onClose,
  company,
  initialFactors,
  onSave,
}: ReconfigureWeightsModalProps) {
  const [factors, setFactors] = useState<SkoreFactor[]>(initialFactors);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFactors(initialFactors);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, initialFactors]);

  if (!isOpen) return null;

  const totalWeightPercent = Math.round(
    factors.reduce((sum, f) => sum + (f.weight || 0), 0) * 100
  );
  const isBalanced = totalWeightPercent === 100;

  const handleWeightChange = (index: number, newPercent: number) => {
    setSuccessMessage('');
    setErrorMessage('');
    const clamped = Math.min(100, Math.max(0, newPercent));
    const next = [...factors];
    next[index] = {
      ...next[index],
      weight: parseFloat((clamped / 100).toFixed(2)),
    };
    setFactors(next);
  };

  const handleAutoBalance = () => {
    if (factors.length === 0) return;
    const count = factors.length;
    const equalShare = parseFloat((1 / count).toFixed(2));
    const next = factors.map((f, i) => ({
      ...f,
      weight: i === count - 1 ? parseFloat((1 - equalShare * (count - 1)).toFixed(2)) : equalShare,
    }));
    setFactors(next);
    setErrorMessage('');
  };

  const handleReset = () => {
    setFactors(initialFactors);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!isBalanced) {
      setErrorMessage(`Total factor weighting must equal 100% (currently ${totalWeightPercent}%).`);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      // Simulate real async worker mutation / dispatch
      await new Promise((resolve) => setTimeout(resolve, 600));
      await onSave(factors);
      setSuccessMessage(`Factor weights recalibrated for ${company.ticker}. New composite score calculated.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update factor weights.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#0e131f',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'grid',
                placeItems: 'center',
                color: '#38bdf8',
              }}
            >
              <Sliders size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Reconfigure Factor Weights
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                {company.ticker} — {company.name} ({company.sector})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: 'transparent',
              border: 0,
              color: '#64748b',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 8,
              background: isBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
              border: `1px solid ${isBalanced ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
            }}
          >
            <div style={{ fontSize: 12, color: '#e2e8f0' }}>
              Cumulative Distribution:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isBalanced ? '#34d399' : '#fb7185',
                }}
              >
                {totalWeightPercent}% / 100%
              </span>
              <button
                type="button"
                onClick={handleAutoBalance}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  color: '#94a3b8',
                  fontSize: 11,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                Auto-Balance
              </button>
            </div>
          </div>

          {/* Factor Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 280, overflowY: 'auto' }}>
            {factors.map((factor, index) => {
              const weightVal = Math.round(factor.weight * 100);
              return (
                <div
                  key={factor.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
                      {factor.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'DM Mono, monospace',
                          color: factor.impact >= 0 ? '#34d399' : '#fb7185',
                        }}
                      >
                        {factor.impact >= 0 ? '+' : ''}
                        {factor.impact}% impact
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: 'DM Mono, monospace',
                          fontWeight: 700,
                          color: '#38bdf8',
                        }}
                      >
                        {weightVal}%
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightVal}
                    onChange={(e) => handleWeightChange(index, Number(e.target.value))}
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      accentColor: '#38bdf8',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                fontSize: 12,
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: 12,
              }}
            >
              <CheckCircle2 size={15} />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            className="button secondary"
            onClick={handleReset}
            disabled={isSaving}
            style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={13} /> Reset
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={isSaving}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button lime"
              onClick={handleSave}
              disabled={isSaving || !isBalanced}
              style={{ fontSize: 12, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving & Recalibrating...
                </>
              ) : (
                'Save & Recalibrate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
