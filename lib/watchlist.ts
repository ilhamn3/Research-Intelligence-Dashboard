'use client';

import { auth, getSupabaseClient } from './auth';

export const DEFAULT_WATCHLIST = ['c1', 'c3', 'c5'];

// In-memory user-segregated cache to guarantee zero cross-user state leakage
const memoryCacheByUser: Record<string, string[]> = {};

function getActiveUserId(explicitUserId?: string): string | null {
  if (explicitUserId) return explicitUserId;
  if (typeof window === 'undefined') return null;
  const profile = auth.getStoredProfile();
  return profile?.id || null;
}

export const watchlistStore = {
  /**
   * Synchronous getter for instant UI rendering, backed by per-user memory cache
   */
  getWatched(userId?: string): string[] {
    const activeId = getActiveUserId(userId);
    if (!activeId) return [];

    if (memoryCacheByUser[activeId]) {
      return memoryCacheByUser[activeId];
    }

    // Trigger async sync in the background
    this.fetchWatched(activeId).catch(() => {});
    return memoryCacheByUser[activeId] || [];
  },

  /**
   * Asynchronously fetches user-isolated pinned companies directly from Supabase database
   * Strictly protected by Supabase Row Level Security (RLS)
   */
  async fetchWatched(userId?: string): Promise<string[]> {
    const activeId = getActiveUserId(userId);
    if (!activeId) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('watchlists')
          .select('company_id')
          .eq('user_id', activeId);

        if (!error && data) {
          const list = data.map((row: { company_id: string }) => row.company_id);
          memoryCacheByUser[activeId] = list;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('wtfxai_watchlist_change', {
                detail: { watchlist: list, userId: activeId },
              })
            );
          }
          return list;
        }
      } catch (err) {
        console.warn('Supabase watchlist fetch fallback to memory:', err);
      }
    }

    return memoryCacheByUser[activeId] || [];
  },

  isWatched(companyId: string, userId?: string): boolean {
    return this.getWatched(userId).includes(companyId);
  },

  /**
   * Toggles a pinned company for the active user in the database
   */
  async toggle(companyId: string, userId?: string): Promise<boolean> {
    const activeId = getActiveUserId(userId);
    if (!activeId) return false;

    const current = this.getWatched(activeId);
    const isCurrentlyWatched = current.includes(companyId);
    let updated: string[];

    if (isCurrentlyWatched) {
      updated = current.filter((id) => id !== companyId);
    } else {
      updated = [...current, companyId];
    }

    // Optimistically update memory cache
    memoryCacheByUser[activeId] = updated;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wtfxai_watchlist_change', {
          detail: { watchlist: updated, userId: activeId },
        })
      );
    }

    // Persist to Supabase watchlists table
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (isCurrentlyWatched) {
          await supabase
            .from('watchlists')
            .delete()
            .eq('user_id', activeId)
            .eq('company_id', companyId);
        } else {
          await supabase
            .from('watchlists')
            .upsert(
              {
                user_id: activeId,
                company_id: companyId,
                created_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,company_id' }
            );
        }
      } catch (err) {
        console.warn('Failed to persist watchlist change to Supabase:', err);
      }
    }

    return !isCurrentlyWatched;
  },

  /**
   * Adds a company to the active user's database watchlist
   */
  async add(companyId: string, userId?: string): Promise<void> {
    const activeId = getActiveUserId(userId);
    if (!activeId) return;

    const current = this.getWatched(activeId);
    if (!current.includes(companyId)) {
      await this.toggle(companyId, activeId);
    }
  },

  /**
   * Removes a company from the active user's database watchlist
   */
  async remove(companyId: string, userId?: string): Promise<void> {
    const activeId = getActiveUserId(userId);
    if (!activeId) return;

    const current = this.getWatched(activeId);
    if (current.includes(companyId)) {
      await this.toggle(companyId, activeId);
    }
  },

  /**
   * Resets the active user's watchlist to standard default coverage set in Supabase
   */
  async reset(userId?: string): Promise<string[]> {
    const activeId = getActiveUserId(userId);
    if (!activeId) return [];

    const defaults = ['c1', 'c2', 'c3', 'c5'];
    memoryCacheByUser[activeId] = defaults;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wtfxai_watchlist_change', {
          detail: { watchlist: defaults, userId: activeId },
        })
      );
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Clear current user's watchlists
        await supabase.from('watchlists').delete().eq('user_id', activeId);
        // Insert defaults
        const rows = defaults.map((companyId) => ({
          user_id: activeId,
          company_id: companyId,
          created_at: new Date().toISOString(),
        }));
        await supabase.from('watchlists').insert(rows);
      } catch (err) {
        console.warn('Failed to reset watchlist in Supabase:', err);
      }
    }

    return defaults;
  },

  /**
   * Clears in-memory cache for a user upon sign out
   */
  clearUserCache(userId?: string) {
    if (userId && memoryCacheByUser[userId]) {
      delete memoryCacheByUser[userId];
    } else if (!userId) {
      for (const key of Object.keys(memoryCacheByUser)) {
        delete memoryCacheByUser[key];
      }
    }
  },
};
