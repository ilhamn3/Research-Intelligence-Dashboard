import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div
      className="content"
      style={{
        maxWidth: 520,
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 24,
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.4)',
            marginBottom: 16,
          }}
        >
          W
        </div>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          WTFXAI Intelligence Platform
        </div>
        <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: '#fff' }}>
          Access Operations Desk
        </h1>
        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px' }}>
          Secure quantitative terminal and neural research synthesis
        </p>
      </div>

      <div className="panel" style={{ padding: '32px 28px', border: '1px solid rgba(56,189,248,0.2)' }}>
        <label className="eyebrow" htmlFor="email" style={{ display: 'block', marginBottom: 8 }}>
          Institutional Work Email
        </label>
        <div className="search-wrap">
          <input
            className="search"
            id="email"
            type="email"
            placeholder="analyst@firm.com"
            defaultValue="analyst@wtfxai.internal"
          />
          <Lock size={16} />
        </div>

        <Link
          href="/"
          className="button lime"
          style={{ width: '100%', marginTop: 20, height: 44, fontSize: '14px' }}
        >
          Enter Workspace Session <ArrowRight size={15} />
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
            padding: '10px 12px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>Single-Sign-On enabled via Supabase & enterprise OAuth credentials.</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/" className="button secondary" style={{ fontSize: '12px' }}>
          Enter Demo Workspace (Bypass Login)
        </Link>
      </div>
    </div>
  );
}

