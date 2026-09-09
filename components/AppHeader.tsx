'use client';

import { Bell, ChevronDown, LogIn, LogOut, Search, Settings, ShieldCheck, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export function AppHeader({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/companies?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onToggleMobile && (
          <button className="mobile-toggle" onClick={onToggleMobile} aria-label="Open menu">
            <span style={{ fontSize: '20px', lineHeight: 1 }}>☰</span>
          </button>
        )}
        <div className="top-search-wrap">
          <Search size={15} />
          <input
            placeholder="Search tickers, sectors, or reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="top-status" ref={menuRef} style={{ position: 'relative' }}>
        <div className="status-chip">
          <span className="status-dot-pulse" style={{ width: 6, height: 6 }} />
          <span>System Operational</span>
        </div>

        <span className="env-badge">PRODUCTION</span>

        {/* Notifications Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            title="System alerts"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setMenuOpen(false);
            }}
          >
            <Bell size={16} />
            <span className="icon-badge" />
          </button>

          {notificationOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 320,
                background: '#0d131f',
                border: '1px solid var(--line)',
                borderRadius: 8,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                padding: '12px 14px',
                zIndex: 9999,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Desk Notifications</span>
                <span className="status-chip" style={{ fontSize: '10px', padding: '2px 6px' }}>2 Unread</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12px' }}>
                <div style={{ padding: '8px 10px', background: 'rgba(56,189,248,0.06)', borderRadius: 6, border: '1px solid rgba(56,189,248,0.15)' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>Earnings Revision · NVDA</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: 2 }}>FY27 consensus EPS moved +8.4% after channel checks.</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Consensus Dossier Certified · LLY</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: 2 }}>Incretin franchise dossier published (SKORE 91/100).</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Dropdown */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <div
              className="user-profile-badge"
              title={`${user.name} (${user.email}) - ${user.role.toUpperCase()}`}
              onClick={() => {
                setMenuOpen(!menuOpen);
                setNotificationOpen(false);
              }}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="user-avatar">{user.initials}</span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                <span style={{ color: '#e2e8f0', fontSize: '12px', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {user.name.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: isAdmin ? '#fbbf24' : '#38bdf8',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
              </div>
              <ChevronDown size={12} style={{ color: '#94a3b8', marginLeft: 2 }} />
            </div>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 280,
                  background: '#0d131f',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                  padding: '14px 16px',
                  zIndex: 9999,
                }}
              >
                <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{user.name}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: isAdmin ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        border: `1px solid ${isAdmin ? 'rgba(251, 191, 36, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                        color: isAdmin ? '#fbbf24' : '#38bdf8',
                        textTransform: 'uppercase',
                      }}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4, fontFamily: 'DM Mono, monospace', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                  {user.department && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                      {user.department}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '12px',
                        color: '#fbbf24',
                        textDecoration: 'none',
                        padding: '6px 8px',
                        borderRadius: 4,
                        background: 'rgba(251, 191, 36, 0.08)',
                      }}
                    >
                      <Settings size={14} /> Admin Controls & Portal
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '12px',
                      color: '#fb7185',
                      background: 'transparent',
                      border: 0,
                      padding: '6px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="button lime" style={{ padding: '5px 12px', fontSize: '12px' }}>
            <LogIn size={13} /> Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
