'use client';

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  initials: string;
  createdAt?: string;
}

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@wtfxai.internal'
).toLowerCase();

const STORAGE_KEY = 'wtfxai_auth_profile';
const ALL_USERS_KEY = 'wtfxai_registered_users_cache';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your_supabase') || key.includes('your_supabase')) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return (email?.slice(0, 2) || 'US').toUpperCase();
}

function cacheUserLocally(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    const existing: UserProfile[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((u) => u.id === profile.id || u.email === profile.email);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...profile };
    } else {
      existing.push(profile);
    }
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export const auth = {
  getStoredProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  },

  setStoredProfile(profile: UserProfile | null) {
    if (typeof window === 'undefined') return;
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        document.cookie = `wtfxai_auth=${profile.role}; path=/; max-age=86400; SameSite=Lax`;
        cacheUserLocally(profile);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = `wtfxai_auth=; path=/; max-age=0; SameSite=Lax`;
      }
      window.dispatchEvent(new Event('wtfxai_auth_change'));
    } catch {
      // ignore
    }
  },

  isAdmin(profile?: UserProfile | null): boolean {
    const p = profile ?? this.getStoredProfile();
    if (!p) return false;
    // Exactly and only the defined single Admin email has admin clearance
    return p.email.toLowerCase() === ADMIN_EMAIL || p.role === 'admin';
  },

  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: UserProfile | null; error?: string; message?: string }> {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Admin registration/signup is completely disabled
    if (trimmedEmail === ADMIN_EMAIL) {
      return {
        user: null,
        error: 'Registration is restricted for the System Administrator ID. Admin accounts cannot be created via public sign up.',
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        user: null,
        error: 'Supabase client is not configured. Please check your environment variables.',
      };
    }

    try {
      const displayName = fullName?.trim() || trimmedEmail.split('@')[0];

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: displayName,
            role: 'user', // strictly regular user
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return {
          user: null,
          error: 'User creation failed. Please try again.',
        };
      }

      const profile: UserProfile = {
        id: data.user.id,
        email: trimmedEmail,
        name: displayName,
        role: 'user',
        department: 'Quantitative Research Desk',
        initials: getInitials(displayName, trimmedEmail),
        createdAt: new Date().toISOString(),
      };

      // Try inserting into public.profiles table if it exists
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: trimmedEmail,
          full_name: displayName,
          role: 'user',
          department: 'Quantitative Research Desk',
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Table might not exist yet or RLS handled it
      }

      cacheUserLocally(profile);

      // If user session is returned immediately (email confirmation disabled in Supabase)
      if (data.session) {
        this.setStoredProfile(profile);
        return { user: profile };
      }

      return {
        user: profile,
        message: 'Account created successfully! If email confirmation is enabled on your Supabase project, please verify your email before signing in.',
      };
    } catch (err) {
      return {
        user: null,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during sign up.',
      };
    }
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: UserProfile | null; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        user: null,
        error: 'Supabase client is not configured. Please verify NEXT_PUBLIC_SUPABASE_URL.',
      };
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to retrieve authenticated user details.' };
      }

      const u = data.user;
      const isSystemAdmin = trimmedEmail === ADMIN_EMAIL;
      const role: UserRole = isSystemAdmin ? 'admin' : 'user';
      let name = (u.user_metadata?.full_name as string) || (isSystemAdmin ? 'System Administrator' : trimmedEmail.split('@')[0]);
      let department = isSystemAdmin ? 'Operations & System Control' : 'Quantitative Research Desk';

      // Query profiles table for assigned role and profile info
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, role, department, created_at')
          .eq('id', u.id)
          .maybeSingle();

        if (profileRow) {
          if (profileRow.full_name) name = profileRow.full_name;
          if (profileRow.department) department = profileRow.department;
        } else {
          await supabase.from('profiles').upsert({
            id: u.id,
            email: trimmedEmail,
            full_name: name,
            role,
            department,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // fallback
      }

      const profile: UserProfile = {
        id: u.id,
        email: trimmedEmail,
        name,
        role,
        department,
        initials: getInitials(name, trimmedEmail),
        createdAt: u.created_at || new Date().toISOString(),
      };

      this.setStoredProfile(profile);
      cacheUserLocally(profile);
      return { user: profile };
    } catch (err) {
      return {
        user: null,
        error: err instanceof Error ? err.message : 'Authentication failed.',
      };
    }
  },

  async resendConfirmation(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const supabase = getSupabaseClient();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, message: '', error: 'Please enter a valid email address.' };
    }
    if (!supabase) {
      return { success: false, message: '', error: 'Supabase client is not configured.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
      });
      if (error) {
        return { success: false, message: '', error: error.message };
      }
      return {
        success: true,
        message: `Confirmation email has been resent to ${trimmedEmail}. Please check your inbox and spam folder.`,
      };
    } catch (err) {
      return {
        success: false,
        message: '',
        error: err instanceof Error ? err.message : 'Failed to resend confirmation email.',
      };
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const supabase = getSupabaseClient();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, message: '', error: 'Please enter a valid email address.' };
    }

    if (!supabase) {
      return {
        success: false,
        message: '',
        error: 'Supabase client is not configured. Please check your environment variables.',
      };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, message: '', error: error.message };
      }

      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${trimmedEmail}. Please check your inbox or spam folder.`,
      };
    } catch (err) {
      return {
        success: false,
        message: '',
        error: err instanceof Error ? err.message : 'Failed to send password reset request.',
      };
    }
  },

  async fetchCurrentProfile(): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return this.getStoredProfile();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.setStoredProfile(null);
        return null;
      }

      const email = (user.email || '').toLowerCase();
      const isSystemAdmin = email === ADMIN_EMAIL;
      const role: UserRole = isSystemAdmin ? 'admin' : 'user';
      let name = (user.user_metadata?.full_name as string) || (isSystemAdmin ? 'System Administrator' : email.split('@')[0]);
      let department = isSystemAdmin ? 'Operations & System Control' : 'Quantitative Research Desk';

      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, role, department')
          .eq('id', user.id)
          .maybeSingle();

        if (profileRow) {
          if (profileRow.full_name) name = profileRow.full_name;
          if (profileRow.department) department = profileRow.department;
        }
      } catch {
        // ignore
      }

      const profile: UserProfile = {
        id: user.id,
        email,
        name,
        role,
        department,
        initials: getInitials(name, email),
      };

      this.setStoredProfile(profile);
      cacheUserLocally(profile);
      return profile;
    } catch {
      return this.getStoredProfile();
    }
  },

  async listUsers(): Promise<UserProfile[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, department, created_at')
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          return data.map((row) => ({
            id: row.id,
            email: row.email,
            name: row.full_name || row.email.split('@')[0],
            role: (row.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : row.role || 'user') as UserRole,
            department: row.department || 'Quantitative Research Desk',
            initials: getInitials(row.full_name || '', row.email),
            createdAt: row.created_at,
          }));
        }
      } catch {
        // ignore
      }
    }

    // Local cached users fallback
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(ALL_USERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }

    // Default institutional roster if no users yet registered
    return [
      {
        id: 'usr-admin-master',
        email: ADMIN_EMAIL,
        name: 'System Administrator',
        role: 'admin',
        department: 'Operations & System Control',
        initials: 'SA',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 'usr-user-01',
        email: 'analyst@wtfxai.internal',
        name: 'Elena Rostova',
        role: 'user',
        department: 'Quantitative Research Desk',
        initials: 'ER',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'usr-user-02',
        email: 'quant@wtfxai.internal',
        name: 'Marcus Vance',
        role: 'user',
        department: 'Alpha Research & Factor Ops',
        initials: 'MV',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ];
  },

  async deleteUser(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(ALL_USERS_KEY);
        if (raw) {
          const existing: UserProfile[] = JSON.parse(raw);
          const filtered = existing.filter((u) => u.id !== id);
          localStorage.setItem(ALL_USERS_KEY, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    }
    return true;
  },

  async getAuthToken(): Promise<string | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  },

  async getAuthenticatedUser(): Promise<User | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore network error on signout
      }
    }
    this.setStoredProfile(null);
  },
};
