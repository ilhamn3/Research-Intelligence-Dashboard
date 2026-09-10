'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, getSupabaseClient, UserProfile } from './auth';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await auth.fetchCurrentProfile();
      setUser(profile);
    } catch {
      setUser(auth.getStoredProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Initial check from storage & fetch current Supabase session after mount
    setUser(auth.getStoredProfile());
    refreshProfile();

    // Listen to custom window events
    const handleAuthChange = () => {
      setUser(auth.getStoredProfile());
    };
    window.addEventListener('wtfxai_auth_change', handleAuthChange);

    // Listen to Supabase auth state change
    const supabase = getSupabaseClient();
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          const profile = await auth.fetchCurrentProfile();
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          auth.setStoredProfile(null);
          setUser(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      window.removeEventListener('wtfxai_auth_change', handleAuthChange);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refreshProfile]);

  const signOut = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const activeUser = mounted ? user : null;

  return {
    user: activeUser,
    loading: mounted ? loading : true,
    isAdmin: mounted && (auth.isAdmin(activeUser) || activeUser?.role === 'admin'),
    mounted,
    signOut,
    refreshProfile,
  };
}
