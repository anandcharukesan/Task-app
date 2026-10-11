import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, AuthSession } from '../types/user';

export const authService = {
  async getSession(): Promise<AuthSession> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase getSession error:', error);
      }
      if (data.session?.user) {
        const session = {
          user: data.session.user,
          accessToken: data.session.access_token || null,
        };
        try {
          localStorage.setItem('cleartasks_auth_user', JSON.stringify(session));
        } catch {
          // ignore
        }
        return session;
      }
    }

    // Offline / Local storage fallback if session exists
    const stored = localStorage.getItem('cleartasks_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    return {
      user: null,
      accessToken: null,
    };
  },

  async signInWithEmail(email: string, password: string): Promise<{ error?: Error | null }> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    }
    return { error: new Error('Supabase is not configured') };
  },

  async signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: Error | null; requiresEmailConfirmation?: boolean }> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) return { error };

      // Try inserting into profiles table if user is created
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            display_name: displayName || email.split('@')[0],
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore if table trigger already handled it
        }
      }

      return {
        requiresEmailConfirmation: !data.session,
      };
    }
    return { error: new Error('Supabase is not configured') };
  },

  async signInWithGoogle(): Promise<{ url?: string; error?: Error | null }> {
    if (isSupabaseConfigured() && supabase) {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) return { error };
      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }
      return { url: data?.url || undefined };
    }

    return { error: new Error('Supabase is not configured') };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('cleartasks_auth_user');
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, email, avatar_url, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          userId: data.user_id,
          displayName: data.display_name,
          email: data.email,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }

      // If profile record isn't created yet, upsert it from auth session metadata
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (currentUser && currentUser.id === userId) {
        const displayName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0] ||
          'User';
        const email = currentUser.email || '';
        const avatarUrl = currentUser.user_metadata?.avatar_url || null;

        try {
          const { data: insertedData } = await supabase
            .from('profiles')
            .upsert(
              {
                user_id: currentUser.id,
                display_name: displayName,
                email: email,
                avatar_url: avatarUrl,
              },
              { onConflict: 'user_id' }
            )
            .select('id, user_id, display_name, email, avatar_url, created_at, updated_at')
            .single();

          if (insertedData) {
            return {
              id: insertedData.id,
              userId: insertedData.user_id,
              displayName: insertedData.display_name,
              email: insertedData.email,
              avatarUrl: insertedData.avatar_url,
              createdAt: insertedData.created_at,
              updatedAt: insertedData.updated_at,
            };
          }
        } catch {
          // ignore if table error
        }

        return {
          id: currentUser.id,
          userId: currentUser.id,
          displayName,
          email,
          avatarUrl,
          createdAt: currentUser.created_at,
          updatedAt: currentUser.updated_at || currentUser.created_at,
        };
      }
    }

    return null;
  },
};
