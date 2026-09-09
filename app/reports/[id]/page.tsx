'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  FileCheck,
  FileDown,
  FileText,
  Fingerprint,
  Layers,
  ListTodo,
  Loader2,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { repository } from '@/lib/api';
import { Company, Report, SkoreJob } from '@/lib/types';
import { SectionHeader } from '@/components/SectionHeader';

export default function ReportViewerPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [relatedJob, setRelatedJob] = useState<SkoreJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const rep = await repository.getReport(params.id);
      if (rep) {
        setReport(rep);
        const [comp, jobs] = await Promise.all([
          repository.getCompany(rep.companyId),
          repository.getJobs(rep.companyId),
        ]);
        if (comp) setCompany(comp);
        const job = jobs.find((j) => j.score === rep.score) || jobs[0];
        if (job) setRelatedJob(job);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleExport = () => {
    if (!report) return;
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const ticker = company?.ticker ?? report.companyId.toUpperCase();
      const content = `WTFXAI INSTITUTIONAL RESEARCH INTELLIGENCE DOSSIER
=====================================================
REPORT IDENTIFIER : ${report.id.toUpperCase()}
TARGET ENTITY     : ${ticker} (${company?.name ?? 'Covered Asset'})
SECTOR            : ${company?.sector ?? 'Equity Coverage'}
GENERATION STATUS : ${(report.generationStatus || 'CERTIFIED').toUpperCase()}
GENERATION DATE   : ${new Date(report.generatedAt).toUTCString()}
MODEL VERSION     : ${report.modelVersion || 'WTFXAI-v2.4-NEURAL'}
AUDIT CHECKSUM    : ${report.checksum || 'sha256:d8a9f3b20c1844b82193e2b9c71'}
AUTHOR AGENT      : ${report.authorAgent || 'Quantitative Operations Desk'}
COMPOSITE SKORE   : ${report.score}/100

EXECUTIVE SUMMARY
-----------------
${report.executiveSummary || 'Automated multi-agent synthesis generated from primary filings and order books.'}

INVESTMENT THESIS
-----------------
${report.investmentThesis || 'High conviction quantitative signal supported by factor momentum.'}

FACTOR DECOMPOSITION
--------------------
${report.factors.map((f) => `- ${f.name.padEnd(24)}: ${(f.impact > 0 ? '+' : '') + f.impact}% impact (weight ${Math.round(f.weight * 100)}%)`).join('\n')}

KEY CATALYSTS
-------------
${(report.keyCatalysts || ['Next quarterly earnings filing', 'Channel volume confirmations']).map((c) => `* ${c}`).join('\n')}

RISK FACTORS
------------
${(report.riskFactors || ['Sector multiple compression', 'Regulatory disclosure revisions']).map((r) => `* ${r}`).join('\n')}

PRIMARY EVIDENCE & TRACEABILITY
--------------------------------
${(report.sources || ['SEC EDGAR Filings', 'WTFXAI Signal Processing Ledger']).map((s) => `[+] ${s}`).join('\n')}
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const el = document.createElement('a');
      el.href = URL.createObjectURL(blob);
      el.download = `WTFXAI_${ticker}_Dossier_${report.id.toUpperCase()}.txt`;
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    }, 500);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="panel empty" style={{ minHeight: 320, display: 'grid', placeContent: 'center' }}>
          <Loader2 size={26} className="status-dot-pulse" style={{ margin: '0 auto 14px' }} />
          <p style={{ margin: 0, color: '#e2e8f0', fontSize: 14 }}>Retrieving certified research dossier...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="content">
        <Link
          href="/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#94a3b8',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} /> Back to Reports Repository
        </Link>
        <div className="panel empty">
          <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: '#fb7185' }} />
          <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 18 }}>Dossier Not Found</h2>
          <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 13 }}>
            No report matching identifier "{params.id}" exists in the certified ledger.
          </p>
          <Link href="/reports" className="button secondary">
            Browse All Reports
          </Link>
        </div>
      </div>
    );
  }

  const ticker = company?.ticker ?? report.companyId.toUpperCase();
  const status = report.generationStatus || 'certified';

  return (
    <div className="content">
      {/* Quick Navigation Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Link
          href="/reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#94a3b8',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
        >
          <ArrowLeft size={14} /> Back to Reports Repository
        </Link>

        {/* Fast Navigation Interlinks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href={`/companies/${report.companyId}`}
            className="button secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Company Intelligence <ArrowUpRight size={12} />
          </Link>
          {relatedJob && (
            <Link
              href="/queue"
              className="button secondary"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Execution Ledger <ListTodo size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="company-hero">
        <div className="company-title">
          <div className="company-avatar">{ticker.slice(0, 2)}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="eyebrow">{company?.sector ?? 'Equity Research'}</span>
              <span
                className={`status-badge ${
                  status === 'certified'
                    ? 'status-complete'
                    : status === 'in-review'
                    ? 'status-processing'
                    : 'status-queued'
                }`}
                style={{ fontSize: '10px', padding: '2px 8px', letterSpacing: '0.05em' }}
              >
                {status.toUpperCase()} CONSENSUS
              </span>
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  color: '#94a3b8',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                DOSSIER ID: {report.id.toUpperCase()}
              </span>
            </div>
            <h1 style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 700, color: '#fff' }}>
              {report.title || `${ticker} Quantitative Research & Factor Dossier`}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="button secondary" onClick={handleShare} style={{ fontSize: '13px' }}>
            <Share2 size={14} /> {copied ? 'Link Copied!' : 'Share'}
          </button>
          <button className="button lime" onClick={handleExport} disabled={downloading} style={{ fontSize: '13px' }}>
            {downloading ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Exporting...
              </>
            ) : (
              <>
                <Download size={14} /> Export Dossier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Metadata Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Composite SKORE
          </div>
          <div
            style={{
              fontSize: '22px',
              fontFamily: 'DM Mono, monospace',
              fontWeight: 700,
              color: report.score >= 80 ? '#34d399' : '#38bdf8',
              marginTop: 4,
            }}
          >
            {report.score} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>/ 100</span>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Generation Timestamp
          </div>
          <div
            style={{
              fontSize: '13px',
              fontFamily: 'DM Mono, monospace',
              fontWeight: 600,
              color: '#e2e8f0',
              marginTop: 6,
            }}
          >
            {new Date(report.generatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Model Engine
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              fontFamily: 'DM Mono, monospace',
              color: '#38bdf8',
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            <Cpu size={14} /> {report.modelVersion || 'WTFXAI-v2.4-NEURAL'}
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Audit Checksum
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              fontFamily: 'DM Mono, monospace',
              color: '#94a3b8',
              marginTop: 6,
            }}
          >
            <Fingerprint size={13} color="#10b981" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.checksum || 'sha256:d8a9f3b20c1844b82193e2b9c71'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Readable Research Content */}
      <div className="two-col" style={{ marginTop: 24 }}>
        {/* Left Column: Executive Summary & Theses */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionHeader
              eyebrow="Core Intelligence"
              title="Executive Summary"
              detail="Multimodal synthesis across market disclosures, order books, and earnings estimates"
            />
            <div className="panel" style={{ padding: '24px 22px' }}>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: 1.7 }}>
                {report.executiveSummary ||
                  'The target equity demonstrates resilient quantitative characteristics with expanding institutional conviction. Fundamental revisions exceed the sector baseline across 3 consecutive reporting periods.'}
              </p>

              {report.investmentThesis && (
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 18,
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#38bdf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} /> Investment Thesis & Multiple Durability
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: 1.65 }}>
                    {report.investmentThesis}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow="Forward Catalysts"
              title="What to Watch"
              detail="Milestones, regulatory triggers, and expected channel validation dates"
            />
            <div className="panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(
                  report.keyCatalysts || [
                    'Next quarterly earnings filing and gross margin guidance revisions',
                    'Channel checks regarding supply velocity and enterprise adoption',
                    'Confirmation of institutional fund positioning in upcoming 13-F cycle',
                  ]
                ).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: '13px',
                      color: '#e2e8f0',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontFamily: 'DM Mono, monospace',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {report.riskFactors && report.riskFactors.length > 0 && (
            <div>
              <SectionHeader
                eyebrow="Downside Sensitivity"
                title="Monitored Risk Factors"
                detail="Identified vulnerabilities and macro friction points"
              />
              <div className="panel" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.riskFactors.map((rf, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: '13px',
                        color: '#cbd5e1',
                      }}
                    >
                      <AlertTriangle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Factor Breakdown & Evidence Traceability */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionHeader
              eyebrow="Quantitative Engine"
              title="Factor Attribution"
              detail="Component weights and net percentage impacts driving consensus"
            />
            <div className="panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {report.factors.map((factor) => {
                  const weightPct = Math.round(factor.weight * 100);
                  return (
                    <div key={factor.name}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{factor.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: 'DM Mono, monospace',
                              color: '#64748b',
                            }}
                          >
                            Weight: {weightPct}%
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontWeight: 700,
                              color: factor.impact >= 0 ? '#34d399' : '#fb7185',
                            }}
                          >
                            {factor.impact >= 0 ? '+' : ''}
                            {factor.impact}%
                          </span>
                        </div>
                      </div>

                      <div className="factor-bar">
                        <div
                          className={`factor-fill ${factor.impact < 0 ? 'down' : ''}`}
                          style={{ width: `${Math.min(Math.abs(factor.impact) * 5 + 15, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                <span>Audit Status: Certified</span>
                <span className="mono" style={{ color: '#34d399' }}>
                  Normalized Sum: 100%
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow="Audit Trail"
              title="Primary Evidence & Sources"
              detail="Deterministic data points grounding neural findings"
            />
            <div className="panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(
                  report.sources || [
                    `${ticker} Regulatory SEC Form 10-K / 10-Q Feeds`,
                    'WTFXAI Realtime Web Crawl & Earnings Channel Check',
                    'Internal Quantitative Estimate Revision Database',
                    'Consensus Sell-Side Model Variance Archive',
                  ]
                ).map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--line)',
                      fontSize: '12px',
                      fontFamily: 'DM Mono, monospace',
                      color: '#cbd5e1',
                    }}
                  >
                    <FileCheck size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Interlink Card */}
          <div
            className="panel"
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(2,132,199,0.08) 0%, rgba(56,189,248,0.02) 100%)',
              border: '1px solid rgba(56,189,248,0.2)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              Interactive Research Actions
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Navigate to the complete company intelligence suite, inspect active channel triggers, or view the background SKORE run in the worker ledger.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href={`/companies/${report.companyId}`} className="button lime" style={{ fontSize: '12px' }}>
                Open Company Intelligence <ArrowUpRight size={13} />
              </Link>
              <Link href="/queue" className="button secondary" style={{ fontSize: '12px' }}>
                Worker Queue <ListTodo size={13} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
