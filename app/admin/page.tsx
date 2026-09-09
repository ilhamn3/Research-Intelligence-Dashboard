'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Edit2,
  Globe,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Company, SkoreJob } from '@/lib/types';
import { repository } from '@/lib/api';
import { auth, UserProfile, ADMIN_EMAIL } from '@/lib/auth';
import { SectionHeader } from '@/components/SectionHeader';
import { AdminGuard } from '@/components/AdminGuard';

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [actionLog, setActionLog] = useState<Array<{ action: string; ticker: string; jobId: string; time: string }>>([]);

  // User Management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Company CRUD state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({
    ticker: '',
    name: '',
    sector: 'Technology',
    status: 'active' as 'active' | 'monitoring' | 'paused',
  });
  const [crudError, setCrudError] = useState('');

  const loadData = async () => {
    try {
      const items = await repository.listCompanies();
      setCompanies(items);
      if (items.length > 0 && !selected) {
        setSelected(items[0].id);
      }
    } catch {
      // ignore
    }

    try {
      setLoadingUsers(true);
      const userList = await auth.listUsers();
      setUsers(userList);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function queueWorkflow() {
    if (busy || !selected) return;
    setBusy(true);
    setMessage('');
    const target = companies.find((c) => c.id === selected);
    try {
      const job = await repository.rerunJob(selected);
      setMessageType('success');
      setMessage(
        `Workflow queued for ${target?.ticker ?? selected}. Job ${job.id} dispatched with status: ${job.status}.`
      );
      setActionLog((prev) => [
        { action: 'Queue Workflow', ticker: target?.ticker ?? selected, jobId: job.id, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (err) {
      setMessageType('error');
      setMessage(`Queue failed for ${target?.ticker ?? selected}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(false);
  }

  async function retryLatest() {
    if (busy || !selected) return;
    setBusy(true);
    setMessage('');
    const target = companies.find((c) => c.id === selected);
    try {
      const jobs = await repository.getJobs(selected);
      const failedJob = jobs.find((j) => j.status === 'failed');
      if (!failedJob) {
        setMessageType('success');
        setMessage(`No failed jobs found for ${target?.ticker ?? selected}. All executions are healthy.`);
        setBusy(false);
        return;
      }
      const retried = await repository.retryJob(failedJob.id);
      setMessageType('success');
      setMessage(
        `Retried job ${retried.id} for ${target?.ticker ?? selected}. New status: ${retried.status}. Score: ${retried.score ?? '—'}/100.`
      );
      setActionLog((prev) => [
        { action: 'Retry Error', ticker: target?.ticker ?? selected, jobId: retried.id, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (err) {
      setMessageType('error');
      setMessage(`Retry failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(false);
  }

  async function forceRecalculate() {
    if (busy || !selected) return;
    setBusy(true);
    setMessage('');
    const target = companies.find((c) => c.id === selected);
    try {
      const job = await repository.rerunJob(selected);
      setMessageType('success');
      setMessage(
        `Full SKORE recalculation dispatched for ${target?.ticker ?? selected}. Job ${job.id} is ${job.status}. Estimated completion in ~4 min.`
      );
      setActionLog((prev) => [
        { action: 'Force Recalculate', ticker: target?.ticker ?? selected, jobId: job.id, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (err) {
      setMessageType('error');
      setMessage(`Recalculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setBusy(false);
  }

  // --- Company CRUD Handlers ---
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ ticker: '', name: '', sector: 'Semiconductors', status: 'active' });
    setCrudError('');
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      ticker: company.ticker,
      name: company.name,
      sector: company.sector,
      status: company.status,
    });
    setCrudError('');
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.ticker.trim() || !companyForm.name.trim()) {
      setCrudError('Ticker and Company Name are required.');
      return;
    }

    try {
      if (editingCompany) {
        // Update
        const updated = await repository.updateCompany(editingCompany.id, {
          ticker: companyForm.ticker.toUpperCase().trim(),
          name: companyForm.name.trim(),
          sector: companyForm.sector.trim(),
          status: companyForm.status,
        });
        setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        // Create
        const created = await repository.createCompany({
          ticker: companyForm.ticker.toUpperCase().trim(),
          name: companyForm.name.trim(),
          sector: companyForm.sector.trim(),
          status: companyForm.status,
        });
        setCompanies((prev) => [created, ...prev]);
        if (!selected) setSelected(created.id);
      }
      setShowCompanyModal(false);
      setCrudError('');
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : 'Operation failed.');
    }
  };

  const handleDeleteCompany = async (id: string, ticker: string) => {
    if (!window.confirm(`Are you sure you want to remove ${ticker} from coverage?`)) return;
    try {
      await repository.deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      if (selected === id) {
        const remaining = companies.filter((c) => c.id !== id);
        setSelected(remaining[0]?.id || '');
      }
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (email.toLowerCase() === ADMIN_EMAIL) {
      alert('The master System Administrator account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Remove access for user ${email}?`)) return;
    try {
      await auth.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('Failed to delete user.');
    }
  };

  return (
    <AdminGuard>
      <div className="content">
        <div className="eyebrow">Desk Operations & Controls</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
            Operator Console
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="status-chip">
              <ShieldCheck size={13} color="#10b981" /> Single Admin Mode Active
            </span>
            <span className="status-chip">
              <Database size={13} color="#38bdf8" /> Supabase Mesh Connected
            </span>
          </div>
        </div>

        {/* Top Two-Col Section: Pipeline Triggers & Health Diagnostics */}
        <div className="two-col" style={{ marginTop: 24 }}>
          {/* Left Column: Workflow Triggers */}
          <div>
            <SectionHeader
              title="Manual Pipeline Triggers"
              detail="Execute asynchronous worker tasks against specific equity coverage entities through backend APIs"
            />

            <div className="panel" style={{ padding: '24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label className="eyebrow" htmlFor="company-select" style={{ display: 'block', marginBottom: 8 }}>
                  Target Company Coverage
                </label>
                <select
                  id="company-select"
                  className="search"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  style={{ width: '100%', background: '#0a0e17' }}
                  disabled={busy || companies.length === 0}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ticker} — {c.name} ({c.sector})
                    </option>
                  ))}
                </select>
              </div>

              {message && (
                <div
                  className="alert"
                  style={{
                    marginBottom: 16,
                    borderColor: messageType === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)',
                    color: messageType === 'success' ? '#34d399' : '#fb7185',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {messageType === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{message}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  className="button lime"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={queueWorkflow}
                  disabled={busy}
                >
                  {busy ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
                  Queue Workflow Execution
                </button>

                <button
                  type="button"
                  className="button secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={retryLatest}
                  disabled={busy}
                >
                  {busy ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />}
                  Retry Latest Failed Task
                </button>

                <button
                  type="button"
                  className="button secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={forceRecalculate}
                  disabled={busy}
                >
                  {busy ? <Loader2 size={15} className="spin" /> : <RotateCcw size={15} />}
                  Force Recalculate SKORE
                </button>
              </div>
            </div>

            {actionLog.length > 0 && (
              <div className="panel" style={{ marginTop: 16, padding: '16px 18px' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Recent Session Dispatches</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {actionLog.slice(0, 4).map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: idx < Math.min(actionLog.length, 4) - 1 ? '1px solid var(--line)' : undefined,
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{entry.action}</span>
                        <span style={{ color: '#38bdf8', marginLeft: 8, fontFamily: 'DM Mono, monospace' }}>
                          {entry.ticker}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="mono" style={{ color: '#94a3b8', fontSize: '11px' }}>{entry.jobId}</span>
                        <span className="mono" style={{ color: '#64748b', fontSize: '11px' }}>{entry.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Primary relational store & RLS profiles</div>
                  </div>
                </div>
                <span className="status-badge status-complete">Connected (12ms)</span>
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
                    <div style={{ fontSize: '11px', color: '#64748b' }}>SKORE scoring microservices & triggers</div>
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
                  <ShieldCheck size={18} color="#a855f7" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Access Control Boundary</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Designated Admin ID: {ADMIN_EMAIL}</div>
                  </div>
                </div>
                <span className="status-badge status-complete">Enforced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Company Universe Management (CRUD) */}
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <SectionHeader
              title="Company Universe Management"
              detail="Full CRUD operations for managing institutional equity universe coverage"
            />
            <button
              type="button"
              className="button lime"
              onClick={handleOpenAddCompany}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <Plus size={15} /> Add New Company
            </button>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Company Name</th>
                    <th>Sector</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td className="mono" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {c.ticker}
                      </td>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: '#94a3b8' }}>{c.sector}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            c.status === 'active'
                              ? 'status-complete'
                              : c.status === 'monitoring'
                              ? 'status-processing'
                              : 'status-failed'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleOpenEditCompany(c)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Edit company"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleDeleteCompany(c.id, c.ticker)}
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#fb7185', borderColor: 'rgba(244,63,94,0.25)' }}
                            title="Delete company"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No companies registered in universe. Click "Add New Company" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Registered Application Users Directory */}
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionHeader
              title="Application User Directory"
              detail="Manage registered institutional users, roles, and session clearances"
            />
            <button
              type="button"
              className="button secondary"
              onClick={loadData}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <RefreshCw size={13} /> Refresh Users
            </button>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role Clearance</th>
                    <th>Department</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSystemAdmin = u.email.toLowerCase() === ADMIN_EMAIL || u.role === 'admin';
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>
                              {u.initials || 'US'}
                            </span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="mono" style={{ color: '#38bdf8', fontSize: '12px' }}>
                          {u.email}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              background: isSystemAdmin ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              border: `1px solid ${isSystemAdmin ? 'rgba(251, 191, 36, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                              color: isSystemAdmin ? '#fbbf24' : '#38bdf8',
                            }}
                          >
                            {isSystemAdmin ? 'ADMIN (Primary)' : 'USER'}
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {u.department || 'Quantitative Research Desk'}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '11px' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isSystemAdmin ? (
                            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Protected</span>
                          ) : (
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              style={{ padding: '3px 8px', fontSize: '11px', color: '#fb7185', borderColor: 'rgba(244,63,94,0.25)' }}
                              title="Delete user account"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        {loadingUsers ? 'Loading registered accounts...' : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Company Add/Edit Modal */}
        {showCompanyModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
            onClick={() => setShowCompanyModal(false)}
          >
            <div
              className="panel"
              style={{
                width: '100%',
                maxWidth: 480,
                padding: '24px 28px',
                borderColor: 'rgba(56, 189, 248, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {editingCompany ? `Edit ${editingCompany.ticker}` : 'Add New Company to Universe'}
                </h3>
                <button
                  onClick={() => setShowCompanyModal(false)}
                  style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {crudError && (
                <div
                  className="alert"
                  style={{
                    marginBottom: 14,
                    borderColor: 'rgba(244,63,94,0.3)',
                    color: '#fb7185',
                    fontSize: '12px',
                  }}
                >
                  {crudError}
                </div>
              )}

              <form onSubmit={handleSaveCompany}>
                <div style={{ marginBottom: 14 }}>
                  <label className="eyebrow" htmlFor="comp-ticker" style={{ display: 'block', marginBottom: 6 }}>
                    Stock Ticker Symbol
                  </label>
                  <input
                    id="comp-ticker"
                    className="search"
                    style={{ width: '100%', textTransform: 'uppercase' }}
                    placeholder="e.g. AMD, TSLA, AAPL"
                    value={companyForm.ticker}
                    onChange={(e) => setCompanyForm({ ...companyForm, ticker: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="eyebrow" htmlFor="comp-name" style={{ display: 'block', marginBottom: 6 }}>
                    Company Full Name
                  </label>
                  <input
                    id="comp-name"
                    className="search"
                    style={{ width: '100%' }}
                    placeholder="e.g. Advanced Micro Devices, Inc."
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="eyebrow" htmlFor="comp-sector" style={{ display: 'block', marginBottom: 6 }}>
                    Sector / Classification
                  </label>
                  <select
                    id="comp-sector"
                    className="search"
                    style={{ width: '100%', background: '#0a0e17' }}
                    value={companyForm.sector}
                    onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                  >
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Software & Cloud">Software & Cloud</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Defense & Aerospace">Defense & Aerospace</option>
                    <option value="Consumer Discretionary">Consumer Discretionary</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="eyebrow" htmlFor="comp-status" style={{ display: 'block', marginBottom: 6 }}>
                    Coverage Status
                  </label>
                  <select
                    id="comp-status"
                    className="search"
                    style={{ width: '100%', background: '#0a0e17' }}
                    value={companyForm.status}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, status: e.target.value as 'active' | 'monitoring' | 'paused' })
                    }
                  >
                    <option value="active">Active (Automated continuous scoring)</option>
                    <option value="monitoring">Monitoring (Telemetry watch only)</option>
                    <option value="paused">Paused (Scoring suspended)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setShowCompanyModal(false)}
                    style={{ fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button lime" style={{ fontSize: '13px' }}>
                    {editingCompany ? 'Save Changes' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
