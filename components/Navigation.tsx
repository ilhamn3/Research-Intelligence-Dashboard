'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  FileText,
  Gauge,
  ListTodo,
  Menu,
  Settings2,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

const mainNav = [
  { href: '/', label: 'Command Center', icon: Gauge },
  { href: '/companies', label: 'Universe Coverage', icon: Building2 },
  { href: '/watchlist', label: 'Desk Watchlist', icon: BriefcaseBusiness },
  { href: '/reports', label: 'Research Reports', icon: FileText },
  { href: '/queue', label: 'SKORE Queue', icon: ListTodo },
];

const monitorNav = [
  { href: '/activity', label: 'Agent Activity', icon: Activity },
];

const systemNav = [
  { href: '/admin', label: 'Admin Controls', icon: Settings2 },
  { href: '/login', label: 'Access Portal', icon: ShieldAlert },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <Link href="/" className="brand-mark">
          <span className="brand-symbol">W</span>
          <div className="brand-title">
            <span className="brand-name">WTFXAI</span>
            <span className="brand-sub">Intelligence OS</span>
          </div>
        </Link>

        <div className="nav-group">
          <div className="nav-group-label">Intelligence Desk</div>
          <div className="nav-section">
            {mainNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Auditing & Feeds</div>
          <div className="nav-section">
            {monitorNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Operations</div>
          <div className="nav-section">
            {systemNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="system-status-indicator">
            <div className="system-status-left">
              <span className="status-dot-pulse" />
              <span className="system-status-text">Network Mesh</span>
            </div>
            <span className="system-status-tag">ONLINE</span>
          </div>
          <div className="env-label">BUILD v1.2.9-PROD</div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              background: '#0a0e17',
              borderRight: '1px solid #1e293b',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" className="brand-mark" style={{ margin: 0 }} onClick={() => setMobileOpen(false)}>
                <span className="brand-symbol">W</span>
                <div className="brand-title">
                  <span className="brand-name">WTFXAI</span>
                  <span className="brand-sub">Intelligence OS</span>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="nav-section" style={{ marginTop: '10px' }}>
              {[...mainNav, ...monitorNav, ...systemNav].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${isActive(href) ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="mobile-toggle" onClick={onClick} aria-label="Toggle navigation menu">
      <Menu size={22} />
    </button>
  );
}
