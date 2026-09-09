'use client';

import { auth } from './auth';

export const DEFAULT_WATCHLIST = ['c1', 'c3', 'c5'];

function getStorageKey(userId?: string): string {
  const activeId = userId || (typeof window !== 'undefined' ? auth.getStoredProfile()?.id : '') || 'default';
  return `wtfxai_watchlist_${activeId}`;
}

export const watchlistStore = {
  getWatched(userId?: string): string[] {
    if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
    try {
      const key = getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_WATCHLIST;
  },

  isWatched(companyId: string, userId?: string): boolean {
    return this.getWatched(userId).includes(companyId);
  },

  toggle(companyId: string, userId?: string): boolean {
    if (typeof window === 'undefined') return false;
    const current = this.getWatched(userId);
    let updated: string[];
    let isNowWatched = false;
    if (current.includes(companyId)) {
      updated = current.filter((id) => id !== companyId);
      isNowWatched = false;
    } else {
      updated = [...current, companyId];
      isNowWatched = true;
    }
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wtfxai_watchlist_change', { detail: { watchlist: updated, userId } }));
    } catch {
      // ignore
    }
    return isNowWatched;
  },

  add(companyId: string, userId?: string) {
    const current = this.getWatched(userId);
    if (!current.includes(companyId)) {
      const updated = [...current, companyId];
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wtfxai_watchlist_change', { detail: { watchlist: updated, userId } }));
    }
  },

  remove(companyId: string, userId?: string) {
    const current = this.getWatched(userId);
    const updated = current.filter((id) => id !== companyId);
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wtfxai_watchlist_change', { detail: { watchlist: updated, userId } }));
  },

  reset(userId?: string): string[] {
    const defaults = ['c1', 'c2', 'c3', 'c5'];
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(defaults));
      window.dispatchEvent(new CustomEvent('wtfxai_watchlist_change', { detail: { watchlist: defaults, userId } }));
    } catch {
      // ignore
    }
    return defaults;
  },
};
