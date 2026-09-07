'use client';

import { Bell, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AppHeader({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/companies?q=${encodeURIComponent(search.trim())}`);
    }
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

      <div className="top-status">
        <div className="status-chip">
          <span className="status-dot-pulse" style={{ width: 6, height: 6 }} />
          <span>System Operational</span>
        </div>

        <span className="env-badge">PRODUCTION</span>

        <button className="icon-btn" aria-label="Notifications" title="System alerts">
          <Bell size={16} />
          <span className="icon-badge" />
        </button>

        <div className="user-profile-badge" title="Active session">
          <span className="user-avatar">EX</span>
          <span style={{ color: '#e2e8f0', fontSize: '12px' }}>Executive Desk</span>
        </div>
      </div>
    </header>
  );
}
