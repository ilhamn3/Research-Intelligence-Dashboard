'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { AlertTriangle, ArrowLeft, Loader2, Lock, LogIn, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div
        className="content"
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={28} className="spin" style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Verifying security clearance...</span>
        </div>
      </div>
    );
  }

  // Case 1: Unauthenticated
  if (!user) {
    return (
      <div
        className="content"
        style={{
          maxWidth: 560,
          margin: '40px auto',
          padding: '0 16px',
        }}
      >
        <div className="panel" style={{ padding: '36px 30px', textAlign: 'center', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'inline-grid',
              placeItems: 'center',
              color: '#fb7185',
              marginBottom: 16,
            }}
          >
            <Lock size={26} />
          </div>

          <div className="eyebrow" style={{ justifyContent: 'center', color: '#fb7185' }}>
            Restricted Zone
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '8px 0 10px' }}>
            Admin Authentication Required
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 24px' }}>
            The Operations Control & Access Portal contains sensitive orchestration tooling and requires active Admin credentials. Please sign in with an administrator account to continue.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/" className="button secondary" style={{ fontSize: '13px' }}>
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <Link href="/login?redirect=/admin" className="button lime" style={{ fontSize: '13px' }}>
              <LogIn size={14} /> Sign In as Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Authenticated but NOT an Admin (Regular User)
  if (!isAdmin) {
    return (
      <div
        className="content"
        style={{
          maxWidth: 580,
          margin: '40px auto',
          padding: '0 16px',
        }}
      >
        <div className="panel" style={{ padding: '36px 30px', textAlign: 'center', borderColor: 'rgba(251, 146, 60, 0.3)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(251, 146, 60, 0.1)',
              border: '1px solid rgba(251, 146, 60, 0.25)',
              display: 'inline-grid',
              placeItems: 'center',
              color: '#fb923c',
              marginBottom: 16,
            }}
          >
            <ShieldAlert size={26} />
          </div>

          <div className="eyebrow" style={{ justifyContent: 'center', color: '#fb923c' }}>
            Clearance Insufficient
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '8px 0 10px' }}>
            Access Restricted to Administrators
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 16px' }}>
            You are currently signed in as <strong style={{ color: '#e2e8f0' }}>{user.name}</strong> (<span className="mono" style={{ color: '#38bdf8' }}>{user.email}</span>) with <span style={{ color: '#38bdf8', fontWeight: 600 }}>Standard User</span> clearance. Regular users are not permitted to access or modify operator pipeline controls.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--line)',
              fontSize: '12px',
              color: '#94a3b8',
              marginBottom: 24,
            }}
          >
            <span>Assigned Role:</span>
            <span
              style={{
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.04em',
              }}
            >
              {user.role}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="button secondary" style={{ fontSize: '13px' }}>
              <ArrowLeft size={14} /> Return to Intelligence Desk
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/login?redirect=/admin');
              }}
              className="button lime"
              style={{ fontSize: '13px' }}
            >
              <LogOut size={14} /> Switch to Admin Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Authenticated Admin
  return <>{children}</>;
}
