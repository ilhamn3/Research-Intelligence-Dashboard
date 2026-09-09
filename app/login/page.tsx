'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { auth } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password field
  const [forgotEmail, setForgotEmail] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await auth.signIn(signInEmail, signInPassword);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // Exact role-based routing:
      // Single Admin ID automatically redirected to Admin Portal
      // Normal users automatically redirected to Command Center
      if (res.user?.role === 'admin' || auth.isAdmin(res.user)) {
        router.push('/admin');
      } else {
        router.push(redirectPath && redirectPath !== '/admin' ? redirectPath : '/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await auth.signUp(signUpEmail, signUpPassword, signUpName);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.message) {
        setSuccessMessage(res.message);
        setLoading(false);
      } else {
        // Normal user registered & authenticated: auto-redirect to Command Center
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await auth.resetPassword(forgotEmail);
      if (!res.success) {
        setError(res.error || 'Unable to dispatch reset instructions.');
      } else {
        setSuccessMessage(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const [resending, setResending] = useState(false);
  const handleResendConfirmation = async () => {
    const targetEmail = signInEmail || signUpEmail || forgotEmail;
    if (!targetEmail.trim()) {
      setError('Please enter your email address to resend confirmation.');
      return;
    }
    setResending(true);
    try {
      const res = await auth.resendConfirmation(targetEmail);
      if (res.success) {
        setSuccessMessage(res.message);
        setError('');
      } else {
        setError(res.error || 'Failed to resend confirmation email.');
      }
    } catch {
      setError('Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="content"
      style={{
        maxWidth: 500,
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 1000%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 22,
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.4)',
            marginBottom: 14,
          }}
        >
          W
        </div>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          WTFXAI Intelligence Platform
        </div>
        <h1 style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 700, color: '#fff' }}>
          {mode === 'signin'
            ? 'Sign In to Operations Desk'
            : mode === 'signup'
            ? 'Create User Account'
            : 'Password Recovery'}
        </h1>
        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px' }}>
          {mode === 'signin'
            ? 'Access your quantitative research terminal & neural briefs'
            : mode === 'signup'
            ? 'Register your individual institutional research profile'
            : 'Reset your terminal credentials via registered email'}
        </p>
      </div>

      <div className="panel" style={{ padding: '28px 24px', border: '1px solid rgba(56,189,248,0.25)' }}>
        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.4)',
            padding: 4,
            borderRadius: 8,
            marginBottom: 22,
            border: '1px solid var(--line)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccessMessage('');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: mode === 'signin' || mode === 'forgot' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: mode === 'signin' || mode === 'forgot' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              color: mode === 'signin' || mode === 'forgot' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMessage('');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: mode === 'signup' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: mode === 'signup' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              color: mode === 'signup' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            className="alert"
            style={{
              marginBottom: 16,
              borderColor: 'rgba(244,63,94,0.3)',
              color: '#fb7185',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div>{error}</div>
            {error.toLowerCase().includes('email not confirmed') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="button secondary"
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '11px',
                    padding: '4px 10px',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                  }}
                >
                  {resending ? 'Resending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div
            className="alert"
            style={{
              marginBottom: 16,
              borderColor: 'rgba(52,211,153,0.3)',
              color: '#34d399',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: 16 }}>
              <label className="eyebrow" htmlFor="signin-email" style={{ display: 'block', marginBottom: 8 }}>
                Work Email Address
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signin-email"
                  type="email"
                  placeholder="analyst@firm.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                />
                <Mail size={16} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="eyebrow" htmlFor="signin-password" style={{ margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(signInEmail);
                    setMode('forgot');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 0,
                    color: '#38bdf8',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="button lime"
              style={{ width: '100%', height: 44, fontSize: '14px', justifyContent: 'center', marginTop: 14 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Authenticating Session...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: 14 }}>
              <label className="eyebrow" htmlFor="signup-name" style={{ display: 'block', marginBottom: 8 }}>
                Full Name
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                />
                <UserIcon size={16} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="eyebrow" htmlFor="signup-email" style={{ display: 'block', marginBottom: 8 }}>
                Work Email Address
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signup-email"
                  type="email"
                  placeholder="name@institution.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                />
                <Mail size={16} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="eyebrow" htmlFor="signup-password" style={{ display: 'block', marginBottom: 8 }}>
                Password (min 6 characters)
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signup-password"
                  type={showSignUpPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="eyebrow" htmlFor="signup-confirm" style={{ display: 'block', marginBottom: 8 }}>
                Confirm Password
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="signup-confirm"
                  type={showSignUpPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={signUpConfirm}
                  onChange={(e) => setSignUpConfirm(e.target.value)}
                  required
                />
                <Lock size={16} />
              </div>
            </div>

            <button
              type="submit"
              className="button lime"
              style={{ width: '100%', height: 44, fontSize: '14px', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Registering User...
                </>
              ) : (
                <>
                  Create User Account <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: 20 }}>
              <label className="eyebrow" htmlFor="forgot-email" style={{ display: 'block', marginBottom: 8 }}>
                Registered Account Email
              </label>
              <div className="search-wrap">
                <input
                  className="search"
                  id="forgot-email"
                  type="email"
                  placeholder="analyst@firm.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Mail size={16} />
              </div>
            </div>

            <button
              type="submit"
              className="button lime"
              style={{ width: '100%', height: 44, fontSize: '14px', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Sending Instructions...
                </>
              ) : (
                <>
                  Send Recovery Link <KeyRound size={15} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccessMessage('');
              }}
              className="button secondary"
              style={{ width: '100%', height: 38, fontSize: '13px', justifyContent: 'center', marginTop: 10 }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
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
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading authentication portal...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
